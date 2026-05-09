export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function dueDateStr(days = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function statusColor(status: string): string {
  switch (status) {
    case 'estimate': return 'bg-blue-100 text-blue-800';
    case 'invoiced': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function typeColor(type: string): string {
  switch (type) {
    case 'service': return 'bg-purple-100 text-purple-800';
    case 'hours': return 'bg-blue-100 text-blue-800';
    case 'materials': return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function shareViaMessage(invoice: any, customer: any, company: any): void {
  const isEstimate = invoice.status === 'estimate';
  const subject = isEstimate
    ? `Estimate ${invoice.invoiceNumber} from ${company.name}`
    : `Invoice ${invoice.invoiceNumber} from ${company.name}`;

  const body = `Hi ${customer.name},

Please find below the details of ${isEstimate ? 'your estimate' : 'your invoice'}:

${isEstimate ? 'Estimate' : 'Invoice'} #: ${invoice.invoiceNumber}
Date: ${formatDate(invoice.date)}
Due Date: ${formatDate(invoice.dueDate)}

Items:
${invoice.lineItems.map((item: any) => `- ${item.description}: ${formatCurrency(item.amount)}`).join('\n')}

Subtotal: ${formatCurrency(invoice.subtotal)}
Tax: ${formatCurrency(invoice.taxTotal)}
Total: ${formatCurrency(invoice.total)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!
${company.name}
${company.phone}`;

  const emailUrl = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Try email first
  window.open(emailUrl, '_blank');
}
