from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time

from .models import Conversation


@dataclass(frozen=True)
class SendDecision:
    allowed: bool
    reason: str


class PolicyEngine:
    """Enforces WhatsApp send guardrails for MVP."""

    @staticmethod
    def in_allowed_send_window(now: datetime) -> bool:
        return time(7, 0) <= now.time() <= time(23, 0)

    @staticmethod
    def evaluate_send(
        conversation: Conversation,
        now: datetime,
        message_type: str,
    ) -> SendDecision:
        if not PolicyEngine.in_allowed_send_window(now):
            return SendDecision(False, "outside_allowed_send_window")

        if message_type == "template":
            return SendDecision(True, "ok")

        expiry = conversation.service_window_expires_at
        if expiry and now <= expiry:
            return SendDecision(True, "ok")

        return SendDecision(False, "template_required_outside_24h")
