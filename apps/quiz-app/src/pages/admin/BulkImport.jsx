import { useState, useRef, useCallback, useEffect } from 'react';
import { bulkCreateQuestions, fetchAllPacks, createPack, bulkAddQuestionsToPack } from '@qwizzeria/supabase-client';
import { parseExcelFile, generateTemplate } from '@/utils/adminExcelParser';

export default function BulkImport() {
  const [parsed, setParsed] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importedIds, setImportedIds] = useState([]);
  const [packMode, setPackMode] = useState('none'); // 'none' | 'new' | 'existing'
  const [newPackTitle, setNewPackTitle] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [existingPacks, setExistingPacks] = useState([]);
  const [packAssigning, setPackAssigning] = useState(false);
  const [packResult, setPackResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAllPacks({ pageSize: 200 })
      .then(({ data }) => setExistingPacks(data || []))
      .catch(() => {});
  }, []);

  const processFile = useCallback(async (file) => {
    setParsed(null);
    setErrors([]);
    setWarnings([]);
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
      const { questions, errors: parseErrors, warnings: parseWarnings } = parseExcelFile(arrayBuffer);
      setParsed(questions);
      setErrors(parseErrors);
      setWarnings(parseWarnings || []);
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
      // Strip internal warning flags before sending to DB
      const cleanQuestions = parsed.map((q) => {
        const clean = { ...q };
        delete clean._categoryWarning;
        delete clean._subCategoryWarning;
        return clean;
      });
      const data = await bulkCreateQuestions(cleanQuestions);
      setResult({ success: data.length, failed: 0 });
      setImportedIds(data.map(q => q.id));
      setParsed(null);
      setWarnings([]);
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

  const handleAssignToPack = async () => {
    setPackAssigning(true);
    setPackResult(null);
    try {
      let packId = selectedPackId;
      if (packMode === 'new') {
        const pack = await createPack({ title: newPackTitle.trim(), status: 'draft', is_public: false });
        packId = pack.id;
      }
      await bulkAddQuestionsToPack(packId, importedIds);
      setPackResult({ success: true, packId });
      setImportedIds([]);
    } catch (err) {
      setPackResult({ success: false, error: err.message });
    } finally {
      setPackAssigning(false);
    }
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
        <p className="import-zone__hint">
          Drop Excel file here or click to browse
        </p>
        <p>Supported formats: .xlsx, .xls</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          hidden
        />
      </div>

      {errors.length > 0 && (
        <div className="alert alert--error bulk-import__alert-mt">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bulk-import__warning">
          <strong>Category warnings ({warnings.length}):</strong>
          {warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}

      {result && (
        <div className={`alert ${result.error ? 'alert--error' : 'alert--success'} bulk-import__alert-mt`}>
          {result.error
            ? `Import failed: ${result.error}`
            : `Successfully imported ${result.success} question${result.success !== 1 ? 's' : ''}.`}
        </div>
      )}

      {importedIds.length > 0 && !packResult && (
        <div className="bulk-import__pack-section">
          <h3 className="bulk-import__pack-title">
            Add {importedIds.length} questions to a Quiz Pack
          </h3>

          <div className="bulk-import__pack-modes">
            <label className="bulk-import__pack-mode-label">
              <input type="radio" name="packMode" value="new" checked={packMode === 'new'} onChange={() => setPackMode('new')} />
              Create new pack
            </label>
            <label className="bulk-import__pack-mode-label">
              <input type="radio" name="packMode" value="existing" checked={packMode === 'existing'} onChange={() => setPackMode('existing')} />
              Add to existing pack
            </label>
            <label className="bulk-import__pack-mode-label">
              <input type="radio" name="packMode" value="none" checked={packMode === 'none'} onChange={() => setPackMode('none')} />
              Skip
            </label>
          </div>

          {packMode === 'new' && (
            <input
              type="text"
              className="bulk-import__pack-input"
              placeholder="Pack title (e.g. January 2024 Qwizzeria Challenge)"
              value={newPackTitle}
              onChange={(e) => setNewPackTitle(e.target.value)}
            />
          )}

          {packMode === 'existing' && (
            <select
              className="bulk-import__pack-input"
              value={selectedPackId}
              onChange={(e) => setSelectedPackId(e.target.value)}
            >
              <option value="">Select a pack...</option>
              {existingPacks.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.question_count || 0} questions)</option>
              ))}
            </select>
          )}

          {packMode !== 'none' && (
            <button
              className="btn btn-primary bulk-import__pack-btn"
              disabled={packAssigning || (packMode === 'new' && !newPackTitle.trim()) || (packMode === 'existing' && !selectedPackId)}
              onClick={handleAssignToPack}
            >
              {packAssigning ? 'Assigning...' : `Add ${importedIds.length} Questions to Pack`}
            </button>
          )}
        </div>
      )}

      {packResult && (
        <div className={`alert ${packResult.success ? 'alert--success' : 'alert--error'} bulk-import__alert-mt`}>
          {packResult.success
            ? `Successfully added all questions to the pack! You can manage it in Admin → Packs.`
            : `Failed to assign to pack: ${packResult.error}`}
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <div className="bulk-import__preview">
          <div className="bulk-import__preview-header">
            <h2 className="bulk-import__preview-title">
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

          <div className="bulk-import__table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Display Title</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((q, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="truncate">{q.question_text}</td>
                    <td className="truncate">{q.answer_text}</td>
                    <td>
                      {q.category || '—'}
                      {q._categoryWarning && (
                        <span className="bulk-import__category-warn" title="Non-standard category">!!</span>
                      )}
                    </td>
                    <td>
                      {q.sub_category || '—'}
                      {q._subCategoryWarning && (
                        <span className="bulk-import__category-warn" title="Non-standard sub-category">!!</span>
                      )}
                    </td>
                    <td>{q.display_title || '—'}</td>
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
