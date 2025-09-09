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
import { Package, ArrowRight, AlertCircle, Warehouse as WarehouseIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProduct: () => void;
  onCreateWarehouse: () => void;
}

export function NoInventoryDialog({
  open,
  onOpenChange,
  onCreateProduct,
  onCreateWarehouse,
}: NoInventoryDialogProps) {
  const handleCreateProduct = () => {
    onOpenChange(false);
    // Small delay to allow dialog to close smoothly before opening the next one
    setTimeout(() => {
      onCreateProduct();
    }, 150);
  };

  const handleCreateWarehouse = () => {
    onOpenChange(false);
    // Small delay to allow dialog to close smoothly before opening the next one
    setTimeout(() => {
      onCreateWarehouse();
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-orange-100 p-3">
              <Package className="size-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">No Inventory Found</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            You need to set up products and warehouses before you can track inventory.
            Products and warehouses are essential for managing your stock levels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              <strong>Why do I need products and warehouses?</strong>
              <ul className="mt-2 ml-4 space-y-1 text-sm">
                <li>• Track product quantities across locations</li>
                <li>• Monitor stock levels and reorder points</li>
                <li>• Manage inventory movements and adjustments</li>
                <li>• Generate accurate inventory reports</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Quick Setup</h4>
            <p className="text-sm text-muted-foreground">
              Start by creating your first product or setting up a warehouse. You can 
              add multiple products and warehouses to organize your inventory effectively.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateWarehouse}
              variant="outline"
              className="gap-2"
            >
              <WarehouseIcon className="size-4" />
              Set Up Warehouse
            </Button>
            <Button
              onClick={handleCreateProduct}
              className="gap-2"
            >
              <Package className="size-4" />
              Add Product
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}