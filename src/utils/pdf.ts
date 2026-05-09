import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Customer, CompanyInfo, LineItem } from '../types';
import { formatCurrency, formatDate } from './format';

export function generatePDF(invoice: Invoice, customer: Customer, company: CompanyInfo): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 14, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline || '', 14, y);
  y += 5;
  doc.text(`${company.address}, ${company.city}, ${company.state} ${company.zip}`, 14, y);
  y += 5;
  doc.text(`Phone: ${company.phone} | Email: ${company.email}`, 14, y);
  y += 10;

  // Divider
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  // Invoice title
  const isEstimate = invoice.status === 'estimate';
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(isEstimate ? 'ESTIMATE / QUOTE' : 'INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Invoice info + Customer info side by side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(isEstimate ? 'Estimate #:' : 'Invoice #:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 60, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.date), 60, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.dueDate), 60, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.status.toUpperCase(), 60, y);
  y += 10;

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customer.name, 14, y);
  y += 5;
  if (customer.company) { doc.text(customer.company, 14, y); y += 5; }
  doc.text(customer.address, 14, y);
  y += 5;
  doc.text(`${customer.city}, ${customer.state} ${customer.zip}`, 14, y);
  y += 5;
  doc.text(`Phone: ${customer.phone}`, 14, y);
  y += 5;
  doc.text(`Email: ${customer.email}`, 14, y);
  y += 10;

  // Line items table
  const tableBody = invoice.lineItems.map((item: LineItem) => [
    item.type.charAt(0).toUpperCase() + item.type.slice(1),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Type', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  const rightCol = pageWidth - 14;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', rightCol - 70, y);
  doc.text(formatCurrency(invoice.subtotal), rightCol, y, { align: 'right' });
  y += 6;

  if (invoice.taxes.length > 0) {
    invoice.taxes.filter(t => t.enabled).forEach(tax => {
      doc.text(`${tax.name} (${tax.rate}%):`, rightCol - 70, y);
      doc.text(formatCurrency(invoice.subtotal * tax.rate / 100), rightCol, y, { align: 'right' });
      y += 6;
    });
  }

  doc.setLineWidth(0.3);
  doc.line(rightCol - 70, y, rightCol, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', rightCol - 70, y);
  doc.text(formatCurrency(invoice.total), rightCol, y, { align: 'right' });
  y += 12;

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(lines, 14, y);
  }

  return doc;
}

export function downloadPDF(invoice: Invoice, customer: Customer, company: CompanyInfo): void {
  const doc = generatePDF(invoice, customer, company);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
