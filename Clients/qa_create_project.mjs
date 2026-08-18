export default async function run(page, ui) {
  const result = { steps: [] };

  // --- Login ---
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'Suresh@vaid.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\//, { timeout: 10000 }).catch(() => {});
  result.afterLoginUrl = page.url();

  // --- Go to Create Project page ---
  await page.goto('http://localhost:5174/admin/projects/new');
  await page.waitForSelector('text=Client information', { timeout: 10000 });

  // Screenshot before selecting new client
  await page.screenshot({ path: 'C:\\Users\\sreen\\AppData\\Local\\Temp\\claude\\c--xampp-htdocs-websites-VaidProjectManaagment-Web-App\\2b5b017f-281e-4813-9e4a-44a0a98cb2f7\\scratchpad\\before_new_client.png' });

  const beforeSnapshot = await ui.snapshot();
  result.clientDropdownOptionsBefore = beforeSnapshot.match(/combobox[^\n]*/g) || [];

  // Get select options text via DOM
  const selectOptionsText = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const clientSelect = selects[0];
    return clientSelect ? Array.from(clientSelect.options).map(o => o.textContent.trim()) : [];
  });
  result.clientSelectOptions = selectOptionsText;

  // Select "+ Add new client"
  const selects = await page.$$('select');
  await selects[0].selectOption({ label: '+ Add new client' });
  await page.waitForTimeout(300);

  const afterFieldsText = await page.evaluate(() => document.body.innerText);
  result.hasNewClientNameField = afterFieldsText.includes('New client name');
  result.hasNewClientEmailField = afterFieldsText.includes('New client email');
  result.hasPhoneField = afterFieldsText.includes('Phone');
  result.hasCompanyField = afterFieldsText.includes('Company');

  await page.screenshot({ path: 'C:\\Users\\sreen\\AppData\\Local\\Temp\\claude\\c--xampp-htdocs-websites-VaidProjectManaagment-Web-App\\2b5b017f-281e-4813-9e4a-44a0a98cb2f7\\scratchpad\\after_new_client.png' });

  // Fill in fields
  await page.fill('input[placeholder="e.g. Rohit Kumar"]', 'Test Client Co');
  await page.fill('input[placeholder="client@email.com"]', 'testclient@example.com');
  await page.fill('input[placeholder="e.g. BDA Apartments"]', 'Test Project');

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  result.afterSubmitUrl = page.url();
  const bodyTextAfterSubmit = await page.evaluate(() => document.body.innerText);
  result.hasErrorText = bodyTextAfterSubmit.includes('required') || bodyTextAfterSubmit.includes('Enter a valid email');
  result.navigatedToProjectDetail = /\/admin\/projects\/c\d+/.test(page.url()) || /\/admin\/projects\/p/.test(page.url());

  return result;
}
