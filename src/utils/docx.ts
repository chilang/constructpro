import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from 'docx';
import type { Invoice, Customer, CompanyInfo } from '../types';
import { formatCurrency, formatDate } from './format';

export async function generateDocx(invoice: Invoice, customer: Customer, company: CompanyInfo): Promise<Blob> {
  const isEstimate = invoice.status === 'estimate';
  const enabledTaxes = invoice.taxes.filter(t => t.enabled);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children: [
          // Company Name
          new Paragraph({
            children: [
              new TextRun({ text: company.name, bold: true, size: 40, color: '2980B9' }),
            ],
          }),
          // Tagline
          ...(company.tagline ? [new Paragraph({
            children: [new TextRun({ text: company.tagline, italics: true, size: 18, color: '666666' })],
          })] : []),
          // Company details
          new Paragraph({
            children: [new TextRun({ text: `${company.address}, ${company.city}, ${company.state} ${company.zip}`, size: 18 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Phone: ${company.phone} | Email: ${company.email}`, size: 18 })],
          }),
          new Paragraph({ text: '' }),
          // Divider line
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2980B9' } },
            text: '',
          }),
          new Paragraph({ text: '' }),
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: isEstimate ? 'ESTIMATE / QUOTE' : 'INVOICE',
                bold: true,
                size: 32,
                color: '2980B9',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          // Invoice details
          new Paragraph({
            children: [
              new TextRun({ text: isEstimate ? 'Estimate #: ' : 'Invoice #: ', bold: true }),
              new TextRun(invoice.invoiceNumber),
              new TextRun({ text: '     Date: ', bold: true }),
              new TextRun(formatDate(invoice.date)),
              new TextRun({ text: '     Due: ', bold: true }),
              new TextRun(formatDate(invoice.dueDate)),
              new TextRun({ text: '     Status: ', bold: true }),
              new TextRun(invoice.status.toUpperCase()),
            ],
          }),
          new Paragraph({ text: '' }),
          // Bill To
          new Paragraph({
            children: [new TextRun({ text: 'BILL TO:', bold: true, size: 22 })],
          }),
          new Paragraph({ children: [new TextRun({ text: customer.name, bold: true })] }),
          ...(customer.company ? [new Paragraph({ children: [new TextRun(customer.company)] })] : []),
          new Paragraph({ children: [new TextRun(customer.address)] }),
          new Paragraph({
            children: [new TextRun(`${customer.city}, ${customer.state} ${customer.zip}`)],
          }),
          new Paragraph({ children: [new TextRun(`Phone: ${customer.phone} | Email: ${customer.email}`)] }),
          new Paragraph({ text: '' }),
          // Line Items Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header row
              new TableRow({
                tableHeader: true,
                children: ['Type', 'Description', 'Qty', 'Unit Price', 'Amount'].map(
                  text =>
                    new TableCell({
                      shading: { type: ShadingType.SOLID, color: '2980B9' },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
                        }),
                      ],
                    })
                ),
              }),
              // Data rows
              ...invoice.lineItems.map(
                item =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph(item.type.charAt(0).toUpperCase() + item.type.slice(1))],
                      }),
                      new TableCell({
                        children: [new Paragraph(item.description)],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun(item.quantity.toString())], alignment: AlignmentType.CENTER })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun(formatCurrency(item.unitPrice))], alignment: AlignmentType.RIGHT })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun(formatCurrency(item.amount))], alignment: AlignmentType.RIGHT })],
                      }),
                    ],
                  })
              ),
            ],
          }),
          new Paragraph({ text: '' }),
          // Totals
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Subtotal: ', bold: true }),
              new TextRun(formatCurrency(invoice.subtotal)),
            ],
          }),
          ...enabledTaxes.map(
            tax =>
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `${tax.name} (${tax.rate}%): `, bold: true }),
                  new TextRun(formatCurrency(invoice.subtotal * tax.rate / 100)),
                ],
              })
          ),
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 3 } },
            alignment: AlignmentType.RIGHT,
            children: [],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'TOTAL: ', bold: true, size: 24 }),
              new TextRun({ text: formatCurrency(invoice.total), bold: true, size: 24, color: '2980B9' }),
            ],
          }),
          // Notes
          ...(invoice.notes
            ? [
                new Paragraph({ text: '' }),
                new Paragraph({
                  children: [new TextRun({ text: 'Notes:', bold: true, size: 20 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: invoice.notes, size: 18 })],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadDocx(invoice: Invoice, customer: Customer, company: CompanyInfo): Promise<void> {
  const blob = await generateDocx(invoice, customer, company);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoiceNumber}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
