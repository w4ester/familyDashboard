const { chromium } = require('playwright');
const path = require('path');

async function testVerifyWithKnownId() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'verify-flow-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  // We know from the previous test that the chore ID is 1748128512968
  const CHORE_ID = '1748128512968';
  
  console.log('🚀 Testing Verification with Chore ID:', CHORE_ID);
  
  try {
    // Quick login
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'demo');
      await page.fill('input[placeholder="Enter your password"]', 'demo');
      await signInButton.click();
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
      console.log(`\n💬 "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await page.waitForTimeout(500);
        
        await aiInput.press('Enter');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}.png`) });
        
        // Get response
        const messages = await page.$$eval('.fixed.w-96 .text-sm', 
          els => els.map(el => el.textContent).filter(t => t && t.includes('✅') || t && t.includes('❌') || t && t.includes('🏆'))
        );
        
        if (messages.length > 0) {
          console.log(`📨 ${messages[messages.length - 1]}`);
        }
      }
    }
    
    // TEST THE COMPLETE WORKFLOW
    console.log('\n🔄 TESTING COMPLETE VERIFICATION WORKFLOW:');
    
    // 1. Check initial state
    console.log('\n📊 Step 1: Check initial points');
    await sendCommand('Show points', '01-initial-points');
    
    // 2. Mark complete
    console.log('\n✅ Step 2: Kid marks chore complete');
    await sendCommand(`Complete chore ${CHORE_ID}`, '02-mark-complete');
    
    // 3. Check points (should still be 0)
    console.log('\n📊 Step 3: Check points after completion');
    await sendCommand('Show points', '03-points-after-complete');
    
    // 4. Parent verifies
    console.log('\n👨‍👩‍👧‍👦 Step 4: Parent verifies chore');
    await sendCommand(`Verify chore ${CHORE_ID} by VerifyParent`, '04-verify');
    
    // 5. Check final points (should be 25)
    console.log('\n🎯 Step 5: Check points after verification');
    await sendCommand('Show points', '05-points-final');
    
    // 6. Check chore status
    console.log('\n📋 Step 6: Check final chore status');
    await sendCommand('List chores', '06-final-status');
    
    // Close AI and check tabs
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Check Points History
    console.log('\n📊 Checking Points History tab...');
    await page.click('button:has-text("Points History")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '07-points-history.png'), fullPage: true });
    
    console.log('\n✅ Test complete! Check verify-flow-screenshots directory');
    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('   ✓ Points before verification: 0');
    console.log('   ✓ Points after verification: 25');
    console.log('   ✓ Chore status: assigned → pending_review → completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testVerifyWithKnownId().catch(console.error);