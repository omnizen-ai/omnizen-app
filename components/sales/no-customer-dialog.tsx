'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCustomer: () => void;
}

export function NoCustomerDialog({
  open,
  onOpenChange,
  onCreateCustomer,
}: NoCustomerDialogProps) {
  const handleCreateCustomer = () => {
    onOpenChange(false);
    // Small delay to allow dialog to close smoothly before opening the next one
    setTimeout(() => {
      onCreateCustomer();
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-orange-100 p-3">
              <Users className="size-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">No Customers Found</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            You need to set up at least one customer before you can create sales documents.
            Customers help you track who you&apos;re selling to and manage your sales pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              <strong>Why do I need a customer?</strong>
              <ul className="mt-2 ml-4 space-y-1 text-sm">
                <li>• Create quotations and sales orders</li>
                <li>• Track customer information and history</li>
                <li>• Generate invoices and receipts</li>
                <li>• Manage customer relationships</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Quick Setup</h4>
            <p className="text-sm text-muted-foreground">
              It only takes a minute to add your first customer. You can add basic 
              information now and complete the details later.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCustomer}
            className="gap-2"
          >
            <Users className="size-4" />
            Create Customer
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}