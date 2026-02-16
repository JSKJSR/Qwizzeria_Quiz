import { useState, useRef, useCallback } from 'react';
import { bulkCreateQuestions } from '@qwizzeria/supabase-client/src/questions.js';
import { parseExcelFile, generateTemplate } from '../utils/excelParser';

export default function BulkImport() {
  const [parsed, setParsed] = useState(null);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    setParsed(null);
    setErrors([]);
    setResult(null);

    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExt = file.name.match(/\.xlsx?$/i);

    if (!validTypes.includes(file.type) && !validExt) {
      setErrors(['Please upload an Excel file (.xlsx or .xls).']);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { questions, errors: parseErrors } = parseExcelFile(arrayBuffer);
      setParsed(questions);
      setErrors(parseErrors);
    } catch (err) {
      setErrors([`Failed to parse file: ${err.message}`]);
    }
  }, []);

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleImport = async () => {
    if (!parsed || parsed.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await bulkCreateQuestions(parsed);
      setResult({ success: data.length, failed: 0 });
      setParsed(null);
    } catch (err) {
      setResult({ success: 0, failed: parsed.length, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = generateTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qwizzeria_import_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Bulk Import</h1>
        <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
          Download Template
        </button>
      </div>

      <div
        className={`import-zone${dragActive ? ' import-zone--active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
          Drop Excel file here or click to browse
        </p>
        <p>Supported formats: .xlsx, .xls</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {errors.length > 0 && (
        <div className="alert alert--error" style={{ marginTop: '1rem' }}>
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {result && (
        <div
          className={`alert ${result.error ? 'alert--error' : 'alert--success'}`}
          style={{ marginTop: '1rem' }}
        >
          {result.error
            ? `Import failed: ${result.error}`
            : `Successfully imported ${result.success} question${result.success !== 1 ? 's' : ''}.`}
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)' }}>
              Preview ({parsed.length} question{parsed.length !== 1 ? 's' : ''})
            </h2>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : `Import ${parsed.length} Questions`}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Category</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((q, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="truncate">{q.question_text}</td>
                    <td className="truncate">{q.answer_text}</td>
                    <td>{q.category || '—'}</td>
                    <td>{Array.isArray(q.tags) ? q.tags.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
