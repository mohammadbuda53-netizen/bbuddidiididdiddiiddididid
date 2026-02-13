from datetime import datetime, timedelta
import unittest

from whatsapp_bot.app import WhatsAppBotApp
from whatsapp_bot.models import Contact


class AppTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = WhatsAppBotApp()
        self.app.register_contact(Contact(contact_id="u1", whatsapp_e164="+491234", first_name="Max"))

    def test_receive_inbound_creates_outbound_and_tasks(self) -> None:
        out = self.app.receive_inbound("m1", "c1", "u1", "ok", datetime(2026, 1, 1, 10, 0, 0))
        self.assertEqual(1, len(out))
        self.assertTrue(self.app.store.tasks)

    def test_scheduler_sends_templates(self) -> None:
        base = datetime(2026, 1, 1, 10, 0, 0)
        self.app.receive_inbound("m1", "c1", "u1", "ok", base)
        due_time = base + timedelta(hours=24, minutes=1)
        sent = self.app.run_scheduler(due_time)
        self.assertTrue(any(msg.template_name == "lead_nudge_v1" for msg in sent))

    def test_policy_blocks_session_message_outside_24h(self) -> None:
        base = datetime(2026, 1, 1, 10, 0, 0)
        self.app.receive_inbound("m1", "c1", "u1", "ok", base)
        with self.assertRaises(ValueError):
            self.app.send_manual_message(
                conversation_id="c1",
                contact_id="u1",
                content="Hallo",
                message_type="session_text",
                now=base + timedelta(hours=25),
            )

    def test_revoke_consent_blocks_scheduler_output(self) -> None:
        base = datetime(2026, 1, 1, 10, 0, 0)
        self.app.receive_inbound("m1", "c1", "u1", "ok", base)
        self.app.revoke_consent("u1")
        sent = self.app.run_scheduler(base + timedelta(days=2))
        self.assertEqual([], sent)


if __name__ == "__main__":
    unittest.main()
