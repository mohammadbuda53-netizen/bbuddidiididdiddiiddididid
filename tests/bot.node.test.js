const test = require('node:test');
const assert = require('node:assert/strict');

const { BotService } = require('../src/bot');

test('deduplicates inbound messages', () => {
  const bot = new BotService();
  bot.registerContact({ contactId: 'u1', whatsappE164: '+49123', firstName: 'Max' });
  const first = bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok' });
  const second = bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok' });
  assert.equal(first.outbound.length, 1);
  assert.equal(second.outbound.length, 0);
});

test('does not deduplicate unknown contact inbound before contact exists', () => {
  const bot = new BotService();
  assert.throws(
    () => bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok' }),
    /Unknown contact u1/
  );

  bot.registerContact({ contactId: 'u1', whatsappE164: '+49123', firstName: 'Max' });
  const retried = bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok' });
  assert.equal(retried.outbound.length, 1);
});

test('qualifies lead for >= 100 leads', () => {
  const bot = new BotService();
  bot.registerContact({ contactId: 'u1', whatsappE164: '+49123', firstName: 'Max' });
  bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok' });
  bot.receiveInbound({ providerMessageId: 'm2', conversationId: 'c1', contactId: 'u1', content: 'ja' });
  const result = bot.receiveInbound({ providerMessageId: 'm3', conversationId: 'c1', contactId: 'u1', content: '250' });
  assert.equal(result.conversation.status, 'qualified');
  assert.ok(result.tasks.some((x) => x.taskType === 'reminder_22h'));
});

test('blocks session message outside 24h service window', () => {
  const bot = new BotService();
  bot.registerContact({ contactId: 'u1', whatsappE164: '+49123', firstName: 'Max' });
  const base = new Date('2026-01-01T10:00:00.000Z');
  bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok', receivedAt: base });
  assert.throws(
    () => bot.sendMessage({
      conversationId: 'c1',
      contactId: 'u1',
      messageType: 'session_text',
      content: 'Hallo',
      now: new Date('2026-01-02T12:00:00.000Z')
    }),
    /template_required_outside_24h/
  );
});

test('scheduler sends template messages and respects revoked consent', () => {
  const bot = new BotService();
  bot.registerContact({ contactId: 'u1', whatsappE164: '+49123', firstName: 'Max' });
  const base = new Date('2026-01-01T10:00:00.000Z');
  bot.receiveInbound({ providerMessageId: 'm1', conversationId: 'c1', contactId: 'u1', content: 'ok', receivedAt: base });
  const sent = bot.runScheduler(new Date('2026-01-01T10:40:00.000Z'));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].messageType, 'template');

  bot.receiveInbound({ providerMessageId: 'm2', conversationId: 'c1', contactId: 'u1', content: 'ok', receivedAt: base });
  bot.revokeConsent('u1');
  const sentAfterRevoke = bot.runScheduler(new Date('2026-01-02T11:00:00.000Z'));
  assert.equal(sentAfterRevoke.length, 0);
});
