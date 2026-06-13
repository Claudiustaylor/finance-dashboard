'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, PiggyBank, Home, Car, Plane, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category: string;
  target_date?: string;
  status: string;
  color?: string;
  icon?: string;
}

interface SavingsTrackerProps {
  goals: SavingsGoal[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  emergency_fund: <Shield className="h-5 w-5" />,
  vacation: <Plane className="h-5 w-5" />,
  house: <Home className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  debt_payoff: <AlertTriangle className="h-5 w-5" />,
  general: <PiggyBank className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  emergency_fund: '#ef4444',
  vacation: '#f59e0b',
  house: '#8b5cf6',
  car: '#3b82f6',
  investment: '#10b981',
  debt_payoff: '#dc2626',
  general: '#0071c5',
};

export function SavingsTracker({ goals }: SavingsTrackerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'completed');
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <Card className="border border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-[#00aeef]" />
              Savings Goals
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(totalSaved)} of {formatCurrency(totalTarget)} saved
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#00aeef]">
              {overallProgress.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">overall progress</p>
          </div>
        </div>
        <Progress value={overallProgress} className="mt-3 h-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length > 0 ? (
          activeGoals.map((goal) => {
            const progress = goal.target_amount > 0
              ? (goal.current_amount / goal.target_amount) * 100
              : 0;
            const color = goal.color || categoryColors[goal.category] || '#0071c5';
            const icon = categoryIcons[goal.category] || categoryIcons.general;
            const daysLeft = goal.target_date
              ? Math.ceil(
                  (new Date(goal.target_date).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <div
                key={goal.id}
                className="p-4 rounded-lg border border-white/[0.08] hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <div style={{ color }}>{icon}</div>
                    </div>
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color }}>
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Progress Ring + Details */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(progress, 100) / 100)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PiggyBank className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saved</span>
                      <span className="font-medium">{formatCurrency(goal.current_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-1.5" />

                    {daysLeft !== null && daysLeft > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {daysLeft} days remaining
                        {daysLeft <= 30 && (
                          <span className="text-amber-600 ml-1">&bull; Approaching deadline</span>
                        )}
                      </p>
                    )}

                    {goal.status === 'completed' && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Goal completed!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-[#00aeef]/20 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No savings goals yet. Create your first goal to start tracking progress.</p>
            <Button className="bg-[#0071c5] hover:bg-[#005a9e] text-white">
              Create Savings Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
