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
import type { PurchaseOrder } from '@/lib/db/schema';

const purchaseOrderStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'partially_billed', label: 'Partially Billed' },
  { value: 'billed', label: 'Billed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
] as const;

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  purchaseOrder?: any | null;
  vendors?: any[];
  isLoading?: boolean;
}

export function PurchaseOrderForm({
  open,
  onOpenChange,
  onSubmit,
  purchaseOrder,
  vendors = [],
  isLoading = false,
}: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState<any>(() => ({
    orderNumber: purchaseOrder?.orderNumber || '',
    vendorId: purchaseOrder?.vendorId || '',
    orderDate: purchaseOrder?.orderDate ? new Date(purchaseOrder.orderDate) : new Date(),
    expectedReceiptDate: purchaseOrder?.expectedReceiptDate ? new Date(purchaseOrder.expectedReceiptDate) : addDays(new Date(), 14),
    status: purchaseOrder?.status || 'draft',
    subtotal: purchaseOrder?.subtotal || '0',
    taxAmount: purchaseOrder?.taxAmount || '0',
    discountAmount: purchaseOrder?.discountAmount || '0',
    shippingAmount: purchaseOrder?.shippingAmount || '0',
    totalAmount: purchaseOrder?.totalAmount || '0',
    paymentTerms: purchaseOrder?.paymentTerms || 30,
    vendorReferenceNumber: purchaseOrder?.vendorReferenceNumber || '',
    requisitionNumber: purchaseOrder?.requisitionNumber || '',
    internalNotes: purchaseOrder?.internalNotes || '',
    vendorNotes: purchaseOrder?.vendorNotes || '',
  }));

  const [orderDate, setOrderDate] = useState<Date>();
  const [expectedReceiptDate, setExpectedReceiptDate] = useState<Date>();

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        orderNumber: purchaseOrder.orderNumber || '',
        vendorId: purchaseOrder.vendorId || '',
        orderDate: purchaseOrder.orderDate ? new Date(purchaseOrder.orderDate) : new Date(),
        expectedReceiptDate: purchaseOrder.expectedReceiptDate ? new Date(purchaseOrder.expectedReceiptDate) : addDays(new Date(), 14),
        status: purchaseOrder.status || 'draft',
        subtotal: purchaseOrder.subtotal || '0',
        taxAmount: purchaseOrder.taxAmount || '0',
        discountAmount: purchaseOrder.discountAmount || '0',
        shippingAmount: purchaseOrder.shippingAmount || '0',
        totalAmount: purchaseOrder.totalAmount || '0',
        paymentTerms: purchaseOrder.paymentTerms || 30,
        vendorReferenceNumber: purchaseOrder.vendorReferenceNumber || '',
        requisitionNumber: purchaseOrder.requisitionNumber || '',
        internalNotes: purchaseOrder.internalNotes || '',
        vendorNotes: purchaseOrder.vendorNotes || '',
      });
      setOrderDate(purchaseOrder.orderDate ? new Date(purchaseOrder.orderDate) : new Date());
      setExpectedReceiptDate(purchaseOrder.expectedReceiptDate ? new Date(purchaseOrder.expectedReceiptDate) : addDays(new Date(), 14));
    }
  }, [purchaseOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        ...formData,
        orderDate: orderDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        expectedReceiptDate: expectedReceiptDate?.toISOString().split('T')[0] || addDays(new Date(), 14).toISOString().split('T')[0],
      });
      
      // Reset form if creating new purchase order
      if (!purchaseOrder) {
        setFormData({
          orderNumber: '',
          vendorId: '',
          orderDate: new Date(),
          expectedReceiptDate: addDays(new Date(), 14),
          status: 'draft',
          subtotal: '0',
          taxAmount: '0',
          discountAmount: '0',
          shippingAmount: '0',
          totalAmount: '0',
          paymentTerms: 30,
          vendorReferenceNumber: '',
          requisitionNumber: '',
          internalNotes: '',
          vendorNotes: '',
        });
        setOrderDate(new Date());
        setExpectedReceiptDate(addDays(new Date(), 14));
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
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
            {purchaseOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => updateFormData('orderNumber', e.target.value)}
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
                  {purchaseOrderStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorId">Vendor (Required)</Label>
            <Select value={formData.vendorId} onValueChange={(value) => updateFormData('vendorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.companyName || vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !orderDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {orderDate ? format(orderDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    onSelect={setOrderDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Expected Receipt Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedReceiptDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedReceiptDate ? format(expectedReceiptDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedReceiptDate}
                    onSelect={setExpectedReceiptDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => updateFormData('paymentTerms', parseInt(e.target.value) || 30)}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorReferenceNumber">Vendor Reference Number</Label>
              <Input
                id="vendorReferenceNumber"
                value={formData.vendorReferenceNumber}
                onChange={(e) => updateFormData('vendorReferenceNumber', e.target.value)}
                placeholder="Vendor's PO reference"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requisitionNumber">Requisition Number</Label>
            <Input
              id="requisitionNumber"
              value={formData.requisitionNumber}
              onChange={(e) => updateFormData('requisitionNumber', e.target.value)}
              placeholder="Internal requisition number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorNotes">Vendor Notes</Label>
            <Textarea
              id="vendorNotes"
              value={formData.vendorNotes}
              onChange={(e) => updateFormData('vendorNotes', e.target.value)}
              rows={3}
              placeholder="Notes visible to vendor..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) => updateFormData('internalNotes', e.target.value)}
              rows={2}
              placeholder="Internal notes (not visible to vendor)..."
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
              {isLoading ? 'Saving...' : purchaseOrder ? 'Update' : 'Create'} Purchase Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}