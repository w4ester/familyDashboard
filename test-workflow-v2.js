const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWorkflowTestV2() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting workflow test v2...');
  
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
    
    // Wait for dashboard to fully load
    await page.waitForSelector('button:has-text("Chore Jobs")', { timeout: 10000 });
    
    // Step 2: Find and click the floating AI button
    console.log('Looking for AI Assistant button...');
    
    // Try multiple selectors for the floating button
    let aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
    if (!await aiButton.isVisible()) {
      // Try the orange floating button we can see in screenshots
      aiButton = await page.locator('button.bg-orange-500').last();
    }
    if (!await aiButton.isVisible()) {
      // Try by position
      aiButton = await page.locator('button').filter({ has: page.locator('svg') }).last();
    }
    
    if (await aiButton.isVisible()) {
      console.log('Found AI button! Clicking...');
      await aiButton.click();
      await delay(1500);
      
      // Wait for AI panel to open
      await page.waitForSelector('input[placeholder*="Create a chore"], input[placeholder*="Type your request"]', { timeout: 5000 });
    } else {
      console.log('Could not find AI button!');
      await page.screenshot({ path: 'workflow-screenshots/00-no-ai-button.png', fullPage: true });
      return;
    }
    
    // Step 3: Create chore via AI
    console.log('Creating chore via AI...');
    const inputField = await page.locator('input').filter({ 
      hasText: /Create a chore|Type your request/i 
    }).first();
    
    if (!await inputField.isVisible()) {
      // Try a more general selector
      const allInputs = await page.locator('input[type="text"]').all();
      console.log(`Found ${allInputs.length} text inputs`);
      
      for (const input of allInputs) {
        const placeholder = await input.getAttribute('placeholder');
        console.log('Input placeholder:', placeholder);
        if (placeholder && placeholder.toLowerCase().includes('chore')) {
          await input.fill('create chore "Test Workflow" assigned to Alice worth 100 points');
          break;
        }
      }
    } else {
      await inputField.fill('create chore "Test Workflow" assigned to Alice worth 100 points');
    }
    
    // Find and click Send button
    const sendButton = await page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await delay(3000);
    
    await page.screenshot({ path: 'workflow-screenshots/01-chore-created.png', fullPage: true });
    
    // Close AI panel
    const closeButton = await page.locator('button[aria-label="Close"], button:has-text("×")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await delay(1000);
    }
    
    // Step 4: Check Chore Jobs tab
    console.log('Checking Chore Jobs tab...');
    await page.click('button:has-text("Chore Jobs")');
    await delay(2000);
    
    // Scroll to see more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(1000);
    
    await page.screenshot({ path: 'workflow-screenshots/02-chore-jobs-full.png', fullPage: true });
    
    // Debug: Check what's in localStorage
    const debugData = await page.evaluate(() => {
      const assignments = localStorage.getItem('chore-assignments');
      const familyData = localStorage.getItem('familyDashboardData');
      return {
        assignments: assignments ? JSON.parse(assignments) : null,
        hasFamily: !!familyData
      };
    });
    
    console.log('Debug - Assignments:', debugData.assignments);
    console.log('Debug - Has family data:', debugData.hasFamily);
    
    // Look for the chore we created
    const choreFound = await page.locator('text="Test Workflow"').first();
    if (await choreFound.isVisible()) {
      console.log('✓ Chore found in UI!');
      
      // Try to interact with it
      const parentElement = await choreFound.locator('..').locator('..');
      const markDoneBtn = await parentElement.locator('button:has-text("Mark Done")').first();
      
      if (await markDoneBtn.isVisible()) {
        console.log('Clicking Mark Done...');
        await markDoneBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'workflow-screenshots/03-marked-done.png', fullPage: true });
      }
    } else {
      console.log('✗ Chore not found in UI');
    }
    
    console.log('\nTest completed!');
    
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
runWorkflowTestV2().catch(console.error);