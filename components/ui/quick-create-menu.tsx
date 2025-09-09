'use client';

import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import form components
import { QuotationForm } from '@/components/sales/quotation-form';
import { ContactForm } from '@/components/sales/contact-form';
import { SalesOrderForm } from '@/components/sales/sales-order-form';
import { PurchaseOrderForm } from '@/components/purchasing/purchase-order-form';
import { VendorForm } from '@/components/purchasing/vendor-form';
import { WarehouseForm } from '@/components/operations/warehouse-form';
import { TransactionForm } from '@/components/banking/transaction-form';

// Import hooks
import { useContacts, useCreateContact } from '@/lib/hooks/use-sales';
import { useCreateQuotation } from '@/lib/hooks/use-quotations';
import { useCreateSalesOrder } from '@/lib/hooks/use-sales-orders';
import { useCreatePurchaseOrder } from '@/lib/hooks/use-purchase-orders';
import { useCreateWarehouse } from '@/lib/hooks/use-warehouses';
import { useBankAccounts, useCreateBankTransaction } from '@/lib/hooks/use-banking';

interface QuickCreateMenuProps {
  className?: string;
}

export function QuickCreateMenu({ className }: QuickCreateMenuProps) {
  // Form states
  const [quotationFormOpen, setQuotationFormOpen] = useState(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [salesOrderFormOpen, setSalesOrderFormOpen] = useState(false);
  const [purchaseOrderFormOpen, setPurchaseOrderFormOpen] = useState(false);
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [warehouseFormOpen, setWarehouseFormOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  
  // Dependency dialogs
  const [showNoCustomerDialog, setShowNoCustomerDialog] = useState(false);
  const [showNoVendorDialog, setShowNoVendorDialog] = useState(false);
  const [showNoBankAccountDialog, setShowNoBankAccountDialog] = useState(false);
  const [showCreateBankAccountDialog, setShowCreateBankAccountDialog] = useState(false);

  // Data hooks
  const { data: customers = [] } = useContacts({ type: 'customer' });
  const { data: vendors = [] } = useContacts({ type: 'vendor' });
  const { data: bankAccounts = [] } = useBankAccounts();

  // Mutation hooks
  const createContactMutation = useCreateContact();
  const createQuotationMutation = useCreateQuotation();
  const createSalesOrderMutation = useCreateSalesOrder();
  const createPurchaseOrderMutation = useCreatePurchaseOrder();
  const createWarehouseMutation = useCreateWarehouse();
  const createTransactionMutation = useCreateBankTransaction();

  // Handlers
  const handleQuotationClick = () => {
    if (customers.length === 0) {
      setShowNoCustomerDialog(true);
      return;
    }
    setQuotationFormOpen(true);
  };

  const handleSalesOrderClick = () => {
    if (customers.length === 0) {
      setShowNoCustomerDialog(true);
      return;
    }
    setSalesOrderFormOpen(true);
  };

  const handlePurchaseOrderClick = () => {
    if (vendors.length === 0) {
      setShowNoVendorDialog(true);
      return;
    }
    setPurchaseOrderFormOpen(true);
  };

  const handleTransactionClick = () => {
    if (bankAccounts.length === 0) {
      setShowNoBankAccountDialog(true);
      return;
    }
    setTransactionFormOpen(true);
  };

  const handleCreateCustomer = () => {
    setShowNoCustomerDialog(false);
    setCustomerFormOpen(true);
  };

  const handleCreateVendor = () => {
    setShowNoVendorDialog(false);
    setVendorFormOpen(true);
  };

  const handleCreateBankAccount = () => {
    setShowNoBankAccountDialog(false);
    setShowCreateBankAccountDialog(true);
  };

  const handleCustomerSubmit = async (data: any) => {
    await createContactMutation.mutateAsync({ ...data, type: 'customer' });
    setCustomerFormOpen(false);
  };

  const handleVendorSubmit = async (data: any) => {
    await createContactMutation.mutateAsync({ ...data, type: 'vendor' });
    setVendorFormOpen(false);
  };

  const handleQuotationSubmit = async (data: any) => {
    await createQuotationMutation.mutateAsync(data);
    setQuotationFormOpen(false);
  };

  const handleSalesOrderSubmit = async (data: any) => {
    await createSalesOrderMutation.mutateAsync(data);
    setSalesOrderFormOpen(false);
  };

  const handlePurchaseOrderSubmit = async (data: any) => {
    await createPurchaseOrderMutation.mutateAsync(data);
    setPurchaseOrderFormOpen(false);
  };

  const handleWarehouseSubmit = async (data: any) => {
    await createWarehouseMutation.mutateAsync(data);
    setWarehouseFormOpen(false);
  };

  const handleTransactionSubmit = async (data: any) => {
    await createTransactionMutation.mutateAsync(data);
    setTransactionFormOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Plus className="mr-2 size-4" />
            Quick Create
            <ChevronDown className="ml-2 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Finance</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => console.log('Invoice coming soon')}>
            New Invoice
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Bill coming soon')}>
            New Bill
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Payment coming soon')}>
            New Payment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Journal Entry coming soon')}>
            New Journal Entry
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Sales</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setCustomerFormOpen(true)}>
            New Customer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleQuotationClick}>
            New Quotation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSalesOrderClick}>
            New Sales Order
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Purchasing</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setVendorFormOpen(true)}>
            New Vendor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePurchaseOrderClick}>
            New Purchase Order
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Receipt coming soon')}>
            New Receipt
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Operations</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => console.log('Product coming soon')}>
            New Product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setWarehouseFormOpen(true)}>
            New Warehouse
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Inventory Adjustment coming soon')}>
            New Inventory Adjustment
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Banking</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => console.log('Bank Account coming soon')}>
            New Bank Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTransactionClick}>
            New Transaction
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dependency Dialogs */}
      {showNoCustomerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">No Customers Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create a customer first.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoCustomerDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer}>
                Create Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNoVendorDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">No Vendors Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create a vendor first.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoVendorDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVendor}>
                Create Vendor
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNoBankAccountDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">No Bank Accounts Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create a bank account first.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoBankAccountDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBankAccount}>
                Create Bank Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      <ContactForm
        open={customerFormOpen}
        onOpenChange={setCustomerFormOpen}
        onSubmit={handleCustomerSubmit}
        contact={null}
        isLoading={createContactMutation.isPending}
      />

      <VendorForm
        open={vendorFormOpen}
        onOpenChange={setVendorFormOpen}
        onSubmit={handleVendorSubmit}
        vendor={null}
        isLoading={createContactMutation.isPending}
      />

      {customers.length > 0 && (
        <>
          <QuotationForm
            open={quotationFormOpen}
            onOpenChange={setQuotationFormOpen}
            onSubmit={handleQuotationSubmit}
            quotation={null}
            isLoading={createQuotationMutation.isPending}
          />

          <SalesOrderForm
            open={salesOrderFormOpen}
            onOpenChange={setSalesOrderFormOpen}
            onSubmit={handleSalesOrderSubmit}
            salesOrder={null}
            customers={customers}
            isLoading={createSalesOrderMutation.isPending}
          />
        </>
      )}

      {vendors.length > 0 && (
        <PurchaseOrderForm
          open={purchaseOrderFormOpen}
          onOpenChange={setPurchaseOrderFormOpen}
          onSubmit={handlePurchaseOrderSubmit}
          purchaseOrder={null}
          vendors={vendors}
          isLoading={createPurchaseOrderMutation.isPending}
        />
      )}

      <WarehouseForm
        open={warehouseFormOpen}
        onOpenChange={setWarehouseFormOpen}
        onSubmit={handleWarehouseSubmit}
        warehouse={null}
        isLoading={createWarehouseMutation.isPending}
      />

      {bankAccounts.length > 0 && (
        <TransactionForm
          open={transactionFormOpen}
          onOpenChange={setTransactionFormOpen}
          onSubmit={handleTransactionSubmit}
          transaction={null}
          accounts={bankAccounts}
          isLoading={createTransactionMutation.isPending}
        />
      )}
    </>
  );
}