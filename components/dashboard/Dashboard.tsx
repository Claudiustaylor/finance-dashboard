'use client';

import { useState } from 'react';
import { TitanCard, TitanTab } from '@/components/ui/titan';
import { AccountCards } from './AccountCards';
import { SubscriptionTracker } from './SubscriptionTracker';
import { KPICards } from './KPICards';
import { ExpenseBreakdown } from './ExpenseBreakdown';
import { SavingsTracker } from './SavingsTracker';
import { CashFlowForecast } from './CashFlowForecast';
import { AIBudgetBuilder } from './AIBudgetBuilder';
import { WeeklyRecap } from './WeeklyRecap';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  accounts: any[];
  transactions: any[];
  subscriptions: any[];
  savingsGoals: any[];
  expenseCategories: any[];
  cashFlowData: any[];
  budgetCategories: any[];
  weeklyRecap: any;
  netWorth: number;
  monthlyIncome: number;
  monthlySpending: number;
  totalSavings: number;
  savingsRate: number;
  totalBudgeted: number;
  avgMonthlyNet: number;
  runwayMonths: number;
  projectedAnnualSavings: number;
  aiSuggestions: string[];
}

export function Dashboard({
  accounts,
  transactions,
  subscriptions,
  savingsGoals,
  expenseCategories,
  cashFlowData,
  budgetCategories,
  weeklyRecap,
  netWorth,
  monthlyIncome,
  monthlySpending,
  totalSavings,
  savingsRate,
  totalBudgeted,
  avgMonthlyNet,
  runwayMonths,
  projectedAnnualSavings,
  aiSuggestions,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalAssets = accounts
    .filter((a) => a.type === 'depository' || a.type === 'investment')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === 'credit' || a.type === 'loan')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const subscriptionBurn = subscriptions.reduce((total, sub) => {
    if (sub.status !== 'active' && sub.status !== 'trial') return total;
    const monthlyAmount = sub.frequency === 'yearly'
      ? sub.amount / 12
      : sub.frequency === 'quarterly'
      ? sub.amount / 3
      : sub.frequency === 'biweekly'
      ? sub.amount * 2.17
      : sub.amount;
    return total + monthlyAmount;
  }, 0);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'budget', label: 'Budget' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'recap', label: 'Recap' },
  ];

  return (
    <div className="space-y-8">
      <KPICards
        netWorth={netWorth}
        monthlyIncome={monthlyIncome}
        monthlySpending={monthlySpending}
        totalSavings={totalSavings}
        savingsRate={savingsRate}
        debtToIncome={monthlyIncome > 0 ? (totalLiabilities / monthlyIncome) * 100 : 0}
        accountCount={accounts.length}
        subscriptionBurn={subscriptionBurn}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TitanCard glow="blue" variant="gradient" padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-[-0.01em] text-[#888888] uppercase mb-1">Total Assets</p>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-white tabular-nums">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#0071c5]/10">
              <Wallet className="h-5 w-5 text-[#00aeef]" />
            </div>
          </div>
        </TitanCard>

        <TitanCard glow="blue" variant="gradient" padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-[-0.01em] text-[#888888] uppercase mb-1">Total Liabilities</p>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-white tabular-nums">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#0071c5]/10">
              <CreditCard className="h-5 w-5 text-[#00aeef]" />
            </div>
          </div>
        </TitanCard>

        <TitanCard glow="blue" variant="gradient" padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-[-0.01em] text-[#888888] uppercase mb-1">Cash Flow</p>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-white tabular-nums">{formatCurrency(monthlyIncome - monthlySpending)}</p>
              <p className={`text-xs mt-1 ${monthlyIncome - monthlySpending >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {monthlyIncome - monthlySpending >= 0 ? 'Positive flow' : 'Negative flow'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[#0071c5]/10">
              {monthlyIncome - monthlySpending >= 0
                ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                : <TrendingDown className="h-5 w-5 text-red-400" />
              }
            </div>
          </div>
        </TitanCard>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#0a0a0a] border border-white/[0.08] rounded-full w-fit">
        {tabs.map((tab) => (
          <TitanTab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TitanTab>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseBreakdown categories={expenseCategories} />
              <SavingsTracker goals={savingsGoals} />
            </div>
            <TransactionsList transactions={transactions} accounts={accounts} />
          </div>
        )}

        {activeTab === 'forecast' && (
          <CashFlowForecast
            data={cashFlowData}
            avgMonthlyNet={avgMonthlyNet}
            runwayMonths={runwayMonths}
            projectedAnnualSavings={projectedAnnualSavings}
          />
        )}

        {activeTab === 'budget' && (
          <AIBudgetBuilder
            categories={budgetCategories}
            totalBudgeted={totalBudgeted}
            totalSpent={monthlySpending}
            aiSuggestions={aiSuggestions}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountCards accounts={accounts} />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionTracker subscriptions={subscriptions} />
        )}

        {activeTab === 'transactions' && (
          <TransactionsList transactions={transactions} accounts={accounts} />
        )}

        {activeTab === 'recap' && (
          <WeeklyRecap recap={weeklyRecap} />
        )}
      </div>
    </div>
  );
}

function TransactionsList({ transactions, accounts }: { transactions: any[]; accounts: any[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  return (
    <TitanCard glow="inner" padding="none">
      <div className="p-5 pb-3 border-b border-white/[0.08]">
        <h3 className="text-sm font-medium tracking-[-0.01em] text-white">All Transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left py-3 px-5 font-medium text-xs text-[#888888] tracking-[-0.01em]">Transaction</th>
              <th className="text-left py-3 px-5 font-medium text-xs text-[#888888] tracking-[-0.01em]">Category</th>
              <th className="text-left py-3 px-5 font-medium text-xs text-[#888888] tracking-[-0.01em]">Account</th>
              <th className="text-left py-3 px-5 font-medium text-xs text-[#888888] tracking-[-0.01em]">Date</th>
              <th className="text-right py-3 px-5 font-medium text-xs text-[#888888] tracking-[-0.01em]">Amount</th>
              <th className="text-center py-3 px-5 font-medium text-xs text-[#888888] tracking-[-0.01em]">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0071c5]/10 flex items-center justify-center">
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{tx.name}</p>
                        {tx.merchant_name && tx.merchant_name !== tx.name && (
                          <p className="text-xs text-[#888888]">{tx.merchant_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-[#888888] border border-white/[0.08]">
                      {tx.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-[#888888]">
                    {getAccountName(tx.account_id)}
                  </td>
                  <td className="py-3 px-5 text-[#888888]">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <span
                      className={`font-semibold tabular-nums ${
                        tx.amount < 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.amount < 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.pending
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {tx.pending ? 'Pending' : 'Settled'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#888888]">
                  No transactions yet. Connect an account to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </TitanCard>
  );
}
