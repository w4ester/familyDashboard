const { chromium } = require('playwright');
const path = require('path');

async function testUIVerification() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log console messages
  page.on('console', msg => {
    if (msg.text().includes('ChoreAssignments:')) {
      console.log('🔍 Console:', msg.text());
    }
  });
  
  const screenshotsDir = path.join(__dirname, 'ui-test-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🧪 UI VERIFICATION TEST\n');
  
  try {
    // Start fresh
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Quick login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'ui');
      await page.fill('input[placeholder="Enter your password"]', 'test');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Skip onboarding
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      await page.fill('input[placeholder="Enter your name..."]', 'UI Test');
      await onboardingButton.click();
      await page.waitForTimeout(2000);
    }
    
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 1: Navigate to Chore Jobs tab
    console.log('1️⃣ Navigating to Chore Jobs tab...');
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-chore-jobs-empty.png'), fullPage: true });
    
    // Check debug info
    const debugInfo = await page.$('.text-xs.text-gray-500');
    if (debugInfo) {
      const text = await debugInfo.textContent();
      console.log('📊 Debug info:', text);
    }
    
    // Step 2: Create chore via AI
    console.log('\n2️⃣ Creating chore via AI...');
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    async function sendCommand(command) {
      console.log(`💬 "${command}"`);
      const aiInput = await page.$('.fixed.w-96 input[type="text"]');
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await aiInput.press('Enter');
        await page.waitForTimeout(3000);
      }
    }
    
    await sendCommand('Add UIChild as a child');
    await sendCommand('Add UIParent as a parent');
    await sendCommand('Create a chore for UIChild to test UI worth 75 points');
    
    // Close AI
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    
    // Step 3: Check if chore appears in UI
    console.log('\n3️⃣ Checking Chore Jobs tab after creation...');
    await page.screenshot({ path: path.join(screenshotsDir, '02-after-create.png'), fullPage: true });
    
    // Look for the chore card
    const choreCard = await page.$('.bg-white.p-4.rounded-lg.border');
    if (choreCard) {
      console.log('✅ Chore card found in UI!');
      
      // Check for Mark Done button
      const markDoneBtn = await choreCard.$('button:has-text("Mark Done")');
      if (markDoneBtn) {
        console.log('✅ Mark Done button found!');
        
        // Step 4: Click Mark Done
        console.log('\n4️⃣ Clicking Mark Done...');
        await markDoneBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '03-after-mark-done.png'), fullPage: true });
        
        // Step 5: Look for verification buttons
        console.log('\n5️⃣ Looking for verification buttons...');
        const verifyBtn = await page.$('button:has-text("✓ Verify")');
        const rejectBtn = await page.$('button:has-text("✗ Reject")');
        
        if (verifyBtn && rejectBtn) {
          console.log('✅ Verification buttons found!');
          
          // Step 6: Click Verify
          console.log('\n6️⃣ Clicking Verify...');
          await verifyBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotsDir, '04-after-verify.png'), fullPage: true });
          
          // Check for completion status
          const verifiedText = await page.$('span:has-text("✓ Verified by")');
          if (verifiedText) {
            const text = await verifiedText.textContent();
            console.log('✅ Verification confirmed:', text);
          }
        } else {
          console.log('❌ Verification buttons NOT found');
        }
      } else {
        console.log('❌ Mark Done button NOT found');
      }
    } else {
      console.log('❌ No chore card found in UI');
      
      // Check localStorage directly
      const choreData = await page.evaluate(() => {
        return localStorage.getItem('chore-assignments');
      });
      console.log('\n🔍 localStorage chore-assignments:', choreData);
    }
    
    // Step 7: Check Points History
    console.log('\n7️⃣ Checking Points History...');
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '05-points-history.png'), fullPage: true });
    
    // Check if points were awarded
    const choreHistory = await page.$('.text-orange-800:has-text("Chore History")');
    if (choreHistory) {
      const historyTable = await page.$('table');
      if (historyTable) {
        console.log('✅ Points history table found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  }
  
  console.log('\n🏁 Test complete - check ui-test-screenshots/');
  // Keep browser open
}

testUIVerification().catch(console.error);