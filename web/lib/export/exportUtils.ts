/**
 * Export Utilities for PDF and Excel/CSV generation
 * Client-side export functionality for reports and data
 */

// CSV Export
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Build CSV content
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.join(","));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Handle strings with commas/quotes
      if (typeof value === "string") {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    });
    csvRows.push(values.join(","));
  }
  
  // Create blob and download
  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

// Excel Export (using CSV format that Excel can open)
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName?: string
): void {
  // For basic Excel export, we use CSV format
  // For more complex Excel features, consider using xlsx library
  exportToCSV(data, filename);
}

// JSON Export
export function exportToJSON(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

// PDF Export (simple HTML to print)
export function exportToPDF(
  title: string,
  content: string,
  options?: {
    orientation?: "portrait" | "landscape";
    filename?: string;
  }
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for PDF export");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4 ${options?.orientation || "portrait"};
            margin: 1cm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #1f2937;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${content}
        <div class="footer">
          <p>Exported from BH-EDU on ${new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

// Generate HTML table from data
export function dataToHTMLTable(
  data: Record<string, unknown>[],
  options?: {
    headers?: Record<string, string>; // Map of key to display name
  }
): string {
  if (!data.length) return "<p>No data available</p>";

  const keys = Object.keys(data[0]);
  const headers = options?.headers || {};

  let html = "<table><thead><tr>";
  for (const key of keys) {
    html += `<th>${headers[key] || key}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (const row of data) {
    html += "<tr>";
    for (const key of keys) {
      const value = row[key];
      html += `<td>${value ?? "-"}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table>";
  return html;
}

// Export table data as PDF
export function exportTableToPDF(
  data: Record<string, unknown>[],
  title: string,
  options?: {
    headers?: Record<string, string>;
    orientation?: "portrait" | "landscape";
  }
): void {
  const tableHTML = dataToHTMLTable(data, { headers: options?.headers });
  exportToPDF(title, tableHTML, { orientation: options?.orientation });
}

// Helper function to download blob
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format data for grade report export
export function formatGradeReport(grades: {
  studentName: string;
  subject: string;
  score: number;
  date: string;
}[]): Record<string, unknown>[] {
  return grades.map((g) => ({
    "Học sinh": g.studentName,
    "Môn học": g.subject,
    "Điểm": g.score,
    "Ngày": new Date(g.date).toLocaleDateString("vi-VN"),
  }));
}

// Format data for attendance report export
export function formatAttendanceReport(attendance: {
  studentName: string;
  date: string;
  status: string;
  className: string;
}[]): Record<string, unknown>[] {
  const statusLabels: Record<string, string> = {
    present: "Có mặt",
    absent: "Vắng",
    late: "Muộn",
    excused: "Có phép",
  };

  return attendance.map((a) => ({
    "Học sinh": a.studentName,
    "Lớp": a.className,
    "Ngày": new Date(a.date).toLocaleDateString("vi-VN"),
    "Trạng thái": statusLabels[a.status] || a.status,
  }));
}
