/**
 * Family Dashboard Tools API Server
 * Simple Express server that handles tool execution requests
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3031;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, '../../family-data/family-data.json');

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default structure if file doesn't exist
    return {
      choreEntries: [],
      pointValues: {},
      assignments: [],
      events: [],
      familyMembers: [],
      files: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

// Helper function to write data
async function writeData(data) {
  const updatedData = {
    ...data,
    lastUpdated: new Date().toISOString()
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2));
  return updatedData;
}

// Tool definitions
const tools = {
  create_chore: {
    name: 'create_chore',
    description: 'Create a new chore for a family member',
    execute: async (params) => {
      const { choreName, assignedTo, points = 2, frequency = 'weekly' } = params;
      
      const data = await readData();
      
      // Add to point values if not exists
      if (!data.pointValues[choreName]) {
        data.pointValues[choreName] = points;
      }
      
      // Create chore entry
      const newEntry = {
        id: Date.now(),
        person: assignedTo,
        chore: choreName,
        timestamp: new Date().toLocaleString(),
        points: data.pointValues[choreName]
      };
      
      data.choreEntries.push(newEntry);
      
      // Add person to family members if not exists
      if (!data.familyMembers.includes(assignedTo)) {
        data.familyMembers.push(assignedTo);
      }
      
      const updatedData = await writeData(data);
      
      return {
        success: true,
        result: newEntry,
        stateUpdates: {
          choreEntries: updatedData.choreEntries,
          familyMembers: updatedData.familyMembers,
          pointValues: updatedData.pointValues
        }
      };
    }
  },
  
  create_calendar_event: {
    name: 'create_calendar_event',
    description: 'Add an event to the family calendar',
    execute: async (params) => {
      const { title, date, time, person, location } = params;
      
      const data = await readData();
      
      const newEvent = {
        id: Date.now(),
        title: title.trim(),
        date,
        time: time || '',
        person: person.trim(),
        location: location || '',
        timestamp: new Date().toLocaleString()
      };
      
      data.events.push(newEvent);
      
      // Add person to family members if not exists
      if (!data.familyMembers.includes(person.trim())) {
        data.familyMembers.push(person.trim());
      }
      
      const updatedData = await writeData(data);
      
      return {
        success: true,
        result: newEvent,
        stateUpdates: {
          events: updatedData.events,
          familyMembers: updatedData.familyMembers
        }
      };
    }
  },
  
  create_assignment: {
    name: 'create_assignment',
    description: 'Add a school assignment',
    execute: async (params) => {
      const { assignmentName, subject = 'General', dueDate, person, priority = 'medium' } = params;
      
      const data = await readData();
      
      const newAssignment = {
        id: Date.now(),
        name: assignmentName.trim(),
        subject: subject.trim(),
        dueDate,
        person: person.trim(),
        completed: false,
        priority,
        timestamp: new Date().toLocaleString()
      };
      
      data.assignments.push(newAssignment);
      
      // Add person to family members if not exists
      if (!data.familyMembers.includes(person.trim())) {
        data.familyMembers.push(person.trim());
      }
      
      const updatedData = await writeData(data);
      
      return {
        success: true,
        result: newAssignment,
        stateUpdates: {
          assignments: updatedData.assignments,
          familyMembers: updatedData.familyMembers
        }
      };
    }
  },
  
  add_family_member: {
    name: 'add_family_member',
    description: 'Add a new family member',
    execute: async (params) => {
      const { name, age, role = 'child' } = params;
      
      const data = await readData();
      
      if (!data.familyMembers.includes(name)) {
        data.familyMembers.push(name);
      }
      
      const updatedData = await writeData(data);
      
      return {
        success: true,
        result: { name, age, role },
        stateUpdates: {
          familyMembers: updatedData.familyMembers
        }
      };
    }
  }
};

// Load tools schema
const toolsSchema = require('./tools-schema.json');

// Routes
app.get('/api/tools/list', (req, res) => {
  const toolList = Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description
  }));
  res.json(toolList);
});

// Get tools schema for AI
app.get('/api/tools/schema', (req, res) => {
  res.json(toolsSchema);
});

app.post('/api/tools/execute', async (req, res) => {
  try {
    const { toolName, parameters } = req.body;
    
    if (!tools[toolName]) {
      return res.status(404).json({
        success: false,
        error: `Tool ${toolName} not found`
      });
    }
    
    const result = await tools[toolName].execute(parameters);
    res.json(result);
    
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only start server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Family Dashboard Tools API running on port ${PORT}`);
    console.log(`Available tools: ${Object.keys(tools).join(', ')}`);
  });
}

// Export for use in production server
module.exports = app;