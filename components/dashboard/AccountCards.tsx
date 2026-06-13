'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Landmark, Wallet } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  depository: <Wallet className="h-5 w-5" />,
  credit: <CreditCard className="h-5 w-5" />,
  loan: <Landmark className="h-5 w-5" />,
  investment: <Building2 className="h-5 w-5" />,
  other: <Building2 className="h-5 w-5" />,
};

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  current_balance: number;
  available_balance?: number;
  mask?: string;
  institution_name?: string;
}

interface AccountCardsProps {
  accounts: Account[];
}

export function AccountCards({ accounts }: AccountCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <Card key={account.id} className="border border-white/[0.08] hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0071c5]/10 text-[#00aeef]">
                  {iconMap[account.type] || iconMap.other}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {account.institution_name}
                    {account.mask && ` ••••${account.mask}`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {account.subtype || account.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-[#00aeef]">
                {formatCurrency(account.current_balance)}
              </p>
              {account.available_balance !== undefined && account.available_balance !== account.current_balance && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatCurrency(account.available_balance)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
