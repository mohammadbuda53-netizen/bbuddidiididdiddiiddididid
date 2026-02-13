from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, time, timedelta

from .models import Conversation, InboundMessage, OutboundMessage, ScheduledTask


@dataclass
class BotEngine:
    """Rule-based MVP flow engine for WhatsApp qualification bot."""

    processed_ids: set[str] = field(default_factory=set)

    def process_inbound(
        self,
        conversation: Conversation,
        inbound: InboundMessage,
    ) -> tuple[list[OutboundMessage], list[ScheduledTask]]:
        if inbound.provider_message_id in self.processed_ids:
            return [], []
        self.processed_ids.add(inbound.provider_message_id)
        conversation.refresh_service_window(inbound.received_at)

        text = inbound.content.strip().lower()
        out: list[OutboundMessage] = []
        tasks: list[ScheduledTask] = []

        if text in {"mitarbeiter", "berater", "anrufen"}:
            conversation.owner = "human"
            conversation.status = "handover"
            out.append(
                OutboundMessage(
                    conversation_id=conversation.conversation_id,
                    contact_id=conversation.contact_id,
                    content="Klar, ich gebe direkt an einen Kollegen weiter 👌",
                )
            )
            return out, tasks

        if conversation.state == "awaiting_consent_ack":
            out.append(
                OutboundMessage(
                    conversation_id=conversation.conversation_id,
                    contact_id=conversation.contact_id,
                    content="Top. Schaltest du aktuell Ads? (Ja/Nein)",
                )
            )
            conversation.state = "awaiting_ads"
            tasks.extend(self._default_followups(conversation, inbound.received_at))
            return out, tasks

        if conversation.state == "awaiting_ads":
            if text.startswith("n"):
                conversation.ads_running = "no"
                conversation.status = "disqualified"
                conversation.state = "closed"
                out.append(
                    OutboundMessage(
                        conversation_id=conversation.conversation_id,
                        contact_id=conversation.contact_id,
                        content="Danke für deine Offenheit 🙌 Aktuell passt es noch nicht ideal. Wenn sich das ändert, melde dich gerne wieder.",
                    )
                )
                return out, tasks
            if text.startswith("j"):
                conversation.ads_running = "yes"
                conversation.state = "awaiting_leads"
                out.append(
                    OutboundMessage(
                        conversation_id=conversation.conversation_id,
                        contact_id=conversation.contact_id,
                        content="Wie viele Leads generierst du ungefähr pro Monat?",
                    )
                )
                return out, tasks

            out.append(
                OutboundMessage(
                    conversation_id=conversation.conversation_id,
                    contact_id=conversation.contact_id,
                    content="Kannst du mit Ja oder Nein antworten? Schaltest du aktuell Ads?",
                )
            )
            return out, tasks

        if conversation.state == "awaiting_leads":
            bucket = self._parse_lead_bucket(text)
            conversation.monthly_leads_bucket = bucket
            if bucket == "<100":
                conversation.status = "disqualified"
                conversation.state = "closed"
                out.append(
                    OutboundMessage(
                        conversation_id=conversation.conversation_id,
                        contact_id=conversation.contact_id,
                        content="Danke dir 🙏 Unter 100 Leads/Monat ist unser Setup meist noch zu früh. Ich kann dir gern später nochmal schreiben.",
                    )
                )
                return out, tasks

            if bucket in {"100-300", "300+"}:
                conversation.status = "qualified"
                conversation.state = "closed"
                out.append(
                    OutboundMessage(
                        conversation_id=conversation.conversation_id,
                        contact_id=conversation.contact_id,
                        content="Perfekt, das klingt passend ✅ Ich schicke dir jetzt einen Terminvorschlag.",
                    )
                )
                tasks.extend(self._appointment_reminders(conversation, inbound.received_at))
                return out, tasks

            out.append(
                OutboundMessage(
                    conversation_id=conversation.conversation_id,
                    contact_id=conversation.contact_id,
                    content="Kannst du eine grobe Zahl nennen (z. B. 80, 150, 400)?",
                )
            )
            return out, tasks

        return out, tasks

    @staticmethod
    def can_send_session_message(conversation: Conversation, now: datetime) -> bool:
        expiry = conversation.service_window_expires_at
        return bool(expiry and now <= expiry)

    @staticmethod
    def in_quiet_hours_window(now: datetime) -> bool:
        # allowed local send window: 07:00 - 23:00
        return time(7, 0) <= now.time() <= time(23, 0)

    @staticmethod
    def _parse_lead_bucket(text: str) -> str:
        digits = "".join(ch for ch in text if ch.isdigit())
        if not digits:
            return "unknown"
        value = int(digits)
        if value < 100:
            return "<100"
        if value <= 300:
            return "100-300"
        return "300+"

    @staticmethod
    def _default_followups(conversation: Conversation, base: datetime) -> list[ScheduledTask]:
        return [
            ScheduledTask(conversation.conversation_id, "nudge_30m", base + timedelta(minutes=30)),
            ScheduledTask(conversation.conversation_id, "followup_24h", base + timedelta(hours=24)),
            ScheduledTask(conversation.conversation_id, "followup_48h", base + timedelta(hours=48)),
        ]

    @staticmethod
    def _appointment_reminders(conversation: Conversation, base: datetime) -> list[ScheduledTask]:
        # demo: assumes meeting at +3 days
        meeting = base + timedelta(days=3)
        return [
            ScheduledTask(conversation.conversation_id, "reminder_22h", meeting - timedelta(hours=22)),
            ScheduledTask(conversation.conversation_id, "reminder_55m", meeting - timedelta(minutes=55)),
            ScheduledTask(conversation.conversation_id, "reminder_5m", meeting - timedelta(minutes=5)),
        ]
