# CreateFullstackTestApp.ps1
$projectRoot = "C:\Git_Projects\TestProject\Myapp"
$frontend = "$projectRoot\frontend"
$backend = "$projectRoot\backend"

# Create directories
New-Item -ItemType Directory -Force -Path $frontend, $backend | Out-Null

# --- BACKEND SETUP ---
Set-Location $backend
npm init -y
npm install express cors jsonwebtoken bcryptjs body-parser

# Create backend server.js
@"
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
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get('/items', auth, (req, res) => res.json(items));
app.post('/items', auth, (req, res) => {
  const { text } = req.body;
  const newItem = { id: Date.now(), text };
  items.push(newItem);
  res.status(201).json(newItem);
});
app.put('/items/:id', auth, (req, res) => {
  const item = items.find(i => i.id == req.params.id);
  if (!item) return res.sendStatus(404);
  item.text = req.body.text;
  res.json(item);
});
app.delete('/items/:id', auth, (req, res) => {
  const idx = items.findIndex(i => i.id == req.params.id);
  if (idx === -1) return res.sendStatus(404);
  items.splice(idx, 1);
  res.sendStatus(204);
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
"@ | Set-Content "$backend\server.js"

# Add backend start script
(Get-Content "$backend\package.json") -replace '"test": "echo.*"', '"start": "node server.js"' | Set-Content "$backend\package.json"

# --- FRONTEND SETUP ---
Set-Location $projectRoot
npx create-react-app frontend --template cra-template-pwa
Set-Location $frontend
npm install axios

# Replace src/App.js
@"
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

function App() {
  const [token, setToken] = useState('');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [edit, setEdit] = useState({ id: null, text: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (token) fetchItems(); }, [token]);

  const fetchItems = async () => {
    try {
      const res = await axios.get(API + '/items', { headers: { Authorization: 'Bearer ' + token } });
      setItems(res.data);
    } catch { setError('Failed to fetch items'); }
  };

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(API + '/login', login);
      setToken(res.data.token);
    } catch { setError('Invalid credentials'); }
  };

  const handleAdd = async e => {
    e.preventDefault();
    try {
      await axios.post(API + '/items', { text: newItem }, { headers: { Authorization: 'Bearer ' + token } });
      setNewItem(''); fetchItems();
    } catch { setError('Add failed'); }
  };

  const handleEdit = async e => {
    e.preventDefault();
    try {
      await axios.put(API + '/items/' + edit.id, { text: edit.text }, { headers: { Authorization: 'Bearer ' + token } });
      setEdit({ id: null, text: '' }); fetchItems();
    } catch { setError('Edit failed'); }
  };

  const handleDelete = async id => {
    try {
      await axios.delete(API + '/items/' + id, { headers: { Authorization: 'Bearer ' + token } });
      fetchItems();
    } catch { setError('Delete failed'); }
  };

  if (!token) return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input placeholder="Username" value={login.username} onChange={e => setLogin({ ...login, username: e.target.value })} />
      <input placeholder="Password" type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} />
      <button type="submit">Login</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );

  return (
    <div>
      <h2>Items</h2>
      <form onSubmit={handleAdd}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New item" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {items.map(i => (
          <li key={i.id}>
            {edit.id === i.id ? (
              <form onSubmit={handleEdit}>
                <input value={edit.text} onChange={e => setEdit({ ...edit, text: e.target.value, id: i.id })} />
                <button type="submit">Save</button>
                <button onClick={() => setEdit({ id: null, text: '' })}>Cancel</button>
              </form>
            ) : (
              <>
                {i.text}
                <button onClick={() => setEdit({ id: i.id, text: i.text })}>Edit</button>
                <button onClick={() => handleDelete(i.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <button onClick={() => setToken('')}>Logout</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </div>
  );
}

export default App;
"@ | Set-Content "$frontend\src\App.js"

# --- PLAYWRIGHT SETUP ---
Set-Location $projectRoot
npm init -y
npm install -D playwright @playwright/test

# Create Playwright config
@"
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
"@ | Set-Content "$projectRoot\playwright.config.js"

# Create tests folder and sample tests
New-Item -ItemType Directory -Force -Path "$projectRoot\tests" | Out-Null

# UI Test
@"
import { test, expect } from '@playwright/test';

test('login, add, edit, delete item', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[placeholder="Username"]', 'test');
  await page.fill('input[placeholder="Password"]', 'test123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('h2')).toHaveText('Items');
  await page.fill('input[placeholder="New item"]', 'MyItem');
  await page.click('button:has-text("Add")');
  await expect(page.locator('li')).toContainText('MyItem');
  await page.click('button:has-text("Edit")');
  await page.fill('input', 'MyItemEdited');
  await page.click('button:has-text("Save")');
  await expect(page.locator('li')).toContainText('MyItemEdited');
  await page.click('button:has-text("Delete")');
  await expect(page.locator('li')).not.toContainText('MyItemEdited');
});
"@ | Set-Content "$projectRoot\tests\ui.spec.js"

# API Test
@"
import { test, expect, request } from '@playwright/test';

const API = 'http://localhost:4000';

test('API: login, CRUD items', async () => {
  const api = await request.newContext();
  // Invalid login
  let res = await api.post(API + '/login', { data: { username: 'bad', password: 'bad' } });
  expect(res.status()).toBe(401);

  // Valid login
  res = await api.post(API + '/login', { data: { username: 'test', password: 'test123' } });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();

  // Get items
  res = await api.get(API + '/items', { headers: { Authorization: 'Bearer ' + token } });
  expect(res.ok()).toBeTruthy();
  const items = await res.json();

  // Add item
  res = await api.post(API + '/items', { data: { text: 'apiItem' }, headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(201);
  const newItem = await res.json();

  // Edit item
  res = await api.put(API + '/items/' + newItem.id, { data: { text: 'apiItemEdited' }, headers: { Authorization: 'Bearer ' + token } });
  expect(res.ok()).toBeTruthy();

  // Delete item
  res = await api.delete(API + '/items/' + newItem.id, { headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(204);
});
"@ | Set-Content "$projectRoot\tests\api.spec.js"

# --- README & TEST PLAN ---
@"
# Simple Fullstack Test App

## What is being tested
- React frontend: login, CRUD for items
- Node.js backend API: login, CRUD endpoints

## Test Coverage
- UI automation: login, add/edit/delete item, data assertions
- API automation: /login, /items CRUD, positive/negative cases

## Tools Used
- React, Express, Playwright JS

## How to Run

### 1. Start backend
cd backend
npm install
npm start

### 2. Start frontend
cd ../frontend
npm install
npm start

### 3. Run tests (in project root)
npm install
npx playwright test

## Assumptions / Limitations
- No persistent DB, in-memory only
- For demo only, not production ready

## Bonus
- Add Playwright code coverage or GitHub Actions as needed

"@ | Set-Content "$projectRoot\README.md"

Write-Host "Project created at $projectRoot. See README.md for instructions."