const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullWorkflowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting full workflow test...');
  
  try {
    // Step 1: Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Click on AI Assistant
    console.log('Opening AI Assistant...');
    await page.click('button:has-text("AI Assistant")');
    await delay(1000);
    
    // Step 3: Create a chore assignment
    console.log('Creating chore assignment...');
    await page.fill('input[placeholder*="Type your request"]', 'create chore "Test Full Workflow" assigned to Alice worth 100 points');
    await page.keyboard.press('Enter');
    await delay(2000);
    
    // Step 4: Navigate to Chore Jobs
    console.log('Navigating to Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'workflow-screenshots/01-chore-created.png', fullPage: true });
    
    // Step 5: Mark chore as done
    console.log('Marking chore as done...');
    const markDoneButton = await page.locator('button:has-text("Mark Done")').first();
    if (await markDoneButton.isVisible()) {
      await markDoneButton.click();
      await delay(2000);
      await page.screenshot({ path: 'workflow-screenshots/02-marked-done.png', fullPage: true });
    } else {
      console.log('Mark Done button not found!');
    }
    
    // Step 6: Look for verify button
    console.log('Looking for verify button...');
    await delay(1000);
    
    // Check if we need to switch to parent view
    const parentViewButton = await page.locator('button:has-text("Parent View")');
    if (await parentViewButton.isVisible()) {
      console.log('Switching to Parent View...');
      await parentViewButton.click();
      await delay(2000);
    }
    
    // Try to find verify button
    const verifyButton = await page.locator('button:has-text("Verify & Award Points")').first();
    if (await verifyButton.isVisible()) {
      console.log('Found verify button! Clicking...');
      await verifyButton.click();
      await delay(2000);
      await page.screenshot({ path: 'workflow-screenshots/03-after-verify.png', fullPage: true });
    } else {
      console.log('Verify button not visible. Checking page state...');
      const pageContent = await page.content();
      console.log('Looking for pending_review status...');
      console.log(pageContent.includes('pending_review') ? 'Found pending_review' : 'No pending_review found');
      console.log(pageContent.includes('Verify') ? 'Found Verify text' : 'No Verify text found');
    }
    
    // Step 7: Check points via AI
    console.log('Checking points via AI...');
    await page.click('button:has-text("AI Assistant")');
    await delay(1000);
    
    await page.fill('input[placeholder*="Type your request"]', 'show points for Alice');
    await page.keyboard.press('Enter');
    await delay(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'workflow-screenshots/04-points-check.png', fullPage: true });
    
    // Get the response text
    const responseElement = await page.locator('.bg-blue-50').last();
    if (await responseElement.isVisible()) {
      const responseText = await responseElement.textContent();
      console.log('AI Response:', responseText);
    }
    
    // Step 8: Check the actual chore status
    console.log('\nFinal check - going back to Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    await page.screenshot({ path: 'workflow-screenshots/05-final-state.png', fullPage: true });
    
    // Log what we see
    const choreCards = await page.locator('.bg-white.rounded-lg.shadow').all();
    console.log(`Found ${choreCards.length} chore cards`);
    
    for (let i = 0; i < choreCards.length; i++) {
      const cardText = await choreCards[i].textContent();
      console.log(`Card ${i + 1}: ${cardText.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-screenshots/error-state.png', fullPage: true });
  } finally {
    console.log('\nTest completed. Check workflow-screenshots folder for results.');
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('workflow-screenshots')) {
  fs.mkdirSync('workflow-screenshots');
}

// Run the test
runFullWorkflowTest().catch(console.error);