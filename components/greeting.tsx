import { motion } from 'framer-motion';

const quickActionSuggestions = [
  "What were my top selling products last month?",
  "Which customers generated the most revenue this quarter?",
  "How is my revenue trending compared to last year?",
  "What is my current cash position and runway?",
  "Which invoices are overdue for payment?",
  "What is my gross profit margin this month?",
  "What are my operational bottlenecks right now?",
  "Which suppliers have the best lead times?",
  "How can I reduce my operational costs?",
  "What is my customer retention rate?",
  "Which marketing channels drive the most conversions?",
  "What is my average customer lifetime value?",
  "Show me hourly sales patterns for optimization",
  "How can I improve my inventory turnover?",
  "What are the risks in my supply chain?",
  "Create a marketing campaign strategy",
  "How much funding do I need for expansion?",
  "Develop a customer acquisition strategy",
];

export const Greeting = () => {
  // Randomly select a different suggestion each time the component renders
  // Not using useMemo here so it changes on every render
  const randomIndex = Math.floor(Math.random() * quickActionSuggestions.length);
  const suggestion = quickActionSuggestions[randomIndex];

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Hey partner!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        Try asking: "{suggestion}"
      </motion.div>
    </div>
  );
};
