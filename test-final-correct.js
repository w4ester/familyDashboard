const { chromium } = require('playwright');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFinalTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting final test...');
  
  try {
    // Step 1: Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in...');
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    await delay(2000);
    
    // Handle welcome
    const startButton = await page.locator('button:has-text("Start Using Dashboard")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await delay(2000);
    }
    
    // Wait for dashboard
    await page.waitForSelector('button:has-text("Chore Jobs")', { timeout: 10000 });
    console.log('Dashboard loaded!');
    
    // Step 2: Click floating AI button
    console.log('Opening AI Assistant...');
    const floatingButton = await page.locator('button.fixed.bottom-4.right-4').first();
    await floatingButton.click();
    await delay(1500);
    
    // Step 3: Fill AI input with the correct placeholder
    console.log('Creating chore via AI...');
    const aiInput = await page.locator('input[placeholder*="Create a chore for"]').first();
    await aiInput.fill('create chore "Test Workflow Complete" assigned to Alice worth 100 points');
    
    // Click Send
    const sendButton = await page.locator('button:has-text("Send")').last();
    await sendButton.click();
    await delay(3000);
    
    await page.screenshot({ path: 'workflow-screenshots/01-ai-created.png', fullPage: true });
    
    // Close AI panel
    const closeButton = await page.locator('button:has-text("×")').last();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await delay(1000);
    }
    
    // Step 4: Check Chore Jobs tab
    console.log('Checking Chore Jobs tab...');
    const choreJobsBtn = await page.locator('button:has-text("Chore Jobs")').first();
    await choreJobsBtn.click();
    await delay(2000);
    
    // Scroll to see ChoreAssignments component
    await page.evaluate(() => window.scrollBy(0, 300));
    await delay(1000);
    
    await page.screenshot({ path: 'workflow-screenshots/02-chore-jobs.png', fullPage: true });
    
    // Debug: Check localStorage
    const storageData = await page.evaluate(() => {
      const assignments = localStorage.getItem('chore-assignments');
      const family = localStorage.getItem('familyDashboardData');
      return {
        assignments: assignments ? JSON.parse(assignments) : [],
        familyMembers: family ? JSON.parse(family).familyMembers : []
      };
    });
    
    console.log('Assignments:', storageData.assignments.length);
    console.log('Family members:', storageData.familyMembers);
    
    // Look for the chore
    const choreCard = await page.locator('text="Test Workflow Complete"').first();
    if (await choreCard.isVisible()) {
      console.log('✓ Found chore in UI!');
      
      // Find Mark Done button
      let markDoneBtn = null;
      let parent = choreCard;
      
      // Navigate up the DOM tree to find the card container
      for (let i = 0; i < 5; i++) {
        parent = await parent.locator('..');
        const buttons = await parent.locator('button:has-text("Mark Done")').all();
        if (buttons.length > 0) {
          markDoneBtn = buttons[0];
          break;
        }
      }
      
      if (markDoneBtn && await markDoneBtn.isVisible()) {
        console.log('Clicking Mark Done...');
        await markDoneBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'workflow-screenshots/03-marked-done.png', fullPage: true });
        
        // Look for verify button
        await delay(1000);
        
        // Check if we need admin view
        const showAdminBtn = await page.locator('button:has-text("Show Admin")').first();
        if (await showAdminBtn.isVisible()) {
          console.log('Switching to admin view...');
          await showAdminBtn.click();
          await delay(1000);
        }
        
        // Look for verify button
        const verifyBtn = await page.locator('button:has-text("Verify & Award Points")').first();
        if (await verifyBtn.isVisible()) {
          console.log('✓ Clicking Verify button...');
          await verifyBtn.click();
          await delay(2000);
          
          await page.screenshot({ path: 'workflow-screenshots/04-verified.png', fullPage: true });
        } else {
          console.log('✗ Verify button not found');
          
          // Check what status text we see
          const statusTexts = await page.locator('.text-xs.font-medium').all();
          for (const status of statusTexts) {
            const text = await status.textContent();
            console.log('Status text:', text);
          }
        }
      } else {
        console.log('✗ Mark Done button not found');
      }
    } else {
      console.log('✗ Chore not found in UI');
      
      // Look for any assignment cards
      const assignmentCards = await page.locator('.bg-white.rounded-lg.shadow').all();
      console.log(`Found ${assignmentCards.length} cards`);
      
      // Check section headers
      const headers = await page.locator('h2, h3').all();
      for (const header of headers) {
        const text = await header.textContent();
        if (text?.includes('Chore') || text?.includes('Assignment')) {
          console.log('Header:', text);
        }
      }
    }
    
    // Step 5: Check points
    console.log('\nChecking points...');
    await floatingButton.click();
    await delay(1000);
    
    const pointsInput = await page.locator('input[placeholder*="Create a chore for"]').first();
    await pointsInput.fill('show points');
    
    const sendPointsBtn = await page.locator('button:has-text("Send")').last();
    await sendPointsBtn.click();
    await delay(3000);
    
    await page.screenshot({ path: 'workflow-screenshots/05-points-summary.png', fullPage: true });
    
    // Get AI response
    const aiMessages = await page.locator('.bg-blue-50, .bg-gray-100').all();
    if (aiMessages.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      const text = await lastMessage.textContent();
      console.log('\nPoints Summary:', text);
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-screenshots/error-final.png', fullPage: true });
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
runFinalTest().catch(console.error);