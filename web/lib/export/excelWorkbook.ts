'use client';

import ExcelJS from 'exceljs';

export type ExcelCell = string | number | boolean | Date | null | undefined;

interface DownloadWorkbookOptions {
  filename: string;
  sheetName: string;
  rows: ExcelCell[][];
  columnWidths?: number[];
}

export async function downloadExcelWorkbook({
  filename,
  sheetName,
  rows,
  columnWidths = [],
}: DownloadWorkbookOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));

  worksheet.addRows(rows);
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  if (rows.length > 0) {
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    const header = worksheet.getRow(1);
    header.font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  try {
    anchor.href = url;
    anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

export async function readFirstWorksheet(file: File, maxRows = 5000): Promise<ExcelCell[][]> {
  const workbook = new ExcelJS.Workbook();
  const bytes = await file.arrayBuffer();
  await workbook.xlsx.load(bytes);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('File Excel không có sheet nào');
  if (worksheet.actualRowCount > maxRows) {
    throw new Error(`File có quá nhiều dòng (tối đa ${maxRows.toLocaleString('vi-VN')})`);
  }

  const rows: ExcelCell[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: ExcelCell[] = [];
    for (let column = 1; column <= row.cellCount; column += 1) {
      const value = row.getCell(column).value;

      if (value instanceof Date || value == null || typeof value !== 'object') {
        values.push(value as ExcelCell);
      } else if ('result' in value) {
        values.push((value.result ?? '') as ExcelCell);
      } else if ('text' in value) {
        values.push(String(value.text));
      } else if ('richText' in value) {
        values.push(value.richText.map((part) => part.text).join(''));
      } else {
        values.push(String(value));
      }
    }
    rows.push(values);
  });

  return rows;
}
