const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = 'testsecret';
let users = [{ username: 'test', password: bcrypt.hashSync('test123', 8) }];
let items = [{ id: 1, text: 'First item' }];

// TEST ONLY: Reset items (for Playwright test isolation)
app.post('/test/reset', (req, res) => {
  items = [];
  res.json({ ok: true });
});

// Robust: handle missing username/password in login
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized: missing token' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: malformed token' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Unauthorized: invalid token' });
    req.user = user;
    next();
  });
}

app.get('/items', auth, (req, res) => res.json(items));
app.post('/items', auth, (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Item text cannot be empty' });
  // Prevent duplicate items with same text (enabled for robustness)
  if (items.some(i => i.text === text)) return res.status(409).json({ error: 'Duplicate item' });
  const newItem = { id: Date.now(), text };
  items.push(newItem);
  res.status(201).json(newItem);
});
app.put('/items/:id', auth, (req, res) => {
  const item = items.find(i => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Item text cannot be empty' });
  item.text = text;
  res.json(item);
});
app.delete('/items/:id', auth, (req, res) => {
  const idx = items.findIndex(i => i.id == req.params.id);
  if (idx === -1) return res.sendStatus(404);
  items.splice(idx, 1);
  res.sendStatus(204);
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));