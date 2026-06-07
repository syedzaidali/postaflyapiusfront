import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { ReactSummernoteLite } from '@easylogic/react-summernote-lite';
import { ref, onValue, off, child, get } from 'firebase/database';
import { database } from '../libs/firebase';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import HtmlEditor from '../components/Editors/HtmlEditor';
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

const TransactionalEmails = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const formFields = {
        provider_id: "",
        template_id: "",
        sender_address_1: "",
        sender_address_2: "",
        payment_url: "",
        payable_company_name: "",
        payable_address_1: "",
        payable_address_2: "",
        info_text_1: "",
        info_text_2: "",
        footer_text: "",
        footer_description: "",
        sender_email: "",
        bcc_email: "",
        subject: "",
        message: "",
        scheduled: "",
        schedule_date: "",
        schedule_time: "",
        csvfile: null,
        tr_email_template_id: ""
    }

    //Transactional Email additional Fields
    const [templateType, setTemplateType] = useState('');
    const [saveTemplate, setSaveTemplate] = useState(null);
    const [transactionTemplateTitle, setTransactionTemplateTitle] = useState("");

    //Initializing provider create form fields
    const providerFormFields = {
        provider_name: "",
        email: "",
        phone: "",
        mailing_address_1: "",
        mailing_address_2: "",
        billing_address_1: "",
        billing_address_2: "",
        payment_url: "",
        logo: null,
        qr_code: null,
    };

    const providerDataFields = {
        provider_name: "",
        provider_logo_url: "",
    }

    const [logoPreview, setLogoPreview] = useState(null);
    const [qrCodePreview, setqrCodePreview] = useState(null);
    const contentRef = useRef(formFields.message);
    const [scheduleLater, setScheduleLater] = useState(false);
    
    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass]   = useState(false);
    const [burgerActive, setBurgerActive]       = useState(false);
    const [title, setTitle]                     = useState(false);
    const [showCreateForm , setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm]        = useState(false);
    const [user, setUser] = useState([]);
    const [templateFieldError, setTemplateFieldError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [transactionEmails, setTransactionEmails] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [providers, setProviders] = useState([]);
    const [transactionTemplates, setTransactionTemplates] = useState([]);
    const [createProviderForm, setCreateProviderForm] = useState(false);
    const [formData, setFormData] = useState(formFields);
    const [providerFormData, setProviderFormData] = useState(providerFormFields);
    const [providerDisplayData, setProviderDisplayData] = useState(providerDataFields);
    const [isProviderSelected, setIsProviderSelected] = useState(false);
    const [displayPreview, setDisplayPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [themes, setThemes] = useState([]);
    const [selectThemeForm, setSelectThemeForm] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [scrollToY, setScrollToY] = useState(0);
    const selectThemeRef = useRef(null);
    const burgerMenuWrapperRef = useRef(null);
    const [importStatus, setImportStatus] = useState('');
    const [importId, setImportId] = useState('');
    const [isPolling, setIsPolling] = useState(false);
    const [jobsCount, setJobsCount] = useState(['0', '0']);
    const [totalCustomers, setTotalCustomers] = useState('0');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [btnDisabled, setBtnDisabled] = useState(false);
    
    const summernoteRef = useRef();
    
    const handleEditorChange = (content) => {
        contentRef.current = content;
    };

    /*
     * Page Functionalities
     */


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
   

    //Fetch All transactional emails
    const fetchTransactionalEmails = async (page = 1, search = '') => {
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

            const response = await fetch(`${apiRoutes.getAllTransactionalEmailsLog}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setTransactionEmails(result.data.data);
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
        fetchTransactionalEmails(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

   


    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Transaction Emails</h4>
                </div>

                
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Manage Transactional Emails</h5>
                            
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
                                        <th scope="col">Email</th>
                                        <th scope="col">Email Status With Event</th>
                                        <th scope="col">Email Timestamp</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">Loading...</td>
                                    </tr>
                                ) : transactionEmails.length > 0 ? (
                                    transactionEmails.map((email) => (
                                        <tr key={email.id}>
                                            
                                            <td className="f-w-500">{email.email || '—'}</td>
                                            <td className="f-w-500">{email.event || '—'}</td>
                                            <td className="f-w-500">{email.event_timestamp || '—'}</td>
                                            
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center">No transactions found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

                            {selectedTransactions.length > 0 && (
                                <button type="button" className="btn btn-pinterest b-r-22" onClick={deleteSelectedTransaction}>
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

export default TransactionalEmails;