// Chore type definitions for the assignment system

export interface ChoreDefinition {
  id: string;
  name: string;
  description?: string;
  pointValue: number;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'once';
  estimatedTime?: number; // minutes
}

export interface ChoreAssignment {
  id: string;
  choreId: string;
  choreName: string;
  assignedTo: string;
  assignedBy: string;
  assignedDate: string;
  dueDate?: string;
  status: 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'incomplete';
  pointValue: number;
  pointsEarned: number; // 0 until verified
  completedDate?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
  photoProof?: string;
}

export interface ChoreWeek {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  assignments: ChoreAssignment[];
  createdBy: string;
  createdDate: string;
}

export interface ChoreHistory {
  id: string;
  choreAssignmentId: string;
  action: 'assigned' | 'started' | 'completed' | 'verified' | 'rejected';
  actionBy: string;
  actionDate: string;
  notes?: string;
}