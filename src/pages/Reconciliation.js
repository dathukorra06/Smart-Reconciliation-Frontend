import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reconciliation = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    matchStatus: '',
    transactionId: '',
    page: 1,
    limit: 10
  });

  // Local search state for real-time filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedResults, setSelectedResults] = useState(new Set());

  useEffect(() => {
    // Always fetch results - search works independently
    fetchReconciliationResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  const fetchReconciliationResults = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.matchStatus) queryParams.append('matchStatus', filters.matchStatus);
      if (searchTerm) queryParams.append('search', searchTerm);
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);

      const response = await axios.get(`/api/reconciliation/results?${queryParams}`);

      setResults(response.data.data.results);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load reconciliation results');
      console.error('Reconciliation results fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSearchChange = (value) => {
    console.log('Search term changed to:', value);
    console.log('Current results count:', results.length);
    setSearchTerm(value);
    // Reset to first page when search changes
    setFilters(prev => ({
      ...prev,
      page: 1
    }));
  };



  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedResults.size === 0) return;

    try {
      const promises = Array.from(selectedResults).map(resultId =>
        axios.put(`/api/reconciliation/results/${resultId}`, {
          matchStatus: bulkAction
        })
      );

      await Promise.all(promises);

      // Refresh the results
      fetchReconciliationResults();

      // Clear selection
      setSelectedResults(new Set());
      setBulkAction('');

    } catch (err) {
      setError('Failed to perform bulk action');
      console.error('Bulk action error:', err);
    }
  };

  const toggleResultSelection = (resultId) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const openUpdateModal = (result) => {
    setSelectedResult(result);
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedResult(null);
  };

  const updateResult = async (updatedData) => {
    try {
      await axios.put(`/api/reconciliation/results/${selectedResult._id}`, updatedData);

      // Update the result in the list
      setResults(prev => prev.map(r =>
        r._id === selectedResult._id ? { ...r, ...updatedData } : r
      ));

      closeUpdateModal();
    } catch (err) {
      setError('Failed to update reconciliation result');
      console.error('Update result error:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'matched':
        return 'status-match';
      case 'partially_matched':
        return 'status-partial';
      case 'not_matched':
        return 'status-no-match';
      case 'duplicate':
        return 'status-duplicate';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // ... rest of the component remains the same ...
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Reconciliation Results</h1>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Upload Job ID Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by Upload Job ID or File Name..."
              className="form-control"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Match Status</label>
            <select
              value={filters.matchStatus}
              onChange={(e) => handleFilterChange('matchStatus', e.target.value)}
              className="form-control"
            >
              <option value="">All Statuses</option>
              <option value="matched">Matched</option>
              <option value="partially_matched">Partially Matched</option>
              <option value="not_matched">Not Matched</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Page Size</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="form-control"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, page: 1 }));
                fetchReconciliationResults();
              }}
              className="btn btn-primary w-full"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedResults.size > 0 && (
        <div className="card mb-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-blue-800">
                {selectedResults.size} record(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="form-control text-sm"
              >
                <option value="">Choose action...</option>
                <option value="matched">Mark as Matched</option>
                <option value="partially_matched">Mark as Partially Matched</option>
                <option value="not_matched">Mark as Not Matched</option>
                <option value="duplicate">Mark as Duplicate</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className={`btn btn-primary text-sm ${!bulkAction ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedResults(new Set())}
                className="btn btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Reconciliation Results</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && results.length === 0 && !error && !searchTerm && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            No reconciliation results found. Please upload some data first.
          </div>
        )}

        {searchTerm && results.length === 0 && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            No results found matching "{searchTerm}". Try searching by Upload Job ID or File Name.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedResults.size === results.length && results.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedResults(new Set(results.map(r => r._id)));
                      } else {
                        setSelectedResults(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th>Uploaded Record</th>
                <th>System Record</th>
                <th>Status</th>
                <th>Variance %</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result._id}
                  className={selectedResults.has(result._id) ? 'bg-blue-50' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result._id)}
                      onChange={() => toggleResultSelection(result._id)}
                      className="rounded"
                    />
                  </td>
                  <td>
                    <div className="font-medium">{result.uploadedRecordId?.transactionId}</div>
                    <div className="text-sm">${result.uploadedRecordId?.amount}</div>
                    <div className="text-xs text-gray-500">{result.uploadedRecordId?.referenceNumber}</div>
                  </td>
                  <td>
                    <div className="font-medium">{result.systemRecordId?.transactionId}</div>
                    <div className="text-sm">${result.systemRecordId?.amount}</div>
                    <div className="text-xs text-gray-500">{result.systemRecordId?.referenceNumber}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(result.matchStatus)}`}>
                      {result.matchStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {result.variancePercentage ? `${result.variancePercentage.toFixed(2)}%` : '-'}
                  </td>
                  <td>{new Date(result.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => openUpdateModal(result)}
                      className="btn btn-secondary text-sm"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="mt-6 flex justify-between items-center">
            <div>
              <span>
                {`Showing ${((pagination.currentPage - 1) * filters.limit) + 1} - ${Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of ${pagination.totalItems} results`}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`btn ${pagination.hasPrev ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                Previous
              </button>

              <span className="flex items-center px-4">
                <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
              </span>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`btn ${pagination.hasNext ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Reconciliation Result</h3>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Current Status</label>
              <div className="p-2 bg-gray-100 rounded">
                <span className={`status-badge ${getStatusClass(selectedResult.matchStatus)}`}>
                  {selectedResult.matchStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">New Status</label>
              <select
                defaultValue={selectedResult.matchStatus}
                className="form-control"
                id="newStatus"
              >
                <option value="matched">Matched</option>
                <option value="partially_matched">Partially Matched</option>
                <option value="not_matched">Not Matched</option>
                <option value="duplicate">Duplicate</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                className="form-control"
                id="notes"
                rows="3"
                placeholder="Add notes about this update..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeUpdateModal}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newStatus = document.getElementById('newStatus').value;
                  const notes = document.getElementById('notes').value;

                  updateResult({
                    matchStatus: newStatus,
                    notes: notes
                  });
                }}
                className="btn btn-primary"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reconciliation;