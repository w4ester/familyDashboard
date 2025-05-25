const { chromium } = require('playwright');
const path = require('path');

async function testAIAssistant() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('🚀 Starting AI Assistant test...');
  
  try {
    // Navigate to the app
    console.log('📱 Opening Family Dashboard...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png'), fullPage: true });
    
    // Check if we need to login
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      console.log('🔐 Logging in with demo credentials...');
      await page.fill('input[placeholder="Enter your username"]', 'demo');
      await page.fill('input[placeholder="Enter your password"]', 'demo');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Handle onboarding if present
    const onboardingButton = await page.$('button:has-text("Let\'s get started together!")');
    if (onboardingButton) {
      console.log('👋 Completing onboarding...');
      // Fill in name
      await page.fill('input[placeholder="Enter your name..."]', 'Test User');
      // Click the button
      await onboardingButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Click Start Using Dashboard if present
    const startButton = await page.$('button:has-text("Start Using Dashboard!")');
    if (startButton) {
      console.log('🚀 Starting dashboard...');
      await startButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot of main dashboard
    await page.screenshot({ path: path.join(screenshotsDir, '02-dashboard.png'), fullPage: true });
    
    // Open AI Assistant - look for the orange button with lightning icon
    console.log('🤖 Opening AI Assistant...');
    // Try multiple selectors
    let aiButton = await page.$('button[title="AI Assistant"]');
    if (!aiButton) {
      // Look for the fixed button in bottom right
      aiButton = await page.$('button.fixed.bottom-4.right-4');
    }
    if (!aiButton) {
      // Look for orange button
      aiButton = await page.$('button.bg-orange-500');
    }
    
    if (aiButton) {
      await aiButton.click();
    } else {
      console.log('⚠️  Could not find AI Assistant button, taking debug screenshot...');
      await page.screenshot({ path: path.join(screenshotsDir, 'debug-no-ai-button.png'), fullPage: true });
      throw new Error('AI Assistant button not found');
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '03-ai-assistant-open.png') });
    
    // Helper function to send AI command
    async function sendCommand(command, screenshotName) {
      console.log(`💬 Sending: "${command}"`);
      
      // Find the AI Assistant's input field (it's within the AI Assistant panel)
      const aiInput = await page.$('.fixed.w-96 input[type="text"]') || 
                     await page.$('input[placeholder*="Create a chore"]') ||
                     await page.$('.bg-white.rounded-lg.shadow-xl input[type="text"]');
      
      if (!aiInput) {
        console.log('⚠️  Could not find AI Assistant input field');
        return;
      }
      
      // Clear and type the command
      await aiInput.click();
      await aiInput.fill('');
      await aiInput.type(command);
      await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}-typing.png`) });
      
      // Press Enter or click Send button
      const sendButton = await page.$('button:has-text("Send")');
      if (sendButton) {
        await sendButton.click();
      } else {
        await aiInput.press('Enter');
      }
      
      // Wait for response
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotsDir, `${screenshotName}-response.png`) });
      
      // Get the response text from AI Assistant chat
      const chatMessages = await page.$$('.fixed.w-96 .text-sm.text-gray-800');
      if (chatMessages.length > 0) {
        const lastMessage = await chatMessages[chatMessages.length - 1].textContent();
        console.log(`✅ Response: ${lastMessage}`);
      }
    }
    
    // Test 1: Add family members
    console.log('\n📍 Test 1: Adding family members');
    await sendCommand('Add Mom as a parent', '04-add-mom');
    await sendCommand('Add Dad as a parent', '05-add-dad');
    await sendCommand('Add Sarah as a child', '06-add-sarah');
    await sendCommand('Add Johnny as a child', '07-add-johnny');
    
    // Test 2: Create chores
    console.log('\n📍 Test 2: Creating chore assignments');
    await sendCommand('Create a chore for Sarah to wash dishes worth 5 points', '08-chore-sarah');
    await sendCommand('Create a chore for Johnny to vacuum living room worth 4 points', '09-chore-johnny');
    
    // Test 3: List chores
    console.log('\n📍 Test 3: Listing chores');
    await sendCommand('List chores', '10-list-chores');
    
    // Test 4: Create events
    console.log('\n📍 Test 4: Creating calendar events');
    await sendCommand('Create event "Soccer Practice" for Sarah on 2025-05-28 at 4:00pm', '11-event-soccer');
    await sendCommand('Create event "Piano Lesson" for Johnny on 2025-05-29 at 3:30pm', '12-event-piano');
    
    // Test 5: Create assignments
    console.log('\n📍 Test 5: Creating school assignments');
    await sendCommand('Create assignment "Math Homework" for Sarah due 2025-05-30', '13-assignment-math');
    await sendCommand('Create assignment "Book Report" for Johnny due 2025-06-01', '14-assignment-book');
    
    // Test 6: Show points summary
    console.log('\n📍 Test 6: Checking points');
    await sendCommand('Show points', '15-show-points');
    
    // Test 7: List everything
    console.log('\n📍 Test 7: Dashboard overview');
    await sendCommand('List everything', '16-list-all');
    
    // Close AI Assistant and check dashboard tabs
    console.log('\n📍 Test 8: Checking dashboard tabs');
    // Try to find close button with different selectors
    const closeButton = await page.$('button:has-text("×")') || 
                       await page.$('button.text-white.hover\\:text-gray-200:has(svg)') ||
                       await page.$('[aria-label="Close"]');
    if (closeButton) {
      await closeButton.click();
    } else {
      console.log('⚠️  Could not find close button, clicking outside...');
      await page.click('body', { position: { x: 100, y: 100 } });
    }
    await page.waitForTimeout(1000);
    
    // Click on Chore Jobs tab
    await page.click('button:has-text("Chore Jobs")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '17-chore-jobs-tab.png'), fullPage: true });
    
    // Click on Calendar tab
    await page.click('button:has-text("Calendar")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '18-calendar-tab.png'), fullPage: true });
    
    // Click on Assignments tab
    await page.click('button:has-text("Assignments")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '19-assignments-tab.png'), fullPage: true });
    
    // Reopen AI Assistant for chore completion test
    console.log('\n📍 Test 9: Testing chore completion workflow');
    const aiButtonReopen = await page.$('button.fixed.bottom-4.right-4') || await page.$('button.bg-orange-500');
    if (aiButtonReopen) {
      await aiButtonReopen.click();
    }
    await page.waitForTimeout(1000);
    
    // Get a chore ID from the list
    await sendCommand('List chores', '20-get-chore-ids');
    
    // Note: In a real test, we'd parse the chore ID from the response
    // For now, we'll show the complete workflow
    console.log('📝 Note: To complete the workflow:');
    console.log('   1. Child marks chore complete: "Complete chore [ID]"');
    console.log('   2. Parent verifies: "Verify chore [ID] by Mom"');
    console.log('   3. Points are awarded automatically');
    
    // Test delete operations
    console.log('\n📍 Test 10: Testing edit/delete operations');
    await sendCommand('Edit chore [ID] to 8 points', '21-edit-example');
    await sendCommand('Delete event [ID]', '22-delete-example');
    
    // Final screenshot of full dashboard
    await page.locator('button:has-text("×")').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '23-final-dashboard.png'), fullPage: true });
    
    console.log('\n✅ All tests completed! Check test-screenshots directory for results.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testAIAssistant().catch(console.error);