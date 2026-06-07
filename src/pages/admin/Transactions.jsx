import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    LayoutLeft,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../../utils/icons';

const Transactions = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initiatilizing constants var
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); 

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
     * Get user billing history
     */
    const fetchTransactions = async (page = 1) => {
        setLoading(true);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
            });

            const response = await fetch(`${apiRoutes.getUserBillingHistory}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (result.status) {
                setTransactions(result.transactions.data);
                setTotalPages(result.data.last_page || 1);
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error("Failed to load billing history", err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions(currentPage, searchQuery);
    }, [currentPage, searchQuery]);
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const formatCycle = (cycle) => {
        switch (cycle) {
            case 'monthly': return 'Monthly';
            case 'yearly': return 'Yearly';
            case 'weekly': return 'Weekly';
            case 'daily': return 'Daily';
            case 'quarterly': return 'Quarterly';
            default: return cycle;
        }
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Billing History</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href={`${ADMIN_ROUTE_PREFIX}/dashboard`} className="btn btn-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Transaction History</h5>
                                
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
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Plan</th>
                                            <th>Description</th>
                                            <th>Card</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="text-center">Loading...</td>
                                            </tr>
                                        ) : transactions.length > 0 ? (
                                            transactions.map((txn) => (
                                                <tr key={txn.id}>
                                                    <td>{new Date(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td>${txn.amount} {txn.currency}</td>
                                                    <td>{txn.plan_name} – {formatCycle(txn.plan_cycle)}</td>
                                                    <td>{txn.description}</td>
                                                    <td>{txn.card_last4 ? `**** ${txn.card_last4}` : 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${txn.status === 'Succeeded' ? "text-light-success" : "text-light-warning"}`}>
                                                          {txn.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center">No transactions found.</td>
                                            </tr>
                                        )}                                       
                                    </tbody>
                                </table>
                            </div>                                

                            <div className="mt-3">
                                <ul className="pagination app-pagination">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <a
                                            className="page-link"
                                            href="#"
                                            aria-label="Previous"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                                            }}
                                        >
                                            <span aria-hidden="true">«</span>
                                        </a>
                                    </li>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <li
                                            key={pageNum}
                                            className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                                        >
                                            <a
                                                className="page-link"
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(pageNum);
                                                }}
                                            >
                                                {pageNum}
                                            </a>
                                        </li>
                                    ))}

                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <a
                                            className="page-link"
                                            href="#"
                                            aria-label="Next"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                            }}
                                        >
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

export default Transactions;