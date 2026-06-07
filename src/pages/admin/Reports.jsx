import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import {
    UserPlus,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../../utils/icons';

const Reports = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    
    //Initialize All Required constants
    const [reportsHistory, setReportsHistory] = useState([]);
    const [usersList, setListAllUsers] = useState([]);  
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [filters, setFilters] = useState({
        sender_email: '',
        recipient_email: '',
        user: '',
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
    const fetchAllEmailReports = async (page = 1, filters = {}) => {
        setBtnLoader(true);
        setBtnDisabled(true);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                ...(filters.sender_email && { sender_email: filters.sender_email }),
                ...(filters.recipient_email && { recipient_email: filters.recipient_email }),
                ...(filters.user && { user: filters.user }),
                ...(filters.from_date && { from_date: filters.from_date }),
                ...(filters.to_date && { recipient_email: filters.to_date }),
            });

            const response = await fetch(`${apiRoutes.getAdminEmailReports}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setReportsHistory(result.data.data);
                setTotalPages(result.data.last_page || 1);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getAllTenantUsers}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok) {
                setListAllUsers(result.data); 
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    }
    
    useEffect(() => {
        fetchUsers();
        fetchAllEmailReports(currentPage, appliedFilters);
    }, [currentPage, appliedFilters]);

    const handleSearch = () => {
        setBtnDisabled(true);
        setBtnLoader(true);

        fetchAllEmailReports(1, filters).finally(() => {
            setBtnDisabled(false);
            setBtnLoader(false);
        });
    };

    const renderLogSource = (report) => {
        if (report.campaign) {
            return (
                <div className="text-xs font-semibold text-indigo-700 bg-indigo-100 p-1 rounded-sm">
                    Campaign: {report.campaign.name}
                </div>
            );
        }
        if (report.transactional_type) {
            return (
                <div className="text-xs font-semibold text-green-700 bg-green-100 p-1 rounded-sm">
                    {report.transactional_type.name}
                </div>
            );
        }
        return <span className="text-gray-500">N/A</span>;
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Email Reports</h4>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Reports History</h5>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="app-form app-icon-form row g-3">
                            <div className="col-md-2 position-relative">
                                <input
                                    className="form-control"
                                    placeholder="Sender Email"
                                    type="text"
                                    value={filters.sender_email}
                                    onChange={(e) => handleFilterChange("sender_email", e.target.value)}
                                />
                            </div>
                            <div className="col-md-3 position-relative">
                                <input
                                    className="form-control"
                                    placeholder="Receipt Email"
                                    type="text"
                                    value={filters.recipient_email}
                                    onChange={(e) => handleFilterChange("recipient_email", e.target.value)}
                                />
                            </div>

                            <div className="col-md-2 position-relative">
                                <select
                                    className="form-select"
                                    placeholder="Subject"
                                    type="text"
                                    value={filters.user}
                                    onChange={(e) => handleFilterChange("user", e.target.value)}
                                >
                                    <option value="">Select User</option>

                                    {usersList.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.email} ({user.username})
                                        </option>
                                    ))}
                                </select>
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
                        </div>

                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">User</th>
                                        <th scope="col">Sender Email</th>
                                        <th scope="col">Recipient Email</th>
                                        <th scope="col">Subject</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Response</th>
                                        <th scope="col">Date Sent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">Loading...</td>
                                        </tr>
                                    ) : reportsHistory.length > 0 ? (
                                        reportsHistory.map((report, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        <strong>Name : </strong>{report.user.name}<br />
                                                        <strong>Email : </strong>{report.user.email}
                                                    </td>
                                                    <td>{report.sender_email}</td>                                                    
                                                    <td>{report.recipient_email}</td>
                                                    <td>{report.subject}</td>
                                                    <td>
                                                        <span className={`badge ${report.status === 'failed' ? 'text-light-danger' : 'text-light-success'}`}>
                                                            {report.status || '—'}
                                                        </span>
                                                    </td>
                                                    <td>{report.message}</td>
                                                    <td>{new Date(report.created_at).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No reports found.</td>
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

export default Reports;