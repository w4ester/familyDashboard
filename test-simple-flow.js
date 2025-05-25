const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimpleTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const page = await browser.newPage();
  
  console.log('Starting simple workflow test...');
  
  try {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="Enter your username"]', 'test');
    await page.fill('input[placeholder="Enter your password"]', 'test');
    await page.click('button:has-text("Sign In")');
    await delay(2000);
    
    // Handle welcome
    const startButton = await page.locator('button:has-text("Start Using Dashboard")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await delay(2000);
    }
    
    // First, we need to add family members
    console.log('Adding family members...');
    await page.click('button:has-text("Family")');
    await delay(1000);
    
    // Add Alice
    const nameInput = await page.locator('input[placeholder*="Enter family member name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Alice');
      await page.click('button:has-text("Add Member")');
      await delay(500);
      
      // Add Parent
      await nameInput.fill('Parent');
      await page.click('button:has-text("Add Member")');
      await delay(500);
    }
    
    // Now test AI chore creation
    console.log('Opening AI Assistant...');
    const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
    await aiButton.click();
    await delay(1000);
    
    // Create chore
    console.log('Creating chore...');
    const aiInput = await page.locator('input[placeholder*="Create a chore"]').first();
    await aiInput.fill('create chore "Clean Room" assigned to Alice worth 50 points');
    
    const sendButton = await page.locator('button:has-text("Send")').last();
    await sendButton.click();
    await delay(2000);
    
    // Check response
    const response = await page.locator('.bg-gray-100, .bg-blue-50').last();
    const responseText = await response.textContent();
    console.log('AI Response:', responseText);
    
    // Close AI
    const closeButton = await page.locator('button:has-text("×")').last();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await delay(500);
    }
    
    // Go to Chore Jobs
    console.log('Checking Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'simple-test-result.png', fullPage: true });
    
    // Check localStorage
    const data = await page.evaluate(() => {
      return {
        assignments: localStorage.getItem('chore-assignments'),
        family: localStorage.getItem('familyDashboardData')
      };
    });
    
    console.log('\nLocalStorage Data:');
    console.log('Assignments:', data.assignments);
    console.log('Family:', data.family ? JSON.parse(data.family).familyMembers : 'No family data');
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'simple-test-error.png', fullPage: true });
  } finally {
    await delay(3000);
    await browser.close();
  }
}

runSimpleTest().catch(console.error);