const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCorrectWorkflowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting correct workflow test...');
  
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
    
    // Wait for dashboard
    await page.waitForSelector('button:has-text("Chore Jobs")', { timeout: 10000 });
    
    // Step 2: Click the floating AI button
    console.log('Opening AI Assistant...');
    // The orange button in bottom right
    const aiButton = await page.locator('button.fixed.bottom-4.right-4, button.bg-orange-500').last();
    await aiButton.click();
    await delay(1500);
    
    // Step 3: Find the correct AI input in the panel
    console.log('Finding AI input field...');
    // The AI panel should have opened
    const aiPanel = await page.locator('.fixed.bottom-20, div:has-text("AI Assistant")').last();
    
    // Find the input within the AI panel
    const aiInput = await aiPanel.locator('input[placeholder*="Create a chore"]').first();
    
    if (await aiInput.isVisible()) {
      console.log('Filling AI input...');
      await aiInput.fill('create chore "Clean Kitchen" assigned to Alice worth 75 points');
      
      // Find Send button within the AI panel
      const sendButton = await aiPanel.locator('button:has-text("Send")').first();
      await sendButton.click();
      await delay(3000);
      
      await page.screenshot({ path: 'workflow-screenshots/01-ai-response.png', fullPage: true });
    } else {
      console.log('AI input not found, trying alternative approach...');
      
      // Try to find any input that's in the AI Assistant context
      const allInputs = await page.locator('input[type="text"]').all();
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const placeholder = await input.getAttribute('placeholder');
        const isVisible = await input.isVisible();
        console.log(`Input ${i}: placeholder="${placeholder}", visible=${isVisible}`);
        
        // Look for the AI assistant input (not the chore form input)
        if (placeholder && placeholder.includes('Create a chore') && isVisible) {
          // Check if this is within the AI panel by checking parent elements
          const parent = await input.locator('..').locator('..');
          const parentText = await parent.textContent();
          if (parentText.includes('AI Assistant')) {
            console.log('Found correct AI input!');
            await input.fill('create chore "Clean Kitchen" assigned to Alice worth 75 points');
            
            // Find the Send button near this input
            const sendBtn = await parent.locator('button:has-text("Send")').first();
            await sendBtn.click();
            await delay(3000);
            break;
          }
        }
      }
    }
    
    // Close AI panel
    const closeButton = await page.locator('button[aria-label="Close"], button:has-text("×")').last();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await delay(1000);
    }
    
    // Step 4: Navigate to Chore Jobs
    console.log('Navigating to Chore Jobs...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    // Scroll to see all content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(1000);
    
    await page.screenshot({ path: 'workflow-screenshots/02-chore-jobs.png', fullPage: true });
    
    // Look for Chore Assignments section
    console.log('Looking for chore assignments...');
    
    // Check localStorage
    const assignmentData = await page.evaluate(() => {
      const data = localStorage.getItem('chore-assignments');
      return data ? JSON.parse(data) : [];
    });
    
    console.log(`Found ${assignmentData.length} assignments in localStorage`);
    if (assignmentData.length > 0) {
      console.log('Latest assignment:', assignmentData[assignmentData.length - 1]);
    }
    
    // Look for the chore in UI
    const choreText = await page.locator('text="Clean Kitchen"').first();
    if (await choreText.isVisible()) {
      console.log('✓ Found chore in UI!');
      
      // Find Mark Done button
      const choreCard = await choreText.locator('..').locator('..').locator('..');
      const markDoneBtn = await choreCard.locator('button:has-text("Mark Done")').first();
      
      if (await markDoneBtn.isVisible()) {
        console.log('Clicking Mark Done...');
        await markDoneBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'workflow-screenshots/03-marked-done.png', fullPage: true });
        
        // Check for verify button
        await delay(1000);
        const verifyBtn = await page.locator('button:has-text("Verify")').first();
        if (await verifyBtn.isVisible()) {
          console.log('✓ Verify button appeared!');
          await verifyBtn.click();
          await delay(2000);
          await page.screenshot({ path: 'workflow-screenshots/04-verified.png', fullPage: true });
        } else {
          console.log('✗ Verify button not found');
        }
      }
    } else {
      console.log('✗ Chore not found in UI');
      
      // Check if there's a specific section for assignments
      const sections = await page.locator('h2, h3').all();
      for (const section of sections) {
        const text = await section.textContent();
        console.log('Section:', text);
      }
    }
    
    // Step 5: Check points
    console.log('\nChecking points...');
    await aiButton.click();
    await delay(1000);
    
    const pointsInput = await page.locator('div:has-text("AI Assistant")').last().locator('input[type="text"]').first();
    await pointsInput.fill('show points');
    
    const sendPointsBtn = await page.locator('div:has-text("AI Assistant")').last().locator('button:has-text("Send")').first();
    await sendPointsBtn.click();
    await delay(3000);
    
    await page.screenshot({ path: 'workflow-screenshots/05-points-check.png', fullPage: true });
    
    console.log('\nWorkflow test completed!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-screenshots/error-state.png', fullPage: true });
  } finally {
    await delay(5000);
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('workflow-screenshots')) {
  fs.mkdirSync('workflow-screenshots');
}

// Run the test
runCorrectWorkflowTest().catch(console.error);