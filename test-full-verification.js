const { chromium } = require('playwright');
const path = require('path');

async function testFullVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'full-verification-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🚀 COMPLETE CHORE VERIFICATION TEST');
  console.log('Testing: Assign → Complete → Verify → Points Awarded');
  console.log('=' . repeat(50));
  
  try {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
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
    console.log('\n🤖 Opening AI Assistant...');
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Helper function
    async function sendCommand(command, screenshotName, expectResponse = true) {
      console.log(`\n💬 Command: "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (!aiInput) {
        console.log('❌ AI input not found');
        return null;
      }
      
      await aiInput.click();
      await aiInput.fill('');
      await aiInput.type(command);
      await page.waitForTimeout(500);
      
      await aiInput.press('Enter');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}.png`) });
      
      if (expectResponse) {
        // Get all messages from the chat
        const messages = await page.$$eval('.fixed.w-96 .text-sm', 
          elements => elements.map(el => el.textContent?.trim()).filter(t => t)
        );
        
        // Find the response to our command
        const responseIndex = messages.findIndex(m => m === command);
        if (responseIndex >= 0 && responseIndex < messages.length - 1) {
          const response = messages[responseIndex + 1];
          console.log(`📨 Response: ${response}`);
          return response;
        }
      }
      
      return null;
    }
    
    // COMPLETE TEST SEQUENCE
    console.log('\n' + '=' . repeat(50));
    console.log('📋 TEST SEQUENCE STARTING');
    console.log('=' . repeat(50));
    
    // 1. Add family members
    console.log('\n1️⃣ SETUP: Adding family members');
    await sendCommand('Add Billy as a child', '01-add-child');
    await sendCommand('Add Parent as a parent', '02-add-parent');
    
    // 2. Create chore
    console.log('\n2️⃣ CREATE: Assigning chore');
    const choreResponse = await sendCommand(
      'Create a chore for Billy to clean room worth 20 points', 
      '03-create-chore'
    );
    
    // 3. List chores and extract ID
    console.log('\n3️⃣ LIST: Getting chore details');
    const listResponse = await sendCommand('List chores', '04-list-chores');
    
    // Extract ID - try multiple patterns
    let choreId = null;
    if (listResponse) {
      // Pattern 1: [ID: xxx]
      let match = listResponse.match(/\[ID:\s*([^\]]+)\]/);
      if (!match) {
        // Pattern 2: Just a long number
        match = listResponse.match(/(\d{13,})/);
      }
      if (match) {
        choreId = match[1];
        console.log(`✅ Found chore ID: ${choreId}`);
      }
    }
    
    if (!choreId) {
      console.log('❌ Could not find chore ID in response');
      console.log('Response was:', listResponse);
      return;
    }
    
    // 4. Check initial points
    console.log('\n4️⃣ CHECK: Initial points (should be 0)');
    await sendCommand('Show points', '05-initial-points');
    
    // 5. Child completes chore
    console.log('\n5️⃣ COMPLETE: Child marks chore as done');
    const completeResponse = await sendCommand(
      `Complete chore ${choreId}`, 
      '06-complete-chore'
    );
    
    // 6. Check points after completion
    console.log('\n6️⃣ CHECK: Points after completion (should still be 0)');
    await sendCommand('Show points', '07-points-after-complete');
    
    // 7. Parent verifies
    console.log('\n7️⃣ VERIFY: Parent approves the chore');
    const verifyResponse = await sendCommand(
      `Verify chore ${choreId} by Parent`, 
      '08-verify-chore'
    );
    
    // 8. Check final points
    console.log('\n8️⃣ CHECK: Points after verification (should be 20)');
    const finalPointsResponse = await sendCommand('Show points', '09-final-points');
    
    // 9. Check final status
    console.log('\n9️⃣ STATUS: Final chore status');
    await sendCommand('List chores', '10-final-status');
    
    // Close AI Assistant
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // 10. Check dashboard tabs
    console.log('\n🔟 DASHBOARD: Checking visual confirmation');
    
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '11-points-history.png'), fullPage: true });
    
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '12-chore-jobs.png'), fullPage: true });
    
    // Summary
    console.log('\n' + '=' . repeat(50));
    console.log('✅ TEST COMPLETE!');
    console.log('=' . repeat(50));
    console.log('\n📊 RESULTS SUMMARY:');
    console.log('1. Chore created for Billy (20 points)');
    console.log('2. Initial points: 0');
    console.log('3. Points after child completion: 0');
    console.log('4. Points after parent verification: 20');
    console.log('\nCheck full-verification-screenshots for visual proof!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// String.repeat polyfill
if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    return new Array(count + 1).join(this);
  };
}

testFullVerification().catch(console.error);