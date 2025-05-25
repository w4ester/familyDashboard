const { chromium } = require('playwright');
const path = require('path');

async function testManualVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slower for manual observation
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'verify-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🚀 Starting Manual Verification Test...');
  console.log('📝 Using the existing chore ID: 1748127934042');
  
  try {
    // Navigate and login
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
    const skipButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (skipButton) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Take initial screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01-initial-dashboard.png'), fullPage: true });
    
    // Open AI Assistant
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Send command helper
    async function sendCommand(command, screenshotName) {
      console.log(`\n💬 Command: "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await page.waitForTimeout(500);
        
        await aiInput.press('Enter');
        await page.waitForTimeout(3000); // Wait longer for response
        
        await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}.png`) });
        
        console.log('📸 Screenshot taken: ' + screenshotName);
      }
    }
    
    // Test sequence
    console.log('\n🔍 TEST SEQUENCE:');
    
    // 1. Check initial points
    await sendCommand('Show points', '02-initial-points');
    
    // 2. Mark chore complete
    await sendCommand('Complete chore 1748127934042', '03-chore-completed');
    
    // 3. Check points after completion (should still be 0)
    await sendCommand('Show points', '04-points-after-complete');
    
    // 4. Verify the chore
    await sendCommand('Verify chore 1748127934042 by TestParent', '05-chore-verified');
    
    // 5. Check points after verification (should now show 10 points)
    await sendCommand('Show points', '06-points-after-verify');
    
    // 6. List all chores to see final status
    await sendCommand('List chores', '07-final-chore-status');
    
    // Close AI Assistant
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Check Points History tab
    console.log('\n📊 Checking Points History tab...');
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '08-points-history.png'), fullPage: true });
    
    // Check Chore Jobs tab
    console.log('📋 Checking Chore Jobs tab...');
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '09-chore-jobs.png'), fullPage: true });
    
    console.log('\n✅ Test completed! Check verify-screenshots directory.');
    console.log('🎯 Key things to verify:');
    console.log('   1. Points should be 0 after completion');
    console.log('   2. Points should be 10 after verification');
    console.log('   3. Chore status should change from assigned → pending_review → completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    // Keep browser open for 5 seconds to observe
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testManualVerification().catch(console.error);