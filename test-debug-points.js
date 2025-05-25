const { chromium } = require('playwright');

async function debugPoints() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'demo');
      await page.fill('input[placeholder="Enter your password"]', 'demo');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Skip onboarding
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check localStorage data
    console.log('🔍 Checking localStorage data...\n');
    
    const choreAssignments = await page.evaluate(() => {
      return localStorage.getItem('chore-assignments');
    });
    
    const familyData = await page.evaluate(() => {
      return localStorage.getItem('familyDashboardData');
    });
    
    console.log('📋 Chore Assignments:');
    if (choreAssignments) {
      const assignments = JSON.parse(choreAssignments);
      console.log(JSON.stringify(assignments, null, 2));
    } else {
      console.log('No chore assignments found');
    }
    
    console.log('\n📊 Family Dashboard Data:');
    if (familyData) {
      const data = JSON.parse(familyData);
      console.log('choreEntries:', JSON.stringify(data.choreEntries, null, 2));
    } else {
      console.log('No family dashboard data found');
    }
    
    // Open AI Assistant and test
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
      
      // Send show points command
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type('Show points');
        await aiInput.press('Enter');
        await page.waitForTimeout(3000);
        
        console.log('\n🤖 AI Response to "Show points":');
        const messages = await page.$$eval('.fixed.w-96 .text-sm', 
          els => els.map(el => el.textContent?.trim()).filter(t => t)
        );
        console.log(messages[messages.length - 1]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugPoints().catch(console.error);