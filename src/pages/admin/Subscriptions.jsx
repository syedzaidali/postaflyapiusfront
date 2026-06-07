import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    Search,
    Trash,
    CheckCircle,
    Xmark
  } from '../../utils/icons';

const Subscriptions = () => {
    const navigate = useNavigate();

    const token  = localStorage.getItem('auth_token');
    
    //Defining burger menu and loader const stats 
    const [loading, setLoading] = useState(true);

    //Defining sucess and error mesages const stats   
    const [subscriptionsList, setSubscriptionsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [showMessageError, setShowMessageError] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [showMessageSuccess, setShowMessageSuccess] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");

    //Initializing Error  / Success Messages
    useEffect(() => {
        if (displayMessageError) {
            const timer = setTimeout(() => {
                setShowMessageError(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setShowMessageError(false); 
        }

        if (displayMessageSuccess) {
            const timer = setTimeout(() => {
                setShowMessageSuccess(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setShowMessageSuccess(false); 
        }
    }, [displayMessageError, displayMessageSuccess]);


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
     * Get all active subscriptions 
     */
    const fetchSubscriptions = async (page = 1, search = '') => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                ...(search && { search })
            });

            const response = await fetch(`${apiRoutes.getAllSubscriptions}?${queryParams}`, {
                method: "GET",
                headers,
            });

            const result = await response.json();
            
            console.log(JSON.stringify(result.data));
            if (response.ok) {
                setSubscriptionsList(result.data);
                setTotalPages(result.pagination?.last_page || 1);
            } else {
                console.error("Error fetching users:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Subscriptions</h4>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Manage Users</h5>
                            
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
                                        <th scope="col">User</th>
                                        <th scope="col">Created</th>
                                        <th scope="col">Amount</th>
                                        <th scope="col">Renewed</th>
                                        <th scope="col">Cycle</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">Loading...</td>
                                        </tr>
                                    ) : subscriptionsList.length > 0 ? (
                                        subscriptionsList.map((subscription) => (
                                            <>
                                                {subscription.user !== null && (
                                                    <tr key={subscription.id}>
                                                        <td className="f-w-500">
                                                            <div className="sm-data">
                                                                <span>
                                                                    <a href={`${ADMIN_ROUTE_PREFIX}/user/view/` + subscription.user.id}>{subscription.user.name}</a>
                                                                </span>
                                                                <span><strong>Username : </strong>@{subscription.user.username}</span>
                                                            </div>
                                                        </td>
                                                        <td>{new Date(subscription.created_at).toLocaleDateString()}</td>
                                                        <td>${!subscription.amount || isNaN(subscription.amount) ? '0.00' : parseFloat(subscription.amount).toFixed(2)}</td>
                                                        <td>{new Date(subscription.renewed_at).toLocaleDateString()}</td>
                                                        <td>
                                                            {subscription.cycle
                                                                ? subscription.cycle.charAt(0).toUpperCase() + subscription.cycle.slice(1)
                                                                : 'N/A'}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge ${
                                                                    subscription.status === 'active'
                                                                        ? 'text-light-success'
                                                                        : subscription.status === 'inactive'
                                                                        ? 'text-light-warning'
                                                                        : subscription.status === 'suspended'
                                                                        ? 'text-light-info'
                                                                        : subscription.status === 'expired'
                                                                        ? 'text-light-danger'
                                                                        : 'text-light-secondary'
                                                                }`}
                                                            >
                                                                {subscription.status === 'active'
                                                                    ? 'Active'
                                                                    : subscription.status === 'inactive'
                                                                    ? 'Inactive'
                                                                    : subscription.status === 'suspended'
                                                                    ? 'Suspended'
                                                                    : subscription.status === 'expired'
                                                                    ? 'Expired'
                                                                    : 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button type="button" className="btn btn-light-primary f-s-12 b-r-22">
                                                                Suspend
                                                            </button>

                                                            <button type="button" className="btn btn-light-success f-s-12 b-r-22 mg-s-5">
                                                                View
                                                            </button>
                                                        </td> 
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center">
                                                <h2 className="not-found wd-100">
                                                    <i className="ti-na"></i>
                                                    <span>No subscriptions found.</span>      
                                                </h2> 
                                            </td>
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

export default Subscriptions