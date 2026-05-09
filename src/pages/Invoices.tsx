import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, FileText, Send, ArrowRight,
  FileDown, FileSpreadsheet, X
} from 'lucide-react';
import {
  getCustomers, getCustomer, getInvoices, saveInvoice, deleteInvoice,
  convertEstimateToInvoice, getTaxRates, getCompanyInfo
} from '../store/db';
import { formatCurrency, formatDate, todayStr, dueDateStr, statusColor, shareViaMessage } from '../utils/format';
import { downloadPDF } from '../utils/pdf';
import { downloadDocx } from '../utils/docx';
import type { Invoice, LineItem, Customer } from '../types';

interface InvoicesPageProps {
  navState?: any;
}

export default function InvoicesPage({ navState }: InvoicesPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<'all' | 'estimate' | 'invoiced' | 'paid' | 'overdue'>('all');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (navState?.createNew) {
      handleNew(navState.customerId);
    }
  }, [navState]);

  useEffect(() => { reload(); }, []);

  function reload() {
    setInvoices(getInvoices());
    setCustomers(getCustomers());
  }

  const filtered = invoices.filter(i => filter === 'all' || i.status === filter);

  function handleNew(customerId?: string) {
    const inv: Invoice = {
      id: '',
      customerId: customerId || '',
      invoiceNumber: '',
      status: 'estimate',
      date: todayStr(),
      dueDate: dueDateStr(30),
      lineItems: [],
      taxes: getTaxRates().filter(t => t.enabled),
      subtotal: 0,
      taxTotal: 0,
      total: 0,
      notes: '',
      createdAt: '',
      updatedAt: '',
    };
    setEditingInvoice(inv);
    setShowEditor(true);
  }

  function handleEdit(inv: Invoice) {
    setEditingInvoice({ ...inv });
    setShowEditor(true);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this invoice?')) {
      deleteInvoice(id);
      reload();
    }
  }

  function handleConvert(id: string) {
    convertEstimateToInvoice(id);
    reload();
  }

  function addLineItem() {
    if (!editingInvoice) return;
    const item: LineItem = {
      id: uuidv4(),
      type: 'service',
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setEditingInvoice({ ...editingInvoice, lineItems: [...editingInvoice.lineItems, item] });
  }

  function updateLineItem(itemId: string, field: string, value: any) {
    if (!editingInvoice) return;
    const items = editingInvoice.lineItems.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      updated.amount = updated.quantity * updated.unitPrice;
      return updated;
    });
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const taxTotal = editingInvoice.taxes.filter(t => t.enabled).reduce((s, t) => s + (subtotal * t.rate / 100), 0);
    setEditingInvoice({ ...editingInvoice, lineItems: items, subtotal, taxTotal, total: subtotal + taxTotal });
  }

  function removeLineItem(itemId: string) {
    if (!editingInvoice) return;
    const items = editingInvoice.lineItems.filter(i => i.id !== itemId);
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const taxTotal = editingInvoice.taxes.filter(t => t.enabled).reduce((s, t) => s + (subtotal * t.rate / 100), 0);
    setEditingInvoice({ ...editingInvoice, lineItems: items, subtotal, taxTotal, total: subtotal + taxTotal });
  }

  function toggleTax(taxId: string) {
    if (!editingInvoice) return;
    const taxes = editingInvoice.taxes.map(t =>
      t.id === taxId ? { ...t, enabled: !t.enabled } : t
    );
    const subtotal = editingInvoice.lineItems.reduce((s, i) => s + i.amount, 0);
    const taxTotal = taxes.filter(t => t.enabled).reduce((s, t) => s + (subtotal * t.rate / 100), 0);
    setEditingInvoice({ ...editingInvoice, taxes, subtotal, taxTotal, total: subtotal + taxTotal });
  }

  function handleSaveInvoice() {
    if (!editingInvoice || !editingInvoice.customerId) {
      alert('Please select a customer');
      return;
    }
    saveInvoice(editingInvoice);
    setShowEditor(false);
    setEditingInvoice(null);
    reload();
  }

  function handleExportPDF(inv: Invoice) {
    const customer = getCustomer(inv.customerId);
    const company = getCompanyInfo();
    if (customer) downloadPDF(inv, customer, company);
  }

  async function handleExportDocx(inv: Invoice) {
    const customer = getCustomer(inv.customerId);
    const company = getCompanyInfo();
    if (customer) await downloadDocx(inv, customer, company);
  }

  function handleSend(inv: Invoice) {
    const customer = getCustomer(inv.customerId);
    const company = getCompanyInfo();
    if (customer) shareViaMessage(inv, customer, company);
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'estimate', label: 'Estimates' },
    { key: 'invoiced', label: 'Invoiced' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Invoices & Quotes</h1>
          <p className="text-gray-500 mt-1">{invoices.length} total documents</p>
        </div>
        <button
          onClick={() => handleNew()}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" /> New Quote/Invoice
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoice Editor Modal */}
      {showEditor && editingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingInvoice.id ? 'Edit' : 'New'} {editingInvoice.status === 'estimate' ? 'Estimate' : 'Invoice'}
                </h2>
                <button onClick={() => { setShowEditor(false); setEditingInvoice(null); }}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Header fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select
                    value={editingInvoice.customerId}
                    onChange={e => setEditingInvoice({ ...editingInvoice, customerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={e => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="estimate">Estimate/Quote</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingInvoice.date}
                    onChange={e => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingInvoice.dueDate}
                    onChange={e => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">Line Items</h3>
                  <button
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {editingInvoice.lineItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                    <p>No line items. Click "Add Item" to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingInvoice.lineItems.map(item => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <select
                              value={item.type}
                              onChange={e => updateLineItem(item.id, 'type', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            >
                              <option value="service">Service</option>
                              <option value="hours">Hours</option>
                              <option value="materials">Materials</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                              placeholder="e.g., Framing labor, Lumber..."
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Qty</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={e => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium text-gray-700">Amount: {formatCurrency(item.quantity * item.unitPrice)}</span>
                          <button onClick={() => removeLineItem(item.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Taxes */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Taxes</h3>
                <div className="space-y-2">
                  {editingInvoice.taxes.map(tax => (
                    <label key={tax.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tax.enabled}
                        onChange={() => toggleTax(tax.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{tax.name} ({tax.rate}%)</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {tax.enabled ? formatCurrency(editingInvoice.subtotal * tax.rate / 100) : '—'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editingInvoice.notes}
                  onChange={e => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  rows={3}
                  placeholder="Payment terms, special instructions..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(editingInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(editingInvoice.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(editingInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSaveInvoice} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
                  Save {editingInvoice.status === 'estimate' ? 'Estimate' : 'Invoice'}
                </button>
                <button onClick={() => { setShowEditor(false); setEditingInvoice(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No invoices found. Create your first quote or estimate.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(inv => {
                  const customer = customers.find(c => c.id === inv.customerId);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{customer?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {inv.status === 'estimate' && (
                            <button onClick={() => handleConvert(inv.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Convert to Invoice">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleExportPDF(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Export PDF">
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleExportDocx(inv)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Export DOCX">
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleSend(inv)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="Send Message">
                            <Send className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(inv)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title="Edit">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filtered.map(inv => {
              const customer = customers.find(c => c.id === inv.customerId);
              return (
                <div key={inv.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{inv.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">{customer?.name || '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{formatDate(inv.date)}</span>
                    <span className="font-bold">{formatCurrency(inv.total)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {inv.status === 'estimate' && (
                      <button onClick={() => handleConvert(inv.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Convert → Invoice</button>
                    )}
                    <button onClick={() => handleExportPDF(inv)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">PDF</button>
                    <button onClick={() => handleExportDocx(inv)} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">DOCX</button>
                    <button onClick={() => handleSend(inv)} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">Send</button>
                    <button onClick={() => handleEdit(inv)} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(inv.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
