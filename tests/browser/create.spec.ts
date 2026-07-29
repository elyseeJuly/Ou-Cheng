import { expect, test } from '@playwright/test';

test('创作核心旅程：模式切换、导入弹窗与草稿恢复', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/');
  const freeEditor = page.getByPlaceholder('在此输入诗词内容...');
  await expect(freeEditor).toBeVisible();
  await freeEditor.fill('明月松间照');
  await page.waitForTimeout(450);

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '专业格律' }).click();
  await expect(page.getByText('近体诗', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '自由挥毫' }).click();

  await page.getByRole('button', { name: '导入文稿' }).click();
  await expect(page.getByRole('dialog', { name: '导入文稿' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '导入文稿' })).toBeHidden();

  await page.reload();
  await expect(page.getByPlaceholder('在此输入诗词内容...')).toHaveValue('明月松间照');
  await page.getByRole('button', { name: '保存墨迹' }).click();
  await expect(page).toHaveURL(/#\/works$/);
  const primaryPoemCount = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const open = indexedDB.open('oucheng_vault', 2);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction('poems', 'readonly').objectStore('poems').count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    };
  }));
  expect(primaryPoemCount).toBe(1);
  expect(runtimeErrors).toEqual([]);
});
