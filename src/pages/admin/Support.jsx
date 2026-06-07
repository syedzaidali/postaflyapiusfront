import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    UserPlus,
    Search,
    Eye,
    EyeClosed,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../../utils/icons';

const Support = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    const [supportList, setLSupportList] = useState([]); 
    const [supportKpi, setSupportKpi]    = useState([]);  
    const [systemUsers, setSystemUsers]  = useState([]);
    const [ticketId, setTicketId]        = useState(''); 
    const [agentId, setAgentId]          = useState(''); 
    const [searchQuery, setSearchQuery]  = useState('');
    const [currentPage, setCurrentPage]  = useState(1);
    const [perPage, setPerPage]          = useState(15);
    const [totalPages, setTotalPages]    = useState(1);
    const [loading, setLoading]          = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive]     = useState(false);
    const [showTicketAssignForm, setShowTicketAssignForm] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [error, setError] = useState("");
    
    /*
     * Page Functionalities
     */
    const formatDateTime = (isoDate) => {
        if (!isoDate) return 'N/A';
        
        const date = new Date(isoDate);
        const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
        
        const timeOptions = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true, 
        };

        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

        const finalTime = formattedTime.replace(':', '.').toLowerCase();

        return `${formattedDate}, ${finalTime}`;
    };

    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setShowTicketAssignForm(false);

        setTimeout(() => {
            setBurgerActive(false);

            document.body.classList.remove("fixed-body");
        }, 500);
    };

    //Burger Menu Action
    useEffect(() => {
        if (burgerActive) {
            const timer = setTimeout(() => {
                setAddActiveClass(true);
            }, 100); 

            return () => clearTimeout(timer);
        } else {
            setAddActiveClass(false); 
        }
    }, [burgerActive]);

    useEffect(() => {
        if (displayMessageError) {
            const timer = setTimeout(() => {
                setDisplayMessageError(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setDisplayMessageError(false); 
        }

        if (displayMessageSuccess) {
            const timer = setTimeout(() => {
                setDisplayMessageSuccess(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setDisplayMessageSuccess(false); 
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
     * Api calls 
     */
    const fetchDashboardKpi = async () => {
        setLoading(true);

        try {
            const response = await fetch(`${apiRoutes.getAdminSupportKpis}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                //New Support Kpi
                setSupportKpi([
                    result.data.all_tickets,
                    result.data.open_tickets,
                    result.data.pending_tickets,
                    result.data.resolved_tickets,
                    result.data.closed_tickets
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSupportTickets = async (page = 1, search = '') => {
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

            const response = await fetch(`${apiRoutes.getAdminAllTickets}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            console.log(JSON.stringify(result));
            if (response.ok && result.status) {
                setLSupportList(result.data); 
                setTotalPages(result.pagination?.last_page || 1);
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemUsers = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getAdminSystemUsers}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setSystemUsers(result.data); 
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } 
    }

    useEffect(() => {
        fetchDashboardKpi();
        fetchSystemUsers();
    }, []);

    useEffect(() => {
        fetchSupportTickets(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const assignTicketToAgent = (ticketId) => {
        setTicketId(ticketId);

        setShowTicketAssignForm(true);

        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    }

    const processAssignTicket = async(e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const body = {
            ticket_id: ticketId, 
            agent_id: agentId
        }

        try {
            const response = await fetch(apiRoutes.createTicket, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setMessageText('Ticket created successfully!');
                setDisplayMessageSuccess(true);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText(""); 
                }, 8000);

                fetchSupportTickets(currentPage);
                fetchDashboardKpi();

                closeMenu(); 
            } else {
                // Display specific validation errors or API messages
                const errorMessage = result.message || 'Failed to create ticket.';
                setMessageText(errorMessage);
                setDisplayMessageError(true);

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText(""); 
                }, 8000);

                console.error('API Error:', result.errors || result.message);
            }
        } catch (err) {
            setMessageText('Network error. Could not reach the server.');
            setDisplayMessageError(true);
            
            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText(""); 
            }, 8000);
            console.error('Fetch Error:', err);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    }

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Support Center</h4>
                </div>
            </div>

            <div className="row ticket-app">
                <div className="col-sm-3">
                    <div className="card ticket-card bg-light-primary">
                        <div className="card-body p-3">
                            <i className="ph-bold ph-circle circle-bg-img"></i>
                            <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                <i className="ph-bold  ph-ticket f-s-25 text-primary"></i>
                            </div>
                            <p className="f-s-16">All Tickets</p>
                            <div className="d-flex justify-content-between align-items-center">
                                <h3 className="text-primary-dark">{supportKpi[0]}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                        
                <div className="col-sm-3">
                    <div className="card ticket-card bg-light-info">
                        <div className="card-body p-3">
                            <i className="ph-bold ph-circle circle-bg-img"></i>
                            <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                <i className="ph-bold  ph-clock-countdown f-s-25 text-info"></i>
                            </div>
                            <p className="f-s-16">Pending</p>
                            <div className="d-flex justify-content-between align-items-center">
                                <h3 className="text-info-dark">{supportKpi[2]}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-3">
                    <div className="card ticket-card bg-light-success">
                        <div className="card-body p-3">
                            <i className="ph-bold ph-circle circle-bg-img"></i>
                            <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                <i className="ph-bold  ph-file-cloud f-s-25 text-success"></i>
                            </div>
                            <p className="f-s-16">Resolved</p>
                            <div className="d-flex justify-content-between align-items-center">
                                <h3 className="text-success-dark">{supportKpi[3]}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-3">
                    <div className="card ticket-card bg-light-warning">
                        <div className="card-body p-3">
                            <i className="ph-bold ph-circle circle-bg-img"></i>
                            <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                <i className="ph-bold  ph-file-x f-s-25 text-warning"></i>
                            </div>
                            <p className="f-s-16">Cancelled</p>
                            <div className="d-flex justify-content-between align-items-center">
                                <h3 className="text-warning-dark">{supportKpi[4]}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-body">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Manage Tickets</h5>
                                
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
                        
                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">Title</th>
                                        <th scope="col">Agent</th>
                                        <th scope="col">Date Created</th>
                                        <th scope="col">Priority</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Last Updated</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">Loading...</td>
                                    </tr>
                                ) : supportList.length > 0 ? (
                                    supportList.map((support) => (
                                        <tr key={support.id}>
                                            <td className="f-w-500 ">
                                                <p className="w-250 txt-ellipsis-1">
                                                    {support.subject}
                                                </p>
                                            </td>
                                            <td className="f-w-500">{support.agent?.name || 'Unassigned'}</td>
                                            <td>{new Date(support.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        support.priority === 'low'
                                                            ? 'text-light-success'
                                                            : support.priority === 'medium'
                                                            ? 'text-light-warning'
                                                            : support.priority === 'high'
                                                            ? 'text-light-info' 
                                                            : support.priority === 'urgent'
                                                            ? 'text-light-danger' 
                                                            : 'text-light-secondary'
                                                    }`}
                                                >
                                                    {support.priority ? support.priority.charAt(0).toUpperCase() + support.priority.slice(1) : 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                               <span
                                                    className={`badge ${
                                                        support.status === 'open'
                                                            ? 'text-light-success' 
                                                            : support.status === 'pending'
                                                            ? 'text-light-warning'  
                                                            : support.status === 'resolved'
                                                            ? 'text-light-primary'      
                                                            : support.status === 'closed'
                                                            ? 'text-light-success'    
                                                            : 'text-light-secondary'  
                                                    }`}
                                                >
                                                {support.status ? support.status.charAt(0).toUpperCase() + support.status.slice(1) : 'Unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                {support.last_reply_at ? formatDateTime(support.last_reply_at) : 'N/A'}
                                            </td>
                                            <td>
                                                <a href={`${ADMIN_ROUTE_PREFIX}/support/ticket/view/` + support.id} className="btn btn-light-primary f-s-10 b-r-22">
                                                    <Eye size={12} width={16}  /> View Ticket
                                                </a>
                                                
                                                {support.assigned_to === null && (
                                                <button onClick={() => assignTicketToAgent(support.id)} className="btn btn-outline-primary f-s-10 b-r-22 ms-2">
                                                    Assign
                                                </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center">No tickets found.</td>
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

            {displayMessageSuccess && (
                <div className="alert alert-light-success" role="alert">
                    {messageText || "Operation completed successfully!"}
                </div>
            )}

            {burgerActive && (
                <div className={`burger-menu ${addActiveClass ? "active-in" : ""}`}>
                    <div className="burger-menu-wrapper">
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={closeMenu}>
                            <Xmark />
                        </a>

                        <div className="col-wrapper-full">
                            <div className="col-md-12 full-loader">
                                {showTicketAssignForm && (
                                    <>
                                        <h2 className="card-title mb-4">Assign Ticket</h2>
                                        
                                        {displayMessageError && (
                                            <div className="alert alert-light-danger" role="alert">
                                                {messageText || "Something went wrong. Please try again."}
                                            </div>
                                        )}

                                        <form method="POST" onSubmit={processAssignTicket}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="priority">Agent</label>
                                                            <select
                                                                className="form-control"
                                                                name="agent_id"
                                                                id="agent_id"
                                                                value={agentId}
                                                                onChange={(e) => setAgentId(e.target.value)} 
                                                            >
                                                                <option value="">Select Agent</option>
        
                                                                {systemUsers && Array.isArray(systemUsers) && systemUsers.map((agent) => (
                                                                    <option key={agent.id} value={agent.id}>
                                                                        {agent.name} ({agent.username})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {agentId && (
                                                        <div className="d-flex align-items-center gap-30">
                                                            <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                                Assign Ticket
                                                            </button>

                                                            {btnLoader && (
                                                                <div className="left d-flex align-items-center">
                                                                    <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                                    Processing
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}

export default Support;