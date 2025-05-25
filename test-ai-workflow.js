const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAIWorkflowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting AI workflow test...');
  
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
    
    // Step 2: Look for and click the floating AI button
    console.log('Looking for floating AI button...');
    const floatingAIButton = await page.locator('button.fixed.bottom-4.right-4').first();
    if (await floatingAIButton.isVisible()) {
      console.log('Found floating AI button! Clicking...');
      await floatingAIButton.click();
      await delay(1000);
    } else {
      // Try alternative selectors
      const aiIcon = await page.locator('button:has(svg)').last();
      if (await aiIcon.isVisible()) {
        console.log('Found AI icon button! Clicking...');
        await aiIcon.click();
        await delay(1000);
      }
    }
    
    // Step 3: Create chore via AI
    console.log('Looking for AI input field...');
    const inputField = await page.locator('input[placeholder*="Type your request"]').first();
    if (await inputField.isVisible()) {
      console.log('Creating chore assignment...');
      await inputField.fill('create chore "Clean Room" assigned to Alice worth 50 points');
      await inputField.press('Enter');
      await delay(3000);
      
      // Take screenshot of AI response
      await page.screenshot({ path: 'workflow-screenshots/00-ai-create-response.png', fullPage: true });
    } else {
      console.log('AI input field not found!');
      await page.screenshot({ path: 'workflow-screenshots/00-no-ai-input.png', fullPage: true });
    }
    
    // Step 4: Go to Chore Jobs tab
    console.log('Navigating to Chore Jobs...');
    const choreJobsTab = await page.locator('button:has-text("Chore Jobs")').first();
    if (await choreJobsTab.isVisible()) {
      await choreJobsTab.click();
      await delay(2000);
      
      await page.screenshot({ path: 'workflow-screenshots/01-chore-jobs-tab.png', fullPage: true });
      
      // Look for ChoreAssignments section
      console.log('Looking for chore assignments...');
      
      // Check if there's a section for assignments
      const assignmentHeaders = await page.locator('h2, h3').all();
      for (const header of assignmentHeaders) {
        const text = await header.textContent();
        console.log('Found header:', text);
      }
      
      // Look for the created chore
      const choreText = await page.locator('text="Clean Room"').first();
      if (await choreText.isVisible()) {
        console.log('Found the created chore!');
        
        // Look for Mark Done button
        const choreCard = await choreText.locator('..').locator('..');
        const markDoneBtn = await choreCard.locator('button:has-text("Mark Done")').first();
        
        if (await markDoneBtn.isVisible()) {
          console.log('Clicking Mark Done...');
          await markDoneBtn.click();
          await delay(2000);
          await page.screenshot({ path: 'workflow-screenshots/02-after-mark-done.png', fullPage: true });
          
          // Check for status change
          await delay(1000);
          
          // Look for verify button or pending status
          const pendingStatus = await page.locator('text="PENDING REVIEW"').first();
          const verifyBtn = await page.locator('button:has-text("Verify")').first();
          
          console.log('Pending status visible?', await pendingStatus.isVisible());
          console.log('Verify button visible?', await verifyBtn.isVisible());
          
          if (await verifyBtn.isVisible()) {
            console.log('Clicking verify...');
            await verifyBtn.click();
            await delay(2000);
            await page.screenshot({ path: 'workflow-screenshots/03-after-verify.png', fullPage: true });
          }
        }
      } else {
        console.log('Created chore not found in UI!');
        
        // Debug: Check localStorage
        const assignments = await page.evaluate(() => {
          const data = localStorage.getItem('chore-assignments');
          return data ? JSON.parse(data) : null;
        });
        console.log('Assignments in localStorage:', assignments);
      }
      
      // Step 5: Check points
      console.log('\nChecking points...');
      // Click AI button again
      await floatingAIButton.click();
      await delay(1000);
      
      const pointsInput = await page.locator('input[placeholder*="Type your request"]').first();
      await pointsInput.fill('show points');
      await pointsInput.press('Enter');
      await delay(3000);
      
      await page.screenshot({ path: 'workflow-screenshots/04-points-check.png', fullPage: true });
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
runAIWorkflowTest().catch(console.error);