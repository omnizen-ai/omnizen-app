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
import type { BankAccount } from '@/lib/db/schema/index';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
] as const;

interface BankAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<BankAccount>) => void;
  account?: BankAccount | null;
  isLoading?: boolean;
}

export function BankAccountForm({
  open,
  onOpenChange,
  onSubmit,
  account,
  isLoading = false,
}: BankAccountFormProps) {
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    accountName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    currentBalance: '0.00',
    availableBalance: '0.00',
    currencyCode: 'USD',
    isActive: true,
    isReconciling: false,
    notes: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.accountName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        routingNumber: account.routingNumber,
        accountType: account.accountType,
        currentBalance: account.currentBalance,
        availableBalance: account.availableBalance,
        currencyCode: account.currencyCode,
        isActive: account.isActive,
        isReconciling: account.isReconciling,
        notes: account.notes,
      });
    } else {
      setFormData({
        accountName: '',
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountType: 'checking',
        currentBalance: '0.00',
        availableBalance: '0.00',
        currencyCode: 'USD',
        isActive: true,
        isReconciling: false,
        notes: '',
      });
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof BankAccount, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{account ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            <DialogDescription>
              {account 
                ? 'Update the bank account details below.' 
                : 'Enter the bank account information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => handleChange('accountName', e.target.value)}
                placeholder="Main Business Checking"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="Chase Bank"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber || ''}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  placeholder="****1234"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={formData.routingNumber || ''}
                  onChange={(e) => handleChange('routingNumber', e.target.value)}
                  placeholder="123456789"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType || 'checking'}
                onValueChange={(value) => handleChange('accountType', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentBalance">Current Balance</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  step="0.01"
                  value={formData.currentBalance}
                  onChange={(e) => handleChange('currentBalance', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableBalance">Available Balance</Label>
                <Input
                  id="availableBalance"
                  type="number"
                  step="0.01"
                  value={formData.availableBalance}
                  onChange={(e) => handleChange('availableBalance', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <Select
                value={formData.currencyCode || 'USD'}
                onValueChange={(value) => handleChange('currencyCode', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="flex items-center gap-2">
                <span>Account Active</span>
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive || false}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
                disabled={isLoading}
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
                ? (account ? 'Updating...' : 'Creating...') 
                : (account ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}