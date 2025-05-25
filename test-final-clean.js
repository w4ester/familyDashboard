const { chromium } = require('playwright');
const path = require('path');

async function testFinalClean() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  // Use incognito for clean state
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'final-clean-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🧪 FINAL CLEAN TEST - Complete Verification Workflow');
  console.log('=' . repeat(50) + '\n');
  
  try {
    // Start completely fresh
    await page.goto('http://localhost:3000');
    
    // Clear ALL localStorage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
      console.log('✨ Cleared all data - starting fresh');
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Login
    console.log('1️⃣ Setting up fresh environment...');
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'final');
      await page.fill('input[placeholder="Enter your password"]', 'test');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Onboarding
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      await page.fill('input[placeholder="Enter your name..."]', 'Final Test');
      await onboardingButton.click();
      await page.waitForTimeout(2000);
    }
    
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Take initial screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01-fresh-start.png'), fullPage: true });
    
    // Open AI Assistant
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1500);
    }
    
    async function sendCommand(command, screenshotName) {
      console.log(`\n💬 "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (!aiInput) return null;
      
      await aiInput.click();
      await aiInput.fill('');
      await aiInput.type(command);
      await aiInput.press('Enter');
      await page.waitForTimeout(3500);
      
      if (screenshotName) {
        await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}.png`) });
      }
      
      // Get response
      const messages = await page.$$eval('.fixed.w-96 .text-sm', 
        els => els.map(el => el.textContent?.trim()).filter(t => t)
      );
      const response = messages[messages.length - 1];
      console.log(`✅ ${response}`);
      return response;
    }
    
    console.log('\n' + '=' . repeat(50));
    console.log('🧪 TEST SEQUENCE - FROM ZERO TO HERO');
    console.log('=' . repeat(50));
    
    // Step 1: Add family
    console.log('\n📍 Step 1: Creating family');
    await sendCommand('Add Emma as a child', '02-add-emma');
    await sendCommand('Add Dad as a parent', '03-add-dad');
    
    // Step 2: Check initial points (should be 0)
    console.log('\n📍 Step 2: Initial points check');
    const initialPoints = await sendCommand('Show points', '04-initial-points');
    
    // Step 3: Create chore
    console.log('\n📍 Step 3: Creating chore assignment');
    await sendCommand('Create a chore for Emma to clean bedroom worth 30 points', '05-create-chore');
    
    // Step 4: Get chore ID
    console.log('\n📍 Step 4: Getting chore ID');
    const listResponse = await sendCommand('List chores', '06-list-chores');
    
    const idMatch = listResponse?.match(/\[ID:\s*(\d+)\]/);
    if (!idMatch) {
      console.log('❌ Could not find chore ID');
      return;
    }
    
    const choreId = idMatch[1];
    console.log(`🔑 Chore ID: ${choreId}`);
    
    // Step 5: Complete chore
    console.log('\n📍 Step 5: Child completing chore');
    await sendCommand(`Complete chore ${choreId}`, '07-complete-chore');
    
    // Step 6: Check points (should still be 0)
    console.log('\n📍 Step 6: Points after completion');
    const midPoints = await sendCommand('Show points', '08-points-after-complete');
    
    // Step 7: Parent verifies
    console.log('\n📍 Step 7: Parent verification');
    await sendCommand(`Verify chore ${choreId} by Dad`, '09-parent-verify');
    
    // Step 8: Check final points (should be 30)
    console.log('\n📍 Step 8: Final points check');
    const finalPoints = await sendCommand('Show points', '10-final-points');
    
    // Close AI and check dashboard
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Final dashboard screenshots
    console.log('\n📍 Step 9: Dashboard verification');
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '11-points-history.png'), fullPage: true });
    
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '12-chore-jobs.png'), fullPage: true });
    
    // Results summary
    console.log('\n' + '=' . repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' . repeat(50));
    console.log(`Initial points: ${initialPoints}`);
    console.log(`Points after completion: ${midPoints}`);
    console.log(`Points after verification: ${finalPoints}`);
    console.log('\n✅ Expected progression:');
    console.log('   1. "No points earned yet!"');
    console.log('   2. "No points earned yet!"');
    console.log('   3. "Emma: 30 points"');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    console.log('\n🏁 Test complete - check final-clean-screenshots/');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Polyfill
if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    return new Array(count + 1).join(this);
  };
}

testFinalClean().catch(console.error);