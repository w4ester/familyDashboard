// Enhanced Family Memory Models - Pierup Integration
import { ID, Timestamp, Identifiable, Timestamped } from './index';

export interface FamilyMemory extends Identifiable, Timestamped {
  familyId: string;
  content: string;
  category: 'general' | 'school' | 'chores' | 'milestones' | 'health' | 'activities' | 'preferences';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  privacy: 'family' | 'parents-only' | 'individual';
  relatedMembers: string[];
  createdBy: string;
  embeddings?: number[]; // For AI similarity search
  context?: Record<string, any>; // Additional context data
  isActive: boolean;
  confidence: number; // AI confidence in this memory (0-1)
}

export interface FamilyKnowledge extends Identifiable, Timestamped {
  familyId: string;
  type: 'preference' | 'routine' | 'milestone' | 'lesson-learned' | 'skill' | 'interest';
  subject: string;
  content: string;
  confidence: number; // How certain we are about this knowledge
  lastValidated: Timestamp;
  sources: string[]; // Which interactions contributed to this
  relatedMembers: string[];
  tags: string[];
}

export interface FamilyContext {
  familyId: string;
  currentMembers: string[];
  activePreferences: FamilyKnowledge[];
  recentMemories: FamilyMemory[];
  learningContext: EducationalContext;
  routineContext: RoutineContext;
}

export interface EducationalContext {
  activeSubjects: string[];
  learningStyles: Record<string, 'visual' | 'auditory' | 'kinesthetic' | 'reading'>;
  currentChallenges: string[];
  strengths: string[];
  upcomingDeadlines: any[];
}

export interface RoutineContext {
  dailyPatterns: Record<string, string[]>; // time -> activities
  weeklyPatterns: Record<string, string[]>; // day -> activities  
  preferences: Record<string, any>; // member preferences
  conflicts: string[]; // scheduling conflicts
}

export interface FamilyInsight extends Identifiable, Timestamped {
  familyId: string;
  type: 'pattern' | 'suggestion' | 'milestone' | 'concern' | 'celebration';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions?: string[];
  relatedMembers: string[];
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface AIConversation extends Identifiable, Timestamped {
  familyId: string;
  userId: string;
  messages: AIMessage[];
  context: FamilyContext;
  topic: string;
  status: 'active' | 'resolved' | 'archived';
  learnings: FamilyKnowledge[]; // What AI learned from this conversation
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  familyContext?: Partial<FamilyContext>;
  metadata?: {
    tool?: string;
    confidence?: number;
    sources?: FamilyMemory[];
    relatedKnowledge?: FamilyKnowledge[];
  };
}

// Builder for creating family memories
export class FamilyMemoryBuilder {
  private memory: Partial<FamilyMemory> = {
    tags: [],
    priority: 'medium',
    privacy: 'family',
    relatedMembers: [],
    isActive: true,
    confidence: 1.0
  };

  withContent(content: string): this {
    this.memory.content = content;
    return this;
  }

  withCategory(category: FamilyMemory['category']): this {
    this.memory.category = category;
    return this;
  }

  withTags(...tags: string[]): this {
    this.memory.tags = [...(this.memory.tags || []), ...tags];
    return this;
  }

  withPriority(priority: FamilyMemory['priority']): this {
    this.memory.priority = priority;
    return this;
  }

  withPrivacy(privacy: FamilyMemory['privacy']): this {
    this.memory.privacy = privacy;
    return this;
  }

  forMembers(...memberIds: string[]): this {
    this.memory.relatedMembers = memberIds;
    return this;
  }

  withConfidence(confidence: number): this {
    this.memory.confidence = Math.max(0, Math.min(1, confidence));
    return this;
  }

  build(familyId: string, createdBy: string): FamilyMemory {
    const now = new Date().toISOString();
    return {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      familyId,
      createdBy,
      createdAt: now,
      updatedAt: now,
      content: this.memory.content || '',
      category: this.memory.category || 'general',
      tags: this.memory.tags || [],
      priority: this.memory.priority!,
      privacy: this.memory.privacy!,
      relatedMembers: this.memory.relatedMembers!,
      isActive: this.memory.isActive!,
      confidence: this.memory.confidence!
    };
  }
}

// Helper functions for family memory management
export const FamilyMemoryHelpers = {
  // Create memory from chore completion
  fromChoreCompletion: (chore: any, member: string, familyId: string) => {
    return new FamilyMemoryBuilder()
      .withContent(`${member} completed chore: ${chore.name}`)
      .withCategory('chores')
      .withTags('chore', 'completion', chore.name.toLowerCase())
      .forMembers(member)
      .withPriority('low')
      .build(familyId, member);
  },

  // Create memory from school assignment
  fromAssignment: (assignment: any, student: string, familyId: string) => {
    return new FamilyMemoryBuilder()
      .withContent(`${student} working on ${assignment.subject}: ${assignment.title}`)
      .withCategory('school')
      .withTags('homework', assignment.subject.toLowerCase(), 'education')
      .forMembers(student)
      .withPriority('medium')
      .build(familyId, student);
  },

  // Create memory from family milestone
  fromMilestone: (event: string, members: string[], familyId: string, createdBy: string) => {
    return new FamilyMemoryBuilder()
      .withContent(event)
      .withCategory('milestones')
      .withTags('milestone', 'celebration', 'family')
      .forMembers(...members)
      .withPriority('high')
      .withPrivacy('family')
      .build(familyId, createdBy);
  }
};