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
  
  console.log('Starting full workflow test...');
  
  try {
    // Step 1: Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in...');
    await page.fill('input[placeholder="Enter your username"]', 'testuser');
    await page.fill('input[placeholder="Enter your password"]', 'testpass');
    await page.click('button:has-text("Sign In")');
    await delay(2000);
    
    // Handle the welcome flow
    const startButton = await page.locator('button:has-text("Start Using Dashboard")');
    if (await startButton.isVisible()) {
      console.log('Clicking Start Using Dashboard...');
      await startButton.click();
      await delay(2000);
    }
    
    // Now we should be on the main dashboard
    console.log('Waiting for dashboard to load...');
    
    // Look for any of the main navigation buttons
    const choreJobsButton = await page.locator('button:has-text("Chore Jobs")').first();
    const aiAssistantButton = await page.locator('button:has-text("AI Assistant")').first();
    
    // Click AI Assistant if visible
    if (await aiAssistantButton.isVisible()) {
      console.log('Dashboard loaded! Opening AI Assistant...');
      await aiAssistantButton.click();
      await delay(1000);
    } else {
      console.log('AI Assistant button not found. Taking screenshot...');
      await page.screenshot({ path: 'workflow-screenshots/no-ai-button.png', fullPage: true });
    }
    
    // Step 2: Create chore via AI
    console.log('Creating chore assignment...');
    const inputField = await page.locator('input[placeholder*="Type your request"]').first();
    if (await inputField.isVisible()) {
      await inputField.fill('create chore "Clean Room" assigned to Alice worth 50 points');
      await inputField.press('Enter');
      await delay(3000);
      
      // Step 3: Go to Chore Jobs
      console.log('Navigating to Chore Jobs...');
      await page.click('button:has-text("Chore Jobs")');
      await delay(2000);
      
      await page.screenshot({ path: 'workflow-screenshots/01-chore-created.png', fullPage: true });
      
      // Step 4: Find and interact with the chore
      const choreCard = await page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: 'Clean Room' }).first();
      if (await choreCard.isVisible()) {
        console.log('Found chore card!');
        
        // Look for Mark Done button within this card
        const markDoneButton = await choreCard.locator('button:has-text("Mark Done")').first();
        if (await markDoneButton.isVisible()) {
          console.log('Clicking Mark Done...');
          await markDoneButton.click();
          await delay(2000);
          await page.screenshot({ path: 'workflow-screenshots/02-marked-done.png', fullPage: true });
          
          // Wait a moment and check for updates
          await delay(1000);
          
          // Check if status changed
          const pendingReview = await page.locator('text="PENDING REVIEW"').first();
          console.log('Pending review visible?', await pendingReview.isVisible());
          
          // Look for verify button
          const verifyButton = await page.locator('button:has-text("Verify & Award Points")').first();
          if (await verifyButton.isVisible()) {
            console.log('Found verify button! Clicking...');
            await verifyButton.click();
            await delay(2000);
            await page.screenshot({ path: 'workflow-screenshots/03-after-verify.png', fullPage: true });
          } else {
            console.log('Verify button not visible yet.');
            
            // Check if we need to refresh or change view
            const parentViewBtn = await page.locator('button:has-text("Parent View")').first();
            if (await parentViewBtn.isVisible()) {
              console.log('Switching to Parent View...');
              await parentViewBtn.click();
              await delay(2000);
              
              // Try again for verify button
              const verifyAfterSwitch = await page.locator('button:has-text("Verify")').first();
              if (await verifyAfterSwitch.isVisible()) {
                await verifyAfterSwitch.click();
                await delay(2000);
              }
            }
          }
        }
      } else {
        console.log('Chore card not found!');
        
        // Log what we see
        const allCards = await page.locator('.bg-white.rounded-lg.shadow').all();
        console.log(`Found ${allCards.length} cards total`);
      }
      
      // Step 5: Check points
      console.log('\nChecking points...');
      await page.click('button:has-text("AI Assistant")');
      await delay(1000);
      
      const pointsInput = await page.locator('input[placeholder*="Type your request"]').last();
      await pointsInput.fill('show points');
      await pointsInput.press('Enter');
      await delay(3000);
      
      await page.screenshot({ path: 'workflow-screenshots/04-points-check.png', fullPage: true });
      
      // Final state
      await page.click('button:has-text("Chore Jobs")');
      await delay(2000);
      await page.screenshot({ path: 'workflow-screenshots/05-final-state.png', fullPage: true });
    }
    
    console.log('\nTest completed!');
    
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