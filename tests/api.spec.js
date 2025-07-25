import { test, expect, request } from '@playwright/test';

const API = 'http://localhost:4000';

test('API: login, CRUD items, and edge cases', async () => {
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

  // Add: cannot add empty item
  res = await api.post(API + '/items', { data: { text: '' }, headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(400);
  expect((await res.json()).error || '').toMatch(/empty/i);

  // Add: cannot add item without auth
  res = await api.post(API + '/items', { data: { text: 'noauth' } });
  expect(res.status()).toBe(401);
  expect((await res.json()).error || '').toMatch(/auth/i);

  // Add: cannot add item with invalid token
  res = await api.post(API + '/items', { data: { text: 'badtoken' }, headers: { Authorization: 'Bearer badtoken' } });
  expect(res.status()).toBe(401);

  // Add: cannot add item with malformed token
  res = await api.post(API + '/items', { data: { text: 'malformed' }, headers: { Authorization: 'Bearer' } });
  expect(res.status()).toBe(401);

  // Add: cannot add item with missing text field
  res = await api.post(API + '/items', { data: {}, headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(400);

  // Add: cannot add duplicate item (if backend prevents duplicates)
  await api.post(API + '/items', { data: { text: 'uniqueItem' }, headers: { Authorization: 'Bearer ' + token } });
  res = await api.post(API + '/items', { data: { text: 'uniqueItem' }, headers: { Authorization: 'Bearer ' + token } });
  // Accept either 201 (if allowed) or 400/409 (if duplicate not allowed)
  expect([201, 400, 409]).toContain(res.status());

  // Edit item
  res = await api.put(API + '/items/' + newItem.id, { data: { text: 'apiItemEdited' }, headers: { Authorization: 'Bearer ' + token } });
  expect(res.ok()).toBeTruthy();

  // Edit: cannot edit to empty text
  res = await api.put(API + '/items/' + newItem.id, { data: { text: '' }, headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(400);

  // Edit: cannot edit non-existent item
  res = await api.put(API + '/items/999999', { data: { text: 'nope' }, headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(404);

  // Edit: cannot edit without auth
  res = await api.put(API + '/items/' + newItem.id, { data: { text: 'failNoAuth' } });
  expect(res.status()).toBe(401);

  // Edit: cannot edit with invalid token
  res = await api.put(API + '/items/' + newItem.id, { data: { text: 'failBadToken' }, headers: { Authorization: 'Bearer badtoken' } });
  expect(res.status()).toBe(401);

  // Edit: cannot edit with malformed token
  res = await api.put(API + '/items/' + newItem.id, { data: { text: 'failMalformed' }, headers: { Authorization: 'Bearer' } });
  expect(res.status()).toBe(401);

  // Edit: cannot edit with missing text field
  res = await api.put(API + '/items/' + newItem.id, { data: {}, headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(400);

  // Delete: cannot delete non-existent item
  res = await api.delete(API + '/items/999999', { headers: { Authorization: 'Bearer ' + token } });
  expect(res.status()).toBe(404);

  // Delete: cannot delete without auth
  res = await api.delete(API + '/items/' + newItem.id);
  expect(res.status()).toBe(401);

  // Delete: cannot delete with invalid token
  res = await api.delete(API + '/items/' + newItem.id, { headers: { Authorization: 'Bearer badtoken' } });
  expect(res.status()).toBe(401);

  // Delete: cannot delete with malformed token
  res = await api.delete(API + '/items/' + newItem.id, { headers: { Authorization: 'Bearer' } });
  expect(res.status()).toBe(401);

  // Get: cannot get items without auth
  res = await api.get(API + '/items');
  expect(res.status()).toBe(401);

  // Get: cannot get items with invalid token
  res = await api.get(API + '/items', { headers: { Authorization: 'Bearer badtoken' } });
  expect(res.status()).toBe(401);

  // Get: cannot get items with malformed token
  res = await api.get(API + '/items', { headers: { Authorization: 'Bearer' } });
  expect(res.status()).toBe(401);

  // Delete item (cleanup)
  res = await api.delete(API + '/items/' + newItem.id, { headers: { Authorization: 'Bearer ' + token } });
  expect([204, 404]).toContain(res.status());
});
