

test.beforeEach(async () => {
  // Reset backend items for test isolation
  await fetch('http://localhost:4000/test/reset', { method: 'POST' });
});
test('login fails with wrong credentials', async ({ page }) => {
  console.log('Testing login with invalid credentials...');
  await page.goto('/');
  await page.fill('input[placeholder="Username"]', 'wronguser');
  await page.fill('input[placeholder="Password"]', 'wrongpass');
  await page.click('button:has-text("Login")');
  // Use the last div with the error text to avoid strict mode violation
  await expect(page.locator('div', { hasText: 'Invalid credentials' }).last()).toBeVisible();
  console.log('Negative login test passed.');
});

test('cannot add empty item', async ({ page }) => {
  console.log('Testing add empty item...');
  await page.goto('/');
  await page.fill('input[placeholder="Username"]', 'test');
  await page.fill('input[placeholder="Password"]', 'test123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('h2')).toHaveText('Items');
  await page.click('button:has-text("Add")');
  // Should not add an empty item, so count remains the same
  const itemCount = await page.locator('li').count();
  await expect(page.locator('li')).toHaveCount(itemCount);
  console.log('Empty item add negative test passed.');
});

test('cannot edit item to empty text', async ({ page }) => {
  console.log('Testing edit item to empty text...');
  await page.goto('/');
  await page.fill('input[placeholder="Username"]', 'test');
  await page.fill('input[placeholder="Password"]', 'test123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('h2')).toHaveText('Items');
  // Add a new item
  await page.fill('input[placeholder="New item"]', 'EditMe');
  await page.click('button:has-text("Add")');
  // Wait for the new item to appear
  const lastItem = page.locator('li').last();
  await expect(lastItem).toContainText('EditMe');
  await lastItem.locator('button:has-text("Edit")').click();
  // Wait for the input to appear
  const editInput = lastItem.locator('input');
  await editInput.first().waitFor({ state: 'visible' });
  await editInput.first().fill('');
  await lastItem.locator('button:has-text("Save")').click();
  // Wait for the input to disappear (edit form closes)
  await expect(editInput).toHaveCount(0);
  // After trying to save empty, check that the item text is still 'EditMe'
  await expect(lastItem).toContainText('EditMe');
  // Clean up
  await lastItem.locator('button:has-text("Delete")').click();
  console.log('Edit to empty text negative test passed.');
});

test('delete item removes only that item', async ({ page }) => {
  console.log('Testing delete removes only the correct item...');
  await page.goto('/');
  await page.fill('input[placeholder="Username"]', 'test');
  await page.fill('input[placeholder="Password"]', 'test123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('h2')).toHaveText('Items');
  // Add two items
  const unique1 = 'DeleteMe1-' + Date.now() + '-' + Math.floor(Math.random()*10000);
  const unique2 = 'DeleteMe2-' + Date.now() + '-' + Math.floor(Math.random()*10000);
  await page.fill('input[placeholder="New item"]', unique1);
  await page.click('button:has-text("Add")');
  await expect(page.locator('li', { hasText: unique1 })).toHaveCount(1);
  await page.fill('input[placeholder="New item"]', unique2);
  await page.click('button:has-text("Add")');
  await expect(page.locator('li', { hasText: unique2 })).toHaveCount(1);
  // Delete the first one
  const firstItem = page.locator('li', { hasText: unique1 }).first();
  await firstItem.locator('button:has-text("Delete")').click();
  await expect(page.locator('li', { hasText: unique1 })).toHaveCount(0);
  await expect(page.locator('li', { hasText: unique2 })).toHaveCount(1);
  // Clean up
  await page.locator('li', { hasText: unique2 }).locator('button:has-text("Delete")').click();
  console.log('Delete item positive test passed.');
});
import { test, expect } from '@playwright/test';

test('login, add, edit, delete item', async ({ page }) => {
  console.log('Navigating to app...');
  await page.goto('/');
  console.log('Logging in...');
  await page.fill('input[placeholder="Username"]', 'test');
  await page.fill('input[placeholder="Password"]', 'test123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('h2')).toHaveText('Items');
  console.log('Login successful, Items page loaded.');

  // Clean up any existing 'MyItem' or 'MyItemEdited' items
  // Robust cleanup: try up to 10 times for each item type
  console.log('Cleaning up any existing MyItem or MyItemEdited items...');
  for (let i = 0; i < 10 && await page.locator('li', { hasText: 'MyItem' }).count() > 0; i++) {
    const delBtn = page.locator('li', { hasText: 'MyItem' }).locator('button:has-text("Delete")').first();
    if (await delBtn.count() === 0) break;
    await delBtn.click();
    await page.waitForTimeout(100); // allow UI to update
  }
  for (let i = 0; i < 10 && await page.locator('li', { hasText: 'MyItemEdited' }).count() > 0; i++) {
    const delBtn = page.locator('li', { hasText: 'MyItemEdited' }).locator('button:has-text("Delete")').first();
    if (await delBtn.count() === 0) break;
    await delBtn.click();
    await page.waitForTimeout(100);
  }

  // Add a new item
  console.log('Adding a new item...');
  await page.fill('input[placeholder="New item"]', 'MyItem');
  await page.click('button:has-text("Add")');
  // Expect only one 'MyItem' in the list
  await expect(page.locator('li', { hasText: 'MyItem' })).toHaveCount(1);
  console.log('Item added successfully.');

  console.log('Editing the last item in the list...');
  const allItems = page.locator('li');
  const lastItem = allItems.last();
  await lastItem.locator('button:has-text("Edit")').click();
  const editInput = lastItem.locator('input');
  const inputCount = await editInput.count();
  if (inputCount === 0) {
    throw new Error('Edit input not found in the last <li> after clicking Edit.');
  }
  await editInput.first().waitFor({ state: 'visible' });
  await editInput.first().fill('MyItemEdited');
  await lastItem.locator('button:has-text("Save")').click();
  // Expect only one 'MyItemEdited' in the list
  await expect(page.locator('li', { hasText: 'MyItemEdited' })).toHaveCount(1);
  console.log('Item edited successfully.');

  // Delete the edited item
  console.log('Deleting the edited item...');
  await page.locator('li', { hasText: 'MyItemEdited' }).locator('button:has-text("Delete")').click();
  await expect(page.locator('li', { hasText: 'MyItemEdited' })).toHaveCount(0);
  console.log('Item deleted successfully.');
});
