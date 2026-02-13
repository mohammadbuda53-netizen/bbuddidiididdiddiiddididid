function inAllowedSendWindow(date) {
  const d = new Date(date);
  const hour = d.getHours();
  return hour >= 7 && hour <= 23;
}

function canSend({ now = new Date(), conversation, messageType = 'session_text' }) {
  if (!inAllowedSendWindow(now)) {
    return { allowed: false, reason: 'outside_allowed_send_window' };
  }
  if (messageType === 'template') {
    return { allowed: true, reason: 'ok' };
  }
  if (conversation?.serviceWindowExpiresAt && new Date(now) <= new Date(conversation.serviceWindowExpiresAt)) {
    return { allowed: true, reason: 'ok' };
  }
  return { allowed: false, reason: 'template_required_outside_24h' };
}

module.exports = { inAllowedSendWindow, canSend };
