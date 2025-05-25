const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullWorkflowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting full workflow test...');
  
  try {
    // Step 1: Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await delay(2000);
    
    // Check if we're on the welcome page
    const welcomeTitle = await page.locator('h1:has-text("Welcome to Family Dashboard")');
    if (await welcomeTitle.isVisible()) {
      console.log('On welcome page, clicking Get Started...');
      await page.click('button:has-text("Get Started")');
      await delay(2000);
      
      // Skip onboarding if needed
      const skipButton = await page.locator('button:has-text("Skip Onboarding")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await delay(2000);
      }
    }
    
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Smith Family Dashboard")', { timeout: 10000 });
    console.log('Dashboard loaded!');
    
    // Step 2: Click on AI Assistant
    console.log('Opening AI Assistant...');
    const aiButton = await page.locator('button:has-text("AI Assistant")').first();
    await aiButton.click();
    await delay(1000);
    
    // Step 3: Create a chore assignment
    console.log('Creating chore assignment...');
    const inputField = await page.locator('input[placeholder*="Type your request"]').first();
    await inputField.fill('create chore "Test Full Workflow" assigned to Alice worth 100 points');
    await inputField.press('Enter');
    await delay(3000);
    
    // Step 4: Navigate to Chore Jobs
    console.log('Navigating to Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'workflow-screenshots/01-chore-created.png', fullPage: true });
    
    // Look for the chore we just created
    const choreCard = await page.locator('text="Test Full Workflow"').first();
    if (await choreCard.isVisible()) {
      console.log('Found the chore card!');
      
      // Step 5: Mark chore as done
      console.log('Looking for Mark Done button...');
      // Find the Mark Done button within the same card
      const cardContainer = await choreCard.locator('..').locator('..');
      const markDoneButton = await cardContainer.locator('button:has-text("Mark Done")').first();
      
      if (await markDoneButton.isVisible()) {
        console.log('Clicking Mark Done...');
        await markDoneButton.click();
        await delay(2000);
        await page.screenshot({ path: 'workflow-screenshots/02-marked-done.png', fullPage: true });
        
        // Step 6: Look for verify button
        console.log('Looking for verify button...');
        await delay(1000);
        
        // Reload to ensure we see the updated state
        await page.reload();
        await delay(2000);
        
        // Try to find verify button
        const verifyButton = await page.locator('button:has-text("Verify & Award Points")').first();
        if (await verifyButton.isVisible()) {
          console.log('Found verify button! Clicking...');
          await verifyButton.click();
          await delay(2000);
          await page.screenshot({ path: 'workflow-screenshots/03-after-verify.png', fullPage: true });
        } else {
          console.log('Verify button not found. Taking screenshot of current state...');
          await page.screenshot({ path: 'workflow-screenshots/03-no-verify-button.png', fullPage: true });
          
          // Check if the chore shows as pending review
          const pendingText = await page.locator('text="PENDING REVIEW"').first();
          console.log('Pending review text visible?', await pendingText.isVisible());
        }
      } else {
        console.log('Mark Done button not found!');
      }
    } else {
      console.log('Chore card not found!');
    }
    
    // Step 7: Check points via AI
    console.log('\nChecking points via AI...');
    await page.click('button:has-text("AI Assistant")');
    await delay(1000);
    
    const pointsInput = await page.locator('input[placeholder*="Type your request"]').first();
    await pointsInput.fill('show points for Alice');
    await pointsInput.press('Enter');
    await delay(3000);
    
    // Take final screenshot
    await page.screenshot({ path: 'workflow-screenshots/04-points-check.png', fullPage: true });
    
    // Get the response text
    const responses = await page.locator('.bg-blue-50').all();
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      const responseText = await lastResponse.textContent();
      console.log('AI Response:', responseText);
    }
    
    // Step 8: Final state check
    console.log('\nFinal check - going back to Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    await page.screenshot({ path: 'workflow-screenshots/05-final-state.png', fullPage: true });
    
    // Log debug info
    const debugInfo = await page.locator('text=/Total assignments:.*Filtered:/').first();
    if (await debugInfo.isVisible()) {
      console.log('Debug info:', await debugInfo.textContent());
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-screenshots/error-state.png', fullPage: true });
  } finally {
    console.log('\nTest completed. Check workflow-screenshots folder for results.');
    await delay(5000); // Keep browser open for 5 seconds
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('workflow-screenshots')) {
  fs.mkdirSync('workflow-screenshots');
}

// Run the test
runFullWorkflowTest().catch(console.error);