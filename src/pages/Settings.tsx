import { useState, useRef } from 'react';
import { Save, Upload, Plus, Trash2, Building2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCompanyInfo, saveCompanyInfo, getTaxRates, saveTaxRates } from '../store/db';
import type { CompanyInfo, TaxRate } from '../types';

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo>(getCompanyInfo());
  const [taxes, setTaxes] = useState<TaxRate[]>(getTaxRates());
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    saveCompanyInfo(company);
    saveTaxRates(taxes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompany({ ...company, logo: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  function addTaxRate() {
    setTaxes([...taxes, { id: uuidv4(), name: 'New Tax', rate: 0, enabled: true }]);
  }

  function updateTax(id: string, field: string, value: any) {
    setTaxes(taxes.map(t => t.id === id ? { ...t, [field]: value } : t));
  }

  function removeTax(id: string) {
    setTaxes(taxes.filter(t => t.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Company info & tax configuration</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          <Save className="w-5 h-5" /> {saved ? 'Saved ✓' : 'Save All'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Company Header</h2>
          </div>

          {/* Logo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
            {company.logo && (
              <div className="mb-2">
                <img src={company.logo} alt="Logo" className="h-16 object-contain" />
              </div>
            )}
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button
              onClick={() => logoRef.current?.click()}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Upload className="w-4 h-4" /> {company.logo ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>

          <div className="space-y-3">
            {[
              { key: 'name', label: 'Company Name' },
              { key: 'tagline', label: 'Tagline' },
              { key: 'address', label: 'Street Address' },
              { key: 'city', label: 'City' },
              { key: 'state', label: 'State' },
              { key: 'zip', label: 'ZIP Code' },
              { key: 'phone', label: 'Phone' },
              { key: 'email', label: 'Email' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={(company as any)[field.key]}
                  onChange={e => setCompany({ ...company, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tax Rates */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Tax Rates</h2>
            <button
              onClick={addTaxRate}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Tax
            </button>
          </div>

          <div className="space-y-3">
            {taxes.map(tax => (
              <div key={tax.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={tax.enabled}
                  onChange={e => updateTax(tax.id, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <input
                  type="text"
                  value={tax.name}
                  onChange={e => updateTax(tax.id, 'name', e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="Tax name"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={tax.rate}
                    onChange={e => updateTax(tax.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-sm text-right"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <button onClick={() => removeTax(tax.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Preview</h3>
            <div className="text-sm text-blue-800">
              <p className="font-bold">{company.name}</p>
              <p>{company.tagline}</p>
              <p>{company.address}, {company.city}, {company.state} {company.zip}</p>
              <p>{company.phone} | {company.email}</p>
              <div className="mt-2">
                <p className="font-medium">Active Taxes:</p>
                {taxes.filter(t => t.enabled).map(t => (
                  <p key={t.id}>• {t.name}: {t.rate}%</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
