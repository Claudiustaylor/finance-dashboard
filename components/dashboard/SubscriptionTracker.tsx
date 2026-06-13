'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  next_billing_date?: string;
  status: string;
  is_essential: boolean;
  cancellation_url?: string;
  source: string;
}

interface SubscriptionTrackerProps {
  subscriptions: Subscription[];
}

export function SubscriptionTracker({ subscriptions }: SubscriptionTrackerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const monthlyBurn = subscriptions.reduce((total, sub) => {
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

  const essentialBurn = subscriptions
    .filter((s) => s.is_essential && (s.status === 'active' || s.status === 'trial'))
    .reduce((total, sub) => {
      const monthlyAmount = sub.frequency === 'yearly'
        ? sub.amount / 12
        : sub.frequency === 'quarterly'
        ? sub.amount / 3
        : sub.frequency === 'biweekly'
        ? sub.amount * 2.17
        : sub.amount;
      return total + monthlyAmount;
    }, 0);

  const upcoming = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .filter((s) => {
      if (!s.next_billing_date) return false;
      const daysUntil = Math.ceil(
        (new Date(s.next_billing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => {
      return new Date(a.next_billing_date!).getTime() - new Date(b.next_billing_date!).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Burn Rate Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#0071c5] to-[#005a9e] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Burn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(monthlyBurn)}</p>
            <p className="text-xs text-white/60 mt-1">{subscriptions.filter(s => s.status === 'active').length} active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Essential vs Discretionary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Essential</span>
                <span className="font-medium">{formatCurrency(essentialBurn)}</span>
              </div>
              <Progress
                value={monthlyBurn > 0 ? (essentialBurn / monthlyBurn) * 100 : 0}
                className="h-2"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Discretionary</span>
              <span>{formatCurrency(monthlyBurn - essentialBurn)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(upcoming.reduce((sum, s) => sum + s.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Charges */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#00aeef]" />
              Upcoming Charges This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcoming.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/[0.08] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0071c5]/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-[#00aeef]" />
                    </div>
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.next_billing_date && new Date(sub.next_billing_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold">{formatCurrency(sub.amount)}</p>
                    {sub.cancellation_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-500"
                        onClick={() => window.open(sub.cancellation_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Service</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Frequency</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Next Bill</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-[#e2e8f0] hover:bg-white/[0.02]">
                    <td className="py-3 px-2 font-medium">{sub.name}</td>
                    <td className="py-3 px-2">{formatCurrency(sub.amount)}</td>
                    <td className="py-3 px-2 capitalize">{sub.frequency}</td>
                    <td className="py-3 px-2">
                      {sub.next_billing_date
                        ? new Date(sub.next_billing_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={sub.status === 'active' ? 'default' : sub.status === 'cancelled' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-xs">
                        {sub.is_essential ? 'Essential' : 'Discretionary'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {sub.cancellation_url && sub.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-500"
                          onClick={() => window.open(sub.cancellation_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
