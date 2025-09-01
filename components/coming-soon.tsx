import { Clock } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Clock className="size-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-xl text-muted-foreground mb-4">Coming Soon</p>
      {description && (
        <p className="text-muted-foreground max-w-md">
          {description}
        </p>
      )}
    </div>
  );
}