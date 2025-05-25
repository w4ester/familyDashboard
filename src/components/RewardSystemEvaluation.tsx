import React, { useState, useEffect } from 'react';
import { ChoreAssignment } from '../types/chore-types';
import { GameRewardHistory } from '../types/game-types';

interface EvaluationMetrics {
  totalTasksAssigned: number;
  tasksWithGameRewards: number;
  tasksCompleted: number;
  gameRewardsEarned: number;
  gameSessionsUsed: number;
  averageCompletionTime: number; // hours
  completionRateWithRewards: number; // percentage
  completionRateWithoutRewards: number; // percentage
  familyEngagementScore: number; // 0-100
}

const RewardSystemEvaluation: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    calculateMetrics();
  }, [dateRange]);

  const calculateMetrics = () => {
    // Get all assignments
    const assignmentsStr = localStorage.getItem('chore-assignments');
    const assignments: ChoreAssignment[] = assignmentsStr ? JSON.parse(assignmentsStr) : [];
    
    // Filter by date range if specified
    let filteredAssignments = assignments;
    if (dateRange.start) {
      filteredAssignments = assignments.filter(a => 
        new Date(a.assignedDate) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filteredAssignments = filteredAssignments.filter(a => 
        new Date(a.assignedDate) <= new Date(dateRange.end)
      );
    }
    
    // Calculate metrics
    const totalTasks = filteredAssignments.length;
    const tasksWithRewards = filteredAssignments.filter(a => a.gameReward).length;
    const completedTasks = filteredAssignments.filter(a => a.status === 'completed').length;
    
    // Completion rates
    const rewardTasks = filteredAssignments.filter(a => a.gameReward);
    const nonRewardTasks = filteredAssignments.filter(a => !a.gameReward);
    const rewardCompletionRate = rewardTasks.length > 0 
      ? (rewardTasks.filter(a => a.status === 'completed').length / rewardTasks.length) * 100
      : 0;
    const nonRewardCompletionRate = nonRewardTasks.length > 0
      ? (nonRewardTasks.filter(a => a.status === 'completed').length / nonRewardTasks.length) * 100
      : 0;
    
    // Average completion time
    const completedWithTime = filteredAssignments.filter(a => 
      a.status === 'completed' && a.completedDate && a.assignedDate
    );
    const totalTime = completedWithTime.reduce((sum, a) => {
      const assigned = new Date(a.assignedDate).getTime();
      const completed = new Date(a.completedDate!).getTime();
      return sum + (completed - assigned);
    }, 0);
    const avgTime = completedWithTime.length > 0 
      ? totalTime / completedWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    // Game rewards data
    const balances = JSON.parse(localStorage.getItem('game-reward-balances') || '{}');
    let totalEarned = 0;
    let totalUsed = 0;
    
    Object.values(balances).forEach((balance: any) => {
      balance.history?.forEach((entry: GameRewardHistory) => {
        if (entry.type === 'earned') totalEarned += entry.sessions;
        if (entry.type === 'used') totalUsed += entry.sessions;
      });
    });
    
    // Family engagement score (0-100)
    // Based on: completion rate, reward usage, and participation
    const participationRate = Object.keys(balances).length / Math.max(1, assignments.map(a => a.assignedTo).filter((v, i, a) => a.indexOf(v) === i).length);
    const rewardUsageRate = totalEarned > 0 ? totalUsed / totalEarned : 0;
    const engagementScore = Math.round(
      (rewardCompletionRate * 0.4) + 
      (rewardUsageRate * 100 * 0.3) + 
      (participationRate * 100 * 0.3)
    );
    
    setMetrics({
      totalTasksAssigned: totalTasks,
      tasksWithGameRewards: tasksWithRewards,
      tasksCompleted: completedTasks,
      gameRewardsEarned: totalEarned,
      gameSessionsUsed: totalUsed,
      averageCompletionTime: Math.round(avgTime * 10) / 10,
      completionRateWithRewards: Math.round(rewardCompletionRate),
      completionRateWithoutRewards: Math.round(nonRewardCompletionRate),
      familyEngagementScore: engagementScore
    });
  };

  const getInsights = () => {
    if (!metrics) return [];
    
    const insights = [];
    
    // Insight 1: Reward effectiveness
    if (metrics.completionRateWithRewards > metrics.completionRateWithoutRewards + 10) {
      insights.push({
        type: 'success',
        text: `Game rewards are working! Tasks with rewards have ${metrics.completionRateWithRewards - metrics.completionRateWithoutRewards}% higher completion rate.`
      });
    } else if (metrics.completionRateWithRewards < metrics.completionRateWithoutRewards) {
      insights.push({
        type: 'warning',
        text: 'Game rewards may not be motivating enough. Consider adjusting reward values.'
      });
    }
    
    // Insight 2: Reward usage
    const usageRate = metrics.gameRewardsEarned > 0 ? (metrics.gameSessionsUsed / metrics.gameRewardsEarned) * 100 : 0;
    if (usageRate > 80) {
      insights.push({
        type: 'success',
        text: 'High reward redemption rate! Kids are actively using their earned game time.'
      });
    } else if (usageRate < 50) {
      insights.push({
        type: 'info',
        text: 'Many earned rewards haven\'t been used. Consider reminding kids about their game time.'
      });
    }
    
    // Insight 3: Completion time
    if (metrics.averageCompletionTime < 24) {
      insights.push({
        type: 'success',
        text: `Tasks are being completed quickly (avg ${metrics.averageCompletionTime} hours).`
      });
    }
    
    return insights;
  };

  if (!metrics) return <div>Loading evaluation data...</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📊 Reward System Evaluation</h2>
      
      {/* Date Range Filter */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="ml-2 p-2 border rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="ml-2 p-2 border rounded"
          />
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-2xl font-bold">{metrics.totalTasksAssigned}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-2xl font-bold text-blue-600">{metrics.tasksWithGameRewards}</div>
          <div className="text-sm text-gray-600">With Game Rewards</div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold text-green-600">{metrics.tasksCompleted}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <div className="text-2xl font-bold text-purple-600">{metrics.familyEngagementScore}%</div>
          <div className="text-sm text-gray-600">Engagement Score</div>
        </div>
      </div>
      
      {/* Comparison Chart */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Completion Rate Comparison</h3>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Tasks with Game Rewards</span>
              <span className="font-medium">{metrics.completionRateWithRewards}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className="bg-green-500 h-6 rounded-full flex items-center justify-center text-white text-xs"
                style={{ width: `${metrics.completionRateWithRewards}%` }}
              >
                {metrics.completionRateWithRewards > 10 && '🎮'}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Tasks with Points Only</span>
              <span className="font-medium">{metrics.completionRateWithoutRewards}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs"
                style={{ width: `${metrics.completionRateWithoutRewards}%` }}
              >
                {metrics.completionRateWithoutRewards > 10 && '💰'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Reward Stats */}
      <div className="mb-6 p-4 bg-orange-50 rounded">
        <h3 className="font-semibold mb-2">🎮 Game Reward Usage</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{metrics.gameRewardsEarned}</div>
            <div className="text-sm text-gray-600">Sessions Earned</div>
          </div>
          <div>
            <div className="text-xl font-bold">{metrics.gameSessionsUsed}</div>
            <div className="text-sm text-gray-600">Sessions Used</div>
          </div>
          <div>
            <div className="text-xl font-bold">
              {metrics.gameRewardsEarned > 0 
                ? Math.round((metrics.gameSessionsUsed / metrics.gameRewardsEarned) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Usage Rate</div>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div>
        <h3 className="font-semibold mb-3">💡 Insights & Recommendations</h3>
        <div className="space-y-2">
          {getInsights().map((insight, index) => (
            <div 
              key={index}
              className={`p-3 rounded flex items-start gap-2 ${
                insight.type === 'success' ? 'bg-green-50 text-green-800' :
                insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                'bg-blue-50 text-blue-800'
              }`}
            >
              <span>
                {insight.type === 'success' ? '✅' : 
                 insight.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="text-sm">{insight.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RewardSystemEvaluation;