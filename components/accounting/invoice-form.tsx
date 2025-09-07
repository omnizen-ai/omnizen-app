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
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/types/database';

const invoiceStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Invoice>) => void;
  invoice?: Invoice | null;
  isLoading?: boolean;
}

export function InvoiceForm({
  open,
  onOpenChange,
  onSubmit,
  invoice,
  isLoading = false,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    customerId: '',
    issueDate: new Date(),
    dueDate: addDays(new Date(), 30), // Default to 30 days payment terms
    subtotal: '0.00',
    taxAmount: '0.00',
    discountAmount: '0.00',
    totalAmount: '0.00',
    status: 'draft',
    notes: '',
    terms: 'Payment is due within 30 days',
    poNumber: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        notes: invoice.notes,
        terms: invoice.terms,
        poNumber: invoice.poNumber,
      });
    } else {
      // Generate next invoice number (in production, this should come from the API)
      const nextInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      setFormData({
        invoiceNumber: nextInvoiceNumber,
        customerId: '',
        issueDate: new Date(),
        dueDate: addDays(new Date(), 30),
        subtotal: '0.00',
        taxAmount: '0.00',
        discountAmount: '0.00',
        totalAmount: '0.00',
        status: 'draft',
        notes: '',
        terms: 'Payment is due within 30 days',
        poNumber: '',
      });
    }
  }, [invoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof Invoice, value: any) => {
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
      <DialogContent className="sm:max-w-screen-toast-mobile max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
            <DialogDescription>
              {invoice 
                ? 'Update the invoice details below.' 
                : 'Enter the customer invoice information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  placeholder="INV-001"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber || ''}
                  onChange={(e) => handleChange('poNumber', e.target.value)}
                  placeholder="PO-12345"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Input
                id="customerId"
                value={formData.customerId}
                onChange={(e) => handleChange('customerId', e.target.value)}
                placeholder="Select or enter customer ID"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.issueDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {formData.issueDate ? format(formData.issueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.issueDate}
                      onSelect={(date) => handleChange('issueDate', date || new Date())}
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
                      <CalendarIcon className="mr-2 size-4" />
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'draft'}
                onValueChange={(value) => handleChange('status', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {invoiceStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="terms">Payment Terms</Label>
              <Textarea
                id="terms"
                value={formData.terms || ''}
                onChange={(e) => handleChange('terms', e.target.value)}
                placeholder="Payment terms and conditions..."
                disabled={isLoading}
                rows={2}
              />
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
                ? (invoice ? 'Updating...' : 'Creating...') 
                : (invoice ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}