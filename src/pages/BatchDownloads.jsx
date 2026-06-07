import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    UserPlus,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../utils/icons';

const BatchDownloads = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    
    //Initialize All Required constants
    const [batchDownloads, setBatchDownloads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    
    /*
     * Pagination slicing code
     */

    const totalPagesToShow = 5;
    const paginationItems = [];

    let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2));
    let endPage = startPage + totalPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }

    // First Page
    if (startPage > 1) {
        paginationItems.push(
            <li key={1} className={`page-item ${currentPage === 1 ? 'active' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}>1</a>
            </li>
        );
        if (startPage > 2) {
            paginationItems.push(<li key="start-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
        }
    }

    // Middle Pages
    for (let i = startPage; i <= endPage; i++) {
        paginationItems.push(
            <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}>{i}</a>
            </li>
        );
    }

    // Last Page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationItems.push(<li key="end-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
        }
        paginationItems.push(
            <li key={totalPages} className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}>{totalPages}</a>
            </li>
        );
    }

    /*
     * Api calls 
     */
    //Fetch All transactional batches
    const fetchTransactionalBatches = async (page = 1, search = '') => {
        setLoading(true);
        setSelectedTransactions([]);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                ...(search && { search })
            });
    
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getTransactionalBatches}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setBatchDownloads(result.data.data);
                setTotalPages(result.data.last_page || 1);
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTransactionalBatches(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Transaction Batches</h4>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Exported Invoice Batches</h5>
                            
                            <div className="app-form app-icon-form">
                                <div className="position-relative icon-input-form">
                                    <input aria-label="Search" className="form-control search-filter" placeholder="Search..." type="search"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1); 
                                    }}
                                    />
                                    <Search className="svg-dark" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Import ID</th>
                                        <th scope="col">Total Customers</th>
                                        <th scope="col">Invoices</th>
                                        <th scope="col">Generated At</th>
                                        <th scope="col">Expires At</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">ZIP File</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">Loading...</td>
                                        </tr>
                                    ) : batchDownloads.length > 0 ? (
                                        batchDownloads.map((batch, index) => {
                                            const now = new Date();
                                            const expiresAt = batch.zip_expires_at ? new Date(batch.zip_expires_at) : null;
                                            const isExpired = expiresAt && now > expiresAt;

                                            return (
                                                <tr key={batch.import_id}>
                                                    <td>{index + 1}</td>
                                                    <td>{batch.import_id}</td>
                                                    
                                                    <td>{batch.total_customers ?? '—'}</td>
                                                    <td>{batch.completed_jobs}/{batch.total_jobs}</td>
                                                    
                                                    <td>{batch.zip_generated_at ? new Date(batch.zip_generated_at).toLocaleString() : '—'}</td>
                                                    <td>{batch.zip_expires_at ? new Date(batch.zip_expires_at).toLocaleString() : '—'}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            batch.status === 'completed'
                                                                ? 'text-light-success'
                                                                : batch.status === 'failed' || batch.status === 'header_mismatch'
                                                                ? 'text-light-danger'
                                                                : 'text-light-warning'
                                                        }`}>
                                                            {batch.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {batch.zip_file_path ? (
                                                            isExpired ? (
                                                                <span className="badge text-light-secondary">Expired</span>
                                                            ) : (
                                                                <a
                                                                    href={batch.zip_file_path}
                                                                    className="btn btn-sm btn-primary rounded"
                                                                    download
                                                                >
                                                                    Download ZIP
                                                                </a>
                                                            )
                                                        ) : (
                                                            <span className="text-muted">Not Generated</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button type="button" onClick={() => deleteBatch(batch.import_id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                            <Trash size={12} width={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No batch exports found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {selectedTransactions.length > 0 && (
                                <button type="button" className="btn btn-pinterest" onClick={deleteSelectedTransaction}>
                                    <span
                                        className="loader spinner-border spinner-border-sm me-2"
                                        style={{ display: 'none' }}
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    <span className="loaderIcon"><Trash size={12} width={16} /></span> Delete Transaction
                                </button>
                            )}

                            <div className="mt-3">
                                <ul className="pagination app-pagination">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <a className="page-link" href="#" aria-label="Previous"
                                        onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>
                                            <span aria-hidden="true">«</span>
                                        </a>
                                    </li>

                                    {paginationItems}

                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <a className="page-link" href="#" aria-label="Next"
                                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>
                                            <span aria-hidden="true">»</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default BatchDownloads;