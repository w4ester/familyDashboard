const { chromium } = require('playwright');

async function checkApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of what we see
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    
    // Log what's on the page
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for various elements
    const h1s = await page.locator('h1').all();
    console.log('\nH1 elements found:');
    for (const h1 of h1s) {
      console.log('-', await h1.textContent());
    }
    
    const buttons = await page.locator('button').all();
    console.log('\nButtons found:');
    for (const button of buttons) {
      const text = await button.textContent();
      if (text) console.log('-', text.trim());
    }
    
    // Check localStorage for existing data
    const familyData = await page.evaluate(() => {
      return localStorage.getItem('familyDashboardData');
    });
    console.log('\nHas family data:', !!familyData);
    
    const choreAssignments = await page.evaluate(() => {
      return localStorage.getItem('chore-assignments');
    });
    console.log('Has chore assignments:', !!choreAssignments);
    
    // If we have data, try to skip to dashboard
    if (familyData) {
      console.log('\nTrying to navigate directly to dashboard...');
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Check if we need to click through welcome
      const getStarted = await page.locator('button:has-text("Get Started")').first();
      if (await getStarted.isVisible()) {
        await getStarted.click();
        await page.waitForTimeout(2000);
        
        // Try to skip onboarding
        const skip = await page.locator('button:has-text("Skip")').first();
        if (await skip.isVisible()) {
          await skip.click();
          await page.waitForTimeout(2000);
        }
      }
      
      await page.screenshot({ path: 'after-navigation.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

checkApp().catch(console.error);