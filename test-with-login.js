const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullWorkflowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting full workflow test with login...');
  
  try {
    // Step 1: Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in...');
    await page.fill('input[placeholder="Enter your username"]', 'testuser');
    await page.fill('input[placeholder="Enter your password"]', 'testpass');
    await page.click('button:has-text("Sign In")');
    await delay(2000);
    
    // Handle welcome/onboarding if needed
    const welcomeTitle = await page.locator('h1:has-text("Welcome to Family Dashboard")');
    if (await welcomeTitle.isVisible()) {
      console.log('On welcome page, clicking Get Started...');
      await page.click('button:has-text("Get Started")');
      await delay(2000);
      
      // Fill in family name if on onboarding
      const familyNameInput = await page.locator('input[placeholder*="Enter your family name"]');
      if (await familyNameInput.isVisible()) {
        console.log('Setting up family...');
        await familyNameInput.fill('Test Family');
        await page.click('button:has-text("Next")');
        await delay(1000);
        
        // Add family members
        const memberInput = await page.locator('input[placeholder*="family member"]');
        if (await memberInput.isVisible()) {
          await memberInput.fill('Alice');
          await page.click('button:has-text("Add")');
          await delay(500);
          await memberInput.fill('Parent');
          await page.click('button:has-text("Add")');
          await delay(500);
          await page.click('button:has-text("Next")');
          await delay(1000);
        }
        
        // Complete onboarding
        const completeButton = await page.locator('button:has-text("Complete Setup")');
        if (await completeButton.isVisible()) {
          await completeButton.click();
          await delay(2000);
        }
      }
    }
    
    // Wait for dashboard
    await page.waitForSelector('button:has-text("AI Assistant")', { timeout: 10000 });
    console.log('Dashboard loaded!');
    
    // Step 2: Create chore via AI
    console.log('Creating chore assignment...');
    await page.click('button:has-text("AI Assistant")');
    await delay(1000);
    
    const inputField = await page.locator('input[placeholder*="Type your request"]').first();
    await inputField.fill('create chore "Clean Room" assigned to Alice worth 50 points');
    await inputField.press('Enter');
    await delay(3000);
    
    // Step 3: Go to Chore Jobs
    console.log('Navigating to Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    await page.screenshot({ path: 'workflow-screenshots/01-chore-created.png', fullPage: true });
    
    // Step 4: Find and mark chore as done
    const choreText = await page.locator('text="Clean Room"').first();
    if (await choreText.isVisible()) {
      console.log('Found chore! Looking for Mark Done button...');
      
      // Get the parent card
      let parent = await choreText.locator('..');
      for (let i = 0; i < 5; i++) {
        const buttons = await parent.locator('button').all();
        const markDoneButton = buttons.find(async b => {
          const text = await b.textContent();
          return text && text.includes('Mark Done');
        });
        
        if (markDoneButton && await markDoneButton.isVisible()) {
          console.log('Clicking Mark Done...');
          await markDoneButton.click();
          await delay(2000);
          break;
        }
        parent = await parent.locator('..');
      }
      
      await page.screenshot({ path: 'workflow-screenshots/02-marked-done.png', fullPage: true });
      
      // Step 5: Check for pending review status
      console.log('Checking for pending review status...');
      await delay(1000);
      
      // Look for verify button or pending status
      const pendingText = await page.locator('text="PENDING REVIEW"').first();
      const verifyButton = await page.locator('button:has-text("Verify")').first();
      
      console.log('Pending review visible?', await pendingText.isVisible());
      console.log('Verify button visible?', await verifyButton.isVisible());
      
      if (await verifyButton.isVisible()) {
        console.log('Clicking verify button...');
        await verifyButton.click();
        await delay(2000);
        await page.screenshot({ path: 'workflow-screenshots/03-after-verify.png', fullPage: true });
      } else {
        console.log('No verify button found. Checking component state...');
        
        // Log what we see
        const statusElements = await page.locator('.text-xs.font-medium').all();
        for (const elem of statusElements) {
          const text = await elem.textContent();
          console.log('Status text found:', text);
        }
      }
    }
    
    // Step 6: Check points
    console.log('\nChecking points...');
    await page.click('button:has-text("AI Assistant")');
    await delay(1000);
    
    const pointsInput = await page.locator('input[placeholder*="Type your request"]').last();
    await pointsInput.fill('show points');
    await pointsInput.press('Enter');
    await delay(3000);
    
    await page.screenshot({ path: 'workflow-screenshots/04-points-check.png', fullPage: true });
    
    // Get AI response
    const responses = await page.locator('.bg-blue-50').all();
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      console.log('Points response:', await lastResponse.textContent());
    }
    
    // Final screenshot
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    await page.screenshot({ path: 'workflow-screenshots/05-final-state.png', fullPage: true });
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-screenshots/error-state.png', fullPage: true });
  } finally {
    await delay(5000); // Keep browser open
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('workflow-screenshots')) {
  fs.mkdirSync('workflow-screenshots');
}

// Run the test
runFullWorkflowTest().catch(console.error);