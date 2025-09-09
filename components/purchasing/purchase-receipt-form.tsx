'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const receiptStatuses = [
  { value: 'received', label: 'Received' },
  { value: 'inspecting', label: 'Inspecting' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
] as const;

interface PurchaseReceiptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  receipt?: any | null;
  isLoading?: boolean;
}

export function PurchaseReceiptForm({
  open,
  onOpenChange,
  onSubmit,
  receipt,
  isLoading = false,
}: PurchaseReceiptFormProps) {
  const [formData, setFormData] = useState<any>(() => ({
    purchaseOrderId: receipt?.purchaseOrderId || '',
    warehouseId: receipt?.warehouseId || '',
    receiptNumber: receipt?.receiptNumber || '',
    receiptDate: receipt?.receiptDate ? new Date(receipt.receiptDate) : new Date(),
    status: receipt?.status || 'received',
    vendorDeliveryNote: receipt?.vendorDeliveryNote || '',
    qualityCheckRequired: receipt?.qualityCheckRequired || false,
    qualityCheckCompleted: receipt?.qualityCheckCompleted || false,
    qualityCheckNotes: receipt?.qualityCheckNotes || '',
    notes: receipt?.notes || '',
  }));

  const [receiptDate, setReceiptDate] = useState<Date>();

  useEffect(() => {
    if (receipt) {
      setFormData({
        purchaseOrderId: receipt.purchaseOrderId || '',
        warehouseId: receipt.warehouseId || '',
        receiptNumber: receipt.receiptNumber || '',
        receiptDate: receipt.receiptDate ? new Date(receipt.receiptDate) : new Date(),
        status: receipt.status || 'received',
        vendorDeliveryNote: receipt.vendorDeliveryNote || '',
        qualityCheckRequired: receipt.qualityCheckRequired || false,
        qualityCheckCompleted: receipt.qualityCheckCompleted || false,
        qualityCheckNotes: receipt.qualityCheckNotes || '',
        notes: receipt.notes || '',
      });
      setReceiptDate(receipt.receiptDate ? new Date(receipt.receiptDate) : new Date());
    }
  }, [receipt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        ...formData,
        receiptDate: receiptDate?.toISOString() || new Date().toISOString(),
      });
      
      // Reset form if creating new receipt
      if (!receipt) {
        setFormData({
          purchaseOrderId: '',
          warehouseId: '',
          receiptNumber: '',
          receiptDate: new Date(),
          status: 'received',
          vendorDeliveryNote: '',
          qualityCheckRequired: false,
          qualityCheckCompleted: false,
          qualityCheckNotes: '',
          notes: '',
        });
        setReceiptDate(new Date());
      }
    } catch (error) {
      console.error('Error submitting purchase receipt:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {receipt ? 'Edit Purchase Receipt' : 'New Purchase Receipt'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => updateFormData('receiptNumber', e.target.value)}
                placeholder="Auto-generated if empty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {receiptStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Receipt Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !receiptDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {receiptDate ? format(receiptDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={receiptDate}
                  onSelect={setReceiptDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseOrderId">Purchase Order ID (Required)</Label>
            <Input
              id="purchaseOrderId"
              value={formData.purchaseOrderId}
              onChange={(e) => updateFormData('purchaseOrderId', e.target.value)}
              placeholder="Purchase Order UUID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouseId">Warehouse ID (Required)</Label>
            <Input
              id="warehouseId"
              value={formData.warehouseId}
              onChange={(e) => updateFormData('warehouseId', e.target.value)}
              placeholder="Warehouse UUID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorDeliveryNote">Vendor Delivery Note</Label>
            <Input
              id="vendorDeliveryNote"
              value={formData.vendorDeliveryNote}
              onChange={(e) => updateFormData('vendorDeliveryNote', e.target.value)}
              placeholder="Vendor's delivery note reference"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="qualityCheckRequired"
                checked={formData.qualityCheckRequired}
                onCheckedChange={(checked) => updateFormData('qualityCheckRequired', checked)}
              />
              <Label htmlFor="qualityCheckRequired">Quality Check Required</Label>
            </div>

            {formData.qualityCheckRequired && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="qualityCheckCompleted"
                    checked={formData.qualityCheckCompleted}
                    onCheckedChange={(checked) => updateFormData('qualityCheckCompleted', checked)}
                  />
                  <Label htmlFor="qualityCheckCompleted">Quality Check Completed</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualityCheckNotes">Quality Check Notes</Label>
                  <Textarea
                    id="qualityCheckNotes"
                    value={formData.qualityCheckNotes}
                    onChange={(e) => updateFormData('qualityCheckNotes', e.target.value)}
                    rows={3}
                    placeholder="Quality inspection notes..."
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">General Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={3}
              placeholder="General notes about this receipt..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : receipt ? 'Update' : 'Create'} Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}