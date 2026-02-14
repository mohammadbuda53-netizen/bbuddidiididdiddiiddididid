from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from .engine import BotEngine
from .models import Contact, InboundMessage, OutboundMessage
from .policy import PolicyEngine
from .store import InMemoryStore
from .templates import render_template


@dataclass
class WhatsAppBotApp:
    store: InMemoryStore = field(default_factory=InMemoryStore)
    engine: BotEngine = field(default_factory=BotEngine)

    def register_contact(self, contact: Contact) -> Contact:
        saved = self.store.upsert_contact(contact)
        self.store.record_audit("consent_granted", contact.contact_id)
        return saved

    def receive_inbound(
        self,
        provider_message_id: str,
        conversation_id: str,
        contact_id: str,
        content: str,
        received_at: datetime | None = None,
    ) -> list[OutboundMessage]:
        contact = self.store.get_contact(contact_id)
        if not contact:
            raise ValueError(f"Unknown contact {contact_id}")

        inbound = InboundMessage(
            provider_message_id=provider_message_id,
            conversation_id=conversation_id,
            contact_id=contact_id,
            content=content,
            received_at=received_at or datetime.utcnow(),
        )
        conversation = self.store.create_or_get_conversation(conversation_id, contact_id)
        self.store.save_message(inbound)
        outbound, tasks = self.engine.process_inbound(conversation, inbound)
        for msg in outbound:
            self.store.save_message(msg)
        self.store.schedule_tasks(tasks)
        return outbound

    def send_manual_message(
        self,
        conversation_id: str,
        contact_id: str,
        content: str,
        message_type: str = "session_text",
        now: datetime | None = None,
        template_name: str | None = None,
    ) -> OutboundMessage:
        now = now or datetime.utcnow()
        contact = self.store.get_contact(contact_id)
        if not contact:
            raise ValueError(f"Unknown contact {contact_id}")
        if not contact.consent_granted:
            raise ValueError("consent_revoked")

        conversation = self.store.create_or_get_conversation(conversation_id, contact_id)
        decision = PolicyEngine.evaluate_send(conversation, now, message_type)
        if not decision.allowed:
            self.store.record_audit("policy_blocked_send", contact_id, {"reason": decision.reason})
            raise ValueError(decision.reason)

        outbound = OutboundMessage(
            conversation_id=conversation_id,
            contact_id=contact_id,
            content=content,
            message_type=message_type,
            template_name=template_name,
        )
        self.store.save_message(outbound)
        return outbound

    def run_scheduler(self, now: datetime | None = None) -> list[OutboundMessage]:
        now = now or datetime.utcnow()
        due = self.store.due_tasks(now)
        sent: list[OutboundMessage] = []
        for task in due:
            conversation = self.store.create_or_get_conversation(task.conversation_id, self.store.conversations[task.conversation_id].contact_id)
            contact = self.store.get_contact(conversation.contact_id)
            if not contact or not contact.consent_granted:
                continue

            template = self._task_to_template(task.task_type)
            if not template:
                continue
            content = render_template(
                template,
                first_name=contact.first_name,
                time=task.payload.get("time", "10:00"),
                link=task.payload.get("link", "https://example.com/call"),
            )
            decision = PolicyEngine.evaluate_send(conversation, now, "template")
            if not decision.allowed:
                self.store.record_audit("policy_blocked_send", contact.contact_id, {"reason": decision.reason})
                continue

            outbound = OutboundMessage(
                conversation_id=task.conversation_id,
                contact_id=contact.contact_id,
                content=content,
                message_type="template",
                template_name=template,
            )
            self.store.save_message(outbound)
            sent.append(outbound)
        return sent

    def revoke_consent(self, contact_id: str) -> None:
        self.store.revoke_consent(contact_id)

    @staticmethod
    def _task_to_template(task_type: str) -> str | None:
        mapping = {
            "nudge_30m": "lead_nudge_v1",
            "followup_24h": "lead_followup_24h_v1",
            "followup_48h": "lead_followup_48h_v1",
            "reminder_22h": "appointment_reminder_22h_v1",
            "reminder_55m": "appointment_reminder_55m_v1",
            "reminder_5m": "appointment_reminder_5m_v1",
        }
        return mapping.get(task_type)
