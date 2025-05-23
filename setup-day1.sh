#!/bin/bash
# Day 1 Rapid Implementation Script
# Run this to quickly set up the new architecture

echo "🚀 Family Dashboard - Day 1 Rapid Setup"
echo "======================================"

# Create all necessary directories
echo "📁 Creating directory structure..."
mkdir -p src/features/{chores,assignments,calendar,ai-assistant,auth,templates}/components
mkdir -p src/features/{chores,assignments,calendar,ai-assistant,auth,templates}/services
mkdir -p src/features/{chores,assignments,calendar,ai-assistant,auth,templates}/hooks
mkdir -p src/features/{chores,assignments,calendar,ai-assistant,auth,templates}/types

mkdir -p src/infrastructure/{api,mcp,storage,ai,p2p}
mkdir -p src/shared/{components,hooks,utils,services}
mkdir -p src/core/{models,utils,constants,config}

echo "✅ Directory structure created"

# Create index files for each feature
echo "📝 Creating feature index files..."
for feature in chores assignments calendar ai-assistant auth templates; do
  cat > src/features/$feature/index.ts << EOF
// $feature feature module
export * from './components';
export * from './services';
export * from './hooks';
export * from './types';
EOF
done

echo "✅ Feature modules initialized"

# Create a simple migration script
echo "🔄 Creating migration helper..."
cat > migrate-component.sh << 'EOF'
#!/bin/bash
# Usage: ./migrate-component.sh <component-name> <feature-name>

COMPONENT=$1
FEATURE=$2

if [ -z "$COMPONENT" ] || [ -z "$FEATURE" ]; then
  echo "Usage: ./migrate-component.sh <component-name> <feature-name>"
  exit 1
fi

echo "Migrating $COMPONENT to $FEATURE feature..."

# Create component file
cat > src/features/$FEATURE/components/$COMPONENT.tsx << EOFC
import React from 'react';
import { ErrorBoundary } from '../../../shared/components';

export const $COMPONENT: React.FC = () => {
  return (
    <ErrorBoundary>
      <div>
        {/* TODO: Migrate $COMPONENT logic here */}
      </div>
    </ErrorBoundary>
  );
};
EOFC

echo "✅ Created src/features/$FEATURE/components/$COMPONENT.tsx"
echo "📋 Next steps:"
echo "  1. Copy logic from FamilyDashboard.tsx"
echo "  2. Extract to service layer"
echo "  3. Add TypeScript types"
echo "  4. Test the component"
EOF

chmod +x migrate-component.sh

echo "✅ Migration helper created"

# Update package.json with new scripts
echo "📦 Adding rapid development scripts..."
node -e "
const pkg = require('./package.json');
pkg.scripts = {
  ...pkg.scripts,
  'dev:rapid': 'REACT_APP_RAPID_MODE=true npm start',
  'build:local': 'REACT_APP_BUILD_TARGET=local npm run build',
  'migrate': './migrate-component.sh',
  'template:feature': 'node scripts/create-feature.js',
  'analyze': 'source-map-explorer build/static/js/*.js'
};
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Package scripts updated"

# Create rapid development config
echo "⚡ Creating rapid development config..."
cat > .env.development << EOF
# Rapid Development Mode
REACT_APP_RAPID_MODE=true
REACT_APP_HOT_RELOAD=true
REACT_APP_SKIP_PREFLIGHT_CHECK=true

# Local First
REACT_APP_STORAGE_TYPE=local
REACT_APP_ENABLE_ENCRYPTION=true
REACT_APP_OFFLINE_FIRST=true

# Community Features
REACT_APP_ENABLE_TEMPLATES=true
REACT_APP_ENABLE_P2P=false
REACT_APP_ENABLE_EXPORT=true

# AI Local Only
REACT_APP_AI_PROVIDER=ollama
REACT_APP_OLLAMA_URL=http://localhost:11434
REACT_APP_AI_LOCAL_ONLY=true

# No Tracking
REACT_APP_ANALYTICS=false
REACT_APP_ERROR_REPORTING=false
REACT_APP_TELEMETRY=false
EOF

echo "✅ Development environment configured"

# Create a quick start component
echo "🎯 Creating QuickStart component..."
cat > src/components/QuickStart.tsx << 'EOF'
import React from 'react';
import { localFirstStorage } from '../infrastructure/storage/localFirstStorage';
import { templateService } from '../features/templates/templateService';

export const QuickStart: React.FC = () => {
  const [isSetup, setIsSetup] = React.useState(false);

  const quickSetup = async () => {
    // Initialize local storage
    await localFirstStorage.initializeEncryption('temp-password');
    
    // Load starter templates
    const templates = await templateService.loadCommunityTemplates();
    
    // Apply starter template
    const starterChores = templates.chores[0];
    
    // Save initial data
    await localFirstStorage.saveData({
      choreEntries: [],
      pointValues: starterChores.suggestedChores.reduce((acc, chore) => ({
        ...acc,
        [chore.name]: chore.points
      }), {}),
      assignments: [],
      events: [],
      familyMembers: [],
      files: [],
      lastUpdated: new Date().toISOString()
    });
    
    setIsSetup(true);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🚀 Quick Start</h1>
      <p className="mb-6">Get your family dashboard running in 30 seconds!</p>
      
      {!isSetup ? (
        <button
          onClick={quickSetup}
          className="bg-amber-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-amber-600"
        >
          Start with Templates
        </button>
      ) : (
        <div className="bg-green-100 p-4 rounded-lg">
          ✅ Ready to go! Your data is stored locally and encrypted.
        </div>
      )}
      
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Day 1 Features Available:</h2>
        <ul className="space-y-2">
          <li>✅ Local encrypted storage</li>
          <li>✅ Starter templates</li>
          <li>✅ Data export (JSON)</li>
          <li>✅ Offline-first operation</li>
          <li>🚧 P2P sync (coming Day 3)</li>
          <li>🚧 Community templates (coming Day 3)</li>
        </ul>
      </div>
    </div>
  );
};
EOF

echo "✅ QuickStart component created"

echo ""
echo "🎉 Day 1 Setup Complete!"
echo "========================"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev:rapid"
echo "2. Open: http://localhost:3000"
echo "3. Click 'Quick Start' to begin"
echo ""
echo "To migrate a component:"
echo "./migrate-component.sh ChoreList chores"
echo ""
echo "Remember: Ship in minutes, not hours!"
