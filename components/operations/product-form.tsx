'use client';

import { useState } from 'react';
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
import { type Product } from '@/lib/types/database';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  product?: Product | null;
  isLoading?: boolean;
}

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  product,
  isLoading = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>(() => ({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    isService: product?.isService ?? false,
    category: product?.category || '',
    salePrice: product?.salePrice || '',
    purchasePrice: product?.purchasePrice || '',
    unitOfMeasure: product?.unitOfMeasure || 'unit',
    isActive: product?.isActive ?? true,
    isTaxable: product?.isTaxable ?? true,
    isTrackedInventory: product?.isTrackedInventory ?? true,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
    setFormData({
      sku: '',
      name: '',
      description: '',
      isService: false,
      category: '',
      salePrice: '',
      purchasePrice: '',
      unitOfMeasure: 'unit',
      isActive: true,
      isTaxable: true,
      isTrackedInventory: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="PROD001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Product Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.isService ? 'service' : 'product'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isService: value === 'service' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Electronics, Accessories, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Sales Price</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.salePrice || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Cost</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">Unit</Label>
              <Select
                value={formData.unitOfMeasure}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unitOfMeasure: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Each</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="case">Case</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="lb">Pound</SelectItem>
                  <SelectItem value="ft">Foot</SelectItem>
                  <SelectItem value="m">Meter</SelectItem>
                  <SelectItem value="hour">Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Product description..."
              rows={3}
            />
          </div>


          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isTaxable"
                checked={formData.isTaxable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTaxable: checked }))}
              />
              <Label htmlFor="isTaxable">Taxable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isTrackedInventory"
                checked={formData.isTrackedInventory}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTrackedInventory: checked }))}
              />
              <Label htmlFor="isTrackedInventory">Track Inventory</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : product ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}