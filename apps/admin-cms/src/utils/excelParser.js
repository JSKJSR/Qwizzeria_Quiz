import * as XLSX from 'xlsx';

const COLUMN_MAP = {
  'question': 'question_text',
  'question_text': 'question_text',
  'answer': 'answer_text',
  'answer_text': 'answer_text',
  'category': 'category',
  'explanation': 'answer_explanation',
  'answer_explanation': 'answer_explanation',
  'media url': 'media_url',
  'media_url': 'media_url',
  'tags': 'tags',
  'sub category': 'sub_category',
  'sub_category': 'sub_category',
  'points': 'points',
  'score': 'points',
};

function normalizeHeader(header) {
  return String(header).trim().toLowerCase();
}

/**
 * Parse an Excel file buffer into an array of question objects.
 * Returns { questions, errors } where errors lists rows with missing required fields.
 */
export function parseExcelFile(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return { questions: [], errors: ['No data found in the spreadsheet.'] };
  }

  // Map headers
  const rawHeaders = Object.keys(rows[0]);
  const headerMap = {};
  for (const h of rawHeaders) {
    const normalized = normalizeHeader(h);
    if (COLUMN_MAP[normalized]) {
      headerMap[h] = COLUMN_MAP[normalized];
    }
  }

  const questions = [];
  const errors = [];

  rows.forEach((row, index) => {
    const q = {};
    for (const [rawKey, dbKey] of Object.entries(headerMap)) {
      const value = String(row[rawKey] ?? '').trim();
      if (value) {
        if (dbKey === 'tags') {
          q[dbKey] = value.split(',').map(t => t.trim()).filter(Boolean);
        } else if (dbKey === 'points') {
          const n = parseInt(value, 10);
          if (!isNaN(n) && n > 0) q[dbKey] = n;
        } else {
          q[dbKey] = value;
        }
      }
    }

    if (!q.question_text || !q.answer_text) {
      errors.push(`Row ${index + 2}: Missing required Question or Answer.`);
      return;
    }

    // Defaults
    q.status = q.status || 'active';
    q.is_public = true;

    questions.push(q);
  });

  return { questions, errors };
}

/**
 * Generate a template Excel file as a Blob for download.
 */
export function generateTemplate() {
  const headers = ['Question', 'Answer', 'Category', 'Sub Category', 'Explanation', 'Media URL', 'Tags', 'Points'];
  const sampleRow = [
    'What is the capital of France?',
    'Paris',
    'Geography',
    'Europe',
    'Paris has been the capital since the 10th century.',
    '',
    'geography, europe, capitals',
    '10',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
