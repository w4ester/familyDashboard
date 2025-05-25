const { chromium } = require('playwright');
const path = require('path');

async function testCleanVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'clean-test-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🧹 CLEAN VERIFICATION TEST - Starting from zero points\n');
  
  try {
    // Fresh start - clear any existing data
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      console.log('Cleared all localStorage data');
    });
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'demo');
      await page.fill('input[placeholder="Enter your password"]', 'demo');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Onboarding
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      await page.fill('input[placeholder="Enter your name..."]', 'Test User');
      await onboardingButton.click();
      await page.waitForTimeout(2000);
    }
    
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Open AI Assistant
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    async function sendCommand(command, screenshotName) {
      console.log(`💬 "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await aiInput.press('Enter');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}.png`) });
      }
    }
    
    console.log('✅ TEST SEQUENCE:\n');
    
    // 1. Setup
    await sendCommand('Add Emma as a child', '01-add-child');
    await sendCommand('Add Dad as a parent', '02-add-parent');
    
    // 2. Check initial points (should be 0)
    console.log('\n📊 Initial state:');
    await sendCommand('Show points', '03-initial-points');
    
    // 3. Create chore
    await sendCommand('Create a chore for Emma to wash car worth 15 points', '04-create-chore');
    
    // 4. Get chore ID
    await sendCommand('List chores', '05-list-chores');
    
    // Extract ID from screenshot - for demo purposes, we'll check manually
    console.log('\n⚠️  Check screenshot 05-list-chores.png for the chore ID');
    console.log('Then run: Complete chore [ID] and Verify chore [ID] by Dad');
    
    // Take final dashboard screenshot
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '06-points-dashboard.png'), fullPage: true });
    
    console.log('\n✅ Clean test setup complete!');
    console.log('📝 Next steps:');
    console.log('1. Note the chore ID from screenshot 05');
    console.log('2. Complete chore [ID]');
    console.log('3. Verify chore [ID] by Dad');
    console.log('4. Show points - should show 15 points for Emma');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Keep browser open for manual testing
    console.log('\n🔍 Browser staying open for manual testing...');
  }
}

testCleanVerification().catch(console.error);