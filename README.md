# WhatsApp Bot MVP

Das Projekt ist als **laufender Node.js-Service** realisiert (inkl. Tests und Policy-Guardrails).

## Starten

```bash
npm start
```

Server läuft standardmäßig auf `http://localhost:3000`.

## Endpunkte

- `GET /health` – Healthcheck
- `POST /contacts` – Kontakt anlegen
- `POST /contacts/revoke-consent` – Consent widerrufen
- `POST /webhooks/whatsapp/inbound` – Inbound-Webhook verarbeiten
- `POST /messages/send` – Outbound-Nachricht senden (Session oder Template)
- `POST /scheduler/run` – fällige Follow-up/Reminder-Tasks ausführen

## Beispiel-Flow

1. Kontakt anlegen:
```bash
curl -s -X POST http://localhost:3000/contacts \
  -H 'content-type: application/json' \
  -d '{"contactId":"u1","whatsappE164":"+491234","firstName":"Max"}'
```

2. Inbound simulieren:
```bash
curl -s -X POST http://localhost:3000/webhooks/whatsapp/inbound \
  -H 'content-type: application/json' \
  -d '{"providerMessageId":"m1","conversationId":"c1","contactId":"u1","content":"ok"}'
```

3. Template senden:
```bash
curl -s -X POST http://localhost:3000/messages/send \
  -H 'content-type: application/json' \
  -d '{"conversationId":"c1","contactId":"u1","messageType":"template","templateName":"lead_nudge_v1"}'
```

## Tests

```bash
npm test
python -m unittest discover -s tests -p 'test_*.py'
```

## Inhalt

- `index.js` – HTTP-Server mit API-Routen
- `src/bot.js` – Kernlogik (State-Flow, Dedupe, Scheduling, Consent, Policy)
- `src/policy.js` – Versandregeln (24h-Fenster + 07:00–23:00)
- `src/templates.js` – Template-Katalog und Rendering
- `tests/bot.node.test.js` – Node-Tests
- `whatsapp_bot/*` + `tests/test_*.py` – bestehende Python-MVP-Referenz
- `WHATSAPP_BOT_MVP_14_TAGE.md` – Planungsdokument
