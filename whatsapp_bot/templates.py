from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TemplateDefinition:
    name: str
    content: str


TEMPLATES: dict[str, TemplateDefinition] = {
    "lead_welcome_v1": TemplateDefinition(
        "lead_welcome_v1",
        "Hey {first_name}, danke für deine Anfrage 🙌 Ich hätte kurz 2 Fragen. Passt das?",
    ),
    "lead_nudge_v1": TemplateDefinition(
        "lead_nudge_v1",
        "Kurzer Reminder zu meiner Frage von eben 🙂 Wenn du magst, antworte einfach mit Ja.",
    ),
    "lead_followup_24h_v1": TemplateDefinition(
        "lead_followup_24h_v1",
        "Hi {first_name}, im Call zeige ich dir den Bot live. Soll ich dir einen Slot schicken?",
    ),
    "lead_followup_48h_v1": TemplateDefinition(
        "lead_followup_48h_v1",
        "Wenn du willst, starten wir risikofrei als Pilot. Soll ich dir 2 Terminvorschläge senden?",
    ),
    "appointment_reminder_22h_v1": TemplateDefinition(
        "appointment_reminder_22h_v1",
        "Reminder zu deinem Termin morgen um {time}. Wie viele Leads/Monat habt ihr aktuell?",
    ),
    "appointment_reminder_55m_v1": TemplateDefinition(
        "appointment_reminder_55m_v1",
        "In 55 Minuten geht's los 👍 Hier ist nochmal dein Link: {link}",
    ),
    "appointment_reminder_5m_v1": TemplateDefinition(
        "appointment_reminder_5m_v1",
        "Start in 5 Minuten – bis gleich 👋",
    ),
}


def render_template(name: str, **variables: str) -> str:
    template = TEMPLATES.get(name)
    if not template:
        raise ValueError(f"Unknown template: {name}")
    return template.content.format(**variables)
