// Family Memory Service - Pierup Integration
import { EventEmitter } from 'events';
import { 
  FamilyMemory, 
  FamilyKnowledge, 
  FamilyContext, 
  FamilyInsight,
  AIConversation,
  FamilyMemoryBuilder,
  FamilyMemoryHelpers
} from '../core/models/family-memory';
import { dataService } from './data-persistence-mcp';

export interface MemorySearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  memberIds?: string[];
  dateRange?: { start: Date; end: Date };
  limit?: number;
  includeEmbeddings?: boolean;
}

export interface FamilyAnalytics {
  totalMemories: number;
  categoriesBreakdown: Record<string, number>;
  memberActivity: Record<string, number>;
  recentTrends: string[];
  suggestedActions: string[];
}

export class FamilyMemoryService extends EventEmitter {
  private static instance: FamilyMemoryService;
  private memoryCache = new Map<string, FamilyMemory[]>();
  private knowledgeCache = new Map<string, FamilyKnowledge[]>();

  private constructor() {
    super();
  }

  static getInstance(): FamilyMemoryService {
    if (!FamilyMemoryService.instance) {
      FamilyMemoryService.instance = new FamilyMemoryService();
    }
    return FamilyMemoryService.instance;
  }

  // Core Memory Operations
  async storeMemory(memory: Partial<FamilyMemory>, familyId: string, createdBy: string): Promise<FamilyMemory> {
    const fullMemory = new FamilyMemoryBuilder()
      .withContent(memory.content || '')
      .withCategory(memory.category || 'general')
      .withTags(...(memory.tags || []))
      .withPriority(memory.priority || 'medium')
      .withPrivacy(memory.privacy || 'family')
      .forMembers(...(memory.relatedMembers || []))
      .withConfidence(memory.confidence || 1.0)
      .build(familyId, createdBy);

    // Store in persistent storage
    await this.persistMemory(fullMemory);
    
    // Update cache
    this.updateMemoryCache(familyId, fullMemory);
    
    // Extract knowledge if applicable
    await this.extractKnowledge(fullMemory);
    
    this.emit('memoryStored', fullMemory);
    return fullMemory;
  }

  async searchMemories(familyId: string, options: MemorySearchOptions = {}): Promise<FamilyMemory[]> {
    let memories = await this.getMemoriesForFamily(familyId);

    // Apply filters
    if (options.category) {
      memories = memories.filter(m => m.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      memories = memories.filter(m => 
        options.tags!.some(tag => m.tags.includes(tag))
      );
    }

    if (options.memberIds && options.memberIds.length > 0) {
      memories = memories.filter(m => 
        options.memberIds!.some(id => m.relatedMembers.includes(id))
      );
    }

    if (options.dateRange) {
      const { start, end } = options.dateRange;
      memories = memories.filter(m => {
        const created = new Date(m.createdAt);
        return created >= start && created <= end;
      });
    }

    // Text search if query provided
    if (options.query) {
      const query = options.query.toLowerCase();
      memories = memories.filter(m => 
        m.content.toLowerCase().includes(query) ||
        m.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Limit results
    if (options.limit) {
      memories = memories.slice(0, options.limit);
    }

    return memories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getFamilyContext(familyId: string, memberId?: string): Promise<FamilyContext> {
    const recentMemories = await this.searchMemories(familyId, { 
      limit: 50,
      memberIds: memberId ? [memberId] : undefined
    });

    const knowledge = await this.getKnowledgeForFamily(familyId);
    const activePreferences = knowledge.filter(k => k.type === 'preference');

    return {
      familyId,
      currentMembers: await this.getFamilyMembers(familyId),
      activePreferences,
      recentMemories,
      learningContext: await this.buildEducationalContext(familyId, memberId),
      routineContext: await this.buildRoutineContext(familyId, memberId)
    };
  }

  // Knowledge Extraction and Learning
  async extractKnowledge(memory: FamilyMemory): Promise<FamilyKnowledge[]> {
    const extracted: FamilyKnowledge[] = [];

    // Extract preferences from chore completions
    if (memory.category === 'chores' && memory.tags.includes('completion')) {
      const preference = await this.extractChorePreference(memory);
      if (preference) extracted.push(preference);
    }

    // Extract learning patterns from school activities
    if (memory.category === 'school') {
      const learningPattern = await this.extractLearningPattern(memory);
      if (learningPattern) extracted.push(learningPattern);
    }

    // Store extracted knowledge
    for (const knowledge of extracted) {
      await this.storeKnowledge(knowledge);
    }

    return extracted;
  }

  async generateInsights(familyId: string): Promise<FamilyInsight[]> {
    const insights: FamilyInsight[] = [];
    const memories = await this.getMemoriesForFamily(familyId);
    const knowledge = await this.getKnowledgeForFamily(familyId);

    // Analyze patterns
    insights.push(...await this.analyzeChorePatterns(memories, familyId));
    insights.push(...await this.analyzeEducationalProgress(memories, familyId));
    insights.push(...await this.analyzeFamilyDynamics(memories, knowledge, familyId));

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  // AI Conversation Integration
  async storeConversation(conversation: Partial<AIConversation>): Promise<AIConversation> {
    const fullConversation: AIConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      familyId: conversation.familyId!,
      userId: conversation.userId!,
      messages: conversation.messages || [],
      context: conversation.context!,
      topic: conversation.topic || 'General',
      status: 'active',
      learnings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.persistConversation(fullConversation);
    this.emit('conversationStored', fullConversation);
    return fullConversation;
  }

  // Quick Helper Methods for Common Operations
  async learnFromChoreCompletion(choreId: string, memberId: string, familyId: string): Promise<void> {
    const chore = await this.getChoreById(choreId);
    if (!chore) return;

    const memory = FamilyMemoryHelpers.fromChoreCompletion(chore, memberId, familyId);
    await this.storeMemory(memory, familyId, memberId);
  }

  async learnFromAssignmentWork(assignmentId: string, studentId: string, familyId: string): Promise<void> {
    const assignment = await this.getAssignmentById(assignmentId);
    if (!assignment) return;

    const memory = FamilyMemoryHelpers.fromAssignment(assignment, studentId, familyId);
    await this.storeMemory(memory, familyId, studentId);
  }

  async celebrateMilestone(event: string, memberIds: string[], familyId: string, createdBy: string): Promise<void> {
    const memory = FamilyMemoryHelpers.fromMilestone(event, memberIds, familyId, createdBy);
    await this.storeMemory(memory, familyId, createdBy);
    
    // Generate celebration insight
    const insight: Partial<FamilyInsight> = {
      familyId,
      type: 'celebration',
      title: 'Family Milestone Achieved! 🎉',
      description: event,
      confidence: 1.0,
      actionable: true,
      suggestedActions: ['Share with extended family', 'Add to family photo album', 'Plan celebration'],
      relatedMembers: memberIds,
      priority: 'high',
      category: 'milestones'
    };

    this.emit('milestoneAchieved', { memory, insight });
  }

  // Private Helper Methods
  private async persistMemory(memory: FamilyMemory): Promise<void> {
    // Integration with your existing data persistence
    const entries = await dataService.loadChoreEntries(); // Reuse existing storage
    const memoryEntry = {
      id: memory.id,
      type: 'memory',
      data: memory,
      timestamp: memory.createdAt
    };
    
    entries.push(memoryEntry);
    await dataService.saveChoreEntries(entries);
  }

  private async persistConversation(conversation: AIConversation): Promise<void> {
    // Store conversation in persistent storage
    const conversations = await this.getStoredConversations();
    conversations.push(conversation);
    await this.saveConversations(conversations);
  }

  private async getMemoriesForFamily(familyId: string): Promise<FamilyMemory[]> {
    if (this.memoryCache.has(familyId)) {
      return this.memoryCache.get(familyId)!;
    }

    // Load from storage
    const entries = await dataService.loadChoreEntries();
    const memories = entries
      .filter((entry: any) => entry.type === 'memory' && entry.data.familyId === familyId)
      .map((entry: any) => entry.data as FamilyMemory);

    this.memoryCache.set(familyId, memories);
    return memories;
  }

  private updateMemoryCache(familyId: string, memory: FamilyMemory): void {
    const existing = this.memoryCache.get(familyId) || [];
    existing.push(memory);
    this.memoryCache.set(familyId, existing);
  }

  private async extractChorePreference(memory: FamilyMemory): Promise<FamilyKnowledge | null> {
    // Extract chore preferences based on completion patterns
    // This would use more sophisticated analysis in practice
    return null; // Placeholder
  }

  private async extractLearningPattern(memory: FamilyMemory): Promise<FamilyKnowledge | null> {
    // Extract learning patterns from educational interactions
    return null; // Placeholder
  }

  private async analyzeChorePatterns(memories: FamilyMemory[], familyId: string): Promise<FamilyInsight[]> {
    // Analyze chore completion patterns
    return []; // Placeholder
  }

  private async analyzeEducationalProgress(memories: FamilyMemory[], familyId: string): Promise<FamilyInsight[]> {
    // Analyze educational progress
    return []; // Placeholder
  }

  private async analyzeFamilyDynamics(memories: FamilyMemory[], knowledge: FamilyKnowledge[], familyId: string): Promise<FamilyInsight[]> {
    // Analyze family interaction patterns
    return []; // Placeholder
  }

  // Integration with existing services
  private async getChoreById(choreId: string): Promise<any> {
    const entries = await dataService.loadChoreEntries();
    return entries.find(entry => entry.id === choreId);
  }

  private async getAssignmentById(assignmentId: string): Promise<any> {
    // Integration with assignment data
    return null; // Placeholder
  }

  private async getFamilyMembers(familyId: string): Promise<string[]> {
    // Get current family members
    const savedMembers = localStorage.getItem('familyMembers');
    return savedMembers ? JSON.parse(savedMembers) : [];
  }

  private async buildEducationalContext(familyId: string, memberId?: string): Promise<any> {
    // Build educational context from memories
    return {
      activeSubjects: [],
      learningStyles: {},
      currentChallenges: [],
      strengths: [],
      upcomingDeadlines: []
    };
  }

  private async buildRoutineContext(familyId: string, memberId?: string): Promise<any> {
    // Build routine context from memories
    return {
      dailyPatterns: {},
      weeklyPatterns: {},
      preferences: {},
      conflicts: []
    };
  }

  private async getKnowledgeForFamily(familyId: string): Promise<FamilyKnowledge[]> {
    // Get stored knowledge for family
    return [];
  }

  private async storeKnowledge(knowledge: FamilyKnowledge): Promise<void> {
    // Store extracted knowledge
  }

  private async getStoredConversations(): Promise<AIConversation[]> {
    // Get stored conversations
    return [];
  }

  private async saveConversations(conversations: AIConversation[]): Promise<void> {
    // Save conversations
  }
}

export const familyMemoryService = FamilyMemoryService.getInstance();