const { chromium } = require('playwright');

async function deepDebugPoints() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Inject debugging into the page
  await page.addInitScript(() => {
    // Override console.log to capture specific logs
    const originalLog = console.log;
    window.debugLogs = [];
    console.log = function(...args) {
      originalLog.apply(console, args);
      if (args[0] && args[0].toString().includes('Points summary result:')) {
        window.debugLogs.push(args);
      }
    };
  });
  
  console.log('🔬 DEEP DEBUG: Points Display Issue\n');
  
  try {
    // Quick setup
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'test');
      await page.fill('input[placeholder="Enter your password"]', 'test');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Skip onboarding if needed
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      await page.fill('input[placeholder="Enter your name..."]', 'Test');
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
        
        // Get the response
        const messages = await page.$$eval('.fixed.w-96 .text-sm', 
          els => els.map(el => el.textContent?.trim()).filter(t => t)
        );
        const response = messages[messages.length - 1];
        console.log(`📨 ${response}`);
        return response;
      }
    }
    
    // Create test data
    console.log('1️⃣ Creating test scenario...');
    await sendCommand('Add DebugChild as a child');
    await sendCommand('Create a chore for DebugChild to test points worth 50 points');
    const listResponse = await sendCommand('List chores');
    
    // Extract ID
    const idMatch = listResponse?.match(/\[ID:\s*(\d+)\]/);
    if (idMatch) {
      const choreId = idMatch[1];
      console.log(`\n✅ Found chore ID: ${choreId}`);
      
      // Complete and verify
      await sendCommand(`Complete chore ${choreId}`);
      await sendCommand(`Verify chore ${choreId} by Parent`);
      
      // Now test Show points
      console.log('\n2️⃣ Testing Show points command...');
      await sendCommand('Show points');
      
      // Get debug logs
      const debugData = await page.evaluate(() => window.debugLogs);
      console.log('\n3️⃣ Debug logs from browser:');
      if (debugData && debugData.length > 0) {
        console.log('Raw result:', JSON.stringify(debugData[0], null, 2));
      }
      
      // Check the actual tool execution
      console.log('\n4️⃣ Checking tool registry directly...');
      const toolResult = await page.evaluate(async () => {
        // Access the tool registry if available
        if (window.toolRegistry) {
          const result = await window.toolRegistry.execute('get_points_summary', {});
          return result;
        }
        return null;
      });
      
      if (toolResult) {
        console.log('Tool result:', JSON.stringify(toolResult, null, 2));
      }
      
      // Check localStorage data
      console.log('\n5️⃣ Checking raw data...');
      const allData = await page.evaluate(() => {
        return {
          familyData: localStorage.getItem('familyData'),
          choreAssignments: localStorage.getItem('chore-assignments')
        };
      });
      
      if (allData.familyData) {
        const familyData = JSON.parse(allData.familyData);
        console.log('ChoreEntries count:', familyData.choreEntries?.length || 0);
        if (familyData.choreEntries?.length > 0) {
          console.log('ChoreEntries:', JSON.stringify(familyData.choreEntries, null, 2));
        }
      }
      
      if (allData.choreAssignments) {
        const assignments = JSON.parse(allData.choreAssignments);
        console.log('\nAssignments count:', assignments.length);
        assignments.forEach(a => {
          console.log(`- ${a.choreName}: status=${a.status}, pointsEarned=${a.pointsEarned}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n🔍 Check browser console for additional details');
  // Keep browser open
}

deepDebugPoints().catch(console.error);