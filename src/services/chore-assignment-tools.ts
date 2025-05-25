/**
 * Chore Assignment Tools - Create assignments, not instant completions
 */

import { toolRegistry } from './tool-registry';
import { ChoreAssignment } from '../types/chore-types';

// Register chore assignment tool
export function registerChoreAssignmentTools() {
  
  // Create Chore Assignment (not completion!)
  toolRegistry.register({
    name: 'assign_chore',
    description: 'Assign a chore to a family member (they must complete it to earn points)',
    parameters: {
      type: 'object',
      properties: {
        choreName: {
          type: 'string',
          description: 'Name of the chore to assign'
        },
        assignedTo: {
          type: 'string',
          description: 'Family member to assign the chore to'
        },
        pointValue: {
          type: 'number',
          description: 'Points available when completed (1-10)',
          minimum: 1,
          maximum: 10
        },
        dueDate: {
          type: 'string',
          description: 'Optional due date (YYYY-MM-DD)'
        }
      },
      required: ['choreName', 'assignedTo']
    },
    execute: async (params) => {
      const { choreName, assignedTo, pointValue = 2, dueDate } = params;
      
      // Create assignment (not completion)
      const assignment: ChoreAssignment = {
        id: Date.now().toString(),
        choreId: Date.now().toString(),
        choreName: choreName.trim(),
        assignedTo: assignedTo.trim(),
        assignedBy: 'AI Assistant',
        assignedDate: new Date().toISOString(),
        dueDate: dueDate || undefined,
        status: 'assigned',
        pointValue: pointValue,
        pointsEarned: 0, // No points until verified!
      };
      
      // Get existing assignments
      const existingStr = localStorage.getItem('chore-assignments');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      
      // Add new assignment
      const updated = [...existing, assignment];
      localStorage.setItem('chore-assignments', JSON.stringify(updated));
      
      return {
        assignment,
        message: `Assigned "${choreName}" to ${assignedTo} (${pointValue} points available when completed)`
      };
    }
  });
  
  // List assigned chores
  toolRegistry.register({
    name: 'list_assigned_chores',
    description: 'List all assigned chores for a person or everyone',
    parameters: {
      type: 'object',
      properties: {
        person: {
          type: 'string',
          description: 'Filter by person (optional)'
        },
        status: {
          type: 'string',
          enum: ['all', 'assigned', 'pending_review', 'completed'],
          description: 'Filter by status'
        }
      }
    },
    execute: async (params) => {
      const { person, status = 'assigned' } = params;
      
      const assignmentsStr = localStorage.getItem('chore-assignments');
      const assignments: ChoreAssignment[] = assignmentsStr ? JSON.parse(assignmentsStr) : [];
      
      let filtered = assignments;
      
      if (person) {
        filtered = filtered.filter(a => a.assignedTo === person);
      }
      
      if (status !== 'all') {
        filtered = filtered.filter(a => a.status === status);
      }
      
      return {
        assignments: filtered,
        count: filtered.length,
        totalPointsAvailable: filtered
          .filter(a => a.status !== 'completed')
          .reduce((sum, a) => sum + a.pointValue, 0)
      };
    }
  });
  
  // Create weekly chore schedule
  toolRegistry.register({
    name: 'create_chore_week',
    description: 'Create a week of chore assignments for the family',
    parameters: {
      type: 'object',
      properties: {
        assignments: {
          type: 'array',
          description: 'Array of chore assignments',
          items: {
            type: 'object',
            properties: {
              choreName: { type: 'string' },
              assignedTo: { type: 'string' },
              pointValue: { type: 'number' },
              dueDate: { type: 'string' }
            }
          }
        }
      },
      required: ['assignments']
    },
    execute: async (params) => {
      const { assignments } = params;
      
      const createdAssignments: ChoreAssignment[] = [];
      
      for (const item of assignments) {
        const assignment: ChoreAssignment = {
          id: Date.now().toString() + Math.random(),
          choreId: Date.now().toString(),
          choreName: item.choreName,
          assignedTo: item.assignedTo,
          assignedBy: 'AI Assistant',
          assignedDate: new Date().toISOString(),
          dueDate: item.dueDate || undefined,
          status: 'assigned',
          pointValue: item.pointValue || 2,
          pointsEarned: 0,
        };
        createdAssignments.push(assignment);
      }
      
      // Get existing and add new
      const existingStr = localStorage.getItem('chore-assignments');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [...existing, ...createdAssignments];
      localStorage.setItem('chore-assignments', JSON.stringify(updated));
      
      return {
        created: createdAssignments.length,
        totalPoints: createdAssignments.reduce((sum, a) => sum + a.pointValue, 0),
        message: `Created ${createdAssignments.length} chore assignments for the week`
      };
    }
  });
  
  console.log('Chore assignment tools registered');
}