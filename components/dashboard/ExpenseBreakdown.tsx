'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface CategoryExpense {
  category: string;
  amount: number;
  color: string;
  percentage: number;
  transactionCount: number;
}

interface ExpenseBreakdownProps {
  categories: CategoryExpense[];
}

const DEFAULT_COLORS = [
  '#0071c5', '#00aeef', '#1e3a8a', '#3b82f6', '#60a5fa',
  '#93c5fd', '#2563eb', '#0369a1', '#0ea5e9', '#38bdf8',
];

export function ExpenseBreakdown({ categories }: ExpenseBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sortedCategories = [...categories].sort((a, b) => b.amount - a.amount);
  const total = sortedCategories.reduce((sum, c) => sum + c.amount, 0);

  const data = sortedCategories.map((cat, i) => ({
    name: cat.category,
    value: cat.amount,
    color: cat.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    percentage: total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0.0',
    count: cat.transactionCount,
  }));

  return (
    <Card className="border border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(total)} total spending this month
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: '#0a0a0a',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(item.value)}</p>
                  <Badge variant="outline" className="text-xs">
                    {item.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
