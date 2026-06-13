'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  aiRecommended: number;
  transactions: number;
  trend: 'over' | 'under' | 'on_track';
  lastMonthSpent: number;
  averageSpent: number;
}

interface AIBudgetBuilderProps {
  categories: BudgetCategory[];
  totalBudgeted: number;
  totalSpent: number;
  aiSuggestions: string[];
}

export function AIBudgetBuilder({
  categories,
  totalBudgeted,
  totalSpent,
  aiSuggestions,
}: AIBudgetBuilderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const overBudgetCount = categories.filter((c) => c.spent > c.budgeted).length;
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <Card className="border border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#00aeef]" />
              AI Budget Builder
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Smart budgets based on your spending patterns
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#00aeef]">
              {formatCurrency(totalRemaining)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalRemaining >= 0 ? 'remaining this month' : 'over budget'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* AI Insights Banner */}
        {aiSuggestions.length > 0 && (
          <div className="p-3 rounded-lg bg-[#0071c5]/5 border border-[#0071c5]/10">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#00aeef] mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {aiSuggestions.map((s, i) => (
                  <p key={i} className="text-sm text-white">
                    {s}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overall Progress */}
        <div className="p-4 rounded-lg border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Overall Budget</p>
            <div className="flex items-center gap-2">
              {overBudgetCount > 0 && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {overBudgetCount} over budget
                </Badge>
              )}
              <p className="text-sm font-bold">
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
              </p>
            </div>
          </div>
          <Progress
            value={Math.min((totalSpent / totalBudgeted) * 100, 100)}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {((totalSpent / totalBudgeted) * 100).toFixed(1)}% of monthly budget used
          </p>
        </div>

        {/* Category Budgets */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Category Breakdown
          </p>
          {categories.map((cat) => {
            const pct = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
            const isOver = cat.spent > cat.budgeted;
            const isClose = pct >= 80 && !isOver;
            const aiDiff = cat.aiRecommended - cat.budgeted;

            return (
              <div
                key={cat.id}
                className={`p-4 rounded-lg border ${
                  isOver
                    ? 'border-red-500/20 border-red-500/5/50'
                    : isClose
                    ? 'border-amber-500/20 border-amber-500/5/50'
                    : 'border-[#e2e8f0]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cat.name}</p>
                    {isOver && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-500/20">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Over by {formatCurrency(cat.spent - cat.budgeted)}
                      </Badge>
                    )}
                    {isClose && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/20">
                        80%+ used
                      </Badge>
                    )}
                    {!isOver && pct < 80 && pct > 0 && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        On track
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(cat.spent)} / {formatCurrency(cat.budgeted)}
                    </p>
                  </div>
                </div>

                <Progress
                  value={Math.min(pct, 100)}
                  className={`h-1.5 ${
                    isOver
                      ? '[&>div]:border-red-500/50'
                      : isClose
                      ? '[&>div]:border-amber-500/50'
                      : '[&>div]:bg-[#0071c5]'
                  }`}
                />

                <div className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{cat.transactions} transactions</span>
                    <span>Last month: {formatCurrency(cat.lastMonthSpent)}</span>
                    <span>Avg: {formatCurrency(cat.averageSpent)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#00aeef]" />
                    <span className="text-[#00aeef]">
                      AI suggests {formatCurrency(cat.aiRecommended)}
                      {aiDiff !== 0 && (
                        <span className={aiDiff > 0 ? 'text-red-500' : 'text-emerald-500'}>
                          {' '}
                          ({aiDiff > 0 ? '+' : ''}{formatCurrency(aiDiff)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <Button className="w-full bg-[#0071c5] hover:bg-[#005a9e] text-white">
          <Sparkles className="h-4 w-4 mr-2" />
          Apply AI-Recommended Budgets
        </Button>
      </CardContent>
    </Card>
  );
}
