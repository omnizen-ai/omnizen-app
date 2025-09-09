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
import { PurchaseReceiptForm } from '@/components/purchasing/purchase-receipt-form';
import { WarehouseForm } from '@/components/operations/warehouse-form';
import { ProductForm } from '@/components/operations/product-form';
import { TransactionForm } from '@/components/banking/transaction-form';
import { BankAccountForm } from '@/components/banking/bank-account-form';
import { InvoiceForm } from '@/components/accounting/invoice-form';
import { BillForm } from '@/components/accounting/bill-form';

// Import dialog components
import { NoCustomerDialog } from '@/components/sales/no-customer-dialog';
import { NoVendorDialog } from '@/components/purchasing/no-vendor-dialog';
import { NoBankAccountDialog } from '@/components/banking/no-bank-account-dialog';

// Import hooks
import { useContacts, useCreateContact } from '@/lib/hooks/use-sales';
import { useCreateQuotation } from '@/lib/hooks/use-quotations';
import { useCreateSalesOrder } from '@/lib/hooks/use-sales-orders';
import { useCreatePurchaseOrder } from '@/lib/hooks/use-purchase-orders';
import { useCreatePurchaseReceipt } from '@/lib/hooks/use-purchase-receipts';
import { useCreateWarehouse } from '@/lib/hooks/use-warehouses';
import { useCreateProduct } from '@/lib/hooks/use-products';
import { useBankAccounts, useCreateBankTransaction, useCreateBankAccount } from '@/lib/hooks/use-banking';
import { useCreateInvoice } from '@/lib/hooks/use-invoices';
import { useCreateBill } from '@/lib/hooks/use-bills';

interface QuickCreateMenuProps {
  className?: string;
}

export function QuickCreateMenu({ className }: QuickCreateMenuProps) {
  // Form states
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [quotationFormOpen, setQuotationFormOpen] = useState(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [salesOrderFormOpen, setSalesOrderFormOpen] = useState(false);
  const [purchaseOrderFormOpen, setPurchaseOrderFormOpen] = useState(false);
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [receiptFormOpen, setReceiptFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [warehouseFormOpen, setWarehouseFormOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [bankAccountFormOpen, setBankAccountFormOpen] = useState(false);
  
  // Dependency dialogs
  const [showNoCustomerDialog, setShowNoCustomerDialog] = useState(false);
  const [showNoVendorDialog, setShowNoVendorDialog] = useState(false);
  const [showNoBankAccountDialog, setShowNoBankAccountDialog] = useState(false);

  // Data hooks
  const { data: customers = [] } = useContacts({ type: 'customer' });
  const { data: vendors = [] } = useContacts({ type: 'vendor' });
  const { data: bankAccounts = [] } = useBankAccounts();

  // Mutation hooks
  const createContactMutation = useCreateContact();
  const createInvoiceMutation = useCreateInvoice();
  const createBillMutation = useCreateBill();
  const createQuotationMutation = useCreateQuotation();
  const createSalesOrderMutation = useCreateSalesOrder();
  const createPurchaseOrderMutation = useCreatePurchaseOrder();
  const createReceiptMutation = useCreatePurchaseReceipt();
  const createProductMutation = useCreateProduct();
  const createWarehouseMutation = useCreateWarehouse();
  const createTransactionMutation = useCreateBankTransaction();
  const createBankAccountMutation = useCreateBankAccount();

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
    setBankAccountFormOpen(true);
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

  const handleInvoiceSubmit = async (data: any) => {
    await createInvoiceMutation.mutateAsync(data);
    setInvoiceFormOpen(false);
  };

  const handleBillSubmit = async (data: any) => {
    await createBillMutation.mutateAsync(data);
    setBillFormOpen(false);
  };

  const handleProductSubmit = async (data: any) => {
    await createProductMutation.mutateAsync(data);
    setProductFormOpen(false);
  };

  const handleReceiptSubmit = async (data: any) => {
    await createReceiptMutation.mutateAsync(data);
    setReceiptFormOpen(false);
  };

  const handleBankAccountSubmit = async (data: any) => {
    await createBankAccountMutation.mutateAsync(data);
    setBankAccountFormOpen(false);
  };

  // Click handlers for dependency checks
  const handleInvoiceClick = () => {
    if (customers.length === 0) {
      setShowNoCustomerDialog(true);
      return;
    }
    setInvoiceFormOpen(true);
  };

  const handleBillClick = () => {
    if (vendors.length === 0) {
      setShowNoVendorDialog(true);
      return;
    }
    setBillFormOpen(true);
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
          <DropdownMenuItem onClick={handleInvoiceClick}>
            New Invoice
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBillClick}>
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
          <DropdownMenuItem onClick={() => setReceiptFormOpen(true)}>
            New Receipt
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Operations</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setProductFormOpen(true)}>
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
          <DropdownMenuItem onClick={() => setBankAccountFormOpen(true)}>
            New Bank Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTransactionClick}>
            New Transaction
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dependency Dialogs */}
      <NoCustomerDialog
        open={showNoCustomerDialog}
        onOpenChange={setShowNoCustomerDialog}
        onCreateCustomer={handleCreateCustomer}
      />

      <NoVendorDialog
        open={showNoVendorDialog}
        onOpenChange={setShowNoVendorDialog}
        onCreateVendor={handleCreateVendor}
      />

      <NoBankAccountDialog
        open={showNoBankAccountDialog}
        onOpenChange={setShowNoBankAccountDialog}
        onCreateAccount={handleCreateBankAccount}
      />

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

      {/* Finance Forms - Dependent on customers/vendors */}
      {customers.length > 0 && (
        <InvoiceForm
          open={invoiceFormOpen}
          onOpenChange={setInvoiceFormOpen}
          onSubmit={handleInvoiceSubmit}
          invoice={null}
          isLoading={createInvoiceMutation.isPending}
        />
      )}

      {vendors.length > 0 && (
        <BillForm
          open={billFormOpen}
          onOpenChange={setBillFormOpen}
          onSubmit={handleBillSubmit}
          bill={null}
          isLoading={createBillMutation.isPending}
        />
      )}

      {/* Operations Forms */}
      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSubmit={handleProductSubmit}
        product={null}
        isLoading={createProductMutation.isPending}
      />

      <PurchaseReceiptForm
        open={receiptFormOpen}
        onOpenChange={setReceiptFormOpen}
        onSubmit={handleReceiptSubmit}
        receipt={null}
        isLoading={createReceiptMutation.isPending}
      />

      {/* Banking Forms */}
      <BankAccountForm
        open={bankAccountFormOpen}
        onOpenChange={setBankAccountFormOpen}
        onSubmit={handleBankAccountSubmit}
        account={null}
        isLoading={createBankAccountMutation.isPending}
      />
    </>
  );
}