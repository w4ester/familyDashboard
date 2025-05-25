/**
 * Family Dashboard Tools - Tool implementations that work directly with React state
 */

import { toolRegistry } from './tool-registry';
import { dataService } from './data-persistence-mcp';
import { activityLogger } from './activity-logger';

// Register all family dashboard tools
export function registerFamilyTools() {
  
  // Create Chore Tool
  toolRegistry.register({
    name: 'create_chore',
    description: 'Create a new chore for a family member',
    parameters: {
      type: 'object',
      properties: {
        choreName: {
          type: 'string',
          description: 'Name of the chore'
        },
        assignedTo: {
          type: 'string',
          description: 'Family member to assign the chore to'
        },
        points: {
          type: 'number',
          description: 'Point value (1-10)',
          minimum: 1,
          maximum: 10
        }
      },
      required: ['choreName', 'assignedTo']
    },
    execute: async (params) => {
      const { choreName, assignedTo, points = 2 } = params;
      
      // Load current data
      const data = await dataService.loadData();
      
      // Update point values
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
      
      // Add to entries
      data.choreEntries.push(newEntry);
      
      // Add person if new
      if (!data.familyMembers.includes(assignedTo)) {
        data.familyMembers.push(assignedTo);
      }
      
      // Save all data
      await dataService.saveData(data);
      
      // Log the action
      activityLogger.logChoreAction(
        'System',
        `Created chore "${choreName}"`,
        {
          choreName,
          assignedTo,
          points,
          id: newEntry.id
        }
      );
      
      return {
        entry: newEntry,
        message: `Created chore "${choreName}" for ${assignedTo} (${points} points)`
      };
    }
  });
  
  // Create Calendar Event Tool
  toolRegistry.register({
    name: 'create_event',
    description: 'Add an event to the family calendar',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title'
        },
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD)'
        },
        time: {
          type: 'string',
          description: 'Time (HH:MM)'
        },
        person: {
          type: 'string',
          description: 'Person this event is for'
        }
      },
      required: ['title', 'date', 'person']
    },
    execute: async (params) => {
      const { title, date, time, person } = params;
      
      const data = await dataService.loadData();
      
      const newEvent = {
        id: Date.now(),
        title,
        date,
        time: time || '',
        person,
        timestamp: new Date().toLocaleString()
      };
      
      data.events.push(newEvent);
      
      if (!data.familyMembers.includes(person)) {
        data.familyMembers.push(person);
      }
      
      await dataService.saveData(data);
      
      return {
        event: newEvent,
        message: `Added event "${title}" for ${person} on ${date}`
      };
    }
  });
  
  // Create Assignment Tool
  toolRegistry.register({
    name: 'create_assignment',
    description: 'Add a school assignment',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Assignment name'
        },
        subject: {
          type: 'string',
          description: 'Subject'
        },
        dueDate: {
          type: 'string',
          description: 'Due date (YYYY-MM-DD)'
        },
        person: {
          type: 'string',
          description: 'Student name'
        }
      },
      required: ['name', 'dueDate', 'person']
    },
    execute: async (params) => {
      const { name, subject = 'General', dueDate, person } = params;
      
      const data = await dataService.loadData();
      
      const newAssignment = {
        id: Date.now(),
        name,
        subject,
        dueDate,
        person,
        completed: false,
        timestamp: new Date().toLocaleString()
      };
      
      data.assignments.push(newAssignment);
      
      if (!data.familyMembers.includes(person)) {
        data.familyMembers.push(person);
      }
      
      await dataService.saveData(data);
      
      return {
        assignment: newAssignment,
        message: `Created assignment "${name}" for ${person} due ${dueDate}`
      };
    }
  });
  
  // Edit Chore Tool
  toolRegistry.register({
    name: 'edit_chore',
    description: 'Edit an existing chore assignment',
    parameters: {
      type: 'object',
      properties: {
        assignmentId: {
          type: 'string',
          description: 'ID of the chore assignment to edit'
        },
        choreName: {
          type: 'string',
          description: 'New chore name (optional)'
        },
        assignedTo: {
          type: 'string',
          description: 'New person to assign to (optional)'
        },
        pointValue: {
          type: 'number',
          description: 'New point value (optional)'
        },
        dueDate: {
          type: 'string',
          description: 'New due date (optional)'
        }
      },
      required: ['assignmentId']
    },
    execute: async (params) => {
      const { assignmentId, choreName, assignedTo, pointValue, dueDate } = params;
      
      const assignmentsStr = localStorage.getItem('chore-assignments');
      const assignments = assignmentsStr ? JSON.parse(assignmentsStr) : [];
      
      const index = assignments.findIndex((a: any) => a.id === assignmentId);
      if (index === -1) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      
      const updated = { ...assignments[index] };
      if (choreName) updated.choreName = choreName;
      if (assignedTo) updated.assignedTo = assignedTo;
      if (pointValue) updated.pointValue = pointValue;
      if (dueDate) updated.dueDate = dueDate;
      
      assignments[index] = updated;
      localStorage.setItem('chore-assignments', JSON.stringify(assignments));
      
      return {
        assignment: updated,
        message: `Updated chore assignment ${assignmentId}`
      };
    }
  });
  
  // Delete Chore Tool
  toolRegistry.register({
    name: 'delete_chore',
    description: 'Delete a chore assignment',
    parameters: {
      type: 'object',
      properties: {
        assignmentId: {
          type: 'string',
          description: 'ID of the chore assignment to delete'
        }
      },
      required: ['assignmentId']
    },
    execute: async (params) => {
      const { assignmentId } = params;
      
      const assignmentsStr = localStorage.getItem('chore-assignments');
      const assignments = assignmentsStr ? JSON.parse(assignmentsStr) : [];
      
      const filtered = assignments.filter((a: any) => a.id !== assignmentId);
      if (filtered.length === assignments.length) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      
      localStorage.setItem('chore-assignments', JSON.stringify(filtered));
      
      return {
        message: `Deleted chore assignment ${assignmentId}`
      };
    }
  });
  
  // Mark Chore Complete Tool
  toolRegistry.register({
    name: 'mark_chore_complete',
    description: 'Mark a chore as completed (pending parent review)',
    parameters: {
      type: 'object',
      properties: {
        assignmentId: {
          type: 'string',
          description: 'ID of the chore assignment'
        },
        notes: {
          type: 'string',
          description: 'Optional completion notes'
        }
      },
      required: ['assignmentId']
    },
    execute: async (params) => {
      const { assignmentId, notes } = params;
      
      const assignmentsStr = localStorage.getItem('chore-assignments');
      const assignments = assignmentsStr ? JSON.parse(assignmentsStr) : [];
      
      const index = assignments.findIndex((a: any) => a.id === assignmentId);
      if (index === -1) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      
      assignments[index].status = 'pending_review';
      assignments[index].completedDate = new Date().toISOString();
      if (notes) assignments[index].notes = notes;
      
      localStorage.setItem('chore-assignments', JSON.stringify(assignments));
      
      return {
        assignment: assignments[index],
        message: `Marked "${assignments[index].choreName}" as complete - waiting for parent approval`
      };
    }
  });
  
  // Verify Chore Tool
  toolRegistry.register({
    name: 'verify_chore',
    description: 'Parent verifies and awards points for completed chore',
    parameters: {
      type: 'object',
      properties: {
        assignmentId: {
          type: 'string',
          description: 'ID of the chore assignment'
        },
        approved: {
          type: 'boolean',
          description: 'Whether to approve and award points'
        },
        verifiedBy: {
          type: 'string',
          description: 'Parent who is verifying'
        }
      },
      required: ['assignmentId', 'approved', 'verifiedBy']
    },
    execute: async (params) => {
      const { assignmentId, approved, verifiedBy } = params;
      
      const assignmentsStr = localStorage.getItem('chore-assignments');
      const assignments = assignmentsStr ? JSON.parse(assignmentsStr) : [];
      
      const index = assignments.findIndex((a: any) => a.id === assignmentId);
      if (index === -1) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      
      const assignment = assignments[index];
      
      if (approved) {
        assignment.status = 'completed';
        assignment.pointsEarned = assignment.pointValue;
        assignment.verifiedBy = verifiedBy;
        assignment.verifiedDate = new Date().toISOString();
        
        // Award points
        const data = await dataService.loadData();
        const newEntry = {
          id: Date.now(),
          person: assignment.assignedTo,
          chore: assignment.choreName,
          timestamp: new Date().toLocaleString(),
          points: assignment.pointValue
        };
        data.choreEntries.push(newEntry);
        await dataService.saveData(data);
      } else {
        assignment.status = 'incomplete';
        assignment.verifiedBy = verifiedBy;
        assignment.verifiedDate = new Date().toISOString();
      }
      
      assignments[index] = assignment;
      localStorage.setItem('chore-assignments', JSON.stringify(assignments));
      
      return {
        assignment,
        message: approved 
          ? `Approved! ${assignment.assignedTo} earned ${assignment.pointValue} points for "${assignment.choreName}"`
          : `Chore "${assignment.choreName}" marked incomplete - needs to be redone`
      };
    }
  });
  
  // Edit Event Tool
  toolRegistry.register({
    name: 'edit_event',
    description: 'Edit an existing calendar event',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'number',
          description: 'ID of the event to edit'
        },
        title: {
          type: 'string',
          description: 'New title (optional)'
        },
        date: {
          type: 'string',
          description: 'New date (optional)'
        },
        time: {
          type: 'string',
          description: 'New time (optional)'
        },
        person: {
          type: 'string',
          description: 'New person (optional)'
        }
      },
      required: ['eventId']
    },
    execute: async (params) => {
      const { eventId, title, date, time, person } = params;
      
      const data = await dataService.loadData();
      const index = data.events.findIndex(e => e.id === eventId);
      
      if (index === -1) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      if (title) data.events[index].title = title;
      if (date) data.events[index].date = date;
      if (time !== undefined) data.events[index].time = time;
      if (person) data.events[index].person = person;
      
      await dataService.saveData(data);
      
      return {
        event: data.events[index],
        message: `Updated event ${eventId}`
      };
    }
  });
  
  // Delete Event Tool
  toolRegistry.register({
    name: 'delete_event',
    description: 'Delete a calendar event',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'number',
          description: 'ID of the event to delete'
        }
      },
      required: ['eventId']
    },
    execute: async (params) => {
      const { eventId } = params;
      
      const data = await dataService.loadData();
      const index = data.events.findIndex(e => e.id === eventId);
      
      if (index === -1) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      data.events.splice(index, 1);
      await dataService.saveData(data);
      
      return {
        message: `Deleted event ${eventId}`
      };
    }
  });
  
  // Edit Assignment Tool
  toolRegistry.register({
    name: 'edit_assignment',
    description: 'Edit a school assignment',
    parameters: {
      type: 'object',
      properties: {
        assignmentId: {
          type: 'number',
          description: 'ID of the assignment to edit'
        },
        name: {
          type: 'string',
          description: 'New name (optional)'
        },
        subject: {
          type: 'string',
          description: 'New subject (optional)'
        },
        dueDate: {
          type: 'string',
          description: 'New due date (optional)'
        },
        completed: {
          type: 'boolean',
          description: 'Mark as completed (optional)'
        }
      },
      required: ['assignmentId']
    },
    execute: async (params) => {
      const { assignmentId, name, subject, dueDate, completed } = params;
      
      const data = await dataService.loadData();
      const index = data.assignments.findIndex(a => a.id === assignmentId);
      
      if (index === -1) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      
      if (name) data.assignments[index].name = name;
      if (subject) data.assignments[index].subject = subject;
      if (dueDate) data.assignments[index].dueDate = dueDate;
      if (completed !== undefined) data.assignments[index].completed = completed;
      
      await dataService.saveData(data);
      
      return {
        assignment: data.assignments[index],
        message: `Updated assignment ${assignmentId}`
      };
    }
  });
  
  // Delete Assignment Tool
  toolRegistry.register({
    name: 'delete_assignment',
    description: 'Delete a school assignment',
    parameters: {
      type: 'object',
      properties: {
        assignmentId: {
          type: 'number',
          description: 'ID of the assignment to delete'
        }
      },
      required: ['assignmentId']
    },
    execute: async (params) => {
      const { assignmentId } = params;
      
      const data = await dataService.loadData();
      const index = data.assignments.findIndex(a => a.id === assignmentId);
      
      if (index === -1) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      
      data.assignments.splice(index, 1);
      await dataService.saveData(data);
      
      return {
        message: `Deleted assignment ${assignmentId}`
      };
    }
  });
  
  // Add Family Member Tool
  toolRegistry.register({
    name: 'add_family_member',
    description: 'Add a new family member',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the family member'
        },
        role: {
          type: 'string',
          description: 'Role (parent or child)',
          enum: ['parent', 'child']
        }
      },
      required: ['name', 'role']
    },
    execute: async (params) => {
      const { name, role } = params;
      
      const data = await dataService.loadData();
      
      if (data.familyMembers.includes(name)) {
        throw new Error(`${name} is already a family member`);
      }
      
      data.familyMembers.push(name);
      
      // Store role information
      if (!data.familyRoles) data.familyRoles = {};
      data.familyRoles[name] = role;
      
      await dataService.saveData(data);
      
      return {
        message: `Added ${name} as a ${role}`
      };
    }
  });
  
  // List Everything Tool
  toolRegistry.register({
    name: 'list_all',
    description: 'List all data in the dashboard',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category to list (optional)',
          enum: ['chores', 'events', 'assignments', 'members', 'all']
        }
      }
    },
    execute: async (params) => {
      const { category = 'all' } = params;
      
      const data = await dataService.loadData();
      const assignmentsStr = localStorage.getItem('chore-assignments');
      const choreAssignments = assignmentsStr ? JSON.parse(assignmentsStr) : [];
      
      const result: any = {};
      
      if (category === 'all' || category === 'members') {
        result.familyMembers = data.familyMembers;
      }
      
      if (category === 'all' || category === 'chores') {
        result.choreAssignments = choreAssignments;
        result.choreHistory = data.choreEntries;
      }
      
      if (category === 'all' || category === 'events') {
        result.events = data.events;
      }
      
      if (category === 'all' || category === 'assignments') {
        result.assignments = data.assignments;
      }
      
      return result;
    }
  });
  
  // Get Points Summary Tool
  toolRegistry.register({
    name: 'get_points_summary',
    description: 'Get points summary for all family members',
    parameters: {
      type: 'object',
      properties: {
        person: {
          type: 'string',
          description: 'Filter by person (optional)'
        }
      }
    },
    execute: async (params) => {
      const { person } = params;
      
      const data = await dataService.loadData();
      
      const pointTotals: { [key: string]: number } = {};
      
      // Calculate points from completed chores in choreEntries
      data.choreEntries.forEach(entry => {
        if (!person || entry.person === person) {
          pointTotals[entry.person] = (pointTotals[entry.person] || 0) + (entry.points || 0);
        }
      });
      
      // Also check chore assignments for verified chores
      const assignmentsStr = localStorage.getItem('chore-assignments');
      if (assignmentsStr) {
        const assignments = JSON.parse(assignmentsStr);
        assignments.forEach((assignment: any) => {
          // Only count points from completed/verified assignments
          if (assignment.status === 'completed' && assignment.pointsEarned > 0) {
            if (!person || assignment.assignedTo === person) {
              pointTotals[assignment.assignedTo] = (pointTotals[assignment.assignedTo] || 0) + assignment.pointsEarned;
            }
          }
        });
      }
      
      return {
        pointTotals,
        totalPoints: Object.values(pointTotals).reduce((sum, points) => sum + points, 0)
      };
    }
  });
  
  console.log('Family dashboard tools registered:', toolRegistry.getToolNames());
}