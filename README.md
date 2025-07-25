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



