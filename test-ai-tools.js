const puppeteer = require('puppeteer');

async function testAITools() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:3000');
    
    // Wait for login page
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    
    console.log('2. Logging in...');
    // Type any username and password
    await page.type('input[type="text"]', 'testuser');
    await page.type('input[type="password"]', 'testpass');
    
    // Click sign in button
    await page.click('button[type="submit"], button');
    
    // Wait for navigation after login
    await page.waitForTimeout(2000);
    
    // Check if we're on the welcome page or dashboard
    try {
      // Try to find Get Started button (welcome page)
      const getStartedButton = await page.$('button');
      if (getStartedButton) {
        await getStartedButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Already on dashboard
    }
    
    console.log('3. Opening AI Guide...');
    // Click the AI guide button (lightning bolt)
    await page.click('.fixed.bottom-4.right-4');
    
    // Wait for AI panel
    await page.waitForSelector('input[placeholder*="Ask me to create"]', { timeout: 5000 });
    
    console.log('4. Testing chore creation...');
    // Type the command
    await page.type('input[placeholder*="Ask me to create"]', 'Create a chore for Dado to unload dishes worth 5 points');
    
    // Click send button - last button in the AI panel
    const buttons = await page.$$('button');
    await buttons[buttons.length - 1].click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check if chore was created
    const choreText = await page.$eval('body', el => el.textContent);
    if (choreText.includes('unload dishes')) {
      console.log('✅ Chore created successfully!');
    } else {
      console.log('❌ Chore not found in dashboard');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'ai-tools-test.png' });
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'ai-tools-error.png' });
  }
  
  await browser.close();
}

testAITools();