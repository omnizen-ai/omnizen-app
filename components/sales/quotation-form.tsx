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
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const quotationStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

interface QuotationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  quotation?: any | null;
  isLoading?: boolean;
}

export function QuotationForm({
  open,
  onOpenChange,
  onSubmit,
  quotation,
  isLoading = false,
}: QuotationFormProps) {
  const [formData, setFormData] = useState<any>(() => ({
    quotationNumber: quotation?.quotationNumber || '',
    customerId: quotation?.customerId || '',
    quotationDate: quotation?.quotationDate ? new Date(quotation.quotationDate) : new Date(),
    validUntil: quotation?.validUntil ? new Date(quotation.validUntil) : addDays(new Date(), 30),
    status: quotation?.status || 'draft',
    subtotal: quotation?.subtotal || '0',
    taxAmount: quotation?.taxAmount || '0',
    discountAmount: quotation?.discountAmount || '0',
    discountPercent: quotation?.discountPercent || '0',
    total: quotation?.total || '0',
    paymentTerms: quotation?.paymentTerms || '',
    deliveryTerms: quotation?.deliveryTerms || '',
    terms: quotation?.terms || '',
    notes: quotation?.notes || '',
    internalNotes: quotation?.internalNotes || '',
  }));

  const [quotationDate, setQuotationDate] = useState<Date>();
  const [validUntilDate, setValidUntilDate] = useState<Date>();

  useEffect(() => {
    if (quotation) {
      setFormData({
        quotationNumber: quotation.quotationNumber || '',
        customerId: quotation.customerId || '',
        quotationDate: quotation.quotationDate ? new Date(quotation.quotationDate) : new Date(),
        validUntil: quotation.validUntil ? new Date(quotation.validUntil) : addDays(new Date(), 30),
        status: quotation.status || 'draft',
        subtotal: quotation.subtotal || '0',
        taxAmount: quotation.taxAmount || '0',
        discountAmount: quotation.discountAmount || '0',
        discountPercent: quotation.discountPercent || '0',
        total: quotation.total || '0',
        paymentTerms: quotation.paymentTerms || '',
        deliveryTerms: quotation.deliveryTerms || '',
        terms: quotation.terms || '',
        notes: quotation.notes || '',
        internalNotes: quotation.internalNotes || '',
      });
      setQuotationDate(quotation.quotationDate ? new Date(quotation.quotationDate) : new Date());
      setValidUntilDate(quotation.validUntil ? new Date(quotation.validUntil) : addDays(new Date(), 30));
    }
  }, [quotation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        ...formData,
        quotationDate: quotationDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        validUntil: validUntilDate?.toISOString().split('T')[0] || addDays(new Date(), 30).toISOString().split('T')[0],
      });
      
      // Reset form if creating new quotation
      if (!quotation) {
        setFormData({
          quotationNumber: '',
          customerId: '',
          quotationDate: new Date(),
          validUntil: addDays(new Date(), 30),
          status: 'draft',
          subtotal: '0',
          taxAmount: '0',
          discountAmount: '0',
          discountPercent: '0',
          total: '0',
          paymentTerms: '',
          deliveryTerms: '',
          terms: '',
          notes: '',
          internalNotes: '',
        });
        setQuotationDate(new Date());
        setValidUntilDate(addDays(new Date(), 30));
      }
    } catch (error) {
      console.error('Error submitting quotation:', error);
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
            {quotation ? 'Edit Quotation' : 'New Quotation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quotationNumber">Quotation Number</Label>
              <Input
                id="quotationNumber"
                value={formData.quotationNumber}
                onChange={(e) => updateFormData('quotationNumber', e.target.value)}
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
                  {quotationStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quotation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !quotationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {quotationDate ? format(quotationDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={quotationDate}
                    onSelect={setQuotationDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validUntilDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntilDate ? format(validUntilDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validUntilDate}
                    onSelect={setValidUntilDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID (Required)</Label>
            <Input
              id="customerId"
              value={formData.customerId}
              onChange={(e) => updateFormData('customerId', e.target.value)}
              placeholder="Customer UUID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => updateFormData('paymentTerms', e.target.value)}
                placeholder="e.g., Net 30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryTerms">Delivery Terms</Label>
              <Input
                id="deliveryTerms"
                value={formData.deliveryTerms}
                onChange={(e) => updateFormData('deliveryTerms', e.target.value)}
                placeholder="e.g., FOB Origin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => updateFormData('terms', e.target.value)}
              rows={3}
              placeholder="General terms and conditions..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Customer Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={2}
              placeholder="Notes visible to customer..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) => updateFormData('internalNotes', e.target.value)}
              rows={2}
              placeholder="Internal notes (not visible to customer)..."
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
              {isLoading ? 'Saving...' : quotation ? 'Update' : 'Create'} Quotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}