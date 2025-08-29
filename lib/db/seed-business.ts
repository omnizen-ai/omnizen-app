import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use local Supabase database for seeding
const POSTGRES_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const client = postgres(POSTGRES_URL);
const db = drizzle(client);
import {
  chartOfAccounts,
  contacts,
  journalEntries,
  journalEntryLines,
  invoices,
  invoiceLineItems,
  inventory,
  transactions,
  expenses,
} from './schema/business';

async function seedBusinessData() {
  console.log('🌱 Seeding business data...');

  try {
    // 1. Create Chart of Accounts
    console.log('Creating chart of accounts...');
    const accounts = await db.insert(chartOfAccounts).values([
      // Asset Accounts (1000s)
      { accountNumber: '1000', accountName: 'Cash', accountType: 'asset', balance: '25000.00' },
      { accountNumber: '1100', accountName: 'Accounts Receivable', accountType: 'asset', balance: '12500.00' },
      { accountNumber: '1200', accountName: 'Inventory', accountType: 'asset', balance: '18000.00' },
      { accountNumber: '1500', accountName: 'Equipment', accountType: 'asset', balance: '45000.00' },
      { accountNumber: '1600', accountName: 'Accumulated Depreciation', accountType: 'asset', balance: '-5000.00' },
      
      // Liability Accounts (2000s)
      { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'liability', balance: '8500.00' },
      { accountNumber: '2100', accountName: 'Credit Card Payable', accountType: 'liability', balance: '2300.00' },
      { accountNumber: '2200', accountName: 'Sales Tax Payable', accountType: 'liability', balance: '1200.00' },
      { accountNumber: '2500', accountName: 'Loan Payable', accountType: 'liability', balance: '30000.00' },
      
      // Equity Accounts (3000s)
      { accountNumber: '3000', accountName: 'Owner\'s Equity', accountType: 'equity', balance: '50000.00' },
      { accountNumber: '3100', accountName: 'Retained Earnings', accountType: 'equity', balance: '15000.00' },
      
      // Revenue Accounts (4000s)
      { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'revenue', balance: '125000.00' },
      { accountNumber: '4100', accountName: 'Service Revenue', accountType: 'revenue', balance: '35000.00' },
      { accountNumber: '4200', accountName: 'Interest Income', accountType: 'revenue', balance: '500.00' },
      
      // Expense Accounts (5000s)
      { accountNumber: '5000', accountName: 'Cost of Goods Sold', accountType: 'expense', balance: '65000.00' },
      { accountNumber: '5100', accountName: 'Salaries Expense', accountType: 'expense', balance: '42000.00' },
      { accountNumber: '5200', accountName: 'Rent Expense', accountType: 'expense', balance: '18000.00' },
      { accountNumber: '5300', accountName: 'Utilities Expense', accountType: 'expense', balance: '3600.00' },
      { accountNumber: '5400', accountName: 'Office Supplies', accountType: 'expense', balance: '2400.00' },
      { accountNumber: '5500', accountName: 'Marketing Expense', accountType: 'expense', balance: '8500.00' },
      { accountNumber: '5600', accountName: 'Insurance Expense', accountType: 'expense', balance: '4200.00' },
      { accountNumber: '5700', accountName: 'Depreciation Expense', accountType: 'expense', balance: '5000.00' },
    ]).returning();

    // 2. Create Contacts (Customers and Vendors)
    console.log('Creating contacts...');
    const contactsData = await db.insert(contacts).values([
      // Customers
      {
        contactType: 'customer' as const,
        companyName: 'Tech Solutions Inc',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@techsolutions.com',
        phone: '555-0101',
        address: { street: '123 Tech Ave', city: 'San Francisco', state: 'CA', zip: '94105', country: 'USA' },
        creditLimit: '15000.00',
        paymentTerms: 30,
      },
      {
        contactType: 'customer' as const,
        companyName: 'Digital Marketing Co',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@digitalmarketing.com',
        phone: '555-0102',
        address: { street: '456 Marketing Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'USA' },
        creditLimit: '20000.00',
        paymentTerms: 45,
      },
      {
        contactType: 'customer' as const,
        companyName: 'StartUp Ventures',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike@startupventures.com',
        phone: '555-0103',
        address: { street: '789 Innovation Way', city: 'Austin', state: 'TX', zip: '78701', country: 'USA' },
        creditLimit: '10000.00',
        paymentTerms: 15,
      },
      // Vendors
      {
        contactType: 'vendor' as const,
        companyName: 'Office Supplies Plus',
        firstName: 'Linda',
        lastName: 'Brown',
        email: 'linda@officesupplies.com',
        phone: '555-0201',
        address: { street: '321 Supply St', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' },
        paymentTerms: 30,
      },
      {
        contactType: 'vendor' as const,
        companyName: 'Tech Hardware Wholesale',
        firstName: 'Robert',
        lastName: 'Davis',
        email: 'robert@techhardware.com',
        phone: '555-0202',
        address: { street: '654 Hardware Lane', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' },
        paymentTerms: 45,
      },
      {
        contactType: 'vendor' as const,
        companyName: 'Cloud Services Provider',
        firstName: 'Emily',
        lastName: 'Taylor',
        email: 'emily@cloudservices.com',
        phone: '555-0203',
        address: { street: '987 Cloud Way', city: 'Denver', state: 'CO', zip: '80201', country: 'USA' },
        paymentTerms: 30,
      },
    ]).returning();

    // 3. Create Inventory Items
    console.log('Creating inventory...');
    const inventoryItems = await db.insert(inventory).values([
      {
        sku: 'LAP-001',
        productName: 'Business Laptop',
        description: 'High-performance laptop for business use',
        category: 'Electronics',
        unitCost: '800.00',
        sellingPrice: '1200.00',
        quantityOnHand: '15',
        reorderPoint: '5',
        preferredVendorId: contactsData[4].id, // Tech Hardware Wholesale
      },
      {
        sku: 'MON-001',
        productName: '27" Monitor',
        description: '4K UHD Business Monitor',
        category: 'Electronics',
        unitCost: '300.00',
        sellingPrice: '450.00',
        quantityOnHand: '25',
        reorderPoint: '10',
        preferredVendorId: contactsData[4].id,
      },
      {
        sku: 'KEY-001',
        productName: 'Wireless Keyboard',
        description: 'Ergonomic wireless keyboard',
        category: 'Accessories',
        unitCost: '50.00',
        sellingPrice: '80.00',
        quantityOnHand: '40',
        reorderPoint: '15',
        preferredVendorId: contactsData[4].id,
      },
      {
        sku: 'SVC-001',
        productName: 'IT Support Hour',
        description: 'Professional IT support service',
        category: 'Services',
        unitCost: '75.00',
        sellingPrice: '125.00',
        quantityOnHand: '999', // Service item
        reorderPoint: '0',
      },
      {
        sku: 'SVC-002',
        productName: 'Cloud Setup Service',
        description: 'Cloud infrastructure setup and configuration',
        category: 'Services',
        unitCost: '150.00',
        sellingPrice: '250.00',
        quantityOnHand: '999',
        reorderPoint: '0',
      },
    ]).returning();

    // 4. Create Invoices with Line Items
    console.log('Creating invoices...');
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Invoice 1 - Paid
    const invoice1 = await db.insert(invoices).values({
      invoiceNumber: 'INV-2024-001',
      contactId: contactsData[0].id, // Tech Solutions Inc
      invoiceDate: new Date('2024-11-15'),
      dueDate: new Date('2024-12-15'),
      status: 'paid',
      subtotal: '3850.00',
      taxAmount: '308.00',
      totalAmount: '4158.00',
      paidAmount: '4158.00',
      notes: 'Thank you for your business!',
    }).returning();

    await db.insert(invoiceLineItems).values([
      {
        invoiceId: invoice1[0].id,
        productId: inventoryItems[0].id,
        description: 'Business Laptop',
        quantity: '2',
        unitPrice: '1200.00',
        totalAmount: '2400.00',
      },
      {
        invoiceId: invoice1[0].id,
        productId: inventoryItems[1].id,
        description: '27" Monitor',
        quantity: '2',
        unitPrice: '450.00',
        totalAmount: '900.00',
      },
      {
        invoiceId: invoice1[0].id,
        productId: inventoryItems[3].id,
        description: 'IT Support Hour',
        quantity: '4.4',
        unitPrice: '125.00',
        totalAmount: '550.00',
      },
    ]);

    // Invoice 2 - Overdue
    const invoice2 = await db.insert(invoices).values({
      invoiceNumber: 'INV-2024-002',
      contactId: contactsData[1].id, // Digital Marketing Co
      invoiceDate: new Date('2024-10-20'),
      dueDate: new Date('2024-11-20'),
      status: 'overdue',
      subtotal: '2500.00',
      taxAmount: '200.00',
      totalAmount: '2700.00',
      paidAmount: '0.00',
    }).returning();

    // Invoice 3 - Sent (current)
    const invoice3 = await db.insert(invoices).values({
      invoiceNumber: 'INV-2024-003',
      contactId: contactsData[2].id, // StartUp Ventures
      invoiceDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-16'),
      status: 'sent',
      subtotal: '5240.00',
      taxAmount: '419.20',
      totalAmount: '5659.20',
      paidAmount: '2000.00', // Partial payment
    }).returning();

    // 5. Create Transactions
    console.log('Creating transactions...');
    await db.insert(transactions).values([
      {
        transactionNumber: 'TXN-2024-001',
        transactionDate: new Date('2024-12-01'),
        transactionType: 'receipt',
        contactId: contactsData[0].id,
        accountId: accounts[0].id, // Cash account
        amount: '4158.00',
        paymentMethod: 'bank_transfer',
        referenceNumber: 'BT-001',
        description: 'Payment for INV-2024-001',
        status: 'completed',
      },
      {
        transactionNumber: 'TXN-2024-002',
        transactionDate: new Date('2024-12-05'),
        transactionType: 'receipt',
        contactId: contactsData[2].id,
        accountId: accounts[0].id,
        amount: '2000.00',
        paymentMethod: 'check',
        referenceNumber: 'CHK-1234',
        description: 'Partial payment for INV-2024-003',
        status: 'completed',
      },
      {
        transactionNumber: 'TXN-2024-003',
        transactionDate: new Date('2024-11-28'),
        transactionType: 'payment',
        contactId: contactsData[3].id, // Office Supplies vendor
        accountId: accounts[0].id,
        amount: '850.00',
        paymentMethod: 'credit_card',
        referenceNumber: 'CC-5678',
        description: 'Office supplies purchase',
        status: 'completed',
      },
    ]);

    // 6. Create Expenses
    console.log('Creating expenses...');
    await db.insert(expenses).values([
      {
        expenseDate: new Date('2024-12-01'),
        vendorId: contactsData[3].id, // Office Supplies Plus
        categoryAccountId: accounts[18].id, // Office Supplies expense
        paymentAccountId: accounts[0].id, // Cash
        amount: '342.50',
        taxAmount: '27.40',
        description: 'Monthly office supplies',
        paymentMethod: 'credit_card',
      },
      {
        expenseDate: new Date('2024-12-01'),
        categoryAccountId: accounts[16].id, // Rent expense
        paymentAccountId: accounts[0].id,
        amount: '3000.00',
        description: 'December office rent',
        paymentMethod: 'bank_transfer',
        referenceNumber: 'RENT-DEC-2024',
      },
      {
        expenseDate: new Date('2024-12-03'),
        vendorId: contactsData[5].id, // Cloud Services
        categoryAccountId: accounts[17].id, // Utilities expense
        paymentAccountId: accounts[0].id,
        amount: '299.00',
        description: 'Cloud hosting services',
        paymentMethod: 'credit_card',
      },
      {
        expenseDate: new Date('2024-11-25'),
        categoryAccountId: accounts[19].id, // Marketing expense
        paymentAccountId: accounts[0].id,
        amount: '1500.00',
        description: 'Google Ads campaign',
        paymentMethod: 'credit_card',
      },
      {
        expenseDate: new Date('2024-11-20'),
        categoryAccountId: accounts[15].id, // Salaries expense
        paymentAccountId: accounts[0].id,
        amount: '7000.00',
        description: 'Monthly payroll',
        paymentMethod: 'bank_transfer',
      },
    ]);

    // 7. Create Journal Entries for key transactions
    console.log('Creating journal entries...');
    const je1 = await db.insert(journalEntries).values({
      entryNumber: 'JE-2024-001',
      entryDate: new Date('2024-12-01'),
      description: 'Record sales invoice INV-2024-003',
      reference: 'INV-2024-003',
      isPosted: true,
    }).returning();

    await db.insert(journalEntryLines).values([
      {
        journalEntryId: je1[0].id,
        accountId: accounts[1].id, // Accounts Receivable
        debit: '5659.20',
        credit: '0.00',
        description: 'Invoice to StartUp Ventures',
        contactId: contactsData[2].id,
      },
      {
        journalEntryId: je1[0].id,
        accountId: accounts[11].id, // Sales Revenue
        debit: '0.00',
        credit: '5240.00',
        description: 'Sales revenue',
      },
      {
        journalEntryId: je1[0].id,
        accountId: accounts[7].id, // Sales Tax Payable
        debit: '0.00',
        credit: '419.20',
        description: 'Sales tax collected',
      },
    ]);

    const je2 = await db.insert(journalEntries).values({
      entryNumber: 'JE-2024-002',
      entryDate: new Date('2024-12-05'),
      description: 'Record partial payment received',
      reference: 'TXN-2024-002',
      isPosted: true,
    }).returning();

    await db.insert(journalEntryLines).values([
      {
        journalEntryId: je2[0].id,
        accountId: accounts[0].id, // Cash
        debit: '2000.00',
        credit: '0.00',
        description: 'Payment received',
      },
      {
        journalEntryId: je2[0].id,
        accountId: accounts[1].id, // Accounts Receivable
        debit: '0.00',
        credit: '2000.00',
        description: 'Reduce AR',
        contactId: contactsData[2].id,
      },
    ]);

    console.log('✅ Business data seeded successfully!');
    console.log(`
      Summary:
      - ${accounts.length} accounts created
      - ${contactsData.length} contacts created
      - ${inventoryItems.length} inventory items created
      - 3 invoices created
      - 3 transactions recorded
      - 5 expenses recorded
      - 2 journal entries posted
    `);

  } catch (error) {
    console.error('❌ Error seeding business data:', error);
    throw error;
  }
}

// Run the seeder
seedBusinessData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });