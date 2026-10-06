require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data');
const MSG_FILE = path.join(DATA, 'messages.json');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ['https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:']
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/profile', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(path.join(DATA, 'profile.json'), 'utf8')));
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many messages. Try again later.' } });
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

app.post('/api/contact', limiter, (req, res) => {
  const name = clean(req.body.name, 80), email = clean(req.body.email, 120), message = clean(req.body.message, 1000);
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return res.status(400).json({ error: 'Enter a name, a valid email and a message.' });
  const list = fs.existsSync(MSG_FILE) ? JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')) : [];
  list.push({ name, email, message, at: new Date().toISOString() });
  fs.writeFileSync(MSG_FILE, JSON.stringify(list, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`[+] Portfolio online: http://localhost:${PORT}`));
