import { v4 as uuidv4 } from 'uuid';
import type { Customer, Invoice, Expense, MileageEntry, CompanyInfo, TaxRate, CustomerBalance } from '../types';

const STORAGE_KEYS = {
  customers: 'construct_customers',
  invoices: 'construct_invoices',
  expenses: 'construct_expenses',
  mileage: 'construct_mileage',
  company: 'construct_company',
  taxes: 'construct_taxes',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Company Info ──────────────────────────────────────────
export function getCompanyInfo(): CompanyInfo {
  return get<CompanyInfo>(STORAGE_KEYS.company, {
    name: 'ABC Construction Co.',
    address: '123 Builder Lane',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    phone: '(512) 555-0123',
    email: 'info@abcconstruction.com',
    tagline: 'Quality Construction Since 1995',
  });
}

export function saveCompanyInfo(info: CompanyInfo): void {
  set(STORAGE_KEYS.company, info);
}

// ── Customers ─────────────────────────────────────────────
export function getCustomers(): Customer[] {
  return get<Customer[]>(STORAGE_KEYS.customers, []);
}

export function saveCustomer(customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }): Customer {
  const customers = getCustomers();
  const now = new Date().toISOString();
  if (customer.id) {
    const idx = customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = { ...customers[idx], ...customer };
      set(STORAGE_KEYS.customers, customers);
      return customers[idx];
    }
  }
  const newCustomer: Customer = { ...customer, id: uuidv4(), createdAt: now } as Customer;
  customers.push(newCustomer);
  set(STORAGE_KEYS.customers, customers);
  return newCustomer;
}

export function deleteCustomer(id: string): void {
  set(STORAGE_KEYS.customers, getCustomers().filter(c => c.id !== id));
}

export function getCustomer(id: string): Customer | undefined {
  return getCustomers().find(c => c.id === id);
}

// ── Invoices ──────────────────────────────────────────────
export function getInvoices(): Invoice[] {
  return get<Invoice[]>(STORAGE_KEYS.invoices, []);
}

export function getInvoicesByCustomer(customerId: string): Invoice[] {
  return getInvoices().filter(i => i.customerId === customerId);
}

export function getNextInvoiceNumber(): string {
  const invoices = getInvoices();
  const year = new Date().getFullYear();
  const count = invoices.filter(i => i.invoiceNumber.startsWith(`INV-${year}`)).length;
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

export function saveInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'> & { id?: string; invoiceNumber?: string }): Invoice {
  const invoices = getInvoices();
  const now = new Date().toISOString();
  if (invoice.id) {
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      invoices[idx] = { ...invoices[idx], ...invoice, updatedAt: now };
      set(STORAGE_KEYS.invoices, invoices);
      return invoices[idx];
    }
  }
  const newInvoice: Invoice = {
    ...invoice,
    id: uuidv4(),
    invoiceNumber: invoice.invoiceNumber || getNextInvoiceNumber(),
    createdAt: now,
    updatedAt: now,
  } as Invoice;
  invoices.push(newInvoice);
  set(STORAGE_KEYS.invoices, invoices);
  return newInvoice;
}

export function deleteInvoice(id: string): void {
  set(STORAGE_KEYS.invoices, getInvoices().filter(i => i.id !== id));
}

export function getInvoice(id: string): Invoice | undefined {
  return getInvoices().find(i => i.id === id);
}

export function convertEstimateToInvoice(id: string): Invoice | undefined {
  const invoices = getInvoices();
  const idx = invoices.findIndex(i => i.id === id);
  if (idx < 0) return undefined;
  invoices[idx] = {
    ...invoices[idx],
    status: 'invoiced',
    invoiceNumber: invoices[idx].invoiceNumber.startsWith('EST-')
      ? invoices[idx].invoiceNumber.replace('EST-', 'INV-')
      : invoices[idx].invoiceNumber,
    updatedAt: new Date().toISOString(),
  };
  set(STORAGE_KEYS.invoices, invoices);
  return invoices[idx];
}

// ── Expenses ──────────────────────────────────────────────
export function getExpenses(): Expense[] {
  return get<Expense[]>(STORAGE_KEYS.expenses, []);
}

export function getExpensesByCustomer(customerId: string): Expense[] {
  return getExpenses().filter(e => e.customerId === customerId);
}

export function saveExpense(expense: Omit<Expense, 'id' | 'createdAt'> & { id?: string }): Expense {
  const expenses = getExpenses();
  const now = new Date().toISOString();
  if (expense.id) {
    const idx = expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) {
      expenses[idx] = { ...expenses[idx], ...expense };
      set(STORAGE_KEYS.expenses, expenses);
      return expenses[idx];
    }
  }
  const newExpense: Expense = { ...expense, id: uuidv4(), createdAt: now } as Expense;
  expenses.push(newExpense);
  set(STORAGE_KEYS.expenses, expenses);
  return newExpense;
}

export function deleteExpense(id: string): void {
  set(STORAGE_KEYS.expenses, getExpenses().filter(e => e.id !== id));
}

// ── Mileage ───────────────────────────────────────────────
export function getMileageEntries(): MileageEntry[] {
  return get<MileageEntry[]>(STORAGE_KEYS.mileage, []);
}

export function getMileageByCustomer(customerId: string): MileageEntry[] {
  return getMileageEntries().filter(m => m.customerId === customerId);
}

export function saveMileageEntry(entry: Omit<MileageEntry, 'id' | 'createdAt' | 'total'> & { id?: string }): MileageEntry {
  const entries = getMileageEntries();
  const now = new Date().toISOString();
  const total = entry.miles * entry.ratePerMile;
  if (entry.id) {
    const idx = entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      entries[idx] = { ...entries[idx], ...entry, total };
      set(STORAGE_KEYS.mileage, entries);
      return entries[idx];
    }
  }
  const newEntry: MileageEntry = { ...entry, id: uuidv4(), createdAt: now, total } as MileageEntry;
  entries.push(newEntry);
  set(STORAGE_KEYS.mileage, entries);
  return newEntry;
}

export function deleteMileageEntry(id: string): void {
  set(STORAGE_KEYS.mileage, getMileageEntries().filter(m => m.id !== id));
}

// ── Tax Rates ─────────────────────────────────────────────
export function getTaxRates(): TaxRate[] {
  return get<TaxRate[]>(STORAGE_KEYS.taxes, [
    { id: uuidv4(), name: 'Sales Tax', rate: 8.25, enabled: true },
  ]);
}

export function saveTaxRates(taxes: TaxRate[]): void {
  set(STORAGE_KEYS.taxes, taxes);
}

// ── Customer Balances ─────────────────────────────────────
export function getCustomerBalances(): CustomerBalance[] {
  const customers = getCustomers();
  const invoices = getInvoices();
  const expenses = getExpenses();
  const mileage = getMileageEntries();

  return customers.map(customer => {
    const custInvoices = invoices.filter(i => i.customerId === customer.id);
    const custExpenses = expenses.filter(e => e.customerId === customer.id);
    const custMileage = mileage.filter(m => m.customerId === customer.id);

    const totalInvoiced = custInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = custInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const totalOwed = totalInvoiced - totalPaid;
    const expenseTotal = custExpenses.reduce((sum, e) => sum + e.amount, 0);
    const mileageTotal = custMileage.reduce((sum, m) => sum + m.total, 0);

    return {
      customerId: customer.id,
      totalInvoiced,
      totalPaid,
      totalOwed,
      invoiceCount: custInvoices.length,
      expenseTotal,
      mileageTotal,
    };
  });
}

export function getCustomerBalance(customerId: string): CustomerBalance | undefined {
  return getCustomerBalances().find(b => b.customerId === customerId);
}
