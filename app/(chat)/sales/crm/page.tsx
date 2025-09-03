'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  Mail, 
  Phone, 
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useSalesSummary
} from '@/lib/hooks/use-sales';
import { type Contact } from '@/lib/db/schema/index';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactForm } from '@/components/sales/contact-form';

export default function CRMPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'contacts' | 'pipeline'>('contacts');
  const [formOpen, setFormOpen] = useState(false);

  // React Query hooks
  const { data: contacts = [], isLoading: contactsLoading, refetch } = useContacts();
  const { data: summary } = useSalesSummary();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  // Filter contacts to customers only
  const customers = contacts.filter(contact => contact.type === 'customer');

  // Columns definition for contacts table
  const contactColumns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Customer
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const contact = row.original;
        const initials = contact.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{contact.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3" />
                {contact.companyName || 'No Company'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Mail className="size-3 text-muted-foreground" />
              {contact.email || 'No email'}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="size-3" />
              {contact.phone || 'No phone'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <Badge variant={active ? 'default' : 'secondary'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div>
            <div className="text-sm">{format(date, 'MMM d, yyyy')}</div>
            <div className="text-xs text-muted-foreground">
              {format(date, 'h:mm a')}
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const contact = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(contact)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(contact)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Handlers
  const handleAdd = () => {
    setSelectedContact(null);
    setFormOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Contact>) => {
    if (selectedContact) {
      await updateMutation.mutateAsync({
        id: selectedContact.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedContact(null);
  };

  const handleDelete = async (contact: Contact) => {
    if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
      await deleteMutation.mutateAsync(contact.id);
    }
  };

  // Pipeline component (placeholder)
  const PipelineView = () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Sales Pipeline</h3>
        <p className="text-muted-foreground mb-4">
          Drag and drop deals between stages to track your sales process.
        </p>
        <div className="text-sm text-muted-foreground">
          Pipeline view coming soon...
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Customer Relationship Management</h2>
            <p className="text-muted-foreground mt-2">
              Manage customer relationships and track sales opportunities.
            </p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-5 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalContacts}</div>
                  <p className="text-xs text-muted-foreground">
                    All contacts
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <UserCheck className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Customer contacts
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <UserCheck className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.activeCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active customers
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <TrendingUp className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Sales orders
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Order Value</CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(summary.totalOrderValue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total sales
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* View Toggle Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contacts">
              <DataTableCrud
                columns={contactColumns}
                data={customers}
                searchKey="name"
                searchPlaceholder="Search customers..."
                onAdd={handleAdd}
                onRefresh={refetch}
                isLoading={contactsLoading}
                addButtonLabel="Add Customer"
                showActions={false}
              />
            </TabsContent>
            
            <TabsContent value="pipeline">
              <PipelineView />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Contact Form Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        contact={selectedContact}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}