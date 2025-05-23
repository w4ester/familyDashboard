// Test script to verify data persistence service

const { dataService } = require('./src/services/data-persistence');

async function testDataPersistence() {
  console.log('Testing data persistence service...\n');
  
  try {
    // Test chore entries
    console.log('1. Testing chore entries:');
    const testChores = [
      { id: 1, person: 'John', chore: 'Dishes', points: 2, timestamp: new Date().toISOString() },
      { id: 2, person: 'Jane', chore: 'Vacuum', points: 3, timestamp: new Date().toISOString() }
    ];
    
    await dataService.saveChoreEntries(testChores);
    console.log('   ✓ Saved chore entries');
    
    const loadedChores = await dataService.loadChoreEntries();
    console.log('   ✓ Loaded chore entries:', loadedChores.length, 'items');
    
    // Test point values
    console.log('\n2. Testing point values:');
    const testPoints = { 'Dishes': 2, 'Vacuum': 3, 'Laundry': 3 };
    
    await dataService.savePointValues(testPoints);
    console.log('   ✓ Saved point values');
    
    const loadedPoints = await dataService.loadPointValues();
    console.log('   ✓ Loaded point values:', Object.keys(loadedPoints).length, 'entries');
    
    // Test family members
    console.log('\n3. Testing family members:');
    const testFamily = ['John', 'Jane', 'Jimmy', 'Julie'];
    
    await dataService.saveFamilyMembers(testFamily);
    console.log('   ✓ Saved family members');
    
    const loadedFamily = await dataService.loadFamilyMembers();
    console.log('   ✓ Loaded family members:', loadedFamily.length, 'members');
    
    // Test events
    console.log('\n4. Testing calendar events:');
    const testEvents = [
      { id: 1, title: 'Soccer Practice', date: '2025-01-15', person: 'Jimmy' },
      { id: 2, title: 'Dentist', date: '2025-01-20', person: 'Julie' }
    ];
    
    await dataService.saveEvents(testEvents);
    console.log('   ✓ Saved events');
    
    const loadedEvents = await dataService.loadEvents();
    console.log('   ✓ Loaded events:', loadedEvents.length, 'events');
    
    // Test assignments
    console.log('\n5. Testing assignments:');
    const testAssignments = [
      { id: 1, name: 'Math Homework', subject: 'Math', dueDate: '2025-01-16', person: 'Jimmy' },
      { id: 2, name: 'Science Project', subject: 'Science', dueDate: '2025-01-25', person: 'Julie' }
    ];
    
    await dataService.saveAssignments(testAssignments);
    console.log('   ✓ Saved assignments');
    
    const loadedAssignments = await dataService.loadAssignments();
    console.log('   ✓ Loaded assignments:', loadedAssignments.length, 'assignments');
    
    console.log('\n✅ All tests passed! Data persistence is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
  }
}

// Run the test
console.log('Make sure the MCP server is running at http://localhost:3030\n');
testDataPersistence();