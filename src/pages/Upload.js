import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  // Redirect if not authorized
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'analyst') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [jobId, setJobId] = useState(null);
  const [progressInterval, setProgressInterval] = useState(null);

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData([]);
      setAvailableColumns([]);
      setUploadSuccess(false);
      setUploadError('');

      // Parse file to get actual column headers
      parseFileHeaders(selectedFile);
    }
  };

  // Parse file headers to get actual column names
  const parseFileHeaders = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let columns = [];

        if (fileExtension === 'csv') {
          // Parse CSV file
          const csvData = Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            preview: 1
          });

          if (csvData.data.length > 0) {
            columns = Object.keys(csvData.data[0]);
          }
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // Parse Excel file
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (jsonData.length > 0) {
            columns = jsonData[0].filter(col => col !== ''); // Remove empty columns
          }
        }

        setAvailableColumns(columns);
      } catch (error) {
        console.error('Error parsing file headers:', error);
        setUploadError('Error reading file headers. Please check the file format.');
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  // Handle column mapping change
  const handleColumnChange = (field, value) => {
    setColumnMapping({
      ...columnMapping,
      [field]: value
    });

    // Clear any previous validation errors when user makes changes
    if (uploadError && uploadError.includes('required columns')) {
      setUploadError('');
    }
  };

  // Validate required columns before upload
  const validateRequiredColumns = () => {
    const requiredColumns = ['transactionId', 'amount'];
    const missingColumns = [];

    // Check if required columns are mapped
    requiredColumns.forEach(col => {
      if (!columnMapping[col] || columnMapping[col].trim() === '') {
        const columnName = col === 'transactionId' ? 'Transaction ID' : 'Amount';
        missingColumns.push(columnName);
      }
    });

    return {
      isValid: missingColumns.length === 0,
      missingColumns
    };
  };

  // Get validation message for display
  const getValidationMessage = () => {
    const validation = validateRequiredColumns();
    if (!validation.isValid) {
      return `Please map the following required columns: ${validation.missingColumns.join(' and ')}`;
    }
    return '';
  };

  // Preview the actual file data
  const previewFile = async () => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let previewData = [];

        if (fileExtension === 'csv') {
          // Parse CSV file
          const csvData = Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true
          });

          // Take first 10 rows for preview
          previewData = csvData.data.slice(0, 10);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // Parse Excel file
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          // Take first 10 rows for preview
          previewData = jsonData.slice(0, 10);
        }

        setPreviewData(previewData);
      } catch (error) {
        console.error('Error parsing file for preview:', error);
        setUploadError('Error reading file for preview. Please check the file format.');
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // Upload the file
  const uploadFile = async () => {
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    // Validate required columns before upload
    const validation = validateRequiredColumns();
    if (!validation.isValid) {
      setUploadError(getValidationMessage());
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      // Make the API call
      const response = await axios.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newJobId = response.data.data.jobId;
      setJobId(newJobId);
      setUploadProgress(0); // Reset progress for polling

      // Start polling for progress updates
      const interval = setInterval(async () => {
        try {
          const progressResponse = await axios.get(`/api/uploads/${newJobId}/progress`);
          const { status, progress, errorMessage } = progressResponse.data.data;

          setUploadProgress(progress);

          if (status === 'completed' || status === 'failed') {
            clearInterval(interval);
            setProgressInterval(null);

            if (status === 'completed') {
              setUploadSuccess(true);
              setUploadError('');
            } else {
              setUploadError(errorMessage || 'Upload processing failed.');
            }
            setIsUploading(false);
          }
        } catch (err) {
          console.error('Progress polling error:', err);
          clearInterval(interval);
          setProgressInterval(null);
          setUploadError('Failed to get upload progress. Please check status manually.');
          setIsUploading(false);
        }
      }, 1000); // Poll every second

      setProgressInterval(interval);
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 409) {
        // Handle file already processed case
        setUploadError(error.response.data.message);
        setJobId(error.response.data.data?.jobId);
        setUploadSuccess(true);
      } else {
        setUploadError(error.response?.data?.message || 'Upload failed');
      }
      setIsUploading(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setColumnMapping({});
    setPreviewData([]);
    setAvailableColumns([]);
    setUploadSuccess(false);
    setUploadError('');
    setJobId(null);
    setUploadProgress(0);

    // Clear any active polling interval
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }

    setIsUploading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Upload Reconciliation File</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>

          <div {...getRootProps()} className={`file-dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <div className="text-center">
                <p className="text-lg mb-2">Drag & drop your file here</p>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">Supported formats: CSV, XLS, XLSX</p>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="font-medium">Selected file:</p>
              <p className="truncate">{file.name}</p>
              <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {file && (
            <div className="mt-4">
              <button
                onClick={previewFile}
                className="btn btn-secondary mr-2"
              >
                Preview Data
              </button>
              <button
                onClick={resetForm}
                className="btn btn-danger"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Column Mapping Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Map Columns</h2>

          {/* Validation Status */}
          {file && (
            <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <span className="text-blue-700 font-medium">Required columns: Transaction ID and Amount</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-700 font-medium">Transaction ID Column</label>
                <span className="text-red-500 text-sm font-medium">* Required</span>
              </div>
              <select
                value={columnMapping.transactionId || ''}
                onChange={(e) => handleColumnChange('transactionId', e.target.value)}
                className={`form-control ${!columnMapping.transactionId ? 'border-red-300' : 'border-green-300'}`}
              >
                <option value="">Select column...</option>
                {availableColumns.map(col => (
                  <option key={`txn-${col}`} value={col}>{col}</option>
                ))}
              </select>
              {!columnMapping.transactionId && (
                <p className="text-red-500 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-700 font-medium">Amount Column</label>
                <span className="text-red-500 text-sm font-medium">* Required</span>
              </div>
              <select
                value={columnMapping.amount || ''}
                onChange={(e) => handleColumnChange('amount', e.target.value)}
                className={`form-control ${!columnMapping.amount ? 'border-red-300' : 'border-green-300'}`}
              >
                <option value="">Select column...</option>
                {availableColumns.map(col => (
                  <option key={`amt-${col}`} value={col}>{col}</option>
                ))}
              </select>
              {!columnMapping.amount && (
                <p className="text-red-500 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Reference Number Column</label>
              <select
                value={columnMapping.referenceNumber || ''}
                onChange={(e) => handleColumnChange('referenceNumber', e.target.value)}
                className="form-control"
              >
                <option value="">Select column...</option>
                {availableColumns.map(col => (
                  <option key={`ref-${col}`} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Date Column</label>
              <select
                value={columnMapping.date || ''}
                onChange={(e) => handleColumnChange('date', e.target.value)}
                className="form-control"
              >
                <option value="">Select column...</option>
                {availableColumns.map(col => (
                  <option key={`date-${col}`} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Summary */}
          {file && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Column Mapping Status:</span>
                {validateRequiredColumns().isValid ? (
                  <span className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Ready for upload
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {getValidationMessage()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {previewData.length > 0 && (
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">File Preview (First 10 Rows)</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {Object.keys(previewData[0]).map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button and Progress */}
      <div className="card mt-8">
        <div className="flex justify-between items-center">
          <button
            onClick={uploadFile}
            disabled={isUploading || !file || !validateRequiredColumns().isValid}
            className={`btn ${isUploading ? 'btn-secondary' : 'btn-primary'} ${(isUploading || !file || !validateRequiredColumns().isValid) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>

          {isUploading && (
            <div className="w-1/2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-600 mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p>File uploaded successfully!</p>
            <p>Upload Job ID: {jobId}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;