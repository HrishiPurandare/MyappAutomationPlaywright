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
