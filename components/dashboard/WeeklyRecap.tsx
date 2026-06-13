'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WeeklyRecapData {
  weekOf: string;
  totalIncome: number;
  totalSpending: number;
  netCashFlow: number;
  topCategories: { name: string; amount: number; change: number }[];
  topTransactions: { name: string; amount: number; type: 'income' | 'expense'; date: string }[];
  subscriptionAlerts: { name: string; amount: number; nextCharge: string }[];
  savingsProgress: number;
  budgetStatus: 'under' | 'over' | 'on_track';
  budgetUsedPct: number;
  vsLastWeek: { income: number; spending: number; net: number };
}

interface WeeklyRecapProps {
  recap: WeeklyRecapData;
}

export function WeeklyRecap({ recap }: WeeklyRecapProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="border border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#00aeef]" />
              Weekly Recap
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Week of {formatDate(recap.weekOf)}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${
              recap.budgetStatus === 'under'
                ? 'text-emerald-600 border-emerald-200'
                : recap.budgetStatus === 'over'
                ? 'text-red-600 border-red-200'
                : 'text-[#00aeef] border-[#0071c5]/20'
            }`}
          >
            {recap.budgetStatus === 'under'
              ? 'Under Budget'
              : recap.budgetStatus === 'over'
              ? 'Over Budget'
              : 'On Track'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Row: Income / Spending / Net */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Income</p>
            </div>
            <p className="text-lg font-bold text-white">{formatCurrency(recap.totalIncome)}</p>
            <div className="flex items-center gap-1 mt-1">
              {recap.vsLastWeek.income >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${recap.vsLastWeek.income >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {recap.vsLastWeek.income >= 0 ? '+' : ''}{formatCurrency(recap.vsLastWeek.income)} vs last week
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Spending</p>
            </div>
            <p className="text-lg font-bold text-white">{formatCurrency(recap.totalSpending)}</p>
            <div className="flex items-center gap-1 mt-1">
              {recap.vsLastWeek.spending <= 0 ? (
                <ArrowDownRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowUpRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${recap.vsLastWeek.spending <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {recap.vsLastWeek.spending >= 0 ? '+' : ''}{formatCurrency(recap.vsLastWeek.spending)} vs last week
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-[#00aeef]" />
              <p className="text-xs text-muted-foreground">Net Flow</p>
            </div>
            <p className={`text-lg font-bold ${recap.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {recap.netCashFlow >= 0 ? '+' : ''}{formatCurrency(recap.netCashFlow)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {recap.vsLastWeek.net >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${recap.vsLastWeek.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {recap.vsLastWeek.net >= 0 ? '+' : ''}{formatCurrency(recap.vsLastWeek.net)} vs last week
              </span>
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="p-3 rounded-lg border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Weekly Budget Used</p>
            <p className="text-sm font-bold">{recap.budgetUsedPct.toFixed(0)}%</p>
          </div>
          <Progress value={recap.budgetUsedPct} className="h-2" />
        </div>

        {/* Top Categories */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Top Spending Categories
          </p>
          <div className="space-y-2">
            {recap.topCategories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#00aeef]" />
                  <span className="text-sm">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatCurrency(cat.amount)}</span>
                  <span className={`text-xs ${cat.change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {cat.change > 0 ? '+' : ''}{cat.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Transactions */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Notable Transactions
          </p>
          <div className="space-y-2">
            {recap.topTransactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {tx.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Alerts */}
        {recap.subscriptionAlerts.length > 0 && (
          <div className="p-3 rounded-lg border border-amber-500/20 border-amber-500/5/50">
            <p className="text-sm font-semibold text-amber-400 mb-2">Upcoming Charges</p>
            <div className="space-y-2">
              {recap.subscriptionAlerts.map((sub) => (
                <div key={sub.name} className="flex items-center justify-between text-sm">
                  <span>{sub.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(sub.amount)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(sub.nextCharge)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Savings Snapshot */}
        <div className="p-3 rounded-lg border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-[#00aeef]" />
              <p className="text-sm font-medium">Savings Goal Progress</p>
            </div>
            <p className="text-sm font-bold">{recap.savingsProgress.toFixed(0)}%</p>
          </div>
          <Progress value={recap.savingsProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
