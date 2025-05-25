const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFinalWorkflowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting final workflow test...');
  
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
    
    // Step 2: Click the floating AI button
    console.log('Opening AI Assistant...');
    const floatingAIButton = await page.locator('button').filter({ hasText: /^[🤖💬]$/ }).last();
    await floatingAIButton.click();
    await delay(1500);
    
    // Step 3: Create chore via AI
    console.log('Creating chore assignment...');
    // Use the actual placeholder text we saw
    const inputField = await page.locator('input[placeholder*="Create a chore"]').first();
    await inputField.fill('create chore "Test Workflow Chore" assigned to Alice worth 75 points');
    
    // Click Send button
    const sendButton = await page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await delay(3000);
    
    // Take screenshot of AI response
    await page.screenshot({ path: 'workflow-screenshots/01-ai-created-chore.png', fullPage: true });
    
    // Close AI panel
    const closeButton = await page.locator('button[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await delay(1000);
    }
    
    // Step 4: Navigate to Chore Jobs
    console.log('Navigating to Chore Jobs tab...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    // Look for ChoreAssignments section - scroll down if needed
    console.log('Looking for Chore Assignments section...');
    
    // Scroll down to find the assignments section
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'workflow-screenshots/02-chore-jobs-view.png', fullPage: true });
    
    // Look for section headers
    const sectionHeaders = await page.locator('h2, h3').all();
    for (const header of sectionHeaders) {
      const text = await header.textContent();
      if (text?.includes('Assignments') || text?.includes('Jobs')) {
        console.log('Found section:', text);
      }
    }
    
    // Look for the created chore
    const choreCard = await page.locator('text="Test Workflow Chore"').first();
    if (await choreCard.isVisible()) {
      console.log('Found the created chore!');
      
      // Find and click Mark Done button
      const parentCard = await choreCard.locator('..').locator('..').locator('..');
      const markDoneBtn = await parentCard.locator('button:has-text("Mark Done")').first();
      
      if (await markDoneBtn.isVisible()) {
        console.log('Clicking Mark Done...');
        await markDoneBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'workflow-screenshots/03-after-mark-done.png', fullPage: true });
        
        // Wait and check for status change
        await delay(1500);
        
        // Look for verification UI
        const pendingReview = await page.locator('text="PENDING REVIEW"').first();
        const verifyButton = await parentCard.locator('button:has-text("Verify")').first();
        
        console.log('Status changed to pending review?', await pendingReview.isVisible());
        console.log('Verify button appeared?', await verifyButton.isVisible());
        
        if (await verifyButton.isVisible()) {
          console.log('Clicking Verify button...');
          await verifyButton.click();
          await delay(2000);
          
          await page.screenshot({ path: 'workflow-screenshots/04-after-verify.png', fullPage: true });
        } else {
          console.log('Verify button not visible. Checking parent view...');
          
          // Try Show Admin button
          const adminButton = await page.locator('button:has-text("Show Admin")').first();
          if (await adminButton.isVisible()) {
            await adminButton.click();
            await delay(2000);
            
            // Now look for verify button again
            const verifyAfterAdmin = await page.locator('button:has-text("Verify")').first();
            if (await verifyAfterAdmin.isVisible()) {
              await verifyAfterAdmin.click();
              await delay(2000);
            }
          }
        }
      } else {
        console.log('Mark Done button not found!');
      }
    } else {
      console.log('Chore not visible in UI. Checking localStorage...');
      
      const assignments = await page.evaluate(() => {
        return localStorage.getItem('chore-assignments');
      });
      console.log('Assignments data:', assignments);
    }
    
    // Step 5: Check points via AI
    console.log('\nChecking points summary...');
    await floatingAIButton.click();
    await delay(1000);
    
    const pointsInput = await page.locator('input[placeholder*="Create a chore"]').first();
    await pointsInput.fill('show points for Alice');
    await sendButton.click();
    await delay(3000);
    
    await page.screenshot({ path: 'workflow-screenshots/05-points-check.png', fullPage: true });
    
    // Get the AI response
    const aiResponses = await page.locator('.bg-blue-50, .text-gray-700').all();
    if (aiResponses.length > 0) {
      const lastResponse = aiResponses[aiResponses.length - 1];
      const responseText = await lastResponse.textContent();
      console.log('\nAI Points Response:', responseText);
    }
    
    console.log('\nWorkflow test completed!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-screenshots/error-state.png', fullPage: true });
  } finally {
    await delay(5000); // Keep browser open for review
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('workflow-screenshots')) {
  fs.mkdirSync('workflow-screenshots');
}

// Run the test
runFinalWorkflowTest().catch(console.error);