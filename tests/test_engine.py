from datetime import datetime
import unittest

from whatsapp_bot.engine import BotEngine
from whatsapp_bot.models import Conversation, InboundMessage


class BotEngineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = BotEngine()
        self.conv = Conversation(conversation_id="c1", contact_id="u1")

    def inbound(self, msg_id: str, text: str, at: datetime | None = None) -> InboundMessage:
        return InboundMessage(
            provider_message_id=msg_id,
            conversation_id="c1",
            contact_id="u1",
            content=text,
            received_at=at or datetime(2026, 1, 1, 10, 0, 0),
        )

    def test_duplicate_message_is_ignored(self) -> None:
        msg = self.inbound("m1", "ja")
        out1, _ = self.engine.process_inbound(self.conv, msg)
        out2, _ = self.engine.process_inbound(self.conv, msg)
        self.assertTrue(out1)
        self.assertEqual([], out2)

    def test_disqualify_when_ads_no(self) -> None:
        self.engine.process_inbound(self.conv, self.inbound("m1", "ok"))
        out, _ = self.engine.process_inbound(self.conv, self.inbound("m2", "Nein"))
        self.assertEqual("disqualified", self.conv.status)
        self.assertEqual("closed", self.conv.state)
        self.assertIn("passt es noch nicht", out[0].content if out else "")

    def test_qualify_when_leads_over_100(self) -> None:
        self.engine.process_inbound(self.conv, self.inbound("m1", "ok"))
        self.engine.process_inbound(self.conv, self.inbound("m2", "Ja"))
        out, tasks = self.engine.process_inbound(self.conv, self.inbound("m3", "250"))
        self.assertEqual("qualified", self.conv.status)
        self.assertEqual("closed", self.conv.state)
        self.assertTrue(any(t.task_type == "reminder_22h" for t in tasks))
        self.assertIn("Perfekt", out[0].content)

    def test_handover_trigger(self) -> None:
        out, _ = self.engine.process_inbound(self.conv, self.inbound("m1", "Mitarbeiter"))
        self.assertEqual("handover", self.conv.status)
        self.assertEqual("human", self.conv.owner)
        self.assertIn("weiter", out[0].content)


if __name__ == "__main__":
    unittest.main()
