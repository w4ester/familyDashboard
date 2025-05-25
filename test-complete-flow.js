const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCompleteFlowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const page = await browser.newPage();
  
  console.log('Starting complete flow test...');
  
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
    
    // Check if we have the chore from previous test
    let choreCard = await page.locator('text="Clean Room"').first();
    
    if (!await choreCard.isVisible()) {
      console.log('No existing chore found, creating new one...');
      
      // Create new chore via AI
      const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
      await aiButton.click();
      await delay(1000);
      
      const aiInput = await page.locator('input[placeholder*="Create a chore"]').first();
      await aiInput.fill('create chore "Test Complete Flow" assigned to Alice worth 75 points');
      
      const sendButton = await page.locator('button:has-text("Send")').last();
      await sendButton.click();
      await delay(2000);
      
      // Close AI
      const closeButton = await page.locator('button:has-text("×")').last();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await delay(500);
      }
      
      // Find the new chore
      choreCard = await page.locator('text="Test Complete Flow"').first();
    }
    
    // Step 1: Mark chore as done
    console.log('Step 1: Marking chore as done...');
    
    // Find the Mark Done button in the same card
    const cardContainer = await choreCard.locator('..').locator('..');
    const markDoneBtn = await cardContainer.locator('button:has-text("Mark Done")').first();
    
    if (await markDoneBtn.isVisible()) {
      await markDoneBtn.click();
      await delay(2000);
      
      console.log('✓ Clicked Mark Done');
      await page.screenshot({ path: 'flow-01-marked-done.png', fullPage: true });
      
      // Step 2: Look for verify button
      console.log('Step 2: Looking for verify button...');
      await delay(1000);
      
      // Check if we need to switch to admin/parent view
      const showAdminBtn = await page.locator('button:has-text("Show Admin")').first();
      if (await showAdminBtn.isVisible() && (await showAdminBtn.textContent()) === 'Show Admin') {
        console.log('Switching to admin view...');
        await showAdminBtn.click();
        await delay(1000);
      }
      
      // Now look for verify button
      const verifyBtn = await page.locator('button:has-text("Verify & Award Points")').first();
      
      if (await verifyBtn.isVisible()) {
        console.log('✓ Found verify button!');
        
        // Step 3: Click verify
        console.log('Step 3: Verifying and awarding points...');
        await verifyBtn.click();
        await delay(2000);
        
        await page.screenshot({ path: 'flow-02-after-verify.png', fullPage: true });
        console.log('✓ Clicked verify button');
        
        // Step 4: Check points
        console.log('Step 4: Checking points...');
        
        // Open AI to check points
        const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
        await aiButton.click();
        await delay(1000);
        
        const pointsInput = await page.locator('input[placeholder*="Create a chore"]').first();
        await pointsInput.fill('show points');
        
        const sendPointsBtn = await page.locator('button:has-text("Send")').last();
        await sendPointsBtn.click();
        await delay(2000);
        
        // Get AI response
        const responses = await page.locator('.bg-gray-100, .bg-blue-50').all();
        const lastResponse = responses[responses.length - 1];
        const pointsText = await lastResponse.textContent();
        console.log('\nPoints Summary:', pointsText);
        
        await page.screenshot({ path: 'flow-03-points-summary.png', fullPage: true });
        
        // Close AI
        const closeBtn = await page.locator('button:has-text("×")').last();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
        
        // Final check - go to Points History tab
        console.log('\nStep 5: Checking Points History...');
        await page.click('button:has-text("Points History")');
        await delay(2000);
        
        await page.screenshot({ path: 'flow-04-points-history.png', fullPage: true });
        
        // Check if points appear in history
        const historyText = await page.textContent('body');
        if (historyText.includes('Alice') && historyText.includes('points')) {
          console.log('✓ Points recorded in history!');
        }
        
      } else {
        console.log('✗ Verify button not found');
        
        // Debug: check what status is shown
        const statusElements = await page.locator('.text-xs.font-medium').all();
        for (const elem of statusElements) {
          const text = await elem.textContent();
          console.log('Status found:', text);
        }
      }
      
    } else {
      console.log('✗ Mark Done button not found');
    }
    
    console.log('\nWorkflow test completed!');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'flow-error.png', fullPage: true });
  } finally {
    await delay(5000);
    await browser.close();
  }
}

runCompleteFlowTest().catch(console.error);