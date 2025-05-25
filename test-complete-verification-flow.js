const { chromium } = require('playwright');
const path = require('path');

async function testCompleteVerificationFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'complete-flow-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🚀 Starting Complete Verification Flow Test...');
  
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
    
    // Handle onboarding
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
    console.log('🤖 Opening AI Assistant...');
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Helper to send AI command and capture response
    async function sendCommand(command, screenshotName) {
      console.log(`\n💬 Sending: "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (!aiInput) {
        console.log('⚠️  Could not find AI input');
        return null;
      }
      
      await aiInput.click();
      await aiInput.fill('');
      await aiInput.type(command);
      await page.waitForTimeout(500);
      
      await aiInput.press('Enter');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}.png`) });
      
      // Get the last response
      const messages = await page.$$eval('.fixed.w-96 .text-sm.text-gray-800', 
        elements => elements.map(el => el.textContent)
      );
      
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        console.log(`✅ Response: ${lastMessage}`);
        return lastMessage;
      }
      
      return null;
    }
    
    // COMPLETE TEST FLOW IN ONE SESSION
    console.log('\n📍 Step 1: Setting up family members');
    await sendCommand('Add VerifyKid as a child', '01-add-kid');
    await sendCommand('Add VerifyParent as a parent', '02-add-parent');
    
    console.log('\n📍 Step 2: Creating a chore assignment');
    await sendCommand('Create a chore for VerifyKid to test verification workflow worth 25 points', '03-create-chore');
    
    console.log('\n📍 Step 3: Listing chores to get ID');
    const listResponse = await sendCommand('List chores', '04-list-chores');
    
    // Extract chore ID from the response
    let choreId = null;
    if (listResponse) {
      const idMatch = listResponse.match(/\[ID: ([^\]]+)\]/);
      if (idMatch) {
        choreId = idMatch[1];
        console.log(`🔍 Found chore ID: ${choreId}`);
      }
    }
    
    if (!choreId) {
      console.log('❌ Could not extract chore ID, trying a different approach...');
      // Sometimes the ID might be in a different format
      const altMatch = listResponse?.match(/(\d{10,})/);
      if (altMatch) {
        choreId = altMatch[1];
        console.log(`🔍 Found alternative ID format: ${choreId}`);
      }
    }
    
    if (choreId) {
      console.log('\n📍 Step 4: Check initial points (should be 0)');
      await sendCommand('Show points', '05-initial-points');
      
      console.log('\n📍 Step 5: Kid marks chore as complete');
      await sendCommand(`Complete chore ${choreId}`, '06-mark-complete');
      
      console.log('\n📍 Step 6: Check points after completion (should still be 0)');
      await sendCommand('Show points', '07-points-after-complete');
      
      console.log('\n📍 Step 7: Parent verifies the chore');
      await sendCommand(`Verify chore ${choreId} by VerifyParent`, '08-verify-chore');
      
      console.log('\n📍 Step 8: Check points after verification (should now be 25)');
      await sendCommand('Show points', '09-points-after-verify');
      
      console.log('\n📍 Step 9: List chores to see final status');
      await sendCommand('List chores', '10-final-status');
    } else {
      console.log('❌ Could not find chore ID to complete the test');
    }
    
    // Close AI Assistant
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Check dashboard tabs
    console.log('\n📍 Step 10: Checking dashboard tabs');
    
    // Check Chore Jobs tab
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '11-chore-jobs-tab.png'), fullPage: true });
    
    // Check Points History tab
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '12-points-history-tab.png'), fullPage: true });
    
    console.log('\n✅ Complete test finished!');
    console.log('📊 Expected results:');
    console.log('   - Initial points: 0');
    console.log('   - Points after marking complete: 0');
    console.log('   - Points after parent verification: 25');
    console.log('   - Chore status progression: assigned → pending_review → completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    // Keep browser open for observation
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testCompleteVerificationFlow().catch(console.error);