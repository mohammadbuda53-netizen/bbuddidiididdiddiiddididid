const { canSend } = require('./policy');
const { renderTemplate } = require('./templates');

class BotService {
  constructor() {
    this.contacts = new Map();
    this.conversations = new Map();
    this.processedIds = new Set();
    this.tasks = [];
    this.auditEvents = [];
  }

  registerContact({ contactId, whatsappE164, firstName, timezone = 'Europe/Berlin' }) {
    if (!contactId || !whatsappE164 || !firstName) {
      throw new Error('contactId, whatsappE164 and firstName are required');
    }
    const contact = { contactId, whatsappE164, firstName, timezone, consentGranted: true };
    this.contacts.set(contactId, contact);
    this._audit('consent_granted', contactId);
    return contact;
  }

  revokeConsent(contactId) {
    const contact = this.contacts.get(contactId);
    if (!contact) throw new Error(`Unknown contact ${contactId}`);
    contact.consentGranted = false;
    this._audit('consent_revoked', contactId);
  }

  receiveInbound({ providerMessageId, conversationId, contactId, content, receivedAt = new Date() }) {
    if (!providerMessageId || !conversationId || !contactId) {
      throw new Error('providerMessageId, conversationId and contactId are required');
    }
    if (this.processedIds.has(providerMessageId)) return { outbound: [], tasks: [] };

    const contact = this.contacts.get(contactId);
    if (!contact) throw new Error(`Unknown contact ${contactId}`);

    this.processedIds.add(providerMessageId);

    const conv = this._getConversation(conversationId, contactId);
    conv.serviceWindowExpiresAt = new Date(new Date(receivedAt).getTime() + 24 * 60 * 60 * 1000).toISOString();

    const text = String(content || '').trim().toLowerCase();
    const outbound = [];
    const tasks = [];

    if (['mitarbeiter', 'berater', 'anrufen'].includes(text)) {
      conv.owner = 'human';
      conv.status = 'handover';
      outbound.push('Klar, ich gebe direkt an einen Kollegen weiter 👌');
      return this._pack(conv, outbound, tasks);
    }

    if (conv.state === 'awaiting_consent_ack') {
      conv.state = 'awaiting_ads';
      outbound.push('Top. Schaltest du aktuell Ads? (Ja/Nein)');
      tasks.push(...this._defaultFollowups(conversationId, new Date(receivedAt)));
      return this._pack(conv, outbound, tasks);
    }

    if (conv.state === 'awaiting_ads') {
      if (text.startsWith('n')) {
        conv.status = 'disqualified';
        conv.state = 'closed';
        conv.adsRunning = 'no';
        outbound.push('Danke für deine Offenheit 🙌 Aktuell passt es noch nicht ideal.');
        return this._pack(conv, outbound, tasks);
      }
      if (text.startsWith('j')) {
        conv.adsRunning = 'yes';
        conv.state = 'awaiting_leads';
        outbound.push('Wie viele Leads generierst du ungefähr pro Monat?');
        return this._pack(conv, outbound, tasks);
      }
      outbound.push('Kannst du mit Ja oder Nein antworten? Schaltest du aktuell Ads?');
      return this._pack(conv, outbound, tasks);
    }

    if (conv.state === 'awaiting_leads') {
      const bucket = this._leadBucket(text);
      conv.monthlyLeadsBucket = bucket;
      if (bucket === '<100') {
        conv.status = 'disqualified';
        conv.state = 'closed';
        outbound.push('Danke dir 🙏 Unter 100 Leads/Monat ist unser Setup meist noch zu früh.');
        return this._pack(conv, outbound, tasks);
      }
      if (bucket === '100-300' || bucket === '300+') {
        conv.status = 'qualified';
        conv.state = 'closed';
        outbound.push('Perfekt, das klingt passend ✅ Ich schicke dir jetzt einen Terminvorschlag.');
        tasks.push(...this._appointmentReminders(conversationId, new Date(receivedAt)));
        return this._pack(conv, outbound, tasks);
      }
      outbound.push('Kannst du eine grobe Zahl nennen (z. B. 80, 150, 400)?');
      return this._pack(conv, outbound, tasks);
    }

    return this._pack(conv, outbound, tasks);
  }

  sendMessage({ conversationId, contactId, content = '', messageType = 'session_text', templateName, now = new Date(), vars = {} }) {
    const contact = this.contacts.get(contactId);
    if (!contact) throw new Error(`Unknown contact ${contactId}`);
    if (!contact.consentGranted) throw new Error('consent_revoked');

    const conv = this._getConversation(conversationId, contactId);
    const decision = canSend({ now, conversation: conv, messageType });
    if (!decision.allowed) {
      this._audit('policy_blocked_send', contactId, { reason: decision.reason });
      throw new Error(decision.reason);
    }

    const message = {
      conversationId,
      contactId,
      messageType,
      templateName: templateName || null,
      content: messageType === 'template' ? renderTemplate(templateName, { firstName: contact.firstName, ...vars }) : content,
      createdAt: new Date(now).toISOString()
    };
    return message;
  }

  runScheduler(now = new Date()) {
    const due = this.tasks.filter((t) => t.runAt <= now);
    this.tasks = this.tasks.filter((t) => t.runAt > now);
    const sent = [];

    for (const task of due) {
      const conv = this.conversations.get(task.conversationId);
      const contact = conv ? this.contacts.get(conv.contactId) : null;
      if (!conv || !contact || !contact.consentGranted) continue;
      const templateName = this._taskToTemplate(task.taskType);
      if (!templateName) continue;
      try {
        sent.push(this.sendMessage({
          conversationId: task.conversationId,
          contactId: conv.contactId,
          messageType: 'template',
          templateName,
          now,
          vars: { time: '10:00', link: 'https://example.com/call' }
        }));
      } catch (_e) {
        // ignore blocked task
      }
    }

    return sent;
  }

  _pack(conv, outbound, tasks) {
    this.tasks.push(...tasks);
    return { outbound, tasks, conversation: conv };
  }

  _getConversation(conversationId, contactId) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        conversationId,
        contactId,
        state: 'awaiting_consent_ack',
        status: 'open',
        owner: 'bot',
        adsRunning: 'unknown',
        monthlyLeadsBucket: 'unknown',
        serviceWindowExpiresAt: null
      });
    }
    return this.conversations.get(conversationId);
  }

  _leadBucket(text) {
    const digits = text.replace(/\D/g, '');
    if (!digits) return 'unknown';
    const n = Number(digits);
    if (n < 100) return '<100';
    if (n <= 300) return '100-300';
    return '300+';
  }

  _defaultFollowups(conversationId, base) {
    return [
      { conversationId, taskType: 'nudge_30m', runAt: new Date(base.getTime() + 30 * 60 * 1000) },
      { conversationId, taskType: 'followup_24h', runAt: new Date(base.getTime() + 24 * 60 * 60 * 1000) },
      { conversationId, taskType: 'followup_48h', runAt: new Date(base.getTime() + 48 * 60 * 60 * 1000) }
    ];
  }

  _appointmentReminders(conversationId, base) {
    const meeting = new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000);
    return [
      { conversationId, taskType: 'reminder_22h', runAt: new Date(meeting.getTime() - 22 * 60 * 60 * 1000) },
      { conversationId, taskType: 'reminder_55m', runAt: new Date(meeting.getTime() - 55 * 60 * 1000) },
      { conversationId, taskType: 'reminder_5m', runAt: new Date(meeting.getTime() - 5 * 60 * 1000) }
    ];
  }

  _taskToTemplate(taskType) {
    return {
      nudge_30m: 'lead_nudge_v1',
      followup_24h: 'lead_followup_24h_v1',
      followup_48h: 'lead_followup_48h_v1',
      reminder_22h: 'appointment_reminder_22h_v1',
      reminder_55m: 'appointment_reminder_55m_v1',
      reminder_5m: 'appointment_reminder_5m_v1'
    }[taskType] || null;
  }

  _audit(eventType, contactId, details = {}) {
    this.auditEvents.push({ eventType, contactId, details, createdAt: new Date().toISOString() });
  }
}

module.exports = { BotService };
