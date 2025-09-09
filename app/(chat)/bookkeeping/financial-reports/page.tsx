'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, DollarSign, PieChart, BarChart, Download } from 'lucide-react';

export default function FinancialReportsPage() {
  const reports = [
    {
      title: 'Balance Sheet',
      description: 'View assets, liabilities, and equity',
      icon: BarChart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Income Statement',
      description: 'Revenue, expenses, and profit analysis',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Cash Flow Statement',
      description: 'Operating, investing, and financing activities',
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Trial Balance',
      description: 'Account balances and verification',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'General Ledger Report',
      description: 'Detailed transaction history',
      icon: FileText,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Aging Reports',
      description: 'AR/AP aging analysis',
      icon: PieChart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      {/* Header */}
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b">
        <h1 className="text-xl font-semibold">Financial Reports</h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, index) => {
              const Icon = report.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${report.bgColor}`}>
                        <Icon className={`size-6 ${report.color}`} />
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="size-4" />
                      </Button>
                    </div>
                    <CardTitle className="mt-4">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <FileText className="mr-2 size-4" />
                Monthly Reports
              </Button>
              <Button variant="outline" size="sm">
                <TrendingUp className="mr-2 size-4" />
                Year-to-Date Analysis
              </Button>
              <Button variant="outline" size="sm">
                <PieChart className="mr-2 size-4" />
                Custom Report Builder
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                Export All Reports
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}