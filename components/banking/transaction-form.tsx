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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { BankTransaction, BankAccount } from '@/lib/db/schema/index';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<BankTransaction>) => Promise<void>;
  transaction?: BankTransaction | null;
  accounts: BankAccount[];
  isLoading?: boolean;
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  transaction,
  accounts,
  isLoading = false,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<Partial<BankTransaction>>(() => ({
    bankAccountId: transaction?.bankAccountId || accounts[0]?.id || '',
    transactionDate: transaction?.transactionDate || new Date(),
    transactionType: transaction?.transactionType || 'deposit',
    amount: transaction?.amount || '',
    payee: transaction?.payee || '',
    description: transaction?.description || '',
    memo: transaction?.memo || '',
    category: transaction?.category || '',
    bankReferenceNumber: transaction?.bankReferenceNumber || '',
    checkNumber: transaction?.checkNumber || '',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
    setFormData({
      bankAccountId: accounts[0]?.id || '',
      transactionDate: new Date(),
      transactionType: 'deposit',
      amount: '',
      payee: '',
      description: '',
      memo: '',
      category: '',
      bankReferenceNumber: '',
      checkNumber: '',
    });
  };

  const transactionTypes = [
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'fee', label: 'Bank Fee' },
    { value: 'interest', label: 'Interest' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'opening_balance', label: 'Opening Balance' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccountId">Bank Account</Label>
              <Select
                value={formData.bankAccountId}
                onValueChange={(value) =>
                  setFormData({ ...formData, bankAccountId: value })
                }
              >
                <SelectTrigger id="bankAccountId">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} ({account.accountType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.transactionDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.transactionDate ? (
                      format(new Date(formData.transactionDate), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.transactionDate ? new Date(formData.transactionDate) : undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, transactionDate: date || new Date() })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Type</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, transactionType: value })
                }
              >
                <SelectTrigger id="transactionType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payee">Payee/Payer</Label>
            <Input
              id="payee"
              placeholder="Enter payee or payer name"
              value={formData.payee}
              onChange={(e) =>
                setFormData({ ...formData, payee: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter transaction description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Office Supplies"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankReferenceNumber">Reference Number</Label>
              <Input
                id="bankReferenceNumber"
                placeholder="Bank reference"
                value={formData.bankReferenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, bankReferenceNumber: e.target.value })
                }
              />
            </div>
          </div>
          
          {(formData.transactionType === 'withdrawal' || formData.transactionType === 'transfer') && (
            <div className="space-y-2">
              <Label htmlFor="checkNumber">Check Number</Label>
              <Input
                id="checkNumber"
                placeholder="Check number (if applicable)"
                value={formData.checkNumber}
                onChange={(e) =>
                  setFormData({ ...formData, checkNumber: e.target.value })
                }
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              placeholder="Additional notes"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              rows={3}
            />
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
              {isLoading ? 'Saving...' : transaction ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}