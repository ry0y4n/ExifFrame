import { test } from '@playwright/test';

for (let i = 1; i < 5; i++) {
  test(`upload & download image: part${i}`, async ({ page }) => {
    await page.goto('http://127.0.0.1:5500/index.html');

    // Upload image
    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('button#uploadBtn')]);
    await fileChooser.setFiles(`samples_original/sample${i}.jpg`);

    // Wait for being able to download
    await page.waitForSelector('#downloadBtn:not([disabled])');

    // Download image
    const downloadPromise = page.waitForEvent('download');
    await page.click('button#downloadBtn'); // Assuming the button has an id of 'downloadBtn'
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    await download.saveAs(`test-results/${suggestedFilename}`);
  });
}
