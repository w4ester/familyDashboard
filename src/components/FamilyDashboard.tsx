import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import SchoolPlatforms from './SchoolPlatforms';
import ChoreAssignments from './ChoreAssignments';
import { dataService } from '../services/data-persistence-mcp';
import { familyMemoryService } from '../services/family-memory';
import { ChoreCreationRequest } from '../services/ai-chore-toolkit';
import ActivityLogViewer from './ActivityLog';
import { activityLogger } from '../services/activity-logger';

interface FamilyDashboardProps {
  onPageChange?: (page: string) => void;
  onAIChoresCreated?: (chores: ChoreCreationRequest[]) => void;
}

const FamilyDashboard = forwardRef<any, FamilyDashboardProps>(({ onPageChange, onAIChoresCreated }, ref) => {
  // State for storing all chore entries
  const [choreEntries, setChoreEntries] = useState<any[]>([]);
  // States for form inputs
  const [personName, setPersonName] = useState('');
  const [choreName, setChoreName] = useState('');
  // State for point values
  const [pointValues, setPointValues] = useState<Record<string, number>>({});
  // State for new point value assignment
  const [newChoreType, setNewChoreType] = useState('');
  const [newPointValue, setNewPointValue] = useState(1);
  // State for showing admin panel
  const [showAdmin, setShowAdmin] = useState(false);
  
  // State for school assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentPerson, setAssignmentPerson] = useState('');
  
  // State for calendar events
  const [events, setEvents] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventPerson, setEventPerson] = useState('');
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('chores');
  
  // List of family members for selection
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [newFamilyMember, setNewFamilyMember] = useState('');
  
  // State to track if data has been loaded
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Load data from the data service when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data from the data service
        const savedEntries = await dataService.loadChoreEntries();
        const savedPointValues = await dataService.loadPointValues();
        const savedAssignments = await dataService.loadAssignments();
        const savedEvents = await dataService.loadEvents();
        const savedFamilyMembers = await dataService.loadFamilyMembers();
        
        // Only update state if we have saved data
        if (savedEntries) {
          setChoreEntries(savedEntries);
        }
        
        if (savedPointValues) {
          setPointValues(savedPointValues);
        } else {
          // Default point values if none exist
          const defaultValues = {
            'Dishes': 2,
            'Vacuum': 3,
            'Take out trash': 1,
            'Make bed': 1,
            'Laundry': 3,
            'Clean bathroom': 5
          };
          setPointValues(defaultValues);
          await dataService.savePointValues(defaultValues);
        }
        
        if (savedAssignments) {
          setAssignments(savedAssignments);
        }
        
        if (savedEvents) {
          setEvents(savedEvents);
        }
        
        if (savedFamilyMembers) {
          setFamilyMembers(savedFamilyMembers);
        }
        
        // Mark data as loaded after loading
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        // Still mark as loaded even on error to enable saving
        setDataLoaded(true);
      }
    };
    
    loadData();
    
    // Reload data every 2 seconds to catch external changes
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Expose the chore creation handler
  useEffect(() => {
    if (onPageChange) {
      onPageChange(activeTab);
    }
  }, [activeTab, onPageChange]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleAIChoreCreation
  }));
  
  // Save chore entries to server when they change (after initial load)
  useEffect(() => {
    if (dataLoaded && choreEntries.length >= 0) {
      dataService.saveChoreEntries(choreEntries).catch(console.error);
    }
  }, [choreEntries, dataLoaded]);
  
  // Save point values to server when they change (after initial load)
  useEffect(() => {
    if (dataLoaded && Object.keys(pointValues).length > 0) {
      dataService.savePointValues(pointValues).catch(console.error);
    }
  }, [pointValues, dataLoaded]);
  
  // Save assignments to server when they change (after initial load)
  useEffect(() => {
    if (dataLoaded && assignments.length >= 0) {
      dataService.saveAssignments(assignments).catch(console.error);
    }
  }, [assignments, dataLoaded]);
  
  // Save events to server when they change (after initial load)
  useEffect(() => {
    if (dataLoaded && events.length >= 0) {
      dataService.saveEvents(events).catch(console.error);
    }
  }, [events, dataLoaded]);
  
  // Save family members to server when they change (after initial load)
  useEffect(() => {
    if (dataLoaded && familyMembers.length >= 0) {
      dataService.saveFamilyMembers(familyMembers).catch(console.error);
    }
  }, [familyMembers, dataLoaded]);

  // Handle chore form submission with AI memory integration
  const handleChoreSubmit = async () => {
    if (personName.trim() === '' || choreName.trim() === '') {
      alert('Please enter both a name and a chore!');
      return;
    }
    
    // Get point value for this chore (default to 1 if not found)
    const pointValue = pointValues[choreName.trim()] || 1;
    
    // Create new entry with current timestamp
    const newEntry = {
      id: Date.now(),
      person: personName.trim(),
      chore: choreName.trim(),
      timestamp: new Date().toLocaleString(),
      points: pointValue
    };
    
    // Add the new entry to the list
    setChoreEntries([...choreEntries, newEntry]);
    
    // Log the manual chore creation
    activityLogger.logChoreAction(
      personName.trim(),
      `Completed chore "${choreName.trim()}"`,
      {
        choreName: choreName.trim(),
        points: pointValue,
        id: newEntry.id
      }
    );
    
    // Add person to family members if not already in the list
    if (!familyMembers.includes(personName.trim())) {
      setFamilyMembers([...familyMembers, personName.trim()]);
    }
    
    // 🚀 NEW: Learn from chore completion using AI memory
    try {
      await familyMemoryService.learnFromChoreCompletion(
        newEntry.id.toString(),
        personName.trim(),
        'default-family'
      );
      
      // Store additional memory about the achievement
      await familyMemoryService.storeMemory({
        content: `${personName.trim()} completed "${choreName.trim()}" and earned ${pointValue} points! 🎉`,
        category: 'chores',
        tags: ['completion', 'achievement', choreName.trim().toLowerCase()],
        relatedMembers: [personName.trim()],
        priority: pointValue >= 5 ? 'high' : 'medium'
      }, 'default-family', personName.trim());
      
    } catch (error) {
      console.error('Failed to store chore memory:', error);
    }
    
    // Clear the form
    setPersonName('');
    setChoreName('');
  };

  // Handle AI-created chores
  const handleAIChoreCreation = async (chores: ChoreCreationRequest[]) => {
    console.log('Received AI chores:', chores);
    
    for (const chore of chores) {
      // Add to point values if not exists
      if (chore.pointValue && !pointValues[chore.choreName]) {
        const updatedPointValues = {
          ...pointValues,
          [chore.choreName]: chore.pointValue
        };
        setPointValues(updatedPointValues);
        await dataService.savePointValues(updatedPointValues);
      }
      
      // Add chore entry if assigned to someone
      if (chore.assignedTo) {
        const newEntry = {
          id: Date.now() + Math.random(), // Unique ID
          person: chore.assignedTo,
          chore: chore.choreName,
          timestamp: new Date().toLocaleString(),
          points: chore.pointValue || pointValues[chore.choreName] || 1,
          frequency: chore.frequency || 'weekly',
          category: chore.category || 'other'
        };
        
        setChoreEntries(prev => [...prev, newEntry]);
        
        // Add to family members if needed
        if (!familyMembers.includes(chore.assignedTo)) {
          setFamilyMembers(prev => [...prev, chore.assignedTo!]);
        }
        
        // Store AI memory
        try {
          await familyMemoryService.storeMemory({
            content: `AI created chore "${chore.choreName}" for ${chore.assignedTo} worth ${chore.pointValue} points`,
            category: 'chores',
            tags: ['ai-created', 'setup', chore.category || 'general'],
            relatedMembers: [chore.assignedTo],
            priority: 'medium'
          }, 'default-family', 'AI Assistant');
        } catch (error) {
          console.error('Failed to store AI chore memory:', error);
        }
      }
    }
    
    // Notify parent component
    if (onAIChoresCreated) {
      onAIChoresCreated(chores);
    }
  };
  
  // Handle assignment form submission
  const handleAssignmentSubmit = () => {
    if (assignmentName.trim() === '' || assignmentPerson.trim() === '' || !assignmentDueDate) {
      alert('Please enter an assignment name, person, and due date!');
      return;
    }
    
    const newAssignment = {
      id: Date.now(),
      name: assignmentName.trim(),
      subject: assignmentSubject.trim(),
      dueDate: assignmentDueDate,
      person: assignmentPerson.trim(),
      completed: false,
      timestamp: new Date().toLocaleString()
    };
    
    setAssignments([...assignments, newAssignment]);
    
    // Add person to family members if not already in the list
    if (!familyMembers.includes(assignmentPerson.trim())) {
      setFamilyMembers([...familyMembers, assignmentPerson.trim()]);
    }
    
    // Clear the form
    setAssignmentName('');
    setAssignmentSubject('');
    setAssignmentDueDate('');
    setAssignmentPerson('');
  };
  
  // Handle event form submission
  const handleEventSubmit = () => {
    if (eventTitle.trim() === '' || !eventDate || eventPerson.trim() === '') {
      alert('Please enter an event title, date, and person!');
      return;
    }
    
    const newEvent = {
      id: Date.now(),
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime,
      person: eventPerson.trim(),
      timestamp: new Date().toLocaleString()
    };
    
    setEvents([...events, newEvent]);
    
    // Add person to family members if not already in the list
    if (!familyMembers.includes(eventPerson.trim())) {
      setFamilyMembers([...familyMembers, eventPerson.trim()]);
    }
    
    // Clear the form
    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventPerson('');
  };
  
  // Add a new chore point value
  const addPointValue = () => {
    if (newChoreType.trim() === '' || newPointValue < 1) {
      alert('Please enter a valid chore name and point value!');
      return;
    }
    
    // Add or update the point value
    setPointValues({
      ...pointValues,
      [newChoreType.trim()]: parseInt(newPointValue.toString())
    });
    
    // Clear the form
    setNewChoreType('');
    setNewPointValue(1);
  };
  
  // Remove a chore point value
  const removePointValue = (choreKey: string) => {
    const newPointValues = {...pointValues};
    delete newPointValues[choreKey];
    setPointValues(newPointValues);
  };
  
  // Add a new family member
  const addFamilyMember = () => {
    if (newFamilyMember.trim() === '') {
      return;
    }
    
    if (!familyMembers.includes(newFamilyMember.trim())) {
      setFamilyMembers([...familyMembers, newFamilyMember.trim()]);
      setNewFamilyMember('');
    } else {
      alert('This family member already exists!');
    }
  };
  
  // Delete a family member
  const deleteFamilyMember = (member: string) => {
    if (window.confirm(`Are you sure you want to remove ${member} from the family list?`)) {
      setFamilyMembers(familyMembers.filter(m => m !== member));
    }
  };
  
  // Toggle assignment completion status
  const toggleAssignmentComplete = (id: number) => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === id) {
        return { ...assignment, completed: !assignment.completed };
      }
      return assignment;
    });
    
    setAssignments(updatedAssignments);
  };
  
  // Delete an assignment
  const deleteAssignment = (id: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(assignments.filter(assignment => assignment.id !== id));
    }
  };
  
  // Delete an event
  const deleteEvent = (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(event => event.id !== id));
    }
  };

  // Delete a chore entry
  const deleteChoreEntry = (id: number) => {
    if (window.confirm('Are you sure you want to delete this chore entry?')) {
      setChoreEntries(choreEntries.filter(entry => entry.id !== id));
    }
  };

  // Reset all data
  const resetData = () => {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      setChoreEntries([]);
      setAssignments([]);
      setEvents([]);
    }
  };

  // Calculate chore scores for each person and chore combination
  const calculateScores = () => {
    const scores: Record<string, any> = {};
    
    choreEntries.forEach(entry => {
      const key = `${entry.person}-${entry.chore}`;
      
      if (!scores[key]) {
        scores[key] = {
          person: entry.person,
          chore: entry.chore,
          count: 0,
          totalPoints: 0
        };
      }
      
      scores[key].count += 1;
      scores[key].totalPoints += (entry.points || 1);
    });
    
    return Object.values(scores);
  };
  
  // Calculate total points per person
  const calculateTotalPoints = () => {
    const personPoints: Record<string, number> = {};
    
    choreEntries.forEach(entry => {
      const person = entry.person;
      
      if (!personPoints[person]) {
        personPoints[person] = 0;
      }
      
      personPoints[person] += (entry.points || 1);
    });
    
    return Object.entries(personPoints)
      .map(([person, points]) => ({ person, points }))
      .sort((a, b) => b.points - a.points); // Sort by points (highest first)
  };
  
  // Get upcoming events for a person or all
  const getUpcomingEvents = (person: string | null = null) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to beginning of day
    
    return events
      .filter(event => {
        // Filter by person if specified
        if (person && event.person !== person) {
          return false;
        }
        
        // Filter to only show upcoming events
        const eventDate = new Date(event.date);
        return eventDate >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
  };
  
  // Get pending assignments for a person or all
  const getPendingAssignments = (person: string | null = null) => {
    return assignments
      .filter(assignment => {
        // Filter by person if specified
        if (person && assignment.person !== person) {
          return false;
        }
        
        // Filter to only show incomplete assignments
        return !assignment.completed;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Sort by due date
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Check if an assignment is overdue
  const isOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < now;
  };
  
  // Render the admin panel
  const renderAdminPanel = () => {
    return (
      <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
        <h2 className="text-lg font-semibold mb-2">Admin: Chore Point Values</h2>
        
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Chore Name"
            value={newChoreType}
            onChange={(e) => setNewChoreType(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <input
            type="number"
            min="1"
            placeholder="Points"
            value={newPointValue}
            onChange={(e) => setNewPointValue(parseInt(e.target.value) || 1)}
            className="w-20 p-2 border rounded"
          />
          <button 
            onClick={addPointValue} 
            className="bg-amber-500 text-white py-2 px-4 rounded hover:bg-amber-600"
          >
            Set Points
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.entries(pointValues).map(([chore, points], index) => (
            <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
              <div>
                <span className="font-medium">{chore}</span>
                <span className="ml-2 text-amber-700">{points} pts</span>
              </div>
              <button 
                onClick={() => removePointValue(chore)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        {Object.keys(pointValues).length === 0 && (
          <p className="text-gray-500 italic">No point values defined yet!</p>
        )}
      </div>
    );
  };
  
  // Render family management tab
  const renderFamilyTab = () => {
    return (
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Manage Family Members</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Add New Family Member"
            value={newFamilyMember}
            onChange={(e) => setNewFamilyMember(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button 
            onClick={addFamilyMember} 
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Add
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Current Family Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {familyMembers.map((member, index) => (
              <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                <span className="font-medium">{member}</span>
                <button 
                  onClick={() => deleteFamilyMember(member)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {familyMembers.length === 0 && (
            <p className="text-gray-500 italic">No family members defined yet!</p>
          )}
        </div>
      </div>
    );
  };
  
  // Render chores tab
  const renderChoresTab = () => {
    return (
      <>
        {/* Add new chore form */}
        <div className="bg-orange-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">Add New Chore</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="flex-1 p-2 border rounded"
            >
              <option value="">-- Select Person --</option>
              {familyMembers.map((member, index) => (
                <option key={index} value={member}>{member}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Chore"
              value={choreName}
              onChange={(e) => setChoreName(e.target.value)}
              list="chore-suggestions"
              className="flex-1 p-2 border rounded"
            />
            <datalist id="chore-suggestions">
              {Object.keys(pointValues).map((chore, index) => (
                <option key={index} value={chore} />
              ))}
            </datalist>
            <button 
              onClick={handleChoreSubmit} 
              className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
            >
              Add Entry
            </button>
          </div>
          {choreName && pointValues[choreName] && (
            <div className="mt-2 text-orange-700">
              This chore is worth <strong>{pointValues[choreName]} points</strong>!
            </div>
          )}
        </div>

        {/* Points Leaderboard */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Points Leaderboard</h2>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            {calculateTotalPoints().map((entry, index) => (
              <div key={index} className="flex items-center mb-2 last:mb-0">
                <div className="w-8 h-8 flex items-center justify-center bg-yellow-100 rounded-full mr-3 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 font-medium">{entry.person}</div>
                <div className="text-yellow-800 font-bold">{entry.points} points</div>
              </div>
            ))}
            
            {calculateTotalPoints().length === 0 && (
              <p className="text-gray-500 italic">No chores completed yet!</p>
            )}
          </div>
        </div>

        {/* Chore Details */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Chore Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calculateScores().map((score, index) => (
              <div key={index} className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium">{score.person} - {score.chore}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center">
                    <div className="mr-2">Count: {score.count}</div>
                    <div className="text-green-700">
                      {'★'.repeat(Math.min(score.count, 5))}
                    </div>
                  </div>
                  <div className="font-bold text-green-800">{score.totalPoints} pts</div>
                </div>
              </div>
            ))}
          </div>
          {calculateScores().length === 0 && (
            <p className="text-gray-500 italic">No chores completed yet!</p>
          )}
        </div>

        {/* Chore History */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Chore History</h2>
            {choreEntries.length > 0 && (
              <button 
                onClick={resetData}
                className="bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600"
              >
                Reset All Data
              </button>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg">
            {choreEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Chore</th>
                      <th className="p-3">Points</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...choreEntries].reverse().map(entry => (
                      <tr key={entry.id} className="border-b">
                        <td className="p-3">{entry.person}</td>
                        <td className="p-3">{entry.chore}</td>
                        <td className="p-3 font-bold text-orange-700">{entry.points || 1}</td>
                        <td className="p-3 text-sm">{entry.timestamp}</td>
                        <td className="p-3">
                          <button 
                            onClick={() => deleteChoreEntry(entry.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-4 text-gray-500 italic">No history yet. Add your first chore above!</p>
            )}
          </div>
        </div>
      </>
    );
  };
  
  // Render assignments tab
  const renderAssignmentsTab = () => {
    return (
      <>
        {/* Add new assignment form */}
        <div className="bg-rose-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">Add New School Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student</label>
              <select
                value={assignmentPerson}
                onChange={(e) => setAssignmentPerson(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Student --</option>
                {familyMembers.map((member, index) => (
                  <option key={index} value={member}>{member}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                placeholder="Math, Science, English..."
                value={assignmentSubject}
                onChange={(e) => setAssignmentSubject(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignment Name</label>
              <input
                type="text"
                placeholder="Homework, Project, Essay..."
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={assignmentDueDate}
                onChange={(e) => setAssignmentDueDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button 
            onClick={handleAssignmentSubmit} 
            className="bg-rose-500 text-white py-2 px-4 rounded hover:bg-rose-600"
          >
            Add Assignment
          </button>
        </div>

        {/* Assignments List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">School Assignments</h2>
          
          {/* Filter by student */}
          <div className="mb-4">
            <select
              onChange={(e) => setActiveTab(e.target.value ? `assignments-${e.target.value}` : 'assignments')}
              className="p-2 border rounded"
              value={activeTab.startsWith('assignments-') ? activeTab.replace('assignments-', '') : ''}
            >
              <option value="">All Students</option>
              {familyMembers.map((member, index) => (
                <option key={index} value={member}>{member}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-4">
            {/* Overdue Assignments */}
            <div>
              <h3 className="font-medium text-red-600 mb-2">Overdue</h3>
              <div className="divide-y border rounded overflow-hidden">
                {getPendingAssignments(activeTab.startsWith('assignments-') ? activeTab.replace('assignments-', '') : null)
                  .filter(a => isOverdue(a.dueDate))
                  .map(assignment => (
                    <div key={assignment.id} className="p-3 bg-red-50 flex items-start">
                      <input
                        type="checkbox"
                        checked={assignment.completed}
                        onChange={() => toggleAssignmentComplete(assignment.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{assignment.name}</div>
                        <div className="text-sm">
                          <span className="text-gray-600">{assignment.subject} • {assignment.person}</span>
                          <span className="ml-2 text-red-600 font-medium">Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteAssignment(assignment.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                }
                {getPendingAssignments(activeTab.startsWith('assignments-') ? activeTab.replace('assignments-', '') : null)
                  .filter(a => isOverdue(a.dueDate)).length === 0 && (
                  <p className="p-3 text-gray-500 italic">No overdue assignments!</p>
                )}
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div>
              <h3 className="font-medium text-green-600 mb-2">Upcoming</h3>
              <div className="divide-y border rounded overflow-hidden">
                {getPendingAssignments(activeTab.startsWith('assignments-') ? activeTab.replace('assignments-', '') : null)
                  .filter(a => !isOverdue(a.dueDate))
                  .map(assignment => (
                    <div key={assignment.id} className="p-3 bg-white flex items-start">
                      <input
                        type="checkbox"
                        checked={assignment.completed}
                        onChange={() => toggleAssignmentComplete(assignment.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{assignment.name}</div>
                        <div className="text-sm">
                          <span className="text-gray-600">{assignment.subject} • {assignment.person}</span>
                          <span className="ml-2 text-green-600">Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteAssignment(assignment.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                }
                {getPendingAssignments(activeTab.startsWith('assignments-') ? activeTab.replace('assignments-', '') : null)
                  .filter(a => !isOverdue(a.dueDate)).length === 0 && (
                  <p className="p-3 text-gray-500 italic">No upcoming assignments!</p>
                )}
              </div>
            </div>

            {/* Completed Assignments */}
            <div>
              <h3 className="font-medium text-gray-600 mb-2">Completed</h3>
              <div className="divide-y border rounded overflow-hidden">
                {assignments
                  .filter(a => {
                    // Filter by person if active tab contains a name
                    if (activeTab.startsWith('assignments-') && 
                        a.person !== activeTab.replace('assignments-', '')) {
                      return false;
                    }
                    return a.completed;
                  })
                  .map(assignment => (
                    <div key={assignment.id} className="p-3 bg-gray-50 flex items-start">
                      <input
                        type="checkbox"
                        checked={assignment.completed}
                        onChange={() => toggleAssignmentComplete(assignment.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium line-through text-gray-500">{assignment.name}</div>
                        <div className="text-sm text-gray-500">
                          <span>{assignment.subject} • {assignment.person}</span>
                          <span className="ml-2">Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteAssignment(assignment.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                }
                {assignments
                  .filter(a => {
                    if (activeTab.startsWith('assignments-') && 
                        a.person !== activeTab.replace('assignments-', '')) {
                      return false;
                    }
                    return a.completed;
                  }).length === 0 && (
                  <p className="p-3 text-gray-500 italic">No completed assignments!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Render calendar tab
  const renderCalendarTab = () => {
    return (
      <>
        {/* Add new event form */}
        <div className="bg-amber-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">Add New Calendar Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Person</label>
              <select
                value={eventPerson}
                onChange={(e) => setEventPerson(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Person --</option>
                {familyMembers.map((member, index) => (
                  <option key={index} value={member}>{member}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Event Title</label>
              <input
                type="text"
                placeholder="Soccer practice, Dentist, etc."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time (Optional)</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button 
            onClick={handleEventSubmit} 
            className="bg-amber-500 text-white py-2 px-4 rounded hover:bg-amber-600"
          >
            Add to Calendar
          </button>
        </div>

        {/* Calendar Events List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            
            {/* Filter by person */}
            <select
              onChange={(e) => setActiveTab(e.target.value ? `calendar-${e.target.value}` : 'calendar')}
              className="p-2 border rounded"
              value={activeTab.startsWith('calendar-') ? activeTab.replace('calendar-', '') : ''}
            >
              <option value="">All Family Members</option>
              {familyMembers.map((member, index) => (
                <option key={index} value={member}>{member}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-4">
            {/* Group events by month and date */}
            {(() => {
              const upcomingEvents = getUpcomingEvents(
                activeTab.startsWith('calendar-') ? activeTab.replace('calendar-', '') : null
              );
              
              if (upcomingEvents.length === 0) {
                return <p className="text-gray-500 italic">No upcoming events scheduled!</p>;
              }
              
              // Group events by month
              const eventsByMonth: Record<string, any[]> = {};
              upcomingEvents.forEach(event => {
                const date = new Date(event.date);
                const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                if (!eventsByMonth[monthKey]) {
                  eventsByMonth[monthKey] = [];
                }
                
                eventsByMonth[monthKey].push(event);
              });
              
              return Object.entries(eventsByMonth).map(([month, monthEvents]) => (
                <div key={month} className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">{month}</h3>
                  
                  <div className="divide-y border rounded overflow-hidden">
                    {monthEvents.map(event => {
                      const eventDate = new Date(event.date);
                      const formattedDate = eventDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        day: 'numeric' 
                      });
                      
                      return (
                        <div key={event.id} className="p-3 bg-white flex items-start hover:bg-gray-50">
                          <div className="text-center mr-4 min-w-14">
                            <div className="font-bold text-amber-700">{formattedDate}</div>
                            {event.time && (
                              <div className="text-xs text-gray-500 mt-1">{event.time}</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-600">
                              {event.person}
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteEvent(event.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </>
    );
  };

  // Main render function
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-center">Family Dashboard</h1>
        <button 
          onClick={() => setShowAdmin(!showAdmin)}
          className="bg-amber-500 text-white py-1 px-3 rounded text-sm hover:bg-amber-600"
        >
          {showAdmin ? 'Hide Admin' : 'Show Admin'}
        </button>
      </div>
      
      {/* Admin panel for point values */}
      {showAdmin && renderAdminPanel()}
      
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab === 'chore-assignments' ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('chore-assignments');
            onPageChange && onPageChange('chore-assignments');
          }}
        >
          Chore Jobs
        </button>
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab === 'chores' ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('chores');
            onPageChange && onPageChange('chores');
          }}
        >
          Points History
        </button>
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab.startsWith('assignments') ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('assignments');
            onPageChange && onPageChange('assignments');
          }}
        >
          School Assignments
        </button>
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab === 'platforms' ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('platforms');
            onPageChange && onPageChange('platforms');
          }}
        >
          School Platforms
        </button>
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab.startsWith('calendar') ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('calendar');
            onPageChange && onPageChange('calendar');
          }}
        >
          Calendar
        </button>
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab === 'family' ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('family');
            onPageChange && onPageChange('family');
          }}
        >
          Family
        </button>
        <button
          className={`py-2 px-4 whitespace-nowrap ${activeTab === 'mcp' ? 'border-b-2 border-amber-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => {
            setActiveTab('mcp');
            onPageChange && onPageChange('mcp');
          }}
        >
          MCP Services
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'family' && renderFamilyTab()}
      {activeTab === 'chore-assignments' && (
        <ChoreAssignments 
          familyMembers={familyMembers}
          onPointsAwarded={(person, points) => {
            // Add to chore entries when points are awarded
            const newEntry = {
              id: Date.now(),
              person,
              chore: 'Verified Chore Completion',
              timestamp: new Date().toLocaleString(),
              points
            };
            setChoreEntries([...choreEntries, newEntry]);
          }}
        />
      )}
      {activeTab === 'chores' && renderChoresTab()}
      {activeTab.startsWith('assignments') && renderAssignmentsTab()}
      {activeTab === 'platforms' && <SchoolPlatforms familyMembers={familyMembers} />}
      {activeTab.startsWith('calendar') && renderCalendarTab()}
      
      {/* Activity Log Viewer */}
      <ActivityLogViewer />
    </div>
  );
});

export default FamilyDashboard;