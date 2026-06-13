'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react';

interface CashFlowData {
  month: string;
  income: number;
  spending: number;
  net: number;
  projected: boolean;
}

interface CashFlowForecastProps {
  data: CashFlowData[];
  runwayMonths: number;
  avgMonthlyNet: number;
  projectedAnnualSavings: number;
}

export function CashFlowForecast({
  data,
  runwayMonths,
  avgMonthlyNet,
  projectedAnnualSavings,
}: CashFlowForecastProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const historicalCount = data.filter((d) => !d.projected).length;
  const projectedCount = data.filter((d) => d.projected).length;
  const currentNetWorth = data[historicalCount - 1]?.net || 0;

  return (
    <Card className="border border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#00aeef]" />
              Cash Flow Forecast
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {historicalCount} months actual + {projectedCount} months projected
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#00aeef]">
              {formatCurrency(avgMonthlyNet)}
            </p>
            <p className="text-xs text-muted-foreground">avg monthly net</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Area Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071c5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0071c5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#0a0a0a',
                }}
              />
              <ReferenceLine
                x={data[historicalCount]?.month}
                stroke="#0071c5"
                strokeDasharray="6 6"
                label={{
                  value: 'Projection Start',
                  position: 'insideTopLeft',
                  fill: '#0071c5',
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fill="url(#incomeGradient)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="spending"
                stroke="#ef4444"
                fill="url(#spendGradient)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Spending"
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="#0071c5"
                fill="url(#netGradient)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Net Cash Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-[#00aeef]" />
              <p className="text-sm font-medium">Projected Annual Savings</p>
            </div>
            <p className="text-xl font-bold text-[#00aeef]">
              {formatCurrency(projectedAnnualSavings)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {formatCurrency(avgMonthlyNet)}/mo avg net
            </p>
          </div>

          <div className="p-4 rounded-lg border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-medium">Current Net Worth</p>
            </div>
            <p className="text-xl font-bold text-white">
              {formatCurrency(currentNetWorth)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              At end of last actual month
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${runwayMonths <= 3 ? 'border-red-500/20 border-red-500/5' : 'border-[#e2e8f0]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {runwayMonths <= 3 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-[#00aeef]" />
              )}
              <p className="text-sm font-medium">Runway</p>
            </div>
            <p className={`text-xl font-bold ${runwayMonths <= 3 ? 'text-red-600' : 'text-white'}`}>
              {runwayMonths === Infinity ? 'Infinite' : `${runwayMonths} months`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {runwayMonths <= 3
                ? 'Warning: low buffer. Increase income or cut spending.'
                : 'Months you could survive with zero income'}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="text-xs text-muted-foreground">Spending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0071c5]" />
            <span className="text-xs text-muted-foreground">Net Cash Flow</span>
          </div>
          <Badge variant="outline" className="text-xs">Projected = dashed vertical line</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
