'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Settings, 
  ClipboardList,
  ChartBar,
  Users,
  FileText,
  Calculator,
  CreditCard,
  PiggyBank,
  Receipt,
  Wallet,
  Package,
  CheckSquare,
  Cpu,
  UserCheck,
  Target,
  Calendar,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface QuickActionsProps {
  chatId: string;
  setInput: Dispatch<SetStateAction<string>>;
  selectedVisibilityType: VisibilityType;
}

interface ActionCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  actions: Array<{
    label: string;
    prompt: string;
    icon?: React.ReactNode;
  }>;
}

const actionCategories: ActionCategory[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp className="h-4 w-4" />,
    actions: [
      { 
        label: 'Revenue Report', 
        prompt: 'Show me a detailed revenue report for the current period',
        icon: <ChartBar className="h-4 w-4" />
      },
      { 
        label: 'Customer Insights', 
        prompt: 'Analyze my customer data and provide key insights',
        icon: <Users className="h-4 w-4" />
      },
      { 
        label: 'Performance Metrics', 
        prompt: 'Display key performance metrics and KPIs',
        icon: <TrendingUp className="h-4 w-4" />
      },
      { 
        label: 'Trend Analysis', 
        prompt: 'Analyze business trends and patterns over time',
        icon: <FileText className="h-4 w-4" />
      },
    ],
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: <DollarSign className="h-4 w-4" />,
    actions: [
      { 
        label: 'Cash Flow Analysis', 
        prompt: 'Analyze cash flow for the current quarter',
        icon: <Calculator className="h-4 w-4" />
      },
      { 
        label: 'Invoice Management', 
        prompt: 'Show all pending invoices and their status',
        icon: <CreditCard className="h-4 w-4" />
      },
      { 
        label: 'Budget Planning', 
        prompt: 'Help me plan and optimize my budget',
        icon: <PiggyBank className="h-4 w-4" />
      },
      { 
        label: 'Expense Tracking', 
        prompt: 'Track and categorize business expenses',
        icon: <Receipt className="h-4 w-4" />
      },
      {
        label: 'Financial Summary',
        prompt: 'Provide a comprehensive financial summary',
        icon: <Wallet className="h-4 w-4" />
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: <Settings className="h-4 w-4" />,
    actions: [
      { 
        label: 'Inventory Status', 
        prompt: 'Check current inventory levels and alerts',
        icon: <Package className="h-4 w-4" />
      },
      { 
        label: 'Task Management', 
        prompt: 'Show all active tasks and their priorities',
        icon: <CheckSquare className="h-4 w-4" />
      },
      { 
        label: 'Process Optimization', 
        prompt: 'Identify areas for process improvement',
        icon: <Cpu className="h-4 w-4" />
      },
      { 
        label: 'Resource Allocation', 
        prompt: 'Analyze and optimize resource allocation',
        icon: <UserCheck className="h-4 w-4" />
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: <ClipboardList className="h-4 w-4" />,
    actions: [
      { 
        label: 'Goal Setting', 
        prompt: 'Help me set and track business goals',
        icon: <Target className="h-4 w-4" />
      },
      { 
        label: 'Forecasting', 
        prompt: 'Generate business forecasts based on current data',
        icon: <Calendar className="h-4 w-4" />
      },
      { 
        label: 'Risk Assessment', 
        prompt: 'Identify and assess business risks',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      { 
        label: 'Strategy Development', 
        prompt: 'Develop strategic plans for business growth',
        icon: <Lightbulb className="h-4 w-4" />
      },
    ],
  },
];

function PureQuickActions({
  chatId,
  setInput,
  selectedVisibilityType,
}: QuickActionsProps) {
  const handleActionClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div data-testid="quick-actions" className="flex justify-center w-full">
      <div className="grid grid-cols-4 gap-2 w-[90%]">
        {actionCategories.map((category, index) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          className="w-full"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 rounded-lg border-border/50 hover:border-border transition-all duration-200 justify-center"
              >
                {category.icon}
                <span className="text-sm">{category.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="bottom" 
              align="center"
              className="w-64 mt-2"
              sideOffset={8}
            >
              {category.actions.map((action) => (
                <DropdownMenuItem
                  key={action.prompt}
                  onClick={() => handleActionClick(action.prompt)}
                  className="cursor-pointer gap-2 py-2"
                >
                  {action.icon && <span className="text-muted-foreground">{action.icon}</span>}
                  <span className="flex-1">{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
        ))}
      </div>
    </div>
  );
}

export const QuickActions = memo(
  PureQuickActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);