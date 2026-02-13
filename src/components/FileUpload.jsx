import { useState, useRef } from 'react';
import { parseExcelFile } from '../utils/excelParser';
import '../styles/FileUpload.css';

export default function FileUpload({ onQuizLoaded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const topics = await parseExcelFile(file);
      setLoaded(true);
      onQuizLoaded(topics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  if (loaded) {
    return (
      <div className="file-upload">
        <div className="file-upload__success">
          &#10003; Quiz loaded successfully
        </div>
      </div>
    );
  }

  return (
    <div className="file-upload">
      <div
        className={`file-upload__dropzone ${dragActive ? 'file-upload__dropzone--active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="file-upload__icon">&#128196;</div>
        <div className="file-upload__label">
          {loading ? 'Loading...' : 'Drop Excel file here or click to browse'}
        </div>
        <div className="file-upload__hint">.xlsx or .xls</div>
        <input
          ref={inputRef}
          className="file-upload__input"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {error && <div className="file-upload__error">{error}</div>}
    </div>
  );
}
