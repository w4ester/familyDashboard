const { chromium } = require('playwright');
const path = require('path');

async function testFreshVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1200
  });
  
  // Use incognito context for fresh state
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'fresh-test-screenshots');
  
  console.log('🚀 FRESH VERIFICATION TEST - Complete Workflow\n');
  console.log('Testing: Assign → Complete → Verify → Points Awarded');
  console.log('=' . repeat(50) + '\n');
  
  try {
    // Start fresh
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('🔐 Logging in...');
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'test');
      await page.fill('input[placeholder="Enter your password"]', 'test');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Handle onboarding
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      console.log('👋 Completing onboarding...');
      await page.fill('input[placeholder="Enter your name..."]', 'Test Family');
      await onboardingButton.click();
      await page.waitForTimeout(2000);
    }
    
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Take initial screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01-initial-dashboard.png'), fullPage: true });
    
    // Open AI Assistant
    console.log('🤖 Opening AI Assistant...');
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1500);
    }
    
    // Helper to send commands and get response
    async function sendCommand(command, stepName) {
      console.log(`\n💬 Command: "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (!aiInput) {
        console.log('❌ Could not find AI input');
        return null;
      }
      
      // Clear and type
      await aiInput.click();
      await aiInput.fill('');
      await aiInput.type(command);
      await page.waitForTimeout(500);
      
      // Send command
      await aiInput.press('Enter');
      await page.waitForTimeout(3500); // Wait for response
      
      // Take screenshot
      await page.screenshot({ path: path.join(screenshotsDir, `${stepName}.png`) });
      
      // Try to get the response
      try {
        const messages = await page.$$eval('.fixed.w-96 .text-sm', 
          elements => elements.map(el => el.textContent?.trim()).filter(t => t)
        );
        
        // Find our command and get the next message (the response)
        const cmdIndex = messages.findIndex(m => m === command);
        if (cmdIndex >= 0 && cmdIndex < messages.length - 1) {
          const response = messages[cmdIndex + 1];
          console.log(`✅ Response: ${response}`);
          return response;
        } else if (messages.length > 0) {
          // Just get the last message
          const lastMsg = messages[messages.length - 1];
          console.log(`✅ Response: ${lastMsg}`);
          return lastMsg;
        }
      } catch (e) {
        console.log('⚠️  Could not extract response');
      }
      
      return null;
    }
    
    // TEST SEQUENCE
    console.log('\n' + '=' . repeat(50));
    console.log('📋 STARTING TEST SEQUENCE');
    console.log('=' . repeat(50));
    
    // Step 1: Add family members
    console.log('\n1️⃣ Adding family members');
    await sendCommand('Add Alice as a child', '02-add-alice');
    await sendCommand('Add Mom as a parent', '03-add-mom');
    
    // Step 2: Check initial points (should be 0)
    console.log('\n2️⃣ Checking initial points');
    const initialPoints = await sendCommand('Show points', '04-initial-points');
    
    // Step 3: Create a chore assignment
    console.log('\n3️⃣ Creating chore assignment');
    const choreResponse = await sendCommand(
      'Create a chore for Alice to organize toys worth 25 points', 
      '05-create-chore'
    );
    
    // Step 4: List chores to get ID
    console.log('\n4️⃣ Getting chore ID');
    const listResponse = await sendCommand('List chores', '06-list-chores');
    
    // Extract chore ID
    let choreId = null;
    if (listResponse) {
      const match = listResponse.match(/\[ID:\s*([^\]]+)\]/);
      if (match) {
        choreId = match[1];
        console.log(`📌 Found chore ID: ${choreId}`);
      }
    }
    
    if (!choreId) {
      console.log('❌ Could not find chore ID');
      // Try to extract from the response another way
      const numbers = listResponse?.match(/\d{13}/);
      if (numbers) {
        choreId = numbers[0];
        console.log(`📌 Found ID (alternate method): ${choreId}`);
      }
    }
    
    if (choreId) {
      // Step 5: Child completes the chore
      console.log('\n5️⃣ Child marking chore as complete');
      const completeResponse = await sendCommand(
        `Complete chore ${choreId}`, 
        '07-child-completes'
      );
      
      // Step 6: Check points (should still be 0)
      console.log('\n6️⃣ Checking points after completion (should still be 0)');
      const midPoints = await sendCommand('Show points', '08-points-after-complete');
      
      // Step 7: Parent verifies the chore
      console.log('\n7️⃣ Parent verifying the chore');
      const verifyResponse = await sendCommand(
        `Verify chore ${choreId} by Mom`, 
        '09-parent-verifies'
      );
      
      // Step 8: Check final points (should now be 25)
      console.log('\n8️⃣ Checking points after verification');
      const finalPoints = await sendCommand('Show points', '10-points-final');
      
      // Step 9: Check chore status
      console.log('\n9️⃣ Checking final chore status');
      await sendCommand('List chores', '11-final-status');
    }
    
    // Close AI Assistant
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Step 10: Check dashboard tabs
    console.log('\n🔟 Checking dashboard for visual confirmation');
    
    // Points History tab
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '12-points-history-tab.png'), fullPage: true });
    
    // Chore Jobs tab
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '13-chore-jobs-tab.png'), fullPage: true });
    
    // Summary
    console.log('\n' + '=' . repeat(50));
    console.log('✅ TEST COMPLETE!');
    console.log('=' . repeat(50));
    console.log('\n📊 Expected Results:');
    console.log('1. Initial points: "No points earned yet!"');
    console.log('2. After child completion: "No points earned yet!"');
    console.log('3. After parent verification: "Alice: 25 points"');
    console.log('\n📸 Check fresh-test-screenshots/ for visual proof');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    // Keep browser open for 10 seconds to observe
    console.log('\n👀 Keeping browser open for observation...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Polyfill for older Node versions
if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    return new Array(count + 1).join(this);
  };
}

testFreshVerification().catch(console.error);