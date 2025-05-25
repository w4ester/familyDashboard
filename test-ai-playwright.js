const { chromium } = require('@playwright/test');

(async () => {
  console.log('Starting Playwright test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navigate to app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-1-initial.png' });
    
    // 2. Check if we need to login
    const loginInput = await page.locator('input[type="text"]').first();
    if (await loginInput.isVisible()) {
      console.log('2. Logging in...');
      await loginInput.fill('testuser');
      await page.locator('input[type="password"]').fill('testpass');
      
      // Find and click the Sign In button
      const signInButton = await page.getByRole('button', { name: /sign in/i });
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-2-after-login.png' });
    
    // 3. Complete onboarding if needed
    try {
      // Check for onboarding form
      const nameInput = await page.locator('input[placeholder*="Enter your name"]');
      if (await nameInput.isVisible()) {
        console.log('3. Completing onboarding...');
        await nameInput.fill('Test User');
        
        // Click "Let's get started together!"
        const startButton = await page.getByRole('button', { name: /Let's get started together/i });
        await startButton.click();
        await page.waitForTimeout(1000);
        
        // Now click "Start Using Dashboard!"
        const dashboardButton = await page.getByRole('button', { name: /Start Using Dashboard/i });
        if (await dashboardButton.isVisible()) {
          await dashboardButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {
      console.log('Onboarding not needed or already completed');
    }
    
    await page.screenshot({ path: 'test-3-dashboard.png' });
    
    // 4. Look for AI Assistant button (orange lightning bolt)
    console.log('4. Looking for AI Assistant...');
    const aiButton = await page.locator('.fixed.bottom-4.right-4').first();
    if (await aiButton.isVisible()) {
      console.log('5. Opening AI Assistant...');
      await aiButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-4-ai-open.png' });
      
      // 6. Type command
      console.log('6. Typing command...');
      const input = await page.locator('input[placeholder*="Create a chore"]').first();
      await input.fill('Create a chore for Dado to unload dishes worth 5 points');
      
      await page.screenshot({ path: 'test-5-command-typed.png' });
      
      // 7. Click Send
      console.log('7. Clicking Send...');
      const sendButton = await page.getByRole('button', { name: 'Send' });
      await sendButton.click();
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-6-after-send.png' });
      
      // 8. Check dashboard for the chore
      console.log('8. Checking dashboard...');
      const dashboardContent = await page.textContent('body');
      
      if (dashboardContent.includes('Dado') && dashboardContent.includes('unload dishes')) {
        console.log('✅ SUCCESS: Chore was created!');
      } else {
        console.log('❌ FAILED: Chore not found in dashboard');
        console.log('Dashboard content:', dashboardContent.substring(0, 500));
      }
      
      await page.screenshot({ path: 'test-7-final.png' });
      
    } else {
      console.log('❌ AI Assistant button not found!');
      console.log('Page content:', await page.content());
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
    console.log('Test complete. Check the screenshots.');
  }
})();