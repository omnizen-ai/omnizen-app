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
import { Truck, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateVendor: () => void;
}

export function NoVendorDialog({
  open,
  onOpenChange,
  onCreateVendor,
}: NoVendorDialogProps) {
  const handleCreateVendor = () => {
    onOpenChange(false);
    // Small delay to allow dialog to close smoothly before opening the next one
    setTimeout(() => {
      onCreateVendor();
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-orange-100 p-3">
              <Truck className="size-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">No Vendors Found</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            You need to set up at least one vendor before you can create purchase documents.
            Vendors help you track who you&apos;re buying from and manage your supply chain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              <strong>Why do I need a vendor?</strong>
              <ul className="mt-2 ml-4 space-y-1 text-sm">
                <li>• Create purchase orders and bills</li>
                <li>• Track vendor information and history</li>
                <li>• Manage purchase receipts and payments</li>
                <li>• Monitor vendor performance</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Quick Setup</h4>
            <p className="text-sm text-muted-foreground">
              It only takes a minute to add your first vendor. You can add basic 
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
            onClick={handleCreateVendor}
            className="gap-2"
          >
            <Truck className="size-4" />
            Create Vendor
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}