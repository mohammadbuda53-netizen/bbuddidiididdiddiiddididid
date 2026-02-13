from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class Contact:
    contact_id: str
    whatsapp_e164: str
    first_name: str
    timezone: str = "Europe/Berlin"
    consent_granted: bool = True


@dataclass
class Conversation:
    conversation_id: str
    contact_id: str
    state: str = "awaiting_consent_ack"
    status: str = "open"
    service_window_expires_at: datetime | None = None
    owner: str = "bot"
    ads_running: str = "unknown"
    monthly_leads_bucket: str = "unknown"

    def refresh_service_window(self, inbound_at: datetime) -> None:
        self.service_window_expires_at = inbound_at + timedelta(hours=24)


@dataclass
class InboundMessage:
    provider_message_id: str
    conversation_id: str
    contact_id: str
    content: str
    received_at: datetime


@dataclass
class OutboundMessage:
    conversation_id: str
    contact_id: str
    content: str
    message_type: str = "session_text"
    template_name: str | None = None


@dataclass
class ScheduledTask:
    conversation_id: str
    task_type: str
    run_at: datetime
    payload: dict = field(default_factory=dict)
