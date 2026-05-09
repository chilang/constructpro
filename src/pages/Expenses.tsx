import { useState, useEffect, useRef } from 'react';
import { Plus, Camera, Receipt, X, ScanLine, Loader2 } from 'lucide-react';
import { getCustomers, getExpenses, saveExpense, deleteExpense, getInvoices } from '../store/db';
import { formatCurrency, formatDate, todayStr } from '../utils/format';
import { scanReceipt, type OCRResult } from '../utils/ocr';
import type { Expense, Invoice } from '../types';

interface ExpensesPageProps {
  navState?: any;
}

export default function ExpensesPage({ navState }: ExpensesPageProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm: {
    customerId: string;
    invoiceId: string;
    category: 'job' | 'customer' | 'invoice';
    description: string;
    amount: number;
    date: string;
    receiptPhoto: string;
    vendor: string;
  } = {
    customerId: '',
    invoiceId: '',
    category: 'job',
    description: '',
    amount: 0,
    date: todayStr(),
    receiptPhoto: '',
    vendor: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (navState?.customerId) {
      setForm(f => ({ ...f, customerId: navState.customerId }));
      setShowForm(true);
    }
  }, [navState]);

  useEffect(() => { reload(); }, []);

  function reload() {
    setExpenses(getExpenses());
    setCustomers(getCustomers().map(c => ({ id: c.id, name: c.name })));
    setInvoices(getInvoices());
  }

  const filtered = expenses.filter(e =>
    !filterCustomer || e.customerId === filterCustomer
  );

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm(f => ({ ...f, receiptPhoto: result }));
      setReceiptPreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleScanReceipt() {
    if (!form.receiptPhoto) return;
    setScanning(true);
    setOcrError(null);
    try {
      const result: OCRResult = await scanReceipt(form.receiptPhoto);
      if (result.total !== null) {
        setForm(f => ({ ...f, amount: result.total! }));
      }
      if (result.vendor) {
        setForm(f => ({ ...f, vendor: result.vendor! }));
      }
      if (result.date) {
        setForm(f => ({ ...f, date: result.date! }));
      }
      if (result.description) {
        setForm(f => ({ ...f, description: result.description! }));
      }
    } catch (err: any) {
      setOcrError(err.message || 'Failed to scan receipt');
    } finally {
      setScanning(false);
    }
  }

  function handleSave() {
    if (!form.description.trim() || form.amount <= 0) {
      alert('Please fill in description and amount');
      return;
    }
    saveExpense({ ...form, id: editingId || undefined });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setReceiptPreview(null);
    reload();
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      customerId: expense.customerId,
      invoiceId: expense.invoiceId || '',
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      receiptPhoto: expense.receiptPhoto || '',
      vendor: expense.vendor || '',
    });
    setReceiptPreview(expense.receiptPhoto || null);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this expense?')) {
      deleteExpense(id);
      reload();
    }
  }

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  const customerInvoices = form.customerId
    ? invoices.filter(i => i.customerId === form.customerId)
    : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Total: {formatCurrency(totalExpenses)}</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setReceiptPreview(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg hover:bg-amber-700 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </div>

      {/* Filter by customer */}
      <div className="mb-6">
        <select
          value={filterCustomer}
          onChange={e => setFilterCustomer(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'New'} Expense</h2>
                <button onClick={() => { setShowForm(false); setEditingId(null); setReceiptPreview(null); }}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    value={form.customerId}
                    onChange={e => setForm({ ...form, customerId: e.target.value, invoiceId: '' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="job">Job</option>
                    <option value="customer">Customer</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>

                {form.category === 'invoice' && form.customerId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                    <select
                      value={form.invoiceId}
                      onChange={e => setForm({ ...form, invoiceId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select invoice...</option>
                      {customerInvoices.map(i => (
                        <option key={i.id} value={i.id}>{i.invoiceNumber}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g., Lumber from Home Depot"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount || ''}
                      onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={e => setForm({ ...form, vendor: e.target.value })}
                    placeholder="e.g., Home Depot, Lowe's..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Receipt Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Photo</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span>{form.receiptPhoto ? 'Change Photo' : 'Take Photo / Upload Receipt'}</span>
                  </button>
                  {receiptPreview && (
                    <div className="mt-2 relative">
                      <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain rounded-lg border" />
                      <button
                        onClick={() => { setForm(f => ({ ...f, receiptPhoto: '' })); setReceiptPreview(null); }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {form.receiptPhoto && (
                    <button
                      type="button"
                      onClick={handleScanReceipt}
                      disabled={scanning}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium text-sm disabled:opacity-50 transition-all"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scanning receipt...
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4" />
                          Auto-Scan Receipt (AI)
                        </>
                      )}
                    </button>
                  )}
                  {ocrError && (
                    <p className="mt-1 text-xs text-red-600">{ocrError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 font-medium">Save Expense</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); setReceiptPreview(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No expenses recorded. Start tracking your project expenses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(expense => {
            const customer = customers.find(c => c.id === expense.customerId);
            return (
              <div key={expense.id} className="bg-white rounded-xl shadow-sm border p-4 flex gap-4">
                {expense.receiptPhoto && (
                  <img src={expense.receiptPhoto} alt="Receipt" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 truncate">{expense.description}</p>
                      <p className="text-sm text-gray-500">{customer?.name} • {expense.vendor || 'No vendor'}</p>
                    </div>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{expense.category}</span>
                      <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(expense)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(expense.id)} className="text-xs text-red-500 hover:underline ml-2">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
