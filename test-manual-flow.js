const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runManualFlowTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('Starting manual flow test...');
  console.log('This test will pause at key moments for manual interaction...');
  
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
    
    console.log('\n=== MANUAL STEP ===');
    console.log('Please manually close the AI Assistant if it is open');
    console.log('(Click the X button in the orange AI Assistant header)');
    console.log('Waiting 5 seconds...\n');
    await delay(5000);
    
    // Check if we have the Test Workflow chore
    const choreExists = await page.locator('text="Test Workflow"').first();
    
    if (await choreExists.isVisible()) {
      console.log('✓ Found "Test Workflow" chore');
      
      // Find and click Mark Done
      const markDoneBtn = await page.locator('button:has-text("Mark Done")').first();
      if (await markDoneBtn.isVisible()) {
        console.log('Clicking Mark Done...');
        await markDoneBtn.click();
        await delay(2000);
        
        console.log('✓ Clicked Mark Done');
        await page.screenshot({ path: 'manual-01-marked-done.png', fullPage: true });
        
        // Look for verify button
        const verifyBtn = await page.locator('button:has-text("Verify")').first();
        if (await verifyBtn.isVisible()) {
          console.log('✓ Verify button is visible!');
          console.log('Clicking Verify & Award Points...');
          await verifyBtn.click();
          await delay(2000);
          
          await page.screenshot({ path: 'manual-02-verified.png', fullPage: true });
          console.log('✓ Points awarded!');
          
          // Check Chore Summary
          const summaryText = await page.textContent('.rounded-lg:has-text("Chore Summary")');
          console.log('\nChore Summary:', summaryText);
          
          // Open AI to check points
          const aiButton = await page.locator('button.fixed.bottom-4.right-4').first();
          await aiButton.click();
          await delay(1000);
          
          const pointsInput = await page.locator('input[placeholder*="Create a chore"]').first();
          await pointsInput.fill('show points');
          
          const sendBtn = await page.locator('button:has-text("Send")').last();
          await sendBtn.click();
          await delay(2000);
          
          await page.screenshot({ path: 'manual-03-points.png', fullPage: true });
          
          console.log('\n✅ WORKFLOW COMPLETED SUCCESSFULLY!');
          console.log('The chore was marked done, verified, and points were awarded.');
        } else {
          console.log('✗ Verify button not visible');
          console.log('The button might be hidden by the AI Assistant panel');
        }
      } else {
        console.log('✗ Mark Done button not found');
      }
    } else {
      console.log('✗ "Test Workflow" chore not found');
      console.log('You may need to create it first using the AI Assistant');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'manual-error.png', fullPage: true });
  } finally {
    console.log('\nTest completed. Browser will close in 10 seconds...');
    await delay(10000);
    await browser.close();
  }
}

runManualFlowTest().catch(console.error);