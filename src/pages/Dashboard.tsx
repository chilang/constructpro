import { useState, useEffect } from 'react';
import { FileText, Users, Receipt, MapPin, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getInvoices, getCustomers, getExpenses, getMileageEntries, getCompanyInfo } from '../store/db';
import { formatCurrency } from '../utils/format';
import type { Invoice } from '../types';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoiced: 0,
    totalOwed: 0,
    totalPaid: 0,
    totalExpenses: 0,
    totalMileage: 0,
    estimates: 0,
    overdue: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const invoices = getInvoices();
    const customers = getCustomers();
    const expenses = getExpenses();
    const mileage = getMileageEntries();
    const company = getCompanyInfo();

    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const totalOwed = totalInvoiced - totalPaid;

    setStats({
      totalCustomers: customers.length,
      totalInvoiced,
      totalOwed,
      totalPaid,
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      totalMileage: mileage.reduce((s, m) => s + m.total, 0),
      estimates: invoices.filter(i => i.status === 'estimate').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
    });
    setRecentInvoices(invoices.slice(-5).reverse());
    setCompanyName(company.name);
  }, []);

  const cards = [
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500', onClick: () => onNavigate('/customers') },
    { label: 'Total Invoiced', value: formatCurrency(stats.totalInvoiced), icon: DollarSign, color: 'bg-green-500', onClick: () => onNavigate('/invoices') },
    { label: 'Amount Owed', value: formatCurrency(stats.totalOwed), icon: AlertCircle, color: 'bg-red-500', onClick: () => onNavigate('/invoices') },
    { label: 'Paid', value: formatCurrency(stats.totalPaid), icon: CheckCircle, color: 'bg-emerald-500', onClick: () => onNavigate('/invoices') },
    { label: 'Expenses', value: formatCurrency(stats.totalExpenses), icon: Receipt, color: 'bg-amber-500', onClick: () => onNavigate('/expenses') },
    { label: 'Mileage Cost', value: formatCurrency(stats.totalMileage), icon: MapPin, color: 'bg-purple-500', onClick: () => onNavigate('/mileage') },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">{companyName} — Overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.onClick}
              className="bg-white rounded-xl shadow-sm border p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-2 rounded-lg ${card.color} text-white mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 truncate">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold text-blue-800">{stats.estimates}</p>
            <p className="text-sm text-blue-600">Pending Estimates</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold text-red-800">{stats.overdue}</p>
            <p className="text-sm text-red-600">Overdue Invoices</p>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Invoices & Quotes</h2>
          <button
            onClick={() => onNavigate('/invoices')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </button>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet. Create your first invoice or estimate.</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">{inv.status === 'estimate' ? 'Estimate' : 'Invoice'} • {inv.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'estimate' ? 'bg-blue-100 text-blue-800' :
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
