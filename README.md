# ConstructPro

Construction business invoice & expense management app.

## Features
- **Quotes & Invoices**: Create estimates, convert to invoices, track status
- **Customer Management**: Store customer info, view running balances
- **Expense Tracking**: Capture receipt photos, categorize by job/customer/invoice
- **Mileage Tracker**: Log mileage per job with IRS rate calculation
- **Export**: Generate PDF or Word DOCX documents
- **Messaging**: Send invoices/quotes via email or SMS
- **Tax Management**: Add/remove/configure tax rates
- **Company Branding**: Customize company header and logo
- **Responsive**: Works on desktop, tablet, and mobile devices

## Tech Stack
- React 19 + TypeScript
- Tailwind CSS 4
- Vite
- jsPDF + docx for document generation
- LocalStorage (client-side persistence)

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Railway Deployment

1. Push to GitHub
2. Connect repository to Railway
3. Railway auto-detects Nixpacks and builds
4. App serves on Railway's PORT

## Environment Variables
- `PORT` - Server port (default: 3000, Railway sets this automatically)
