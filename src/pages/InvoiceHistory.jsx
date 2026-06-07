import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const InvoiceHistory = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();
    const {patient_id} = useParams();

    
    //Initialize All Required constants
    const [invoiceHistory, setInvoiceHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        invoice_number: '',
        from_date: "",
        to_date: ""
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    
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

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    /*
     * Api calls 
     */
    //Fetch All transactional batches
    const fetchAllCustomerInvoices = async (page = 1, filters = {}) => {
        setBtnLoader(true);
        setBtnDisabled(true);
        setSelectedTransactions([]);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                ...(patient_id ? { patient_id } : {}),
                ...(filters.name && { name: filters.name }),
                ...(filters.email && { email: filters.email }),
                ...(filters.invoice_number && { invoice_number: filters.invoice_number })
            });

            const response = await fetch(`${apiRoutes.getCustomerInvoices}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setInvoiceHistory(result.data.data);
                setTotalPages(result.data.last_page || 1);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };
    
    useEffect(() => {
        fetchAllCustomerInvoices(currentPage, appliedFilters);
    }, [currentPage, appliedFilters]);

    const handleSearch = () => {
        setBtnDisabled(true);
        setBtnLoader(true);

        fetchAllCustomerInvoices(1, filters).finally(() => {
            setBtnDisabled(false);
            setBtnLoader(false);
        });
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Customer Invoices</h4>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Invoice History</h5>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="app-form app-icon-form row g-3">
                            {!patient_id && (
                                <>
                                    <div className="col-md-2 position-relative">
                                        <input
                                            className="form-control"
                                            placeholder="Patient Name"
                                            type="text"
                                            value={filters.name}
                                            onChange={(e) => handleFilterChange("name", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-3 position-relative">
                                        <input
                                            className="form-control"
                                            placeholder="Patient Email"
                                            type="text"
                                            value={filters.email}
                                            onChange={(e) => handleFilterChange("email", e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="col-md-2 position-relative">
                                <input
                                    className="form-control"
                                    placeholder="Invoice Number"
                                    type="text"
                                    value={filters.invoice_number}
                                    onChange={(e) => handleFilterChange("invoice_number", e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.from_date}
                                    onChange={(e) => handleFilterChange("from_date", e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.to_date}
                                    onChange={(e) => handleFilterChange("to_date", e.target.value)}
                                />
                            </div>

                            <div className="col-md-1 position-relative">
                                <div className="d-flex align-items-center gap-30">
                                    <button
                                        type="button"
                                        className="btn btn-primary b-r-22 w-100 h-40"
                                        disabled={btnDisabled}
                                        onClick={handleSearch}
                                    >
                                        {btnLoader ? (
                                            <div className="left d-flex align-items-center">
                                                <span
                                                    aria-hidden="true"
                                                    className="spinner-border spinner-border-sm me-2 ms-2"
                                                    role="status"
                                                ></span>
                                            </div>
                                        ) : (
                                            <Search width={16} />
                                        )}
                                    </button>                                    
                                </div>
                            </div>

                            {patient_id && (
                                <div className="col-md-5 d-flex justify-content-end position-relative">
                                    <a href="/patients" className="btn btn-primary b-r-22 h-40">Back</a>
                                </div>
                            )}
                        </div>

                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">Invoice ID</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Generated At</th>
                                        <th scope="col">Invoice Total</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">Loading...</td>
                                        </tr>
                                    ) : invoiceHistory.length > 0 ? (
                                        invoiceHistory.map((invoice, index) => {
                                            return (
                                                <tr key={invoice.cs_invoiceId}>
                                                    <td>{invoice.invoice_id}</td>                                                    
                                                    <td>{invoice.patient_name}</td>
                                                    <td>{invoice.patient_email}</td>
                                                    <td>{new Date(invoice.created_at).toLocaleString()}</td>
                                                    <td>{invoice.sub_total}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/invoice/preview/${invoice.cs_invoiceId}`, '_blank')}
                                                            className="btn btn-primary btn-sm b-r-22 mg-s-5 f-s-12"
                                                        >
                                                            View Invoice
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No invoices found.</td>
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

export default InvoiceHistory;