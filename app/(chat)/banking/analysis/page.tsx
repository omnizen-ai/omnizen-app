'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  Activity,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';

// Mock financial ratios and metrics
const financialMetrics = {
  liquidity: {
    currentRatio: 2.5,
    quickRatio: 1.8,
    cashRatio: 0.9,
    workingCapital: 500000,
  },
  profitability: {
    grossMargin: 42.5,
    operatingMargin: 18.3,
    netMargin: 12.7,
    roe: 15.2,
    roa: 8.5,
  },
  efficiency: {
    inventoryTurnover: 6.2,
    receivablesTurnover: 8.5,
    payablesTurnover: 7.1,
    assetTurnover: 1.2,
  },
  leverage: {
    debtToEquity: 0.45,
    debtToAssets: 0.31,
    interestCoverage: 8.5,
    equityMultiplier: 1.45,
  },
  performance: {
    revenue: 2500000,
    revenueGrowth: 15.3,
    ebitda: 450000,
    ebitdaMargin: 18.0,
    fcf: 320000,
  }
};

export default function FinancialAnalysisPage() {
  const getRatioStatus = (value: number, good: number, warning: number, isHigherBetter = true) => {
    if (isHigherBetter) {
      if (value >= good) return { color: 'text-green-600', badge: 'bg-green-500/10 text-green-500', label: 'Good' };
      if (value >= warning) return { color: 'text-orange-600', badge: 'bg-orange-500/10 text-orange-500', label: 'Warning' };
      return { color: 'text-red-600', badge: 'bg-red-500/10 text-red-500', label: 'Poor' };
    } else {
      if (value <= good) return { color: 'text-green-600', badge: 'bg-green-500/10 text-green-500', label: 'Good' };
      if (value <= warning) return { color: 'text-orange-600', badge: 'bg-orange-500/10 text-orange-500', label: 'Warning' };
      return { color: 'text-red-600', badge: 'bg-red-500/10 text-red-500', label: 'Poor' };
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">

          {/* Key Performance Indicators */}
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(financialMetrics.performance.revenue / 1000000).toFixed(1)}M
                </div>
                <div className="flex items-center text-xs text-green-500">
                  <TrendingUp className="size-3 mr-1" />
                  +{financialMetrics.performance.revenueGrowth}% YoY
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
                <BarChart3 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(financialMetrics.performance.ebitda / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">
                  {financialMetrics.performance.ebitdaMargin}% margin
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Free Cash Flow</CardTitle>
                <Activity className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(financialMetrics.performance.fcf / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">
                  Operating cash flow
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROE</CardTitle>
                <Percent className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialMetrics.profitability.roe}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Return on equity
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
                <Target className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialMetrics.liquidity.currentRatio}x
                </div>
                <div className="text-xs text-green-500">
                  Healthy liquidity
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Liquidity Ratios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-5" />
                  Liquidity Ratios
                </CardTitle>
                <CardDescription>
                  Ability to meet short-term obligations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Current Ratio</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.liquidity.currentRatio, 2, 1).color)}>
                        {financialMetrics.liquidity.currentRatio}x
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.liquidity.currentRatio, 2, 1).badge}>
                        {getRatioStatus(financialMetrics.liquidity.currentRatio, 2, 1).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min((financialMetrics.liquidity.currentRatio / 3) * 100, 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Quick Ratio</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.liquidity.quickRatio, 1.5, 1).color)}>
                        {financialMetrics.liquidity.quickRatio}x
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.liquidity.quickRatio, 1.5, 1).badge}>
                        {getRatioStatus(financialMetrics.liquidity.quickRatio, 1.5, 1).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min((financialMetrics.liquidity.quickRatio / 2) * 100, 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Cash Ratio</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.liquidity.cashRatio, 0.5, 0.2).color)}>
                        {financialMetrics.liquidity.cashRatio}x
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.liquidity.cashRatio, 0.5, 0.2).badge}>
                        {getRatioStatus(financialMetrics.liquidity.cashRatio, 0.5, 0.2).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min((financialMetrics.liquidity.cashRatio / 1) * 100, 100)} className="h-2" />
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Working Capital</span>
                    <span className="font-bold text-green-600">
                      ${(financialMetrics.liquidity.workingCapital / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profitability Ratios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Profitability Ratios
                </CardTitle>
                <CardDescription>
                  Efficiency in generating profits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gross Margin</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.profitability.grossMargin, 40, 25).color)}>
                        {financialMetrics.profitability.grossMargin}%
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.profitability.grossMargin, 40, 25).badge}>
                        {getRatioStatus(financialMetrics.profitability.grossMargin, 40, 25).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(financialMetrics.profitability.grossMargin, 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Operating Margin</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.profitability.operatingMargin, 15, 10).color)}>
                        {financialMetrics.profitability.operatingMargin}%
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.profitability.operatingMargin, 15, 10).badge}>
                        {getRatioStatus(financialMetrics.profitability.operatingMargin, 15, 10).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(financialMetrics.profitability.operatingMargin * 2, 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Net Margin</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.profitability.netMargin, 10, 5).color)}>
                        {financialMetrics.profitability.netMargin}%
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.profitability.netMargin, 10, 5).badge}>
                        {getRatioStatus(financialMetrics.profitability.netMargin, 10, 5).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(financialMetrics.profitability.netMargin * 3, 100)} className="h-2" />
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Return on Equity (ROE)</span>
                    <span className="font-bold text-green-600">{financialMetrics.profitability.roe}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Return on Assets (ROA)</span>
                    <span className="font-bold text-green-600">{financialMetrics.profitability.roa}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Efficiency Ratios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="size-5" />
                  Efficiency Ratios
                </CardTitle>
                <CardDescription>
                  Asset utilization and management effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Inventory Turnover</span>
                  <span className="font-bold">{financialMetrics.efficiency.inventoryTurnover}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Receivables Turnover</span>
                  <span className="font-bold">{financialMetrics.efficiency.receivablesTurnover}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Payables Turnover</span>
                  <span className="font-bold">{financialMetrics.efficiency.payablesTurnover}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Asset Turnover</span>
                  <span className="font-bold">{financialMetrics.efficiency.assetTurnover}x</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    <p>Days Sales Outstanding: <span className="font-semibold">{Math.round(365 / financialMetrics.efficiency.receivablesTurnover)} days</span></p>
                    <p>Days Inventory Outstanding: <span className="font-semibold">{Math.round(365 / financialMetrics.efficiency.inventoryTurnover)} days</span></p>
                    <p>Days Payables Outstanding: <span className="font-semibold">{Math.round(365 / financialMetrics.efficiency.payablesTurnover)} days</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leverage Ratios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5" />
                  Leverage Ratios
                </CardTitle>
                <CardDescription>
                  Financial leverage and debt management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Debt to Equity</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.leverage.debtToEquity, 0.5, 1, false).color)}>
                        {financialMetrics.leverage.debtToEquity}x
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.leverage.debtToEquity, 0.5, 1, false).badge}>
                        {getRatioStatus(financialMetrics.leverage.debtToEquity, 0.5, 1, false).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(financialMetrics.leverage.debtToEquity * 50, 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Debt to Assets</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.leverage.debtToAssets, 0.3, 0.5, false).color)}>
                        {financialMetrics.leverage.debtToAssets}x
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.leverage.debtToAssets, 0.3, 0.5, false).badge}>
                        {getRatioStatus(financialMetrics.leverage.debtToAssets, 0.3, 0.5, false).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(financialMetrics.leverage.debtToAssets * 100, 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Interest Coverage</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", getRatioStatus(financialMetrics.leverage.interestCoverage, 5, 2).color)}>
                        {financialMetrics.leverage.interestCoverage}x
                      </span>
                      <Badge variant="outline" className={getRatioStatus(financialMetrics.leverage.interestCoverage, 5, 2).badge}>
                        {getRatioStatus(financialMetrics.leverage.interestCoverage, 5, 2).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min((financialMetrics.leverage.interestCoverage / 10) * 100, 100)} className="h-2" />
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Equity Multiplier</span>
                    <span className="font-bold">{financialMetrics.leverage.equityMultiplier}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Financial Health Summary</CardTitle>
              <CardDescription>Overall assessment of financial position</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Strong liquidity position</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Healthy profit margins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Moderate leverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Good asset utilization</span>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Key Insights:</strong> The company demonstrates strong financial health with excellent liquidity ratios 
                    and healthy profit margins. The current ratio of 2.5x indicates robust short-term solvency. 
                    Profitability metrics are above industry averages, with a net margin of 12.7% and ROE of 15.2%. 
                    Leverage ratios suggest conservative debt management, providing room for strategic growth investments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}