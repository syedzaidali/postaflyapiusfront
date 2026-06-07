import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import HtmlEditor from '../../components/Editors/HtmlEditor';
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

const ViewSupportTicket = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    const { ticket_id } = useParams();

    const [ticketData, setTicketData]     = useState('');   
    const [attachment, setAttachment]     = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [loading, setLoading]           = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive]     = useState(false);
    const [showCreateticketForm, setShowCreateticketForm] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [error, setError] = useState("");

    const contentRef = useRef('');
    const summernoteRef = useRef();
    
    const handleEditorChange = (content) => {
        contentRef.current = content;
    };
    
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
     * Api calls 
     */
    const fetchTicketDetails = async () => {
        setLoading(true);

        try {
            const response = await fetch(`${apiRoutes.adminViewTicket}/${ticket_id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setTicketData(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketDetails();
    }, []);

    const handleTicketStatusChange = async(e) => {
        const newStatus = e.target.value;

        if (newStatus === ticketStatus) return;
        
        try {
            const response = await fetch(`${apiRoutes.updateTicketStatus}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    ticket_id: ticket_id,
                    status: newStatus 
                }),
            });

            const result = await response.json();

            if (response.ok && result.status === true) {
                setTicketStatus(newStatus); 
                fetchTicketDetails();
            } else {
                console.error('Failed to update status:', result.message || result);
            }
        } catch (error) {
            console.error('API Error updating status:', error);
        
        } 
    }

    const processTicketResponse = async(e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const data = new FormData();
        
        const messageContent = contentRef.current; 

        const rawContent = contentRef.current || ''; 
        const strippedContent = rawContent.replace(/<[^>]*>/g, '');
        const cleanContent = strippedContent.replace(/&nbsp;|\s/g, '').trim();
        
        if (cleanContent == '') {
            setMessageText("Message content or attachment is required.");
            setDisplayMessageError(true);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText(""); 
            }, 8000);

            setBtnLoader(false);
            setBtnDisabled(false);
            return; 
        }

        
        data.append('message', messageContent);

        data.append('ticket_id', ticket_id);

        if (attachment) {
            data.append('attachment', attachment);
        }

        try {
            const response = await fetch(apiRoutes.adminReplyToTicket, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setMessageText('Your response is posted successfully!');
                setDisplayMessageSuccess(true);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText(""); 
                }, 8000);

                fetchTicketDetails();

                contentRef.current = "";
            } else {
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

    const getInitials = (name = "") =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

    const getColorFromName = (name = "") => {
        const colors = ["#FF5722", "#4CAF50", "#3F51B5", "#9C27B0", "#00BCD4"];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Support Center</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href={`${ADMIN_ROUTE_PREFIX}/support`} className="btn btn-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>

            <div className="ticket-details row">
                <div className="col-md-5 col-lg-4 col-xxl-3">
                    <div className="card">
                        <div className="card-body">            
                            <div className="about-list pt-0">
                                <div>
                                    <span className="fw-medium">Ticket Number</span>
                                    <span className="float-end f-s-13 text-secondary">
                                        TKT-{ticketData.id?.slice(-8).toUpperCase() || 'Loading...'}
                                    </span>
                                </div>
                                <div>
                                    <span className="fw-medium">Priority</span>
                                    <span className="float-end f-s-13 text-secondary">
                                        <span
                                            className={`badge ${
                                                ticketData.priority === 'low'
                                                    ? 'text-light-success'
                                                    : ticketData.priority === 'medium'
                                                    ? 'text-light-warning'
                                                    : ticketData.priority === 'high'
                                                    ? 'text-light-info' 
                                                    : ticketData.priority === 'urgent'
                                                    ? 'text-light-danger' 
                                                    : 'text-light-secondary'
                                            }`}
                                        >
                                            {ticketData.priority ? ticketData.priority.charAt(0).toUpperCase() + ticketData.priority.slice(1) : 'N/A'}
                                        </span>
                                    </span>
                                </div>
                                <div>
                                    <span className="fw-medium">Subject</span>
                                    <span className="float-end f-s-13 text-secondary">{ticketData.subject}</span>
                                </div>
                                <div>
                                    <span className="fw-medium">Status</span>
                                    <span className="float-end f-s-13 text-secondary">
                                        <span
                                            className={`badge ${
                                                ticketData.status === 'open'
                                                    ? 'text-light-success' 
                                                    : ticketData.status === 'pending'
                                                    ? 'text-light-warning' 
                                                    : ticketData.status === 'resolved'
                                                    ? 'text-light-primary' // Changed resolved to light-info/primary for clear distinction
                                                    : ticketData.status === 'closed'
                                                    ? 'text-light-success' 
                                                    : 'text-light-secondary' 
                                            }`}
                                        >
                                            {ticketData.status ? ticketData.status.charAt(0).toUpperCase() + ticketData.status.slice(1) : 'Unknown'}
                                        </span>
                                    </span>
                                </div>
                                <div>
                                    <span className="fw-medium">Create Date</span>
                                    <span className="float-end f-s-13 text-secondary">{ticketData.created_at ? new Date(ticketData.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>

                                <div>
                                    <span className="fw-medium">Change Status</span>
                                    <span className="float-end f-s-13 text-secondary">
                                        <select
                                            className="form-control form-control-sm b-r-22 f-s-12"
                                            name="ticketStatus"
                                            id="ticketStatus"
                                            value={ticketStatus}
                                            onChange={handleTicketStatusChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="open">Open</option>
                                            <option value="pending">Pending</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-7 col-lg-8  col-xxl-9">
                    <div className="card">
                        <div className="card-header">
                            <h5>Ticket Details</h5>
                        </div>
                        <div className="card-body">
                            <div className="ticket-details-content">
                                <div className="mb-3">
                                    <h6>Description</h6>
                                    <p className="text-secondary">
                                        {ticketData?.messages?.[0]?.message || 'No description provided.'}
                                    </p>
                                </div>

                                {ticketData?.messages?.[0]?.attachments?.length > 0 && (
                                    <div className="mt-4 border-top pt-3">
                                        <h6>Attachments</h6>
                                        <ul className="d-flex flex-wrap">
                                            {ticketData.messages[0].attachments.map((attachment, index) => (
                                                <li key={attachment.id || index} className="me-3 w-250">
                                                    <a 
                                                        href={`${apiRoutes.base_url}/storage/${attachment.file_path}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary"
                                                    >
                                                        <div className="ticket-details-comment p-3 w-100">
                                                            <h6 className="mb-0">{attachment.file_name}</h6>
                                                            <p className="mb-0 text-secondary">{formatDateTime(attachment.created_at)}</p>
                                                        </div>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5>Comments</h5>
                        </div>

                        <div className="card-body">
                            {ticketData?.messages?.length > 1 ? (
                                ticketData.messages.slice(1).reverse().map((message) => (
                                    <div className="ticket-comment-box mb-3" key={message.id}>
                                        <div className="d-flex justify-content-between position-relative flex-wrap">
                                            <div className={`h-45 w-45 d-flex-center b-r-50 overflow-hidden position-absolute ${
                                                message.sender?.role === 'admin' || message.sender?.role === 'super_admin' ? 'bg-primary' : 'bg-success'
                                            }`}>
                                                <span className="h-45 w-45 d-flex-center b-r-10 position-relative">
                                                    <div className="b-r-10"
                                                        style={{
                                                            backgroundColor: getColorFromName(message.sender?.name || 'User'),
                                                            color: '#fff',
                                                            width: '45px',
                                                            height: '45px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {getInitials(message.sender?.name || 'User')}
                                                    </div>
                                                </span>
                                            </div>
                                            
                                            <div className="flex-grow-1 ps-2 pe-2 ms-5">
                                                <h6 className="mb-0">
                                                    {message.sender?.name || 'Unknown User'} 

                                                    {message.sender?.role === 'super_admin' && (
                                                        <span className="badge ms-2 bg-light-primary text-primary">
                                                            Support Agent
                                                        </span>
                                                    )}
                                                </h6>
                                                <p 
                                                    className="text-dark mb-3"
                                                    dangerouslySetInnerHTML={{ __html: message.message }}
                                                />
                                            </div>
                                            
                                            <div className="ms-5">
                                                <p>{formatDateTime(message.created_at)}</p>
                                            </div>
                                        </div>
                                        
                                        {message.attachments && message.attachments.length > 0 && (
                                            <ul className="d-flex flex-wrap ms-5">
                                                {message.attachments.map((attachment) => (
                                                    <li className="me-3 w-250 mb-3" key={attachment.id}>
                                                        <a 
                                                            href={`/storage/${attachment.file_path}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-decoration-none"
                                                        >
                                                            <div className="ticket-details-comment p-3 w-100 border rounded">
                                                                <h6 className="mb-0 text-primary">{attachment.file_name}</h6>
                                                                <p className="mb-0 text-secondary f-s-13">
                                                                    {formatDateTime(attachment.created_at)}
                                                                </p>
                                                            </div>
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="d-flex justify-content-center">
                                    <div className="badge text-light-primary ms-5">No messages found for this ticket.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5>Answer</h5>
                        </div>

                        <div className="card-body">
                            <form method="POST" onSubmit={processTicketResponse}>
                                <div className="app-form">
                                    <div className="row">
                                        <div className="col-md-12">
                                            {displayMessageSuccess && (
                                                <div className="alert alert-light-success" role="alert">
                                                    {messageText || "Operation completed successfully!"}
                                                </div>
                                            )}
                                            
                                            {displayMessageError && (
                                                <div className="alert alert-light-danger" role="alert">
                                                    {messageText || "Something went wrong. Please try again."}
                                                </div>
                                            )}
                                            
                                            <div className="mb-3">
                                                <HtmlEditor
                                                    message=""
                                                    onChange={handleEditorChange}
                                                    summernoteRef={summernoteRef}
                                                />  
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label" htmlFor="attachment">Attachment (Optional)</label>
                                                <input
                                                    className="form-control"
                                                    type="file"
                                                    name="attachment"
                                                    id="attachment"
                                                    onChange={handleFileChange}
                                                    accept=".jpeg,.png,.gif,.pdf,.zip"
                                                    disabled={loading}
                                                />
                                                <small className="form-text text-muted">Max file size: 5MB (JPG, PNG, GIF, PDF, ZIP)</small>
                                            </div>

                                            <div className="d-flex align-items-center gap-30">
                                                <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                    Submit Reply
                                                </button>

                                                {btnLoader && (
                                                    <div className="left d-flex align-items-center">
                                                        <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                        Processing
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default ViewSupportTicket;