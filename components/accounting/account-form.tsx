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
import { Switch } from '@/components/ui/switch';
import type { ChartAccount } from '@/lib/db/schema/index';

const accountTypes = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'contra_asset', label: 'Contra Asset' },
  { value: 'contra_liability', label: 'Contra Liability' },
  { value: 'other', label: 'Other' },
] as const;

const normalBalanceOptions = [
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
] as const;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<ChartAccount>) => void;
  account?: ChartAccount | null;
  isLoading?: boolean;
}

export function AccountForm({
  open,
  onOpenChange,
  onSubmit,
  account,
  isLoading = false,
}: AccountFormProps) {
  const [formData, setFormData] = useState<Partial<ChartAccount>>({
    code: '',
    name: '',
    type: 'asset',
    normalBalance: 'debit',
    description: '',
    parentId: null,
    isActive: true,
    isPostable: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        description: account.description,
        parentId: account.parentId,
        isActive: account.isActive,
        isPostable: account.isPostable,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'asset',
        normalBalance: 'debit',
        description: '',
        parentId: null,
        isActive: true,
        isPostable: true,
      });
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof ChartAccount, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{account ? 'Edit Account' : 'Create Account'}</DialogTitle>
            <DialogDescription>
              {account 
                ? 'Update the account details below.' 
                : 'Add a new account to your chart of accounts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code *
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="col-span-3"
                placeholder="e.g., 1000"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="col-span-3"
                placeholder="e.g., Cash"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="normalBalance" className="text-right">
                Normal Balance *
              </Label>
              <Select
                value={formData.normalBalance}
                onValueChange={(value) => handleChange('normalBalance', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select normal balance" />
                </SelectTrigger>
                <SelectContent>
                  {normalBalanceOptions.map((balance) => (
                    <SelectItem key={balance.value} value={balance.value}>
                      {balance.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="col-span-3"
                placeholder="Enter account description..."
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                  disabled={isLoading}
                />
              </div>
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
                ? (account ? 'Updating...' : 'Creating...') 
                : (account ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}