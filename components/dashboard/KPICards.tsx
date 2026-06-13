'use client';

import { TitanCard } from '@/components/ui/titan';
import { TrendingUp, TrendingDown, PiggyBank, Target, CreditCard, Banknote } from 'lucide-react';

interface KPICardsProps {
  netWorth: number;
  monthlyIncome: number;
  monthlySpending: number;
  totalSavings: number;
  savingsRate: number;
  debtToIncome: number;
  accountCount: number;
  subscriptionBurn: number;
}

export function KPICards({
  netWorth,
  monthlyIncome,
  monthlySpending,
  totalSavings,
  savingsRate,
  debtToIncome,
  accountCount,
  subscriptionBurn,
}: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const kpis = [
    {
      title: 'Net Worth',
      value: formatCurrency(netWorth),
      change: netWorth >= 0 ? '+12.5% vs last month' : 'Building up',
      trend: netWorth >= 0 ? 'up' as const : 'neutral' as const,
      icon: Banknote,
      accent: '#0071c5',
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(monthlyIncome),
      change: monthlyIncome > 0 ? 'Active income stream' : 'No income recorded',
      trend: monthlyIncome > 0 ? 'up' as const : 'neutral' as const,
      icon: TrendingUp,
      accent: '#10b981',
    },
    {
      title: 'Monthly Spending',
      value: formatCurrency(monthlySpending),
      change: monthlySpending > monthlyIncome * 0.8 ? 'Approaching limit' : 'Within budget',
      trend: monthlySpending > monthlyIncome * 0.8 ? 'down' as const : 'up' as const,
      icon: CreditCard,
      accent: '#ef4444',
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      change: savingsRate >= 20 ? 'On target' : 'Below 20% goal',
      trend: savingsRate >= 20 ? 'up' as const : 'neutral' as const,
      icon: PiggyBank,
      accent: '#00aeef',
    },
    {
      title: 'Total Savings',
      value: formatCurrency(totalSavings),
      change: `${accountCount} account${accountCount > 1 ? 's' : ''} linked`,
      trend: 'neutral' as const,
      icon: Target,
      accent: '#3b82f6',
    },
    {
      title: 'Subscription Burn',
      value: formatCurrency(subscriptionBurn),
      change: subscriptionBurn > 0 ? 'Monthly recurring' : 'No subscriptions',
      trend: 'neutral' as const,
      icon: CreditCard,
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <TitanCard
          key={kpi.title}
          glow="blue"
            variant="gradient"
            padding="md"
            className="hover:border-white/[0.12] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium tracking-[-0.01em] text-[#888888] uppercase">
                {kpi.title}
              </p>
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${kpi.accent}15` }}
              >
                <Icon className="h-4 w-4" style={{ color: kpi.accent }} />
              </div>
            </div>
            <p className="text-xl font-semibold tracking-[-0.03em] text-white tabular-nums">
              {kpi.value}
            </p>
            <p className={`text-xs tracking-[-0.01em] mt-1 ${
              kpi.trend === 'up'
                ? 'text-emerald-400'
                : kpi.trend === 'down'
                ? 'text-red-400'
                : 'text-[#888888]'
            }`}>
              {kpi.change}
            </p>
          </TitanCard>
        );
      })}
    </div>
  );
}
