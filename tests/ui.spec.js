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
