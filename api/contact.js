/* Delivers the Let's talk form to an inbox.
 *
 * Configure in the Vercel project (Settings → Environment Variables):
 *   RESEND_API_KEY  an API key from resend.com
 *   CONTACT_TO      where enquiries should land, e.g. hello@inumedia.com
 *   CONTACT_FROM    a verified sender on your domain, e.g. site@inumedia.com
 *
 * Without those the endpoint answers 503 and the page tells the visitor to email
 * directly, rather than silently swallowing the message.
 */
const LIMITS = { name: 120, email: 200, subject: 200, message: 6000 };

const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const isEmail = value => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
const escape = value => String(value).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request body' });

  // Hidden field: real people leave it empty.
  if (clean(body.company, 100)) return res.status(200).json({ ok: true });

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const subject = clean(body.subject, LIMITS.subject) || 'New enquiry';
  const message = clean(body.message, LIMITS.message);

  if (!name || !message || !isEmail(email)) return res.status(422).json({ error: 'Please check your details' });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;
  if (!key || !to || !from) return res.status(503).json({ error: 'Mail delivery is not configured yet' });

  const text = `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}\n`;
  const html = `<p><strong>Name</strong> ${escape(name)}<br><strong>Email</strong> ${escape(email)}<br><strong>Subject</strong> ${escape(subject)}</p><p style="white-space:pre-wrap">${escape(message)}</p>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject: `INU Media — ${subject}`, text, html })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Resend rejected the message', response.status, detail.slice(0, 400));
      return res.status(502).json({ error: 'The mail provider rejected the message' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact delivery failed', error);
    return res.status(502).json({ error: 'The message could not be delivered' });
  }
};
