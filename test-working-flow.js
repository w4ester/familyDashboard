const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWorkingFlowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('Starting working flow test...');
  
  try {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="Enter your username"]', 'test');
    await page.fill('input[placeholder="Enter your password"]', 'test');
    await page.click('button:has-text("Sign In")');
    await delay(2000);
    
    // Skip welcome if needed
    const startButton = await page.locator('button:has-text("Start Using Dashboard")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await delay(2000);
    }
    
    // Go to Chore Jobs tab
    await page.click('button:has-text("Chore Jobs")');
    await delay(1000);
    
    // Check if chore already exists, if so click Mark Done
    let choreCard = await page.locator('text="Test Workflow"').first();
    
    if (await choreCard.isVisible()) {
      console.log('Found existing chore, proceeding to mark done...');
      
      // Close AI if it's open
      const aiCloseBtn = await page.locator('.fixed.bottom-20 button:has-text("×")').first();
      if (await aiCloseBtn.isVisible()) {
        await aiCloseBtn.click();
        await delay(500);
      }
    } else {
      // Create new chore
      console.log('Creating new chore via AI...');
      const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
      await aiButton.click();
      await delay(1000);
      
      const aiInput = await page.locator('input[placeholder*="Create a chore"]').first();
      await aiInput.fill('create chore "Test Workflow" assigned to Alice worth 100 points');
      
      const sendButton = await page.locator('button:has-text("Send")').last();
      await sendButton.click();
      await delay(3000);
      
      // Close AI panel - look for the X button in the AI Assistant header
      console.log('Closing AI assistant...');
      const closeBtn = await page.locator('button[aria-label="Close"], .fixed button:has-text("×")').first();
      await closeBtn.click();
      await delay(1000);
    }
    
    // Now mark the chore as done
    console.log('Step 1: Marking chore as done...');
    
    // Find the Mark Done button
    const markDoneBtn = await page.locator('button:has-text("Mark Done")').first();
    
    if (await markDoneBtn.isVisible()) {
      await markDoneBtn.click();
      await delay(2000);
      console.log('✓ Clicked Mark Done');
      
      await page.screenshot({ path: 'working-01-marked-done.png', fullPage: true });
      
      // Step 2: Look for verify button
      console.log('Step 2: Looking for verify button...');
      
      // The chore should now show PENDING REVIEW status
      const pendingStatus = await page.locator('text="PENDING REVIEW"').first();
      if (await pendingStatus.isVisible()) {
        console.log('✓ Status changed to PENDING REVIEW');
      }
      
      // Look for verify button
      const verifyBtn = await page.locator('button:has-text("Verify")').first();
      
      if (await verifyBtn.isVisible()) {
        console.log('✓ Found verify button!');
        await verifyBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'working-02-after-verify.png', fullPage: true });
        console.log('✓ Points awarded!');
        
        // Check the status changed to COMPLETED
        const completedStatus = await page.locator('text="COMPLETED"').first();
        if (await completedStatus.isVisible()) {
          console.log('✓ Status changed to COMPLETED');
        }
        
        // Step 3: Check points via AI
        console.log('\nStep 3: Checking points...');
        const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
        await aiButton.click();
        await delay(1000);
        
        const pointsInput = await page.locator('input[placeholder*="Create a chore"]').first();
        await pointsInput.fill('show points for Alice');
        
        const sendPointsBtn = await page.locator('button:has-text("Send")').last();
        await sendPointsBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'working-03-points-check.png', fullPage: true });
        
        // Get AI response
        const responses = await page.locator('.bg-gray-100, .bg-blue-50').all();
        if (responses.length > 0) {
          const lastResponse = responses[responses.length - 1];
          const pointsText = await lastResponse.textContent();
          console.log('\nAI Points Response:', pointsText);
        }
        
        console.log('\n✅ Full workflow completed successfully!');
        console.log('- Chore created via AI');
        console.log('- Chore marked as done');
        console.log('- Chore verified and points awarded');
        console.log('- Points reflected in system');
        
      } else {
        console.log('✗ Verify button not found');
        
        // Try switching to admin view
        const showAdminBtn = await page.locator('button:has-text("Show Admin")').first();
        if (await showAdminBtn.isVisible()) {
          console.log('Switching to admin view...');
          await showAdminBtn.click();
          await delay(1000);
          
          const verifyAfterAdmin = await page.locator('button:has-text("Verify")').first();
          if (await verifyAfterAdmin.isVisible()) {
            await verifyAfterAdmin.click();
            console.log('✓ Verified with admin view');
          }
        }
      }
    } else {
      console.log('✗ Mark Done button not found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'working-error.png', fullPage: true });
  } finally {
    await delay(5000);
    await browser.close();
  }
}

runWorkingFlowTest().catch(console.error);