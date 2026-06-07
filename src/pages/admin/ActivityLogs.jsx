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

const ActivityLogs = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();
    
    //Initiatilizing constants var
    const [activityLogs, setActivityLogs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); 
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

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

    const handleOpenDetails = (log) => {
        setSelectedLog(log);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setSelectedLog(null);
        setModalVisible(false);
    };

    /*
     * Get user Activity logs
     */
    const fetchActivityLogs = async (page = 1) => {
        setLoading(true);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
            });

            const response = await fetch(`${apiRoutes.getAdminActivityLogs}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();
            console.log(JSON.stringify(result));
            if (result.status) {
                setActivityLogs(result.data.data);
                setTotalPages(result.pagination.last_page || 1);
            } else {
                setActivityLogs([]);
            }
        } catch (err) {
            console.error("Failed to load activity logs", err);
            setActivityLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityLogs(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const refine_location = (location) => {
        const locationData = location ? JSON.parse(location) : null;

        return locationData ? `${locationData.city}, ${locationData.country}` : "N/A";
    }

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Activity Logs</h4>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Activity Logs</h5>
                                
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
                                <table className="table table-sm align-top mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">Date</th>
                                            <th scope="col">User</th>
                                            <th scope="col">Action</th>
                                            <th scope="col">Details</th>
                                            <th scope="col">User Agent</th>
                                            <th scope="col">Location</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="text-center">Loading...</td>
                                            </tr>
                                        ) : activityLogs.length > 0 ? (
                                            activityLogs.map((log) => {
                                                const details = (() => {
                                                    try {
                                                        return typeof log.details === "string"
                                                            ? JSON.parse(log.details)
                                                            : log.details;
                                                    } catch {
                                                        return null;
                                                    }
                                                })();
                                                return (
                                                    <tr key={log.id}>
                                                        <td>
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </td>

                                                        <td>
                                                            <span className="badge text-light-primary">
                                                                {log.user?.role === "super_admin"
                                                                ? "Admin"
                                                                : log.user?.role === "system"
                                                                ? "System"
                                                                : "User"}
                                                            </span>
                                                            <br />
                                                            (ID: {log.user?.username ?? "N/A"})
                                                        </td>
                                                        <td>{log.action}</td>
                                                        <td>
                                                            {log.changes ? (
                                                                (() => {
                                                                    const parsedChanges = JSON.parse(log.changes);

                                                                    if (typeof parsedChanges === "object" && parsedChanges !== null) {
                                                                        const entries = Object.entries(parsedChanges);
                                                                        const hasMoreThan3 = entries.length > 3;

                                                                        return (
                                                                            <>
                                                                                <ul className="mb-0">
                                                                                    {entries.slice(0, 3).map(([key, value], idx) => (
                                                                                        <li key={idx}>
                                                                                            <strong>{key.replace(/_/g, " ")}:</strong>{" "}
                                                                                            {Array.isArray(value) || typeof value === "object"
                                                                                                ? JSON.stringify(value)
                                                                                                : value}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>

                                                                                {hasMoreThan3 && (
                                                                                    <button
                                                                                        className="btn btn-sm btn-primary b-r-22 f-s-10 mt-1"
                                                                                        onClick={() => handleOpenDetails(log)}
                                                                                    >
                                                                                        View details
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    }

                                                                    return log.changes || "N/A";
                                                                })()
                                                            ) : (
                                                                "N/A"
                                                            )}

                                                        </td>
                                                        <td>{log.user_agent ?? "N/A"}</td>
                                                        <td>{refine_location(log.geo_location)}</td>
                                                    </tr>
                                                 );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center">No activity records found.</td>
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

                {modalVisible && selectedLog && (
                    <div className="modal show fade d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered app_modal_xl">
                            <div className="modal-content">
                                <div className="modal-header justify-content-between">
                                    <h5 className="modal-title">Activity Details</h5>
                                    <button aria-label="Close" onClick={handleCloseModal} className="btn-close m-0 fs-5" data-bs-dismiss="modal"
                                            type="button"></button>
                                </div>
                                <div class="modal-body">
                                    <div className="row">     
                                        <div className="col-lg-3 text-center align-self-start">
                                            <img src="/images/04.png" className="img-fluid b-r-10" />
                                        </div>                       
                                        <div className="col-md-9 ps-4">
                                            <h5>Log Details</h5>
                                            {(() => {
                                                let parsed = null;
                                                try {
                                                    parsed = JSON.parse(selectedLog.changes);
                                                } catch (e) {}

                                                return parsed ? (
                                                    <ul className="mt-3 mb-0 list-disc">
                                                        {Object.entries(parsed).map(([key, value], idx) => (
                                                            <li key={idx}>
                                                                <strong>{key.replace(/_/g, " ")}:</strong>{" "}
                                                                {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No details available</p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>    
                )}   
            </div>  
        </AppLayout>
    )
}

export default ActivityLogs;