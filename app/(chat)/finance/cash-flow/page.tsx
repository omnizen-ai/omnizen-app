'use client';

export default function CashFlowPage() {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b">
        <h1 className="text-xl font-semibold">Cash Flow</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-2xl font-bold mb-4">Cash Flow Management</h2>
            <p className="text-muted-foreground">This feature is coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}