// Netlify runs this after each contact form submission that passes its spam filter.
// It emails the message to hello@ through Resend, with the customer as the reply-to.
// RESEND_API_KEY is set in Netlify's environment variables, never in this repo.

const FROM = 'Zivio Website <website@ziviodigital.com>';
const TO = 'hello@ziviodigital.com';
const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

// Keeps a single-line value on one line, at a sensible length.
const oneLine = (value, max = 200) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);

export const handler = async (event) => {
  const { payload } = JSON.parse(event.body || '{}');
  if (payload?.form_name !== 'contact') return { statusCode: 200, body: 'Not the contact form' };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return { statusCode: 500, body: 'Email is not configured' };
  }

  const data = payload.data || {};
  const name = [oneLine(data['first-name']), oneLine(data['last-name'])].filter(Boolean).join(' ') || 'Someone';
  const email = oneLine(data.email, 254);
  const business = oneLine(data.business);
  const phone = oneLine(data.phone, 50);
  const service = oneLine(data.service);
  const message = String(data.message ?? '').trim().slice(0, 10000);

  const text = [
    `Name: ${name}`,
    `Email: ${email || '(not given)'}`,
    `Phone: ${phone || '(not given)'}`,
    `Business: ${business || '(not given)'}`,
    `Service: ${service || '(not chosen)'}`,
    '',
    'Message:',
    message || '(no message)',
    '',
    '--',
    'Sent from the contact form on ziviodigital.com',
  ].join('\n');

  const email_payload = {
    from: FROM,
    to: [TO],
    subject: oneLine(`New Zivio Digital enquiry from ${name}${business ? ` (${business})` : ''}`, 150),
    text,
  };
  if (EMAIL.test(email)) email_payload.reply_to = email;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(email_payload),
  });

  if (!res.ok) {
    // Log only the status: the submission itself stays safe in Netlify Forms.
    console.error('Resend rejected the email', res.status);
    return { statusCode: 502, body: 'Email failed' };
  }
  return { statusCode: 200, body: 'Sent' };
};
