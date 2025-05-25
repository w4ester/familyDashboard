const { chromium } = require('playwright');
const path = require('path');

async function testChoreVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'verification-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🚀 Starting Chore Verification Test...');
  
  try {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Login if needed
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'demo');
      await page.fill('input[placeholder="Enter your password"]', 'demo');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Skip onboarding if present
    const skipButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (skipButton) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Open AI Assistant
    console.log('🤖 Opening AI Assistant...');
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Helper to send command to AI
    async function sendAICommand(command, screenshotName) {
      console.log(`💬 Sending: "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}-typing.png`) });
        
        await aiInput.press('Enter');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}-response.png`) });
        
        // Get response
        const chatMessages = await page.$$('.fixed.w-96 .text-sm');
        if (chatMessages.length > 0) {
          const lastMessage = await chatMessages[chatMessages.length - 1].textContent();
          console.log(`✅ Response: ${lastMessage}`);
          return lastMessage;
        }
      }
      return null;
    }
    
    // Step 1: Create test family and chore
    console.log('\n📍 Step 1: Setting up test data');
    await sendAICommand('Add TestKid as a child', '01-add-kid');
    await sendAICommand('Add TestParent as a parent', '02-add-parent');
    await sendAICommand('Create a chore for TestKid to test verification worth 10 points', '03-create-chore');
    
    // Step 2: List chores to get the ID
    console.log('\n📍 Step 2: Getting chore ID');
    const listResponse = await sendAICommand('List chores', '04-list-chores');
    
    // Extract chore ID from response (looking for pattern like [ID: xxx])
    const idMatch = listResponse?.match(/\[ID: ([^\]]+)\]/);
    const choreId = idMatch ? idMatch[1] : null;
    
    if (choreId) {
      console.log(`🔍 Found chore ID: ${choreId}`);
      
      // Step 3: Mark chore as complete
      console.log('\n📍 Step 3: Marking chore as complete');
      await sendAICommand(`Complete chore ${choreId}`, '05-complete-chore');
      
      // Step 4: Check points before verification
      console.log('\n📍 Step 4: Checking points BEFORE verification');
      await sendAICommand('Show points', '06-points-before');
      
      // Step 5: Verify the chore
      console.log('\n📍 Step 5: Parent verifying the chore');
      await sendAICommand(`Verify chore ${choreId} by TestParent`, '07-verify-chore');
      
      // Step 6: Check points after verification
      console.log('\n📍 Step 6: Checking points AFTER verification');
      await sendAICommand('Show points', '08-points-after');
      
      // Step 7: List chores again to see status
      console.log('\n📍 Step 7: Checking final chore status');
      await sendAICommand('List chores', '09-final-status');
      
    } else {
      console.log('❌ Could not find chore ID in response');
    }
    
    // Close AI and check the Chore Jobs tab
    console.log('\n📍 Step 8: Checking Chore Jobs tab');
    const closeButton = await page.$('button:has-text("×")') || 
                       await page.$('button.text-white.hover\\:text-gray-200:has(svg)');
    if (closeButton) {
      await closeButton.click();
    }
    await page.waitForTimeout(1000);
    
    // Navigate to Chore Jobs tab
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '10-chore-jobs-final.png'), fullPage: true });
    
    // Navigate to Points History tab
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '11-points-history-final.png'), fullPage: true });
    
    console.log('\n✅ Verification test completed! Check verification-screenshots directory.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testChoreVerification().catch(console.error);