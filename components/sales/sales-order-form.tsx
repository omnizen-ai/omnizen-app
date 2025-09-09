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
import type { SalesOrder } from '@/lib/db/schema';

const salesOrderStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_fulfillment', label: 'In Fulfillment' },
  { value: 'partially_fulfilled', label: 'Partially Fulfilled' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'partially_invoiced', label: 'Partially Invoiced' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
] as const;

interface SalesOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  salesOrder?: any | null;
  customers?: any[];
  isLoading?: boolean;
}

export function SalesOrderForm({
  open,
  onOpenChange,
  onSubmit,
  salesOrder,
  customers = [],
  isLoading = false,
}: SalesOrderFormProps) {
  const [formData, setFormData] = useState<any>(() => ({
    orderNumber: salesOrder?.orderNumber || '',
    customerId: salesOrder?.customerId || '',
    orderDate: salesOrder?.orderDate ? new Date(salesOrder.orderDate) : new Date(),
    expectedDeliveryDate: salesOrder?.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate) : addDays(new Date(), 7),
    status: salesOrder?.status || 'draft',
    subtotal: salesOrder?.subtotal || '0',
    taxAmount: salesOrder?.taxAmount || '0',
    discountAmount: salesOrder?.discountAmount || '0',
    shippingAmount: salesOrder?.shippingAmount || '0',
    totalAmount: salesOrder?.totalAmount || '0',
    paymentTerms: salesOrder?.paymentTerms || 30,
    customerPoNumber: salesOrder?.customerPoNumber || '',
    internalNotes: salesOrder?.internalNotes || '',
    customerNotes: salesOrder?.customerNotes || '',
  }));

  const [orderDate, setOrderDate] = useState<Date>();
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>();

  useEffect(() => {
    if (salesOrder) {
      setFormData({
        orderNumber: salesOrder.orderNumber || '',
        customerId: salesOrder.customerId || '',
        orderDate: salesOrder.orderDate ? new Date(salesOrder.orderDate) : new Date(),
        expectedDeliveryDate: salesOrder.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate) : addDays(new Date(), 7),
        status: salesOrder.status || 'draft',
        subtotal: salesOrder.subtotal || '0',
        taxAmount: salesOrder.taxAmount || '0',
        discountAmount: salesOrder.discountAmount || '0',
        shippingAmount: salesOrder.shippingAmount || '0',
        totalAmount: salesOrder.totalAmount || '0',
        paymentTerms: salesOrder.paymentTerms || 30,
        customerPoNumber: salesOrder.customerPoNumber || '',
        internalNotes: salesOrder.internalNotes || '',
        customerNotes: salesOrder.customerNotes || '',
      });
      setOrderDate(salesOrder.orderDate ? new Date(salesOrder.orderDate) : new Date());
      setExpectedDeliveryDate(salesOrder.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate) : addDays(new Date(), 7));
    }
  }, [salesOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        ...formData,
        orderDate: orderDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        expectedDeliveryDate: expectedDeliveryDate?.toISOString().split('T')[0] || addDays(new Date(), 7).toISOString().split('T')[0],
      });
      
      // Reset form if creating new sales order
      if (!salesOrder) {
        setFormData({
          orderNumber: '',
          customerId: '',
          orderDate: new Date(),
          expectedDeliveryDate: addDays(new Date(), 7),
          status: 'draft',
          subtotal: '0',
          taxAmount: '0',
          discountAmount: '0',
          shippingAmount: '0',
          totalAmount: '0',
          paymentTerms: 30,
          customerPoNumber: '',
          internalNotes: '',
          customerNotes: '',
        });
        setOrderDate(new Date());
        setExpectedDeliveryDate(addDays(new Date(), 7));
      }
    } catch (error) {
      console.error('Error submitting sales order:', error);
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
            {salesOrder ? 'Edit Sales Order' : 'New Sales Order'}
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
                  {salesOrderStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerId">Customer (Required)</Label>
            <Select value={formData.customerId} onValueChange={(value) => updateFormData('customerId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.companyName || customer.name}
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
              <Label>Expected Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedDeliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedDeliveryDate ? format(expectedDeliveryDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedDeliveryDate}
                    onSelect={setExpectedDeliveryDate}
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
              <Label htmlFor="customerPoNumber">Customer PO Number</Label>
              <Input
                id="customerPoNumber"
                value={formData.customerPoNumber}
                onChange={(e) => updateFormData('customerPoNumber', e.target.value)}
                placeholder="Customer's purchase order number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerNotes">Customer Notes</Label>
            <Textarea
              id="customerNotes"
              value={formData.customerNotes}
              onChange={(e) => updateFormData('customerNotes', e.target.value)}
              rows={3}
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
              {isLoading ? 'Saving...' : salesOrder ? 'Update' : 'Create'} Sales Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}