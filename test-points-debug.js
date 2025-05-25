const { chromium } = require('playwright');

async function debugPointsDisplay() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true // Open devtools to see console logs
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.text().includes('Points summary result:')) {
      console.log('🔍 DEBUG:', msg.text());
    }
  });
  
  console.log('🔍 DEBUGGING POINTS DISPLAY\n');
  
  try {
    // Quick setup
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'debug');
      await page.fill('input[placeholder="Enter your password"]', 'debug');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Skip onboarding
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      await page.fill('input[placeholder="Enter your name..."]', 'Debug');
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
    
    // Helper to send command
    async function sendCommand(command) {
      console.log(`\n💬 "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await aiInput.press('Enter');
        await page.waitForTimeout(3000);
      }
    }
    
    // Quick test
    console.log('1️⃣ Setting up test data...');
    await sendCommand('Add TestChild as a child');
    await sendCommand('Create a chore for TestChild to debug test worth 100 points');
    
    console.log('\n2️⃣ Getting chore ID...');
    await sendCommand('List chores');
    
    // Check localStorage data
    console.log('\n3️⃣ Checking localStorage...');
    const choreAssignments = await page.evaluate(() => {
      const data = localStorage.getItem('chore-assignments');
      return data ? JSON.parse(data) : [];
    });
    
    if (choreAssignments.length > 0) {
      const choreId = choreAssignments[0].id;
      console.log(`Found chore ID: ${choreId}`);
      
      console.log('\n4️⃣ Completing and verifying...');
      await sendCommand(`Complete chore ${choreId}`);
      await sendCommand(`Verify chore ${choreId} by Parent`);
      
      console.log('\n5️⃣ Testing Show points command...');
      await sendCommand('Show points');
      
      // Check data directly
      console.log('\n6️⃣ Checking data directly...');
      const familyData = await page.evaluate(() => {
        const data = localStorage.getItem('familyData');
        return data ? JSON.parse(data) : null;
      });
      
      const choreData = await page.evaluate(() => {
        const data = localStorage.getItem('chore-assignments');
        return data ? JSON.parse(data) : [];
      });
      
      console.log('\n📊 Family Data choreEntries:', 
        familyData?.choreEntries?.length || 0, 'entries');
      if (familyData?.choreEntries?.length > 0) {
        console.log('Latest entry:', familyData.choreEntries[familyData.choreEntries.length - 1]);
      }
      
      console.log('\n📋 Chore Assignments:', choreData.length, 'assignments');
      if (choreData.length > 0) {
        console.log('Assignment status:', choreData[0].status, 
          'Points earned:', choreData[0].pointsEarned);
      }
    }
    
    console.log('\n✅ Check the browser console for debug logs!');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Keep browser open
  console.log('\n👀 Browser staying open for inspection...');
}

debugPointsDisplay().catch(console.error);