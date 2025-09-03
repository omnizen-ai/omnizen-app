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
import { Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: () => void;
}

export function NoBankAccountDialog({
  open,
  onOpenChange,
  onCreateAccount,
}: NoBankAccountDialogProps) {
  const handleCreateAccount = () => {
    onOpenChange(false);
    // Small delay to allow dialog to close smoothly before opening the next one
    setTimeout(() => {
      onCreateAccount();
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-orange-100 p-3">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">No Bank Accounts Found</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            You need to set up at least one bank account before you can record transactions.
            Bank accounts help you track cash flow and maintain accurate financial records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Why do I need a bank account?</strong>
              <ul className="mt-2 ml-4 space-y-1 text-sm">
                <li>• Track deposits and withdrawals</li>
                <li>• Monitor cash balances in real-time</li>
                <li>• Reconcile bank statements</li>
                <li>• Generate accurate cash flow reports</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Quick Setup</h4>
            <p className="text-sm text-muted-foreground">
              It only takes a minute to add your first bank account. You can add multiple 
              accounts for different purposes like checking, savings, or credit cards.
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
            onClick={handleCreateAccount}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Create Bank Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}