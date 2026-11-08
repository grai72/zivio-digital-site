// Retell calls this after each phone call to the Zivio number has been analysed.
// It checks the message really came from Retell, then emails a call summary to hello@ through Resend.
// RETELL_API_KEY (the key with the webhook badge) and RESEND_API_KEY are set in Netlify's
// environment variables, never in this repo.
// Webhook URL to paste into Retell: https://ziviodigital.com/.netlify/functions/retell-call-summary

const FROM = 'Zivio Calls <calls@ziviodigital.com>';
const TO = 'hello@ziviodigital.com';
const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;
const FIVE_MINUTES = 5 * 60 * 1000;
const TIME_ZONE = 'America/Edmonton';
const RETELL_CALLS = 'https://dashboard.retellai.com/';

const oneLine = (value, max = 200) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Retell signs each message as "v=<time in ms>,d=<HMAC-SHA256 of body + time, keyed with the API key>".
async function signedByRetell(body, signature, apiKey, now = Date.now()) {
  const match = /^v=(\d+),d=([0-9a-f]{64})$/i.exec(signature || '');
  if (!match) return false;
  const stamp = Number(match[1]);
  if (!Number.isSafeInteger(stamp) || Math.abs(now - stamp) > FIVE_MINUTES) return false;
  const digest = Uint8Array.from(match[2].match(/../g), (h) => parseInt(h, 16));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(apiKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, digest, enc.encode(body + stamp));
}

// Turns "403-797-3695" or "+14037973695" into a dialable +1 number, or '' if it doesn't look like one.
function dialable(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return '';
}

function prettyPhone(e164) {
  const d = e164.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : e164;
}

function whenAndHowLong(call) {
  const start = Number(call.start_timestamp);
  const when = Number.isFinite(start) && start > 0
    ? new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(start))
    : '';
  const ms = Number(call.duration_ms) || (Number(call.end_timestamp) - start) || 0;
  const secs = Math.max(0, Math.round(ms / 1000));
  const length = secs >= 60 ? `${Math.floor(secs / 60)} min ${secs % 60} sec` : `${secs} sec`;
  return { when, length };
}

function transcriptLines(call) {
  const turns = Array.isArray(call.transcript_object) ? call.transcript_object : [];
  if (turns.length) {
    return turns
      .map((t) => ({ who: t.role === 'agent' ? 'AI' : 'Caller', said: String(t.content ?? '').trim() }))
      .filter((t) => t.said);
  }
  return String(call.transcript ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^(Agent|User):\s*(.*)$/i.exec(line);
      return m ? { who: m[1].toLowerCase() === 'agent' ? 'AI' : 'Caller', said: m[2] } : { who: '', said: line };
    });
}

export function buildEmail(call) {
  const analysis = call.call_analysis || {};
  const d = analysis.custom_analysis_data || {};
  const name = oneLine(d.caller_name, 80);
  const business = oneLine(d.business_name, 120);
  const need = oneLine(d.need, 300);
  const callType = oneLine(d.call_type, 40);
  const urgent = d.urgent === true || d.urgent === 'true' || callType.toLowerCase() === 'urgent it';
  const callerId = dialable(call.from_number);
  const callback = dialable(d.callback_number) || callerId;
  const email = oneLine(d.email, 254);
  const validEmail = EMAIL.test(email) && (email.match(/@/g) || []).length === 1 ? email : '';
  const summary = String(analysis.call_summary ?? '').trim().slice(0, 2000);
  const nextStep = oneLine(d.next_step, 500);
  const isTest = call.call_type === 'web_call';
  const lines = transcriptLines(call);
  const callerSpoke = lines.some((l) => l.who === 'Caller');
  const missed = !name && !need && !callerSpoke;
  const { when, length } = whenAndHowLong(call);

  const who = name ? `${name}${business ? `, ${business}` : ''}` : business || (callerId ? prettyPhone(callerId) : 'Unknown caller');
  const subject = oneLine(
    missed
      ? `${isTest ? '[Test] ' : ''}Missed call from ${callerId ? prettyPhone(callerId) : 'unknown number'}`
      : `${urgent ? 'URGENT: ' : ''}${isTest ? '[Test] ' : ''}New call: ${who}${need ? ` – ${need}` : ''}`,
    150,
  );

  const rows = (missed ? [] : [
    ['Name', name],
    ['Business', business],
    ['Phone', callback ? prettyPhone(callback) + (callerId && callback === callerId ? ' (same as caller ID)' : '') : ''],
    ['Email', validEmail || (email ? `${email} (looks wrong, check on the callback)` : '')],
    ['Needs', need],
    ['Interested in', oneLine(d.services, 200)],
    ['Timeline', oneLine(d.timeline, 120)],
    ['Best time', oneLine(d.best_time, 120)],
    ['Urgency', urgent ? 'URGENT' : 'Normal'],
    ['Call type', callType],
  ]).concat([['Caller ID', callerId ? prettyPhone(callerId) : isTest ? 'Test call from the Retell dashboard' : 'Hidden']])
    .filter(([, v]) => v);

  // Plain text version, for mail apps that don't show HTML.
  const text = [
    missed ? 'Missed call: the caller hung up before leaving any details.' : `${urgent ? 'URGENT. ' : ''}${who}`,
    [when, length].filter(Boolean).join(' · '),
    '',
    summary,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    nextStep ? `\nSuggested next step: ${nextStep}` : '',
    '',
    'Transcript:',
    ...(lines.length ? lines.map((l) => (l.who ? `${l.who}: ${l.said}` : l.said)) : ['(no transcript)']),
    '',
    '--',
    'Answered by the Zivio AI assistant on 587-206-5600. The summary and details are written by AI from the call, so check anything important with the caller.',
    `Call ID: ${call.call_id || ''}`,
  ].join('\n').slice(0, 60000);

  const badge = (label, bg, fg) =>
    `<td bgcolor="${bg}" style="background-color:${bg};border-radius:20px;padding:5px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:bold;color:${fg};">${esc(label)}</td><td width="8"></td>`;
  const badges = [
    urgent && badge('URGENT', '#fde2e2', '#b42318'),
    missed ? badge('MISSED CALL', '#eceaf3', '#4d586b') : callType && !(urgent && /urgent/i.test(callType)) && badge(callType.toUpperCase(), '#fdf0d0', '#7a5a00'),
    isTest && badge('TEST', '#e6f0ff', '#1f5fc2'),
  ].filter(Boolean).join('');

  const td = 'padding:12px 0;border-bottom:1px solid #eeeae0;vertical-align:top;';
  const rowHtml = rows.map(([k, v], i) => {
    const last = i === rows.length - 1 ? 'border-bottom:0;' : '';
    let value = esc(v);
    if (k === 'Phone' && callback) value = `<a class="z-link" href="tel:${callback}" style="color:#8f6a00;">${esc(prettyPhone(callback))}</a>${callerId && callback === callerId ? ' <span class="z-muted" style="color:#4d586b;font-size:13px;">(same as caller ID)</span>' : ''}`;
    if (k === 'Email' && validEmail) value = `<a class="z-link" href="mailto:${esc(validEmail)}" style="color:#8f6a00;">${esc(validEmail)}</a>`;
    if (k === 'Urgency' && urgent) value = '<b style="color:#b42318;">URGENT</b>';
    return `<tr><td class="z-muted z-line" width="130" style="${td}${last}color:#4d586b;">${esc(k)}</td><td class="z-text z-line" style="${td}${last}color:#151925;">${value}</td></tr>`;
  }).join('');

  const buttons = [
    callback && `<td bgcolor="#c8960c" style="background-color:#c8960c;border-radius:8px;"><a href="tel:${callback}" style="display:inline-block;padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:18px;font-weight:bold;color:#080810;text-decoration:none;">Call back</a></td><td width="10"></td>`,
    validEmail && `<td class="z-soft" bgcolor="#f3f0e9" style="background-color:#f3f0e9;border:1px solid #e3dfd3;border-radius:8px;"><a class="z-text" href="mailto:${esc(validEmail)}?subject=${encodeURIComponent('Your call with Zivio Digital')}" style="display:inline-block;padding:11px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:18px;font-weight:bold;color:#151925;text-decoration:none;">Email ${esc(name.split(' ')[0] || 'caller')}</a></td>`,
  ].filter(Boolean).join('');

  const transcriptHtml = lines.length
    ? lines.map((l) => `<tr><td class="${l.who === 'Caller' ? 'z-link' : 'z-muted'}" width="62" style="padding:0 0 10px;color:${l.who === 'Caller' ? '#8f6a00' : '#4d586b'};vertical-align:top;font-weight:bold;">${esc(l.who)}</td><td class="z-text" style="padding:0 0 10px;color:#151925;">${esc(l.said)}</td></tr>`).join('')
    : '<tr><td class="z-muted" style="color:#4d586b;">No transcript for this call.</td></tr>';

  const card = (inner, pad = '20px 24px') =>
    `<tr><td class="z-panel" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #e3dfd3;border-radius:12px;padding:${pad};">${inner}</td></tr><tr><td height="14" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
  const heading = (label) => `<p class="z-text" style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:bold;letter-spacing:1px;color:#151925;">${label}</p>`;
  const dot = (c) => `<td width="7" height="7" bgcolor="${c}" style="border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>`;
  const G = '#c8960c', B = '#4f9cf9';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(subject)}</title>
<style>:root{color-scheme:light dark;supported-color-schemes:light dark}a{color:#8f6a00}
@media (prefers-color-scheme: dark){.z-bg{background-color:#080810!important}.z-panel{background-color:#11121c!important;border-color:#262838!important}.z-soft{background-color:#181a26!important;border-color:#262838!important}.z-text{color:#f0ede8!important}.z-muted{color:#a0a0b8!important}.z-link{color:#e8b84b!important}.z-line{border-color:#262838!important}}</style></head>
<body class="z-bg" style="margin:0;padding:0;background-color:#f6f4ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(oneLine(summary, 140))}</div>
<table class="z-bg" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f4ee" style="background-color:#f6f4ee;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 4px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:10px;vertical-align:middle;"><table role="presentation" cellpadding="0" cellspacing="3" border="0"><tr>${dot(G)}${dot(G)}${dot(G)}</tr><tr>${dot(B)}${dot(G)}${dot(B)}</tr><tr>${dot(G)}${dot(G)}${dot(G)}</tr></table></td>
<td class="z-text" style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:20px;font-weight:bold;letter-spacing:1px;color:#151925;">ZIVIO <span class="z-muted" style="font-weight:normal;font-size:12px;letter-spacing:3px;color:#4d586b;">CALLS</span></td>
</tr></table></td></tr>
${card(`${badges ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;"><tr>${badges}</tr></table>` : ''}
<h1 class="z-text" style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:30px;color:#151925;">${esc(missed ? `Missed call from ${callerId ? prettyPhone(callerId) : 'unknown number'}` : who)}</h1>
<p class="z-muted" style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#4d586b;">${esc([when, length, 'Answered by AI assistant'].filter(Boolean).join(' · '))}</p>
<p class="z-text" style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#151925;">${esc(missed ? 'The caller hung up before leaving any details.' : summary || 'No summary for this call.')}</p>
${buttons ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${buttons}</tr></table>` : ''}`, '26px 24px')}
${rows.length ? card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;">${rowHtml}</table>`, '8px 24px') : ''}
${nextStep ? card(`${heading('SUGGESTED NEXT STEP')}<p class="z-text" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#151925;">${esc(nextStep)}</p>`) : ''}
${card(`${heading('TRANSCRIPT')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;">${transcriptHtml}</table>`)}
<tr><td class="z-muted" align="center" style="padding:4px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#4d586b;">
Call to 587-206-5600, answered by your AI assistant. The summary and details are written by AI from the call, so check anything important with the caller.<br>
Call ID ${esc(call.call_id || '')} · <a class="z-link" href="${RETELL_CALLS}" style="color:#8f6a00;">open Retell</a>
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, text, html, replyTo: validEmail };
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const retellKey = process.env.RETELL_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!retellKey || !resendKey) {
    console.error('RETELL_API_KEY or RESEND_API_KEY is not set');
    return new Response('Not configured', { status: 500 });
  }

  // Check the signature against the exact text Retell sent, before reading it.
  const body = await req.text();
  if (!(await signedByRetell(body, req.headers.get('x-retell-signature'), retellKey))) {
    return new Response('Bad signature', { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  // Retell also sends call_started and call_ended; only the analysed call has the summary.
  if (event?.event !== 'call_analyzed' || !event.call) return new Response('Ignored', { status: 200 });

  const { subject, text, html, replyTo } = buildEmail(event.call);
  const email = { from: FROM, to: [TO], subject, text, html };
  if (replyTo) email.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
      // If Retell retries the same call, Resend sends the email only once.
      ...(event.call.call_id ? { 'Idempotency-Key': `retell-${event.call.call_id}` } : {}),
    },
    body: JSON.stringify(email),
  });
  if (!res.ok) {
    // Log only the status: the full call stays safe in Retell's Call History.
    console.error('Resend rejected the email', res.status);
    return new Response('Email failed', { status: 502 });
  }
  return new Response('Sent', { status: 200 });
};
