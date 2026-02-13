import * as XLSX from 'xlsx';
import { detectMediaType } from './mediaDetector';

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    throw new Error('Excel file is empty');
  }

  // Validate required columns
  const headers = Object.keys(rows[0]);
  const requiredColumns = ['Q. No', 'Topic', 'Points', 'Q', 'Answer'];
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      throw new Error(`Missing required column: "${col}"`);
    }
  }

  // Find the visual column (may be "Visual" or "Visual (link)")
  const visualCol = headers.find(h =>
    h.toLowerCase().includes('visual')
  ) || 'Visual';

  // Group by topic
  const topicMap = new Map();

  rows.forEach((row, index) => {
    const topicName = String(row['Topic']).trim();
    if (!topicName) return;

    const visualUrl = String(row[visualCol] || '').trim();
    const media = detectMediaType(visualUrl);

    const question = {
      id: `q-${index}`,
      qNo: row['Q. No'],
      topic: topicName,
      points: Number(row['Points']) || 0,
      question: String(row['Q']).trim(),
      visual: visualUrl || null,
      mediaType: media.type,
      embedUrl: media.embedUrl,
      answer: String(row['Answer']).trim(),
    };

    if (!topicMap.has(topicName)) {
      topicMap.set(topicName, { name: topicName, questions: [] });
    }
    topicMap.get(topicName).questions.push(question);
  });

  const topics = Array.from(topicMap.values());

  if (topics.length === 0) {
    throw new Error('No topics found in the Excel file');
  }
  if (topics.length > 24) {
    throw new Error(`Too many topics (${topics.length}). Maximum is 24.`);
  }

  return topics;
}
