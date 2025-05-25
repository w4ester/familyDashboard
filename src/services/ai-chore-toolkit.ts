import { ollamaService } from './ollama-service';

export interface ChoreCreationRequest {
  choreName: string;
  assignedTo?: string;
  pointValue?: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'one-time';
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: 'cleaning' | 'cooking' | 'yard-work' | 'pet-care' | 'organization' | 'other';
}

export interface ChoreCreationResponse {
  chores: ChoreCreationRequest[];
  explanation: string;
  suggestions?: string[];
}

export class AIChoreToolkit {
  private static instance: AIChoreToolkit;
  
  public static getInstance(): AIChoreToolkit {
    if (!AIChoreToolkit.instance) {
      AIChoreToolkit.instance = new AIChoreToolkit();
    }
    return AIChoreToolkit.instance;
  }

  /**
   * Parse natural language chore creation requests
   */
  async createChoresFromText(
    userInput: string, 
    familyMembers: string[] = [],
    existingChores: any[] = [],
    selectedModel: string = 'llama3.1:latest'
  ): Promise<ChoreCreationResponse> {
    try {
      const systemPrompt = this.buildChoreCreationPrompt(familyMembers, existingChores);
      
      const response = await ollamaService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ], { model: selectedModel, temperature: 0.7 });

      return this.parseChoreResponse(response);
    } catch (error) {
      console.error('AI chore creation failed:', error);
      return this.fallbackChoreCreation(userInput);
    }
  }

  /**
   * Suggest intelligent point values based on chore complexity
   */
  async suggestPointValues(
    chores: ChoreCreationRequest[],
    selectedModel: string = 'llama3.1:latest'
  ): Promise<ChoreCreationRequest[]> {
    try {
      const systemPrompt = `You are a family chore point calculator. Suggest fair point values for chores based on:
- Time required (1-2 min = 1pt, 5-10 min = 2-3pts, 15-30 min = 4-5pts, 30+ min = 6-10pts)
- Difficulty level (easy = base points, medium = +1-2pts, hard = +3-5pts)
- Age appropriateness
- Family motivation needs

Return ONLY a JSON array with updated point values. No other text.`;

      const choreDescriptions = chores.map(c => 
        `${c.choreName} (${c.difficulty || 'medium'} difficulty, ${c.frequency || 'weekly'})`
      ).join('\n');

      const response = await ollamaService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Calculate points for these chores:\n${choreDescriptions}` }
      ], { model: selectedModel, temperature: 0.3 });

      const updatedChores = JSON.parse(response);
      return chores.map((chore, index) => ({
        ...chore,
        pointValue: updatedChores[index]?.pointValue || this.calculateDefaultPoints(chore)
      }));
    } catch (error) {
      console.error('Point suggestion failed:', error);
      return chores.map(chore => ({
        ...chore,
        pointValue: this.calculateDefaultPoints(chore)
      }));
    }
  }

  /**
   * Create age-appropriate chore suggestions
   */
  async suggestAgeAppropriateChores(
    age: number,
    interests: string[] = [],
    selectedModel: string = 'llama3.1:latest'
  ): Promise<ChoreCreationRequest[]> {
    const systemPrompt = `You are a child development expert creating age-appropriate chores.
    
For age ${age}, suggest 5-8 chores that are:
- Developmentally appropriate
- Build life skills
- Foster independence
- Consider safety
${interests.length > 0 ? `- Align with interests: ${interests.join(', ')}` : ''}

Return ONLY a JSON array of chore objects with: choreName, difficulty, pointValue, category, frequency.`;

    try {
      const response = await ollamaService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create chores for ${age}-year-old` }
      ], { model: selectedModel, temperature: 0.8 });

      return JSON.parse(response);
    } catch (error) {
      console.error('Age-appropriate chore suggestion failed:', error);
      return this.getDefaultChoresForAge(age);
    }
  }

  private buildChoreCreationPrompt(familyMembers: string[], existingChores: any[]): string {
    return `You are a family assistant helping create chores efficiently. Your job is to parse natural language requests and create structured chore data.

Family Members: ${familyMembers.join(', ') || 'None specified'}
Existing Chores: ${existingChores.map(c => c.name || c.choreName).join(', ') || 'None'}

When users request chores, understand:
- Who should do them (assign to family members mentioned or ask for clarification)
- How often (daily, weekly, monthly, one-time)
- Point values (suggest based on effort: 1-2 easy, 3-5 medium, 6-10 hard)
- Categories (cleaning, cooking, yard-work, pet-care, organization, other)

Return ONLY a JSON object with this structure:
{
  "chores": [
    {
      "choreName": "string",
      "assignedTo": "string or null",
      "pointValue": number,
      "frequency": "daily|weekly|monthly|one-time",
      "difficulty": "easy|medium|hard",
      "category": "cleaning|cooking|yard-work|pet-care|organization|other"
    }
  ],
  "explanation": "Brief explanation of what was created",
  "suggestions": ["Optional array of additional suggestions"]
}

Be smart about:
- Age-appropriate tasks
- Fair point distribution
- Avoiding duplicate chores
- Seasonal considerations
- Family dynamics`;
  }

  private parseChoreResponse(response: string): ChoreCreationResponse {
    try {
      const cleaned = response.trim().replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        chores: [],
        explanation: "Sorry, I couldn't understand that request. Please try rephrasing.",
        suggestions: ["Try: 'Create weekly cleaning chores for kids'", "Or: 'Add dishwasher duty for Sarah, 3 points'"]
      };
    }
  }

  private fallbackChoreCreation(userInput: string): ChoreCreationResponse {
    // Simple keyword extraction fallback
    const chores: ChoreCreationRequest[] = [];
    const keywords = userInput.toLowerCase();
    
    if (keywords.includes('clean')) {
      chores.push({
        choreName: 'Cleaning tasks',
        pointValue: 3,
        frequency: 'weekly',
        difficulty: 'medium',
        category: 'cleaning'
      });
    }
    
    return {
      chores,
      explanation: "I created some basic chores, but my AI assistant is having trouble. Please try again with Ollama running.",
      suggestions: ["Make sure Ollama is running on localhost:11434"]
    };
  }

  private calculateDefaultPoints(chore: ChoreCreationRequest): number {
    const basePoints = {
      'easy': 2,
      'medium': 3,
      'hard': 5
    };
    
    const frequencyMultiplier = {
      'daily': 1,
      'weekly': 1.5,
      'monthly': 3,
      'one-time': 2
    };
    
    const base = basePoints[chore.difficulty || 'medium'];
    const multiplier = frequencyMultiplier[chore.frequency || 'weekly'];
    
    return Math.round(base * multiplier);
  }

  private getDefaultChoresForAge(age: number): ChoreCreationRequest[] {
    if (age <= 5) {
      return [
        { choreName: 'Put toys away', difficulty: 'easy', pointValue: 1, category: 'organization', frequency: 'daily' },
        { choreName: 'Feed pet with help', difficulty: 'easy', pointValue: 2, category: 'pet-care', frequency: 'daily' }
      ];
    } else if (age <= 10) {
      return [
        { choreName: 'Make bed', difficulty: 'easy', pointValue: 2, category: 'cleaning', frequency: 'daily' },
        { choreName: 'Set table', difficulty: 'easy', pointValue: 2, category: 'cooking', frequency: 'daily' },
        { choreName: 'Feed pets', difficulty: 'medium', pointValue: 3, category: 'pet-care', frequency: 'daily' }
      ];
    } else {
      return [
        { choreName: 'Vacuum living room', difficulty: 'medium', pointValue: 4, category: 'cleaning', frequency: 'weekly' },
        { choreName: 'Load dishwasher', difficulty: 'medium', pointValue: 3, category: 'cleaning', frequency: 'daily' },
        { choreName: 'Take out trash', difficulty: 'easy', pointValue: 2, category: 'cleaning', frequency: 'weekly' }
      ];
    }
  }
}

export const aiChoreToolkit = AIChoreToolkit.getInstance();