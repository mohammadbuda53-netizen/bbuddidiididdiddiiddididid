# WhatsApp-Bot MVP (14 Tage) – Umsetzungsplan

## 1) Zielbild (MVP-Scope)

**Primärziel:** In 14 Tagen einen produktionsnahen WhatsApp-Bot live bringen, der Leads qualifiziert, Termine bestätigt/erinnert und sauber an CRM + Kalender angebunden ist.

**MVP-Funktionen:**
- Inbound/Outbound Messaging über offiziellen Provider (z. B. Twilio + WhatsApp Business API).
- Regelbasierter Qualifizierungsflow (Entscheidungsbaum).
- KI-Assist für freie Fragen (RAG-gestützt, mit Fallback auf menschliche Übergabe).
- Zeitgesteuerte Follow-ups/Reminder (inkl. 24h-Regel + Templates).
- CRM- und Kalender-Synchronisierung.
- Monitoring, KPI-Tracking, Audit-Logs (Opt-in/Compliance).

**Nicht im MVP:**
- Mehrsprachigkeit > 1 Sprache.
- Vollautomatischer Vertragsabschluss.
- Komplexe Omnichannel-Orchestrierung.

---

## 2) Referenzarchitektur

```text
WhatsApp (Meta/Twilio)
    -> Inbound Webhook
        -> Conversation Service (State Machine)
            -> Rules Engine (Qualifizierung, Zeitfenster, Policy)
            -> AI Service (LLM + RAG)
            -> Handover Service (Human Agent)
            -> Scheduler/Queue (Delayed Sends, Follow-ups)
            -> CRM Adapter
            -> Calendar Adapter
            -> Analytics + Audit Log
    <- Outbound Sender (Template/Session Messages)
```

### Kernprinzipien
- **Idempotenz:** Jede eingehende Nachricht mit `provider_message_id` deduplizieren.
- **Resilienz:** Retry-Strategie + Dead-Letter Queue für fehlgeschlagene Zustellungen.
- **Policy-first:** Vor jeder Outbound-Nachricht prüfen:
  - 24h-Servicefenster aktiv?
  - Falls nein: nur genehmigtes Template senden.
  - Sendezeit innerhalb definierter Geschäftszeiten?

---

## 3) Datenmodell (minimal)

## Tabellen / Collections

### `contacts`
- `id`
- `whatsapp_e164`
- `first_name`
- `timezone` (z. B. `Europe/Berlin`)
- `language` (`de`)
- `consent_status` (`granted|revoked|unknown`)
- `consent_source` (Landingpage, Formular, etc.)
- `consent_text_version`
- `consent_timestamp`
- `created_at`, `updated_at`

### `conversations`
- `id`
- `contact_id`
- `status` (`open|qualified|disqualified|handover|closed`)
- `current_state` (State Machine Node)
- `last_inbound_at`
- `last_outbound_at`
- `service_window_expires_at` (24h-Fenster)
- `owner` (`bot|human`)
- `created_at`, `updated_at`

### `messages`
- `id`
- `conversation_id`
- `direction` (`inbound|outbound`)
- `channel` (`whatsapp`)
- `provider_message_id`
- `message_type` (`text|template|interactive|media`)
- `content`
- `template_name` (optional)
- `delivery_status` (`queued|sent|delivered|read|failed`)
- `error_code` (optional)
- `created_at`

### `qualification_answers`
- `id`
- `conversation_id`
- `ads_running` (`yes|no|unknown`)
- `monthly_leads_bucket` (`<100|100-300|300+|unknown`)
- `qualified` (`true|false|pending`)
- `reason` (Disqualify-/Qualify-Grund)
- `updated_at`

### `tasks_scheduled`
- `id`
- `conversation_id`
- `task_type` (`nudge_30m|followup_24h|followup_48h|reminder_22h|reminder_55m|reminder_5m`)
- `run_at`
- `payload_json`
- `status` (`pending|running|done|cancelled|failed`)
- `attempts`

### `audit_events`
- `id`
- `contact_id`
- `event_type` (`consent_granted|consent_revoked|data_exported|data_deleted|policy_blocked_send|handover`)
- `details_json`
- `created_at`

---

## 4) Entscheidungsbaum (Lead-Qualifizierung)

## Start-Trigger
- 5 Minuten nach Opt-in: personalisierte Erstnachricht.

## Flow
1. **Erstnachricht:**
   - „Hey {{first_name}}, Sebastian hier 👋 Danke für dein Interesse. Ich hab kurz 2 Fragen, damit wir schauen können, ob es passt. Ist das okay?“
2. **Q1 – Ads aktiv?**
   - Frage: „Schaltest du aktuell Ads?“
   - **Nein** -> freundlich disqualifizieren + optional Ressourcenlink + Exit.
   - **Ja** -> weiter zu Q2.
3. **Q2 – Lead-Volumen?**
   - Frage: „Wie viele Leads generierst du ca. pro Monat?“
   - **<100** -> freundlich disqualifizieren + Option „später wieder melden“.
   - **>=100** -> qualifiziert.
4. **Qualified Path:**
   - Bestätigung + Terminprozess starten.

## Human-Handover Trigger
- Nutzer schreibt „Mitarbeiter“, „Berater“, „Anrufen“.
- Preis-/Vertragsanfrage mit hoher Unsicherheit.
- Negativer Sentiment-Score über Schwellwert.
- >2 Missverständnisse in Folge.

---

## 5) Nachrichten-Templates (DE, MVP)

> Hinweis: Namen/Variablen final auf Meta/Twilio-Template-Format anpassen und vor Go-Live genehmigen lassen.

### 5.1 Opt-in Follow-up (Template, +5 min)
**Name:** `lead_welcome_v1`
- „Hey {{1}}, danke für deine Anfrage 🙌
Ich hätte kurz 2 Fragen, damit ich einschätzen kann, ob wir dir schnell helfen können. Passt das?“

### 5.2 Nudge bei Inaktivität (Template außerhalb 24h)
**Name:** `lead_nudge_v1`
- „Kurzer Reminder zu meiner Frage von eben 🙂
Wenn du magst, antworte einfach mit *Ja* und wir machen weiter.“

### 5.3 24h Follow-up
**Name:** `lead_followup_24h_v1`
- „Hi {{1}}, kurzer Hinweis: Im Call zeige ich dir live, wie der Bot Leads qualifiziert und Termine vorbereitet. Soll ich dir einen Slot schicken?“

### 5.4 48h Follow-up
**Name:** `lead_followup_48h_v1`
- „Wenn du willst, setzen wir das risikofrei als Pilot auf und prüfen gemeinsam die Ergebnisse. Soll ich dir 2 Terminvorschläge senden?“

### 5.5 Reminder 22h vor Termin
**Name:** `appointment_reminder_22h_v1`
- „Reminder zu deinem Termin morgen um {{1}} Uhr.
Magst du mir vorab kurz sagen, wie viele Leads/Monat ihr aktuell habt?“

### 5.6 Reminder 55m vor Termin
**Name:** `appointment_reminder_55m_v1`
- „In 55 Minuten geht’s los 👍
Hier ist nochmal dein Link: {{1}}“

### 5.7 Reminder 5m vor Termin
**Name:** `appointment_reminder_5m_v1`
- „Start in 5 Minuten – bis gleich 👋“

---

## 6) API-Schnittstellen (Beispiel)

## Inbound
- `POST /webhooks/whatsapp/inbound`
  - Input: Provider Payload (Message SID/ID, Sender, Text, Timestamp)
  - Steps:
    1. Signature prüfen
    2. Idempotenz prüfen
    3. Nachricht persistieren
    4. State Machine ausführen
    5. ggf. Outbound enqueue

## Outbound
- `POST /messages/send`
  - Body:
    - `contact_id`
    - `type` (`session_text|template`)
    - `template_name` (if template)
    - `variables`
    - `send_at` (optional)
  - Guardrails:
    - Policy-Check (24h + Template)
    - Quiet Hours Check (07:00–23:00 lokal)

## CRM
- `POST /integrations/crm/lead-upsert`
- `POST /integrations/crm/activity`
- `POST /integrations/crm/handover`

## Kalender
- `POST /integrations/calendar/book`
- `POST /integrations/calendar/cancel`
- `POST /integrations/calendar/reschedule`

## DSGVO Ops
- `POST /privacy/export`
- `POST /privacy/delete`
- `POST /privacy/revoke-consent`

---

## 7) KI-/RAG-Policy (MVP-safe)

- KI darf nur auf freigegebene Wissensquellen zugreifen:
  - `pricing.md`, `offers.md`, `faq.md`, `legal.md`.
- Bei geringer Retrieval-Konfidenz:
  - nicht raten, sondern „Ich gebe es ans Team weiter“.
- Keine verbindlichen Aussagen ohne Quelle (z. B. individuelle Vertragszusagen).
- Antwortstil natürlich, aber transparent (kein Identitätsbetrug).
- Antwortverzögerung konfigurierbar (30s–5min), nur 07:00–23:00.

---

## 8) 14-Tage-Umsetzungsplan

## Woche 1 – Fundament

**Tag 1–2: Setup & Compliance**
- WhatsApp Business API Zugang + verifizierte Nummer.
- Meta Business Verifizierung.
- Opt-in Text finalisieren + Tracking (Quelle, Timestamp, Version).
- Template-Liste definieren und zur Genehmigung einreichen.

**Tag 3–4: Backend Kern**
- Inbound Webhook + Signaturprüfung.
- Persistenzmodell (`contacts`, `conversations`, `messages`).
- State Machine Grundgerüst.

**Tag 5: Qualifizierungsflow v1**
- Q1/Q2 Logik.
- Disqualify/Qualify Pfade.
- Handover Trigger v1.

**Tag 6–7: Scheduler & Outbound**
- Delayed sends.
- Follow-up Jobs (24h, 48h, Reminder).
- Policy-Checks (24h + Template + Sendezeit).

## Woche 2 – Integrationen & Go-Live

**Tag 8–9: CRM + Kalender**
- Lead Upsert.
- Termin-Events + Reminder Trigger.
- Fehlerbehandlung und Retry.

**Tag 10: KI/RAG v1**
- Wissensbasis einbinden.
- Prompt Guardrails + Fallback.
- Unsicherheitsrouting an Mensch.

**Tag 11: QA / Testmatrix**
- Alle Flow-Branches testen.
- Edge Cases (Dubletten, verspätete Webhooks, Template required).

**Tag 12: Analytics Dashboard v1**
- KPIs: Reply Rate, Qualifizierungsquote, Booking Rate, Show-up Rate, Opt-out Rate.

**Tag 13: Pilotbetrieb (10–20% Traffic)**
- Monitoring eng begleiten.
- Hotfix-Fenster offen halten.

**Tag 14: Go-Live + Retro**
- 100% Traffic oder stufenweise Hochskalierung.
- Retro + Backlog für v2.

---

## 9) Testplan (MVP)

## Funktional
- Happy Path (qualified).
- Disqualify Path (`ads=no`, `<100 leads`).
- Freitextfrage + RAG Antwort.
- Human-Handover Trigger.

## Policy/Compliance
- Outbound außerhalb 24h ohne Template -> blockiert.
- Outbound innerhalb 24h -> Session message erlaubt.
- Quiet Hours -> send_at auf erlaubtes Zeitfenster verschieben.
- Consent revoked -> alle Marketing-Messages blockiert.

## Technisch
- Duplicate inbound events -> keine Doppelantwort.
- Provider timeout -> retry greift.
- Queue failure -> DLQ Eintrag.

## UAT
- Sales-Team testet echte Gesprächsqualität.
- Abbruchgründe dokumentieren.

---

## 10) Go-Live Checkliste

- [ ] API Zugang + Nummer verifiziert
- [ ] Templates genehmigt
- [ ] Opt-in Logging inkl. Audit nachweisbar
- [ ] DSGVO-Prozesse (Export/Löschung/Widerruf) getestet
- [ ] 24h-Regel technisch erzwungen
- [ ] Quiet-Hours aktiv
- [ ] Monitoring + Alerting live
- [ ] Handover zu Mensch geprüft
- [ ] Runbook für Incidents vorhanden

---

## 11) KPI-Definitionen (MVP)

- **Reply Rate:** `Antworten / versendete Erstkontakte`
- **Qualifizierungsquote:** `qualified / beantwortete Qualifizierungsflows`
- **Booking Rate:** `gebuchte Termine / qualified`
- **Show-up Rate:** `erschienene Termine / gebuchte Termine`
- **Opt-out Rate:** `Abmeldungen / aktive Kontakte`
- **Median Time-to-First-Response:** Antwortzeit des Bots auf ersten Inbound

---

## 12) Minimales Prompting-Design (für KI-Antworten)

**Systemregeln (Kurzform):**
1. Antworte präzise, freundlich, kurz.
2. Nutze nur Fakten aus freigegebenen Quellen.
3. Bei Unsicherheit: transparente Eskalation.
4. Keine Rechts-/Vertragsberatung über freigegebenen Rahmen hinaus.
5. Respektiere Sendezeit und Policy-Grenzen.

---

## 13) Nächster Schritt (direkt umsetzbar)

1. Entscheidung für Provider (Twilio vs. anderer BSP).
2. Template-Texte finalisieren und einreichen.
3. Webhook + State Machine implementieren.
4. Erstpilot mit begrenztem Traffic starten.

