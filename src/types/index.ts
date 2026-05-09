export type LineItemType = 'service' | 'hours' | 'materials';

export interface LineItem {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage e.g. 8.25
  enabled: boolean;
}

export type DocumentStatus = 'estimate' | 'invoiced' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  status: DocumentStatus;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
  taxes: TaxRate[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  customerId: string;
  invoiceId?: string;
  category: 'job' | 'customer' | 'invoice';
  description: string;
  amount: number;
  date: string;
  receiptPhoto?: string; // base64
  vendor?: string;
  createdAt: string;
}

export interface MileageEntry {
  id: string;
  customerId: string;
  invoiceId?: string;
  date: string;
  fromAddress: string;
  toAddress: string;
  miles: number;
  ratePerMile: number;
  total: number;
  notes: string;
  createdAt: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  logo?: string; // base64
  tagline: string;
}

export interface CustomerBalance {
  customerId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOwed: number;
  invoiceCount: number;
  expenseTotal: number;
  mileageTotal: number;
}
