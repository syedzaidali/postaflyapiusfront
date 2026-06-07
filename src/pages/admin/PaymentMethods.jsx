import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams  } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    Calendar,
    Search,
    Edit,
    Trash,
    CheckCircle,
    Xmark,
    Eye,
    CreditCard,
    Mail,
    User
  } from '../../utils/icons';

const PaymentMethods = () => {
    const navigate = useNavigate();
    const token  = localStorage.getItem('auth_token');
    
    //Defining burger menu and loader const stats 
    const [loading, setLoading] = useState(true);
    const { user_id } = useParams();

/*
     * Get all active users 
     */
    //Fetch All Channels
    const [listPaymentMethods, setListPaymentMethods] = useState([]);
    const [searchQuery, setSearchQuery]         = useState('');
    const [currentPage, setCurrentPage]         = useState(1);
    const [perPage, setPerPage]                 = useState(15);
    const [totalPages, setTotalPages]           = useState(1);
    
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

    const fetchPaymentMethods = async (page = 1, search = '') => {
        setLoading(true);

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

            const response = await fetch(`${apiRoutes.getUserPaymentMethods}/${user_id}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            console.log(JSON.stringify(result.data));

            if (response.ok) {
                setListPaymentMethods(result.data);
                setTotalPages(result.pagination?.last_page || 1);
            } else {
                console.error("Error fetching invoices:", result.message);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods(currentPage, searchQuery);
    }, [currentPage, searchQuery]);
    
    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Users Billing Account</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href={`${ADMIN_ROUTE_PREFIX}/user/view/` + user_id} className="btn btn-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Manage Billing</h5>

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
                                        <th scope="col">Payment Method</th>
                                        <th scope="col">Card Status</th>
                                        <th scope="col">Card Expiry</th>
                                        <th scope="col">Date Created</th>
                                        <th scope="col">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">Loading...</td>
                                    </tr>
                                ) : listPaymentMethods.length > 0 ? (
                                    listPaymentMethods.map((method) => (
                                        <tr key={method.id}>
                                            <td className="d-flex align-items-center">
                                                <img 
                                                    src={`/images/${method.card_icon}.svg`} 
                                                    alt={method.card_type} 
                                                    style={{ width: '30px', height: 'auto' }} // Added inline style for table
                                                />
                                                <strong className="mg-s-10">{method.card_type} **** {method.last4}</strong>
                                            </td>
                                            <td>
                                                <label 
                                                    className={`badge ${method.card_status === 'active' ? 'text-light-success' : 'text-light-secondary'}`}
                                                >
                                                    {method.card_status.charAt(0).toUpperCase() + method.card_status.slice(1)}
                                                </label>
                                            </td>
                                            <td>{method.card_expiry}</td>
                                            <td>{new Date(method.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {method.is_default ? (
                                                    <span className="badge text-light-primary">Default</span>
                                                ) : (
                                                    <span className="badge text-light-danger">Not Default</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center">No payment methods found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

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

export default PaymentMethods