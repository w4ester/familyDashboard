const { chromium } = require('playwright');
const path = require('path');

async function testVerifyPointsFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  const page = await browser.newPage();
  
  const screenshotsDir = path.join(__dirname, 'points-fix-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🚀 Testing Points Display Fix\n');
  
  try {
    // Quick setup
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await page.fill('input[placeholder="Enter your username"]', 'demo');
      await page.fill('input[placeholder="Enter your password"]', 'demo');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Skip onboarding
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
    const aiButton = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
    
    async function sendCommand(command) {
      console.log(`💬 "${command}"`);
      
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (aiInput) {
        await aiInput.click();
        await aiInput.fill('');
        await aiInput.type(command);
        await aiInput.press('Enter');
        await page.waitForTimeout(3000);
        
        const messages = await page.$$eval('.fixed.w-96 .text-sm', 
          els => els.map(el => el.textContent?.trim()).filter(t => t)
        );
        
        const response = messages[messages.length - 1];
        console.log(`📨 ${response}\n`);
        return response;
      }
    }
    
    // Quick test sequence
    console.log('1️⃣ Setup test data');
    await sendCommand('Add TestKid as a child');
    await sendCommand('Add TestParent as a parent');
    
    console.log('2️⃣ Create and verify a chore');
    await sendCommand('Create a chore for TestKid to test points worth 50 points');
    
    const listResponse = await sendCommand('List chores');
    const match = listResponse?.match(/\[ID:\s*([^\]]+)\]/);
    
    if (match) {
      const choreId = match[1];
      console.log(`Found ID: ${choreId}`);
      
      // Complete and verify
      await sendCommand(`Complete chore ${choreId}`);
      await sendCommand(`Verify chore ${choreId} by TestParent`);
      
      // Check points with AI
      console.log('3️⃣ Check points with AI command');
      await sendCommand('Show points');
      
      // Also check localStorage
      console.log('4️⃣ Check localStorage data');
      const choreAssignments = await page.evaluate(() => localStorage.getItem('chore-assignments'));
      const familyData = await page.evaluate(() => localStorage.getItem('familyData'));
      
      console.log('\n📋 Chore Assignments:');
      if (choreAssignments) {
        const assignments = JSON.parse(choreAssignments);
        console.log('Total assignments:', assignments.length);
        assignments.forEach(a => {
          console.log(`- ${a.choreName} (${a.assignedTo}): ${a.status}, earned: ${a.pointsEarned}`);
        });
      }
      
      console.log('\n📊 Family Data - choreEntries:');
      if (familyData) {
        const data = JSON.parse(familyData);
        console.log('Total entries:', data.choreEntries.length);
        data.choreEntries.forEach(e => {
          console.log(`- ${e.person}: ${e.points} points for "${e.chore}"`);
        });
      }
      
      // Take screenshot of Points History tab
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Points History")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotsDir, 'points-history.png'), fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testVerifyPointsFix().catch(console.error);