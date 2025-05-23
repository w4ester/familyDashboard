# Manual Steps to Run Family Dashboard Locally

## Step 1: Open Terminal
- On Mac: Press `Cmd + Space`, type "Terminal", press Enter
- On Windows: Press `Win + R`, type "cmd", press Enter

## Step 2: Navigate to Project
Copy and paste this command:
```bash
cd /Users/willf/smartIndex/siguy/family-dashboard
```

## Step 3: Install Dependencies (First Time Only)
If you haven't run this before:
```bash
npm install
```

## Step 4: Start the App
```bash
npm start
```

Wait for the message "Compiled successfully!"

## Step 5: Open Browser
Open your web browser and go to:
**http://localhost:3000**

## If It's Not Working:

### Option 1: Use a Different Port
```bash
PORT=3001 npm start
```
Then open: http://localhost:3001

### Option 2: Clear Everything and Restart
```bash
# Stop any running processes
pkill -f "node"

# Clear npm cache
npm cache clean --force

# Remove and reinstall dependencies
rm -rf node_modules
npm install

# Start again
npm start
```

### Option 3: Use Yarn Instead
```bash
# Install yarn (if not installed)
npm install -g yarn

# Install dependencies
yarn install

# Start the app
yarn start
```

## What You Should See:
1. Welcome page with a "Get Started" button
2. Onboarding flow to set up your family
3. Main dashboard with tabs for:
   - Chores & Points
   - School Assignments
   - Calendar
   - Files
   - School Platforms

## The app is working when:
- Terminal shows "Compiled successfully!"
- Browser loads the welcome page
- No error messages in browser console

## For VS Code Users:
1. Open the project folder in VS Code
2. Open Terminal in VS Code (Terminal > New Terminal)
3. Run: `npm start`
4. Click the URL that appears in terminal