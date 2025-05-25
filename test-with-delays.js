const { chromium } = require('playwright');

async function testWithDelays() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500 // Slower actions
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🐌 TEST WITH DELAYS - Allowing component updates\n');
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000); // Longer wait
    
    // Login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'slow');
      await page.fill('input[placeholder="Enter your password"]', 'test');
      await signInButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Skip onboarding
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      await page.fill('input[placeholder="Enter your name..."]', 'Slow Test');
      await onboardingButton.click();
      await page.waitForTimeout(3000);
    }
    
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Open AI Assistant
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(2000);
    }
    
    async function sendCommand(command) {
      console.log(`💬 "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (!aiInput) return null;
      
      await aiInput.click();
      await aiInput.fill('');
      await aiInput.type(command);
      await aiInput.press('Enter');
      await page.waitForTimeout(5000); // Extra long wait
      
      const messages = await page.$$eval('.fixed.w-96 .text-sm', 
        els => els.map(el => el.textContent?.trim()).filter(t => t)
      );
      const response = messages[messages.length - 1];
      console.log(`✅ ${response}\n`);
      
      // Additional wait after command
      await page.waitForTimeout(2000);
      return response;
    }
    
    // Test sequence
    console.log('📋 TEST SEQUENCE:\n');
    
    await sendCommand('Add SlowKid as a child');
    await sendCommand('Create a chore for SlowKid to test timing worth 40 points');
    
    // Wait extra time before listing
    console.log('⏳ Waiting for data to persist...');
    await page.waitForTimeout(5000);
    
    const listResponse = await sendCommand('List chores');
    
    // Check localStorage directly
    const localStorage = await page.evaluate(() => {
      return {
        assignments: localStorage.getItem('chore-assignments'),
        familyData: localStorage.getItem('familyData')
      };
    });
    
    console.log('\n🔍 LocalStorage check:');
    if (localStorage.assignments) {
      const assignments = JSON.parse(localStorage.assignments);
      console.log(`Assignments in storage: ${assignments.length}`);
      assignments.forEach(a => {
        console.log(`- ${a.choreName} (ID: ${a.id})`);
      });
    } else {
      console.log('No assignments in localStorage');
    }
    
    // If we found an assignment, complete the test
    const idMatch = listResponse?.match(/\[ID:\s*(\d+)\]/);
    if (idMatch) {
      const choreId = idMatch[1];
      console.log(`\n✅ Found chore ID: ${choreId}`);
      
      await sendCommand(`Complete chore ${choreId}`);
      await sendCommand(`Verify chore ${choreId} by Parent`);
      await sendCommand('Show points');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n🏁 Test complete');
  // Keep open for inspection
}

testWithDelays().catch(console.error);