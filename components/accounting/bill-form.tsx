'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Bill } from '@/lib/db/schema/index';

const billStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Bill>) => void;
  bill?: Bill | null;
  isLoading?: boolean;
}

export function BillForm({
  open,
  onOpenChange,
  onSubmit,
  bill,
  isLoading = false,
}: BillFormProps) {
  const [formData, setFormData] = useState<Partial<Bill>>({
    billNumber: '',
    vendorId: '',
    vendorInvoiceNumber: '',
    billDate: new Date(),
    dueDate: new Date(),
    subtotal: '0.00',
    taxAmount: '0.00',
    discountAmount: '0.00',
    totalAmount: '0.00',
    status: 'draft',
    notes: '',
    poNumber: '',
  });

  useEffect(() => {
    if (bill) {
      setFormData({
        billNumber: bill.billNumber,
        vendorId: bill.vendorId,
        vendorInvoiceNumber: bill.vendorInvoiceNumber,
        billDate: new Date(bill.billDate),
        dueDate: new Date(bill.dueDate),
        subtotal: bill.subtotal,
        taxAmount: bill.taxAmount,
        discountAmount: bill.discountAmount,
        totalAmount: bill.totalAmount,
        status: bill.status,
        notes: bill.notes,
        poNumber: bill.poNumber,
      });
    } else {
      // Generate next bill number (in production, this should come from the API)
      const nextBillNumber = `BILL-${Date.now().toString().slice(-6)}`;
      setFormData({
        billNumber: nextBillNumber,
        vendorId: '',
        vendorInvoiceNumber: '',
        billDate: new Date(),
        dueDate: new Date(),
        subtotal: '0.00',
        taxAmount: '0.00',
        discountAmount: '0.00',
        totalAmount: '0.00',
        status: 'draft',
        notes: '',
        poNumber: '',
      });
    }
  }, [bill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof Bill, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate total if amounts change
      if (['subtotal', 'taxAmount', 'discountAmount'].includes(field)) {
        const subtotal = parseFloat(updated.subtotal || '0');
        const tax = parseFloat(updated.taxAmount || '0');
        const discount = parseFloat(updated.discountAmount || '0');
        updated.totalAmount = (subtotal + tax - discount).toFixed(2);
      }
      
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{bill ? 'Edit Bill' : 'Create Bill'}</DialogTitle>
            <DialogDescription>
              {bill 
                ? 'Update the bill details below.' 
                : 'Enter the vendor bill information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billNumber">Bill Number *</Label>
                <Input
                  id="billNumber"
                  value={formData.billNumber}
                  onChange={(e) => handleChange('billNumber', e.target.value)}
                  placeholder="BILL-001"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorInvoiceNumber">Vendor Invoice #</Label>
                <Input
                  id="vendorInvoiceNumber"
                  value={formData.vendorInvoiceNumber || ''}
                  onChange={(e) => handleChange('vendorInvoiceNumber', e.target.value)}
                  placeholder="INV-12345"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor *</Label>
              <Input
                id="vendorId"
                value={formData.vendorId}
                onChange={(e) => handleChange('vendorId', e.target.value)}
                placeholder="Select or enter vendor ID"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bill Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.billDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.billDate ? format(formData.billDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.billDate}
                      onSelect={(date) => handleChange('billDate', date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => handleChange('dueDate', date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber || ''}
                  onChange={(e) => handleChange('poNumber', e.target.value)}
                  placeholder="PO-001"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {billStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => handleChange('subtotal', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxAmount">Tax</Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => handleChange('taxAmount', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Discount</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) => handleChange('discountAmount', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => handleChange('totalAmount', e.target.value)}
                  className="text-lg font-semibold"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes..."
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (bill ? 'Updating...' : 'Creating...') 
                : (bill ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}