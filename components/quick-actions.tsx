'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { VisibilityType } from './visibility-selector';
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
  inputRef?: React.RefObject<HTMLTextAreaElement>;
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
    icon: <TrendingUp className="size-4" />,
    actions: [
      { 
        label: 'What were my top selling products last month?', 
        prompt: 'What were my top selling products last month and which categories performed best?',
        icon: <ChartBar className="size-4" />
      },
      { 
        label: 'Which customers generated the most revenue this quarter?', 
        prompt: 'Which customers generated the most revenue this quarter and what is their average order value?',
        icon: <Users className="size-4" />
      },
      { 
        label: 'How is my revenue trending compared to last year?', 
        prompt: 'How is my revenue trending compared to the same period last year?',
        icon: <TrendingUp className="size-4" />
      },
      { 
        label: 'What is my customer retention rate?', 
        prompt: 'What is my customer retention rate and churn rate over the past 6 months?',
        icon: <Users className="size-4" />
      },
      {
        label: 'Which marketing channels drive the most conversions?',
        prompt: 'Which marketing channels are driving the most conversions and what is the ROI for each?',
        icon: <TrendingUp className="size-4" />
      },
      {
        label: 'What is my average customer lifetime value?',
        prompt: 'What is my average customer lifetime value and how has it changed over time?',
        icon: <Calculator className="size-4" />
      },
      {
        label: 'Show me hourly sales patterns for optimization',
        prompt: 'Show me hourly and daily sales patterns to identify peak business hours for staffing optimization',
        icon: <FileText className="size-4" />
      },
    ],
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: <DollarSign className="size-4" />,
    actions: [
      { 
        label: 'What is my current cash position and runway?', 
        prompt: 'What is my current daily cash position and how many months of runway do I have at current burn rate?',
        icon: <Calculator className="size-4" />
      },
      { 
        label: 'Create an invoice for a new client', 
        prompt: 'Create a professional invoice for ',
        icon: <CreditCard className="size-4" />
      },
      { 
        label: 'Which invoices are overdue for collection?', 
        prompt: 'Which invoices are overdue and what is the total amount pending collection?',
        icon: <Receipt className="size-4" />
      },
      { 
        label: 'What are my biggest expense categories this month?', 
        prompt: 'What are my biggest expense categories this month and how do they compare to budget?',
        icon: <PiggyBank className="size-4" />
      },
      {
        label: 'Calculate my gross profit margin',
        prompt: 'Calculate my gross profit margin and net profit margin for this quarter',
        icon: <Calculator className="size-4" />
      },
      {
        label: 'How much should I save for quarterly taxes?',
        prompt: 'How much should I save for quarterly tax payments based on current revenue?',
        icon: <Wallet className="size-4" />
      },
      {
        label: 'Create a financial forecast for next quarter',
        prompt: 'Create a financial forecast for next quarter based on current trends and seasonality',
        icon: <TrendingUp className="size-4" />
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: <Settings className="size-4" />,
    actions: [
      { 
        label: 'Which products are running low on inventory?', 
        prompt: 'Which products are running low on inventory and need to be reordered?',
        icon: <Package className="size-4" />
      },
      { 
        label: 'Create a task for team member', 
        prompt: 'Create a new task: ',
        icon: <CheckSquare className="size-4" />
      },
      { 
        label: 'What is my inventory turnover rate?', 
        prompt: 'What is my inventory turnover rate and which products are moving slowly?',
        icon: <Package className="size-4" />
      },
      { 
        label: 'Show me productivity metrics by department', 
        prompt: 'Show me productivity metrics by department and identify any bottlenecks',
        icon: <Cpu className="size-4" />
      },
      {
        label: 'Which suppliers have the best delivery performance?',
        prompt: 'Which suppliers have the best on-time delivery performance and pricing?',
        icon: <UserCheck className="size-4" />
      },
      {
        label: 'Calculate optimal reorder points for products',
        prompt: 'Calculate optimal reorder points for my top products based on sales velocity',
        icon: <Calculator className="size-4" />
      },
      {
        label: 'Create a project timeline for new initiative',
        prompt: 'Create a project timeline with milestones for ',
        icon: <Calendar className="size-4" />
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: <ClipboardList className="size-4" />,
    actions: [
      { 
        label: 'Create quarterly goals with KPIs', 
        prompt: 'Create SMART goals for next quarter with specific KPIs to track',
        icon: <Target className="size-4" />
      },
      { 
        label: 'What should be my revenue target next month?', 
        prompt: 'What should be my revenue target for next month based on historical growth and seasonality?',
        icon: <TrendingUp className="size-4" />
      },
      { 
        label: 'Build a hiring plan for scaling', 
        prompt: 'Build a hiring plan for the next 6 months based on projected growth',
        icon: <Users className="size-4" />
      },
      { 
        label: 'What are my biggest business risks right now?', 
        prompt: 'What are my biggest business risks and how can I mitigate them?',
        icon: <AlertTriangle className="size-4" />
      },
      {
        label: 'Create a marketing campaign strategy',
        prompt: 'Create a marketing campaign strategy for ',
        icon: <Lightbulb className="size-4" />
      },
      {
        label: 'How much funding do I need for expansion?',
        prompt: 'How much funding do I need for expansion and what are my best financing options?',
        icon: <Calculator className="size-4" />
      },
      {
        label: 'Develop a customer acquisition strategy',
        prompt: 'Develop a customer acquisition strategy to reduce CAC and increase CLV',
        icon: <Users className="size-4" />
      },
    ],
  },
];

function PureQuickActions({
  chatId,
  setInput,
  selectedVisibilityType,
  inputRef,
}: QuickActionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedCategory(null);
      }
    };

    if (selectedCategory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedCategory]);

  const handleActionClick = (prompt: string) => {
    setInput(prompt);
    setSelectedCategory(null);
    
    // Focus the input and move cursor to the end
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
        // Move cursor to the end of the text
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const selectedCategoryData = actionCategories.find(cat => cat.id === selectedCategory);

  return (
    <div ref={containerRef} data-testid="quick-actions" className="flex justify-center w-full">
      <div className="w-[90%]">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-4 gap-2"
            >
              {actionCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategoryClick(category.id)}
                    className="w-full gap-2 rounded-lg border-border/50 hover:border-border transition-all duration-200 justify-center"
                  >
                    {category.icon}
                    <span className="text-sm">{category.label}</span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : selectedCategoryData ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border bg-background shadow-lg rounded-xl p-1"
            >
              {selectedCategoryData.actions.map((action, index) => (
                <motion.button
                  key={action.prompt}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * index }}
                  onClick={() => handleActionClick(action.prompt)}
                  className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-accent rounded-lg transition-colors text-left"
                >
                  {action.icon && <span className="text-muted-foreground opacity-70">{action.icon}</span>}
                  <span className="flex-1 text-sm">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
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