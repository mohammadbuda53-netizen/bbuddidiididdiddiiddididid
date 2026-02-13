from __future__ import annotations

from dataclasses import replace
from datetime import datetime

from .models import Contact, Conversation, InboundMessage, OutboundMessage, ScheduledTask


class InMemoryStore:
    def __init__(self) -> None:
        self.contacts: dict[str, Contact] = {}
        self.conversations: dict[str, Conversation] = {}
        self.messages: list[InboundMessage | OutboundMessage] = []
        self.tasks: list[ScheduledTask] = []
        self.audit_events: list[dict] = []

    def upsert_contact(self, contact: Contact) -> Contact:
        self.contacts[contact.contact_id] = contact
        return contact

    def get_contact(self, contact_id: str) -> Contact | None:
        return self.contacts.get(contact_id)

    def create_or_get_conversation(self, conversation_id: str, contact_id: str) -> Conversation:
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = Conversation(conversation_id=conversation_id, contact_id=contact_id)
        return self.conversations[conversation_id]

    def save_message(self, message: InboundMessage | OutboundMessage) -> None:
        self.messages.append(message)

    def schedule_tasks(self, tasks: list[ScheduledTask]) -> None:
        self.tasks.extend(tasks)

    def due_tasks(self, now: datetime) -> list[ScheduledTask]:
        due = [t for t in self.tasks if t.run_at <= now]
        self.tasks = [t for t in self.tasks if t.run_at > now]
        return due

    def record_audit(self, event_type: str, contact_id: str, details: dict | None = None) -> None:
        self.audit_events.append(
            {
                "event_type": event_type,
                "contact_id": contact_id,
                "details": details or {},
                "created_at": datetime.utcnow().isoformat(),
            }
        )

    def revoke_consent(self, contact_id: str) -> None:
        contact = self.contacts.get(contact_id)
        if not contact:
            return
        self.contacts[contact_id] = replace(contact, consent_granted=False)
        self.record_audit("consent_revoked", contact_id)
