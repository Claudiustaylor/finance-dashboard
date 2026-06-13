#!/usr/bin/env bash
# Fix all light-mode colors to dark mode in dashboard components

cd ~/projects/finance-dashboard/components/dashboard

# Fix AccountCards.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' AccountCards.tsx
sed -i '' 's/bg-\[#0071c5\]\/10/bg-[#0071c5]\/10/g' AccountCards.tsx
sed -i '' 's/text-\[#0071c5\]/text-[#00aeef]/g' AccountCards.tsx

# Fix ExpenseBreakdown.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' ExpenseBreakdown.tsx
sed -i '' 's/border: '\''1px solid #e2e8f0'\''/border: '\''1px solid rgba(255,255,255,0.08)'\''/g' ExpenseBreakdown.tsx
sed -i '' 's/backgroundColor: '\''#ffffff'\''/backgroundColor: '\''#0a0a0a'\''/g' ExpenseBreakdown.tsx

# Fix SavingsTracker.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' SavingsTracker.tsx
sed -i '' 's/hover:shadow-md transition-all/hover:bg-white\/[0.02] transition-all/g' SavingsTracker.tsx
sed -i '' 's/text-\[#0071c5\]/text-[#00aeef]/g' SavingsTracker.tsx
sed -i '' 's/bg-\[#0071c5\]\/20/bg-[#0071c5]\/10/g' SavingsTracker.tsx
sed -i '' 's/stroke="#e2e8f0"/stroke="rgba(255,255,255,0.08)"/g' SavingsTracker.tsx
sed -i '' 's/bg-\[#0071c5\] hover:bg-\[#005a9e\] text-white/bg-[#0071c5] hover:bg-[#005a9e] text-white/g' SavingsTracker.tsx

# Fix CashFlowForecast.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' CashFlowForecast.tsx
sed -i '' 's/backgroundColor: '\''#ffffff'\''/backgroundColor: '\''#0a0a0a'\''/g' CashFlowForecast.tsx
sed -i '' 's/border: '\''1px solid #e2e8f0'\''/border: '\''1px solid rgba(255,255,255,0.08)'\''/g' CashFlowForecast.tsx
sed -i '' 's/strokeDasharray="3 3" stroke="#e2e8f0"/strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/g' CashFlowForecast.tsx
sed -i '' 's/text-\[#1a1a1a\]/text-white/g' CashFlowForecast.tsx
sed -i '' 's/text-\[#0071c5\]/text-[#00aeef]/g' CashFlowForecast.tsx
sed -i '' 's/bg-red-50/border-red-500\/5/g' CashFlowForecast.tsx
sed -i '' 's/border-red-200/border-red-500\/20/g' CashFlowForecast.tsx

# Fix AIBudgetBuilder.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' AIBudgetBuilder.tsx
sed -i '' 's/bg-\[#0071c5\]\/5/bg-[#0071c5]\/5/g' AIBudgetBuilder.tsx
sed -i '' 's/bg-\[#0071c5\]\/10/bg-[#0071c5]\/10/g' AIBudgetBuilder.tsx
sed -i '' 's/text-\[#1a1a1a\]/text-white/g' AIBudgetBuilder.tsx
sed -i '' 's/text-\[#0071c5\]/text-[#00aeef]/g' AIBudgetBuilder.tsx
sed -i '' 's/bg-red-50/border-red-500\/5/g' AIBudgetBuilder.tsx
sed -i '' 's/bg-amber-50/border-amber-500\/5/g' AIBudgetBuilder.tsx
sed -i '' 's/border-red-200/border-red-500\/20/g' AIBudgetBuilder.tsx
sed -i '' 's/border-amber-200/border-amber-500\/20/g' AIBudgetBuilder.tsx
sed -i '' 's/bg-[#0071c5] hover:bg-[#005a9e] text-white/bg-[#0071c5] hover:bg-[#005a9e] text-white/g' AIBudgetBuilder.tsx

# Fix WeeklyRecap.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' WeeklyRecap.tsx
sed -i '' 's/hover:bg-\[#f8fafc\]/hover:bg-white\/[0.02]/g' WeeklyRecap.tsx
sed -i '' 's/text-\[#1a1a1a\]/text-white/g' WeeklyRecap.tsx
sed -i '' 's/text-\[#0071c5\]/text-[#00aeef]/g' WeeklyRecap.tsx
sed -i '' 's/bg-amber-50/border-amber-500\/5/g' WeeklyRecap.tsx
sed -i '' 's/border-amber-200/border-amber-500\/20/g' WeeklyRecap.tsx
sed -i '' 's/text-amber-700/text-amber-400/g' WeeklyRecap.tsx

# Fix SubscriptionTracker.tsx
sed -i '' 's/border border-\[#e2e8f0\]/border border-white\/[0.08]/g' SubscriptionTracker.tsx
sed -i '' 's/hover:bg-\[#f8fafc\]/hover:bg-white\/[0.02]/g' SubscriptionTracker.tsx
sed -i '' 's/text-\[#1a1a1a\]/text-white/g' SubscriptionTracker.tsx
sed -i '' 's/text-\[#0071c5\]/text-[#00aeef]/g' SubscriptionTracker.tsx
sed -i '' 's/text-\[#dc2626\]/text-red-400/g' SubscriptionTracker.tsx
sed -i '' 's/text-\[#b91d1d\]/text-red-500/g' SubscriptionTracker.tsx

echo "Done!"
