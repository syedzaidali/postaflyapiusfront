import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    UserPlus,
    Search,
    Eye,
    EyeClosed,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../utils/icons';

const Support = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        subject: '',
        priority: 'medium',
        message: '',
    });

    const [attachment, setAttachment] = useState(null);
    const { subject, priority, message } = formData;

    const [supportList, setLSupportList] = useState([]); 
    const [supportKpi, setSupportKpi]    = useState([]);   
    const [searchQuery, setSearchQuery]  = useState('');
    const [currentPage, setCurrentPage]  = useState(1);
    const [perPage, setPerPage]          = useState(15);
    const [totalPages, setTotalPages]    = useState(1);
    const [loading, setLoading]          = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive]     = useState(false);
    const [showCreateticketForm, setShowCreateticketForm] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [error, setError] = useState("");
    
    /*
        * Page Functionalities
        */

    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setShowCreateticketForm(false);

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

    //Initializing create user form button
    const createTicketFormDisplay = () => {
        setShowCreateticketForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };
    
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        setAttachment(e.target.files[0]);
    };

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
            const response = await fetch(`${apiRoutes.getSupportKpis}`, {
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

            const response = await fetch(`${apiRoutes.getAllTickets}?${queryParams}`, {
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

    useEffect(() => {
        fetchDashboardKpi();
    }, []);

    useEffect(() => {
        fetchSupportTickets(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const processCreateTicket = async(e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        // API requires 'multipart/form-data' for file uploads
        const data = new FormData();
        
        data.append('subject', subject);
        data.append('priority', priority);
        data.append('message', message);

        if (attachment) {
            data.append('attachment', attachment);
        }

        try {
            const response = await fetch(apiRoutes.createTicket, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
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
                <div className="col-lg-6">
                    <div className="row">
                        <div className="col-sm-6">
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
                                
                        <div className="col-sm-6">
                            <div className="card ticket-card bg-light-info">
                                <div className="card-body p-3">
                                    <i className="ph-bold ph-circle circle-bg-img"></i>
                                    <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                        <i className="ph-bold  ph-clock-countdown f-s-25 text-info"></i>
                                    </div>
                                    <p className="f-s-16">Pending Tickets</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h3 className="text-info-dark">{supportKpi[2]}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6">
                            <div className="card ticket-card bg-light-success">
                                <div className="card-body p-3">
                                    <i className="ph-bold ph-circle circle-bg-img"></i>
                                    <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                        <i className="ph-bold  ph-file-cloud f-s-25 text-success"></i>
                                    </div>
                                    <p className="f-s-16">Completed Tickets</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h3 className="text-success-dark">{supportKpi[3]}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6">
                            <div className="card ticket-card bg-light-warning">
                                <div className="card-body p-3">
                                    <i className="ph-bold ph-circle circle-bg-img"></i>
                                    <div className="h-50 w-50 d-flex-center b-r-15 bg-white mb-3">
                                        <i className="ph-bold  ph-file-x f-s-25 text-warning"></i>
                                    </div>
                                    <p className="f-s-16">Cancelled Tickets</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h3 className="text-warning-dark">{supportKpi[4]}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card create-ticket-card">
                        <div className="card-body">
                            <div className="col-xl-12">
                                <div className="row align-items-center">
                                    <div className="col-sm-7 col-12">
                                        <div className="ticket-create">
                                            <h5 className=" mb-2 ">The Ticket Component</h5>
                                            <p className="mb-5 mt-3 text-secondary"> Provide a more detailed
                                                explanation of the issue. Describe
                                                what is happening versus what should happen. If it’s a feature
                                                request, explain the
                                                desired outcome and why it's needed.</p>
                                            <button 
                                                className="btn btn-light-primary rounded" 
                                                onClick={() => {createTicketFormDisplay()}} 
                                                type="button"
                                            >Create Ticket
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-sm-5 col-12">
                                        <img alt="" className="img-fluid w-300 d-block m-auto" src="../assets/images/icons/ticket.png" />
                                    </div>
                                </div>
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
                                        <th scope="col">Priority</th>
                                        <th scope="col">Date Created</th>
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
                                                {support.last_reply_at ? new Date(support.last_reply_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <a href={`/support/ticket/view/` + support.id} className="btn btn-light-primary f-s-10 b-r-22">
                                                    <Eye size={12} width={16}  /> View Ticket
                                                </a>
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
                                {showCreateticketForm && (
                                    <>
                                        <h2 className="card-title mb-4">Create Ticket</h2>
                                        
                                        {displayMessageError && (
                                            <div className="alert alert-light-danger" role="alert">
                                                {messageText || "Something went wrong. Please try again."}
                                            </div>
                                        )}
                                        
                                        <form method="POST" onSubmit={processCreateTicket}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Subject</label>
                                                            <input
                                                                className="form-control"
                                                                name="subject"
                                                                id="subject"
                                                                type="text"
                                                                value={subject}
                                                                onChange={handleInputChange}
                                                                required
                                                                placeholder="Brief subject of your issue"
                                                                disabled={loading}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="priority">Priority</label>
                                                            <select
                                                                className="form-control"
                                                                name="priority"
                                                                id="priority"
                                                                value={priority}
                                                                onChange={handleInputChange}
                                                                required
                                                                disabled={loading}
                                                            >
                                                                <option value="low">Low</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="high">High</option>
                                                                <option value="urgent">Urgent</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="message">Message Details</label>
                                                    <textarea
                                                        className="form-control h-100"
                                                        name="message"
                                                        id="message"
                                                        rows="5"
                                                        value={message}
                                                        onChange={handleInputChange}
                                                        required
                                                        placeholder="Describe your issue in detail..."
                                                        disabled={loading}
                                                    ></textarea>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="form-label" htmlFor="attachment">Attachment (Optional)</label>
                                                    <input
                                                        className="form-control"
                                                        type="file"
                                                        name="attachment"
                                                        id="attachment"
                                                        onChange={handleFileChange}
                                                        accept=".jpeg,.png,.gif,.pdf,.zip" // Enforce allowed file types
                                                        disabled={loading}
                                                    />
                                                    <small className="form-text text-muted">Max file size: 5MB (JPG, PNG, GIF, PDF, ZIP)</small>
                                                </div>

                                                <div className="d-flex align-items-center gap-30">
                                                    <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                        Create Ticket
                                                    </button>

                                                    {btnLoader && (
                                                        <div className="left d-flex align-items-center">
                                                            <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                            Processing
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