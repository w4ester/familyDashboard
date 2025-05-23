// Core domain models for Family Dashboard

export interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child' | 'other';
  birthDate?: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chore {
  id: string;
  name: string;
  description?: string;
  assignedTo?: string;
  completedBy?: string;
  points: number;
  dueDate?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
  };
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChoreEntry {
  id: string;
  choreId: string;
  personId: string;
  personName: string;
  choreName: string;
  points: number;
  completedAt: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description?: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  attendees: string[];
  location?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    until?: string;
  };
  reminder?: {
    type: 'email' | 'notification';
    minutesBefore: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointCost: number;
  available: boolean;
  imageUrl?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  personId: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  choreId?: string;
  rewardId?: string;
  balance: number;
  createdAt: string;
}

export interface MealPlan {
  id: string;
  weekStartDate: string;
  meals: {
    [day: string]: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snacks?: string[];
    };
  };
  shoppingList?: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category: string;
  purchased: boolean;
  addedBy?: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  context?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tool?: string;
    confidence?: number;
    sources?: string[];
  };
}

export interface FileEntry {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  category?: string;
  tags?: string[];
  uploadedBy: string;
  sharedWith?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Utility types
export type ID = string;
export type Timestamp = string;

// Common interfaces
export interface Timestamped {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Identifiable {
  id: ID;
}

// Builder patterns for complex objects
export class ChoreBuilder {
  private chore: Partial<Chore> = {};

  withName(name: string): this {
    this.chore.name = name;
    return this;
  }

  withPoints(points: number): this {
    this.chore.points = points;
    return this;
  }

  withAssignment(personId: string): this {
    this.chore.assignedTo = personId;
    return this;
  }

  withRecurrence(frequency: 'daily' | 'weekly' | 'monthly', daysOfWeek?: number[]): this {
    this.chore.recurring = { frequency, daysOfWeek };
    return this;
  }

  build(): Chore {
    const now = new Date().toISOString();
    return {
      id: Date.now().toString(),
      name: this.chore.name || '',
      points: this.chore.points || 1,
      completed: false,
      createdAt: now,
      updatedAt: now,
      ...this.chore
    } as Chore;
  }
}
