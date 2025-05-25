import React, { useState, useEffect } from 'react';
import { ChoreDefinition, ChoreAssignment, ChoreWeek, GameReward } from '../types/chore-types';
import { activityLogger } from '../services/activity-logger';
import { gameRewardService } from './GameRewardManager';

interface ChoreAssignmentsProps {
  familyMembers: string[];
  currentUser?: string;
  onPointsAwarded?: (person: string, points: number) => void;
}

export default function ChoreAssignments({ 
  familyMembers, 
  currentUser = 'Parent',
  onPointsAwarded 
}: ChoreAssignmentsProps) {
  // Chore definitions (templates)
  const [choreDefinitions, setChoreDefinitions] = useState<ChoreDefinition[]>([
    { id: '1', name: 'Wash Dishes', pointValue: 3, category: 'Kitchen', frequency: 'daily' },
    { id: '2', name: 'Take Out Trash', pointValue: 2, category: 'General', frequency: 'daily' },
    { id: '3', name: 'Clean Room', pointValue: 5, category: 'Bedroom', frequency: 'weekly' },
    { id: '4', name: 'Vacuum Living Room', pointValue: 4, category: 'Living Areas', frequency: 'weekly' },
    { id: '5', name: 'Feed Pets', pointValue: 2, category: 'Pets', frequency: 'daily' },
    { id: '6', name: 'Laundry', pointValue: 4, category: 'Laundry', frequency: 'weekly' },
    { id: '7', name: 'Mow Lawn', pointValue: 8, category: 'Outdoor', frequency: 'weekly' },
    { id: '8', name: 'Clean Bathroom', pointValue: 6, category: 'Bathroom', frequency: 'weekly' }
  ]);

  const [assignments, setAssignments] = useState<ChoreAssignment[]>([]);
  const [selectedChore, setSelectedChore] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'all' | 'assigned' | 'pending' | 'completed'>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);
  // New reward states
  const [rewardType, setRewardType] = useState<'points' | 'game-time' | 'both'>('points');
  const [gameSessions, setGameSessions] = useState<number>(1);

  // Load saved assignments
  useEffect(() => {
    const loadAssignments = () => {
      const saved = localStorage.getItem('chore-assignments');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only update if data actually changed
          setAssignments(prev => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(parsed);
            if (hasChanged) {
              console.log('ChoreAssignments: Loading', parsed.length, 'assignments from storage');
            }
            return hasChanged ? parsed : prev;
          });
        } catch (e) {
          console.error('ChoreAssignments: Error parsing saved data', e);
        }
      }
    };
    
    // Initial load
    loadAssignments();
    setIsInitialized(true);
    
    // Reload periodically to catch external changes
    const interval = setInterval(loadAssignments, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save assignments (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('chore-assignments', JSON.stringify(assignments));
    }
  }, [assignments, isInitialized]);

  // Create assignment (not completion!)
  const createAssignment = () => {
    if (!selectedChore || !selectedPerson) {
      alert('Please select a chore and person');
      return;
    }

    const choreDef = choreDefinitions.find(c => c.id === selectedChore);
    if (!choreDef) return;

    const gameReward: GameReward | undefined = 
      (rewardType === 'game-time' || rewardType === 'both') 
        ? {
            gameType: 'any',
            sessions: gameSessions,
            familyPlayRequired: true
          }
        : undefined;

    const newAssignment: ChoreAssignment = {
      id: Date.now().toString(),
      choreId: choreDef.id,
      choreName: choreDef.name,
      assignedTo: selectedPerson,
      assignedBy: currentUser,
      assignedDate: new Date().toISOString(),
      dueDate: dueDate || undefined,
      status: 'assigned',
      pointValue: rewardType === 'game-time' ? 0 : choreDef.pointValue,
      pointsEarned: 0, // No points until verified!
      rewardType,
      gameReward
    };

    setAssignments([...assignments, newAssignment]);

    // Log the assignment
    let rewardText = '';
    if (rewardType === 'points') {
      rewardText = `${choreDef.pointValue} points`;
    } else if (rewardType === 'game-time') {
      rewardText = `${gameSessions} game session(s)`;
    } else {
      rewardText = `${choreDef.pointValue} points + ${gameSessions} game session(s)`;
    }
    
    activityLogger.log({
      user: currentUser,
      action: `Assigned chore "${choreDef.name}" to ${selectedPerson} (Reward: ${rewardText})`,
      category: 'chore',
      result: 'success',
      details: newAssignment
    });

    // Reset form
    setSelectedChore('');
    setSelectedPerson('');
    setDueDate('');
  };

  // Kid marks chore as complete
  const markComplete = (assignmentId: string) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignmentId) {
        const updated = {
          ...a,
          status: 'pending_review' as const,
          completedDate: new Date().toISOString()
        };

        activityLogger.log({
          user: a.assignedTo,
          action: `Marked "${a.choreName}" as complete (pending verification)`,
          category: 'chore',
          result: 'success',
          details: { assignmentId, choreName: a.choreName }
        });

        return updated;
      }
      return a;
    }));
  };

  // Parent verifies and awards points
  const verifyComplete = (assignmentId: string, approved: boolean) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignmentId) {
        if (approved) {
          const updated = {
            ...a,
            status: 'completed' as const,
            pointsEarned: a.pointValue,
            verifiedBy: currentUser,
            verifiedDate: new Date().toISOString()
          };

          // Award points
          if (onPointsAwarded && a.pointValue > 0) {
            onPointsAwarded(a.assignedTo, a.pointValue);
          }
          
          // Award game rewards
          if (a.gameReward) {
            gameRewardService.addReward(a.assignedTo, updated);
          }

          // Log with appropriate reward text
          let rewardText = '';
          if (a.rewardType === 'points') {
            rewardText = `${a.pointValue} points`;
          } else if (a.rewardType === 'game-time') {
            rewardText = `${a.gameReward?.sessions || 0} game session(s)`;
          } else if (a.rewardType === 'both') {
            rewardText = `${a.pointValue} points + ${a.gameReward?.sessions || 0} game session(s)`;
          }

          activityLogger.log({
            user: currentUser,
            action: `Verified "${a.choreName}" - ${a.assignedTo} earned ${rewardText}!`,
            category: 'points',
            result: 'success',
            details: { assignmentId, choreName: a.choreName, reward: rewardText, rewardType: a.rewardType }
          });

          return updated;
        } else {
          // Rejected - back to assigned
          const updated = {
            ...a,
            status: 'assigned' as const,
            completedDate: undefined
          };

          activityLogger.log({
            user: currentUser,
            action: `Rejected "${a.choreName}" completion - needs to be redone`,
            category: 'chore',
            result: 'error',
            details: { assignmentId, choreName: a.choreName }
          });

          return updated;
        }
      }
      return a;
    }));
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    if (personFilter !== 'all' && a.assignedTo !== personFilter) return false;
    
    switch (viewFilter) {
      case 'assigned':
        return a.status === 'assigned' || a.status === 'in_progress';
      case 'pending':
        return a.status === 'pending_review';
      case 'completed':
        return a.status === 'completed';
      default:
        return true;
    }
  });

  // Get status color
  const getStatusColor = (status: ChoreAssignment['status']) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending_review': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Assignment Form */}
      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Assign New Chore</h3>
        <div className="space-y-3">
          {/* First row - basic assignment */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select 
              value={selectedChore}
              onChange={(e) => setSelectedChore(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Select Chore</option>
              {choreDefinitions.map(chore => (
                <option key={chore.id} value={chore.id}>
                  {chore.name} ({chore.pointValue} pts)
                </option>
              ))}
            </select>

            <select 
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Assign To</option>
              {familyMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="p-2 border rounded"
              placeholder="Due Date (optional)"
            />

            <button
              onClick={createAssignment}
              className="bg-amber-500 text-white p-2 rounded hover:bg-amber-600"
            >
              Assign Chore
            </button>
          </div>
          
          {/* Second row - reward settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div>
              <label className="text-sm font-medium mr-2">Reward Type:</label>
              <select 
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as any)}
                className="p-2 border rounded"
              >
                <option value="points">Points Only</option>
                <option value="game-time">Game Time Only 🎮</option>
                <option value="both">Points + Game Time 🎉</option>
              </select>
            </div>
            
            {(rewardType === 'game-time' || rewardType === 'both') && (
              <div>
                <label className="text-sm font-medium mr-2">Game Sessions:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={gameSessions}
                  onChange={(e) => setGameSessions(parseInt(e.target.value) || 1)}
                  className="w-20 p-2 border rounded"
                />
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              {rewardType === 'game-time' && '🎮 Complete task to earn family game time!'}
              {rewardType === 'both' && '🎉 Best of both - points AND game time!'}
              {rewardType === 'points' && '💰 Traditional points reward'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select 
          value={viewFilter}
          onChange={(e) => setViewFilter(e.target.value as any)}
          className="p-2 border rounded"
        >
          <option value="all">All Chores</option>
          <option value="assigned">To Do</option>
          <option value="pending">Needs Verification</option>
          <option value="completed">Completed</option>
        </select>

        <select 
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All People</option>
          {familyMembers.map(member => (
            <option key={member} value={member}>{member}</option>
          ))}
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-2">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mb-2">
            Total assignments: {assignments.length} | Filtered: {filteredAssignments.length}
          </div>
        )}
        
        {filteredAssignments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No chores found</p>
        ) : (
          filteredAssignments.map(assignment => (
            <div key={assignment.id} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{assignment.choreName}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    Assigned to: <span className="font-medium">{assignment.assignedTo}</span>
                    {assignment.dueDate && (
                      <span> • Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(assignment.status)}`}>
                      {assignment.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm">
                      {assignment.status === 'completed' ? (
                        <>
                          {assignment.pointsEarned > 0 && `✅ ${assignment.pointsEarned} points earned! `}
                          {assignment.gameReward && `🎮 ${assignment.gameReward.sessions} game session(s) earned!`}
                        </>
                      ) : (
                        <>
                          {assignment.pointValue > 0 && `🎯 ${assignment.pointValue} points available `}
                          {assignment.gameReward && `🎮 ${assignment.gameReward.sessions} game session(s) available`}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {assignment.status === 'assigned' && (
                    <button
                      onClick={() => markComplete(assignment.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Mark Done
                    </button>
                  )}

                  {assignment.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => verifyComplete(assignment.id, true)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        ✓ Verify
                      </button>
                      <button
                        onClick={() => verifyComplete(assignment.id, false)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}

                  {assignment.status === 'completed' && assignment.verifiedBy && (
                    <span className="text-sm text-green-600">
                      ✓ Verified by {assignment.verifiedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Chore Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Assigned</div>
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.status === 'assigned').length}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Pending Review</div>
            <div className="text-2xl font-bold text-orange-600">
              {assignments.filter(a => a.status === 'pending_review').length}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Points Available</div>
            <div className="text-2xl font-bold text-purple-600">
              {assignments
                .filter(a => a.status !== 'completed')
                .reduce((sum, a) => sum + a.pointValue, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}