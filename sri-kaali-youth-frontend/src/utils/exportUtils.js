import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './formatters';

/**
 * Export tabular data to PDF document with Sri Kaali Youth branding
 */
export const exportToPDF = ({
  title = 'Report',
  subtitle = 'Sri Kaali Youth Shalawada',
  headers = [],
  data = [],
  fileName = 'report.pdf',
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(76, 29, 149); // #4c1d95
  doc.rect(0, 0, 210, 28, 'F');

  // Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SRI KAALI YOUTH SHALAWADA', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), 14, 20);

  // Subtitle / Date stamp
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  const dateStamp = `Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`;
  doc.text(dateStamp, 14, 35);
  if (subtitle) {
    doc.text(subtitle, 140, 35);
  }

  // AutoTable Data
  doc.autoTable({
    startY: 40,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [109, 40, 217], // #6d28d9
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 40, left: 14, right: 14 },
    didDrawPage: (dataArg) => {
      // Footer page number
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 180, 287);
    },
  });

  doc.save(fileName);
};

/**
 * Export tabular data to Excel (.xlsx) file
 */
export const exportToExcel = ({
  title = 'Data',
  headers = [],
  data = [],
  fileName = 'report.xlsx',
}) => {
  // Convert headers and data into worksheet format
  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths dynamically
  const colWidths = headers.map((h, i) => {
    let maxLen = String(h).length;
    data.forEach((row) => {
      if (row[i] !== undefined && row[i] !== null) {
        maxLen = Math.max(maxLen, String(row[i]).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));

  XLSX.writeFile(workbook, fileName);
};

/**
 * Trigger clean window printing for tables / reports
 */
export const printReport = () => {
  window.print();
};
