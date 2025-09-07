import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingComponent: React.FC = () => {
  return (
    <div className="cursor-default px-3 py-2 flex items-center">
      <Loader2 className="w-4 h-4 mr-2 text-muted-foreground animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
};