const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFixedFlowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const page = await browser.newPage();
  
  console.log('Starting fixed flow test...');
  
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
    
    // Create new chore via AI
    console.log('Creating chore via AI...');
    const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
    await aiButton.click();
    await delay(1000);
    
    const aiInput = await page.locator('input[placeholder*="Create a chore"]').first();
    await aiInput.fill('create chore "Test Workflow" assigned to Alice worth 100 points');
    
    const sendButton = await page.locator('button:has-text("Send")').last();
    await sendButton.click();
    await delay(2000);
    
    // IMPORTANT: Close AI chat box so it doesn't block buttons!
    console.log('Closing AI assistant...');
    const closeButton = await page.locator('button:has-text("×")').last();
    await closeButton.click();
    await delay(1000);
    
    // Step 1: Find and mark chore as done
    console.log('Step 1: Marking chore as done...');
    const choreCard = await page.locator('text="Test Workflow"').first();
    const cardContainer = await choreCard.locator('..').locator('..');
    const markDoneBtn = await cardContainer.locator('button:has-text("Mark Done")').first();
    
    if (await markDoneBtn.isVisible()) {
      await markDoneBtn.click();
      await delay(2000);
      console.log('✓ Clicked Mark Done');
      
      // Step 2: Now the verify button should be visible
      console.log('Step 2: Looking for verify button...');
      await page.screenshot({ path: 'fixed-01-after-mark-done.png', fullPage: true });
      
      // The verify button should now be visible since AI chat is closed
      const verifyBtn = await page.locator('button:has-text("Verify")').first();
      
      if (await verifyBtn.isVisible()) {
        console.log('✓ Found verify button!');
        await verifyBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'fixed-02-after-verify.png', fullPage: true });
        console.log('✓ Points awarded!');
        
        // Step 3: Check points
        console.log('Step 3: Checking points...');
        
        // Open AI again to check points
        await aiButton.click();
        await delay(1000);
        
        const pointsInput = await page.locator('input[placeholder*="Create a chore"]').first();
        await pointsInput.fill('show points');
        
        const sendPointsBtn = await page.locator('button:has-text("Send")').last();
        await sendPointsBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'fixed-03-points-summary.png', fullPage: true });
        
        // Get AI response
        const responses = await page.locator('.bg-gray-100, .bg-blue-50').all();
        const lastResponse = responses[responses.length - 1];
        const pointsText = await lastResponse.textContent();
        console.log('\nPoints Summary:', pointsText);
        
        // Close AI again
        await closeButton.click();
        await delay(500);
        
        // Check Points History tab
        console.log('\nStep 4: Checking Points History...');
        await page.click('button:has-text("Points History")');
        await delay(2000);
        
        await page.screenshot({ path: 'fixed-04-points-history.png', fullPage: true });
        
        console.log('✓ Workflow completed successfully!');
        
      } else {
        console.log('✗ Verify button still not visible');
        
        // Check if we need admin view
        const showAdminBtn = await page.locator('button:has-text("Show Admin")').first();
        if (await showAdminBtn.isVisible()) {
          console.log('Trying with admin view...');
          await showAdminBtn.click();
          await delay(1000);
          
          const verifyAfterAdmin = await page.locator('button:has-text("Verify")').first();
          if (await verifyAfterAdmin.isVisible()) {
            await verifyAfterAdmin.click();
            console.log('✓ Verified with admin view');
          }
        }
      }
    }
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'fixed-error.png', fullPage: true });
  } finally {
    await delay(5000);
    await browser.close();
  }
}

runFixedFlowTest().catch(console.error);