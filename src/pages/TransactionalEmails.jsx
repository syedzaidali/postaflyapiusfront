import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { ReactSummernoteLite } from '@easylogic/react-summernote-lite';
import { ref, onValue, off, child, get } from 'firebase/database';
import { database } from '../libs/firebase';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import HtmlEditor from '../components/Editors/HtmlEditor';
import { unwrapLastPage, unwrapPagedRows, prependRow, authGetHeaders } from '../utils/listResponse';
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
    const [previewLoading, setPreviewLoading] = useState(false);
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
    const [messageText, setMessageText] = useState("");
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [showMessageError, setShowMessageError] = useState(false);
    
    const summernoteRef = useRef();
    
    const handleEditorChange = (content) => {
        contentRef.current = content;
    };
    
    //Mapping shortcodes
    const shortcodes = [
        'patient_name',
        'patient_phone',
        'patient_balance',
        'company_name',
        'company_email',
        'company_phone',
        'company_logo',
        'company_address_1',
        'company_address_2',
        'billing_address_1',
        'billing_address_2',
        'payment_link',
    ];

    /*
     * Page Functionalities
     */

    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setTitle("");

        setTimeout(() => {
            setBurgerActive(false);
            setUploadProgress(0);

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

    //Create New Campaign form
    const createFormDisplay = () => {
        setShowCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    }

    useEffect(() => {
        if (window.location.hash === "#create") {
            createFormDisplay();
            
            history.replaceState(null, "", window.location.pathname);
        }
    }, []);

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
    
        if (!file) return;
    
        setProviderFormData((prev) => ({ ...prev, [name]: file }));
    
        const reader = new FileReader();
        reader.onloadend = () => {
            if (name === "logo") {
                setLogoPreview(reader.result);
            } else if (name === "qr_code") {
                setqrCodePreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    //Creating new provider form inline
    const createNewProvider = (path) => {
        setCreateProviderForm(true);

        setShowCreateForm(false);
    }

    const returnBackForm = () => {
        setCreateProviderForm(false);
        
        setProviderFormData({
            provider_name: "",
            email: "",
            phone: "",
            mailing_address_1: "",
            mailing_address_2: "",
            billing_address_1: "",
            billing_address_2: "",
            payment_url: "",
            status: "",
            logo: null,
            qr_code: null,
        }); 

        setLogoPreview(null);
        setqrCodePreview(null);

        setShowCreateForm(true);    
    }

    const showCreateFormDisplay = () => {
        setShowCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
        fetchProviders();
        fetchTemplates();
        fetchTransactionTemplates();
        fetchThemes();
    };   

    //Populate provider details into form
    const setSelectedProvider = (provider) => {
        setIsProviderSelected(true);

        setProviderDisplayData({
            provider_name: provider.title,
            provider_logo_url: provider.logo_url,
        });

        setFormData((prev) => ({
            ...prev,
            provider_id: provider.id,
            sender_address_1: provider.mail_address_1,
            sender_address_2: provider.mail_address_2 || "",
            payment_url: provider.payment_link || "",
            payable_company_name: provider.title || "",
            payable_address_1: provider.billing_address_1 || "",
            payable_address_2: provider.billing_address_2 || "",
            sender_email: provider.email || "",
            //bcc_email: provider.email || "",
        }));
    }

    const handleRadioChange = (e) => {
        setTemplateType(e.target.value);
        setFormData({
            ...formFields, 
            tr_email_template_id: "",
            provider_id: "",
            sender_address_1:  "",
            sender_address_2:  "",
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
            template_id: "",
        });
        setSelectedThemeId(null);
        setSelectedTheme(null);
        setIsProviderSelected(false);
    };

    const handleModifyTemplate = () => {
        setDisplayPreview(false);
    }

    const setPreviewBlobUrl = (blob) => {
        if (previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(blob));
        setDisplayPreview(true);
    };

    const fetchSavedTemplatePreview = async (templateId) => {
        setPreviewLoading(true);
        try {
            const res = await fetch(apiRoutes.transactionalTemplatePreview(templateId));
            if (!res.ok) {
                throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            setPreviewBlobUrl(await res.blob());
        } catch (err) {
            console.error("Failed to load invoice preview:", err);
            alert("Invoice preview failed. Please check provider, theme, and backend logs.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const invoiceTemplatePreview = async (e) => {
        if (e?.preventDefault) {
            e.preventDefault();
        }

        if (!formData.provider_id) {
            alert("Please select a provider before previewing the invoice.");
            return;
        }

        if (!selectedThemeId) {
            alert("Please select an invoice theme before previewing.");
            return;
        }

        const payload = {
            invoice_theme_id: selectedThemeId,
            provider_id: formData.provider_id,
            sender_address_1: formData.sender_address_1,
            sender_address_2: formData.sender_address_2,
            payable_company_name: formData.payable_company_name,
            payable_address_1: formData.payable_address_1,
            payable_address_2: formData.payable_address_2,
            footer_text: formData.footer_text,
            footer_description: formData.footer_description,
            info_text_1: formData.info_text_1,
            info_text_2: formData.info_text_2,
        };

        setPreviewLoading(true);
        try {
            const res = await fetch(apiRoutes.previewTransactionTemplateInvoice, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || `Error: ${res.status} ${res.statusText}`);
            }

            setPreviewBlobUrl(await res.blob());
        } catch (err) {
            console.error("Failed to load invoice preview:", err);
            alert(err.message || "Invoice preview failed. PDF generation can take up to 30 seconds on local WAMP.");
        } finally {
            setPreviewLoading(false);
        }
    }
    
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
    //Fetch User Data
    const fetchUserData = async () => {
        try {
            const response = await fetch(apiRoutes.userData, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setUser(result.data.user || []);
            setUserId(result.data.user.id);
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    };

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

            const response = await fetch(`${apiRoutes.getTransactionalEmails}?${queryParams}`, {
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

    //Fetch Providers
    const fetchProviders = async () => {
        try {
            const response = await fetch(`${apiRoutes.getProviders}?per_page=100&_ts=${Date.now()}`, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setProviders(unwrapPagedRows(result));
        } catch (error) {
            console.error("Failed to fetch providers", error);
            setProviders([]);
        }
    };

    //Fetch Email Templates (transactional / marketing email body templates)
    const fetchTemplates = async () => {
        try {    
            const type = 'transactional'; 
            const url = `${apiRoutes.getAllTemplates}?type=${encodeURIComponent(type)}&per_page=100&_ts=${Date.now()}`;

            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setTemplates(unwrapPagedRows(result));
            } else {
                console.error(result);
                setTemplates([]);
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error);
            setTemplates([]);
        }
    };

    //Fetch Transaction Templates (saved invoice/transaction setups — separate from email templates)
    const fetchTransactionTemplates = async () => {
        try {    
            const url = `${apiRoutes.getTransactionEmailTemplate}?_ts=${Date.now()}`;

            const response = await fetch(url, {
                method: "POST",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                const rows = Array.isArray(result.data)
                    ? result.data
                    : unwrapPagedRows(result);
                setTransactionTemplates(rows || []);
            } else {
                console.error(result);
                setTransactionTemplates([]);
            }
        } catch (error) {
            console.error("Failed to fetch transaction templates:", error);
            setTransactionTemplates([]);
        }
    };

    //Fetch invoice Themes
    const fetchThemes = async () => {
        try {    
            const url = `${apiRoutes.getAllInvoiceThemes}?_ts=${Date.now()}`;

            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                const rows = Array.isArray(result.data)
                    ? result.data
                    : unwrapPagedRows(result);
                setThemes(rows || []);
            } else {
                console.error(result);
                setThemes([]);
            }
        } catch (error) {
            console.error("Failed to fetch themes:", error);
            setThemes([]);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchProviders();
        fetchTemplates();
        fetchThemes();
        fetchTransactionTemplates();
    }, []);

    const handleTemplateSelect = async (e) => {
        const selectedId = e.target.value;
        setFormData({ ...formData, tr_email_template_id: selectedId });

        // Optional: fetch and populate data for that template here
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        try {
            const response = await fetch(apiRoutes.getTransactionEmailTemplate, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(
                    {tr_transaction_template_id: selectedId}
                ),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                const selectedTemplate = result.data;
                
                const selectedProvider = providers.find(
                    (p) => p.id.toString() === selectedTemplate.provider_id.toString()
                );
                                    
                if (selectedProvider) {
                    setSelectedProvider(selectedProvider);
                }

                setFormData({
                    ...formFields, // reset first
                    tr_email_template_id: selectedId,
                    provider_id: selectedTemplate.provider_id || "",
                    sender_address_1: selectedTemplate.sender_address_1 || "",
                    sender_address_2: selectedTemplate.sender_address_2 || "",
                    payment_url: selectedTemplate.payment_url || "",
                    payable_company_name: selectedTemplate.payable_company_name || "",
                    payable_address_1: selectedTemplate.payable_address_1 || "",
                    payable_address_2: selectedTemplate.payable_address_2 || "",
                    info_text_1: selectedTemplate.info_text_1 || "",
                    info_text_2: selectedTemplate.info_text_2 || "",
                    footer_text: selectedTemplate.footer_text || "",
                    footer_description: selectedTemplate.footer_description || "",
                    sender_email: selectedTemplate.sender_email || "",
                    bcc_email: selectedTemplate.bcc_email || "",
                    subject: selectedTemplate.subject || "",
                    message: selectedTemplate.message || "",
                    template_id: selectedTemplate.id || "",
                });

                const theme = themes.find(
                    (t) => t.id.toString() === selectedTemplate.invoice_theme_id.toString()
                );
                setSelectedThemeId(selectedTemplate.invoice_theme_id);
                setSelectedTheme(theme);
                await fetchSavedTemplatePreview(selectedId);
            } else {
                alert(result.message || "Failed to create contact.");
            }
        } catch (error) {
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.values(validationErrors).forEach(errs => {
                  errs.forEach(err => console.log(err));
                });
            } else {
                console.log("Unexpected error occurred.");
            }
        } 
    };

    //Create Provider 
    const handleProcessProviderForm= async () => {
        e.preventDefault();
        setReqLoader(true);
    
        const isEdit = providerId !== "";
    
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.provider_name);
            formDataToSend.append("email", formData.email || "");
            formDataToSend.append("phone", formData.phone || "");
            formDataToSend.append("mail_address_1", formData.mailing_address_1 || "");
            formDataToSend.append("mail_address_2", formData.mailing_address_2 || "");
            formDataToSend.append("billing_address_1", formData.billing_address_1 || "");
            formDataToSend.append("billing_address_2", formData.billing_address_2 || "");
            formDataToSend.append("payment_url", formData.payment_url || "");
    
            if (providerId) {
                formDataToSend.append("id", providerId);
            }
    
            if (formData.logo) {
                formDataToSend.append("logo", formData.logo);
            }
    
            if (formData.qr_code) {
                formDataToSend.append("qr_code", formData.qr_code);
            }
    
            const response = await axios.post(apiRoutes.createProvider, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
    
            if (response.status) {
                setDisplayMessageSuccess(true);
    
                // Reset form
                setProviderFormData({
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
                });
                
                setLogoPreview(null);
                setqrCodePreview(null);
                
                setCreateProviderForm(false);
                setShowCreateForm(true);
                const created = response.data?.data;
                if (created?.id) {
                    setProviders((prev) => prependRow(prev, created));
                    setSelectedProvider(created);
                }
                await fetchProviders();
            } else {
                setDisplayMessageError(true);
                setMessageText(response.message || "Failed to process provider.");
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again.")
        } finally {
            setReqLoader(false);
            setTimeout(() => setShowMessageError(false), 4500);
            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    }

    const selectTheme = () => {
        setSelectThemeForm(true);
        setShowCreateForm(false);

        const y = burgerMenuWrapperRef.current?.scrollTop || 0;
        setScrollToY(y);
    }

    const setTheme = (themeId) => {
        const theme = themes.find(t => t.id === themeId);
        setSelectedThemeId(themeId);
        setSelectedTheme(theme);
        
        setSelectThemeForm(false);
        setShowCreateForm(true);

        setTimeout(() => {
            burgerMenuWrapperRef.current?.scrollTo({
                top: scrollToY,
                behavior: 'smooth'
            });
        }, 100);
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return { label: 'Pending', class: 'secondary' };
            case 'processing':
                return { label: 'Processing File', class: 'info' };
            case 'inserting_rows':
                return { label: 'Saving Rows', class: 'info' };
            case 'parsing_complete':
                return { label: 'Parsed Successfully', class: 'success' };
            case 'grouping_customers':
                return { label: 'Grouping Customers', class: 'info' };
            case 'grouping_complete':
                return { label: 'Customer Grouping Complete', class: 'warning' };
            case 'initializing_process':
                return { label: 'Preparing Invoices', class: 'primary' };
            case 'processing_invoices':
                return { label: 'Generating Invoices', class: 'warning' };
            case 'completed':
                return { label: 'Completed', class: 'success' };
            case 'failed':
                return { label: 'Failed', class: 'danger' };
            case 'header_mismatch':
                return { label: 'Invalid File Format', class: 'danger' };
            default:
                return { label: 'Waiting', class: 'secondary' };
        }
    };

    const { label, class: statusClass } = getStatusLabel(importStatus);

    //Create Transactional Email
    const processCreateTransactionalEmail = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        try {
            const form = new FormData();

            form.append('save_template', saveTemplate ? 1 : 0);

            if (saveTemplate) {
                form.append('transactionTemplateTitle', transactionTemplateTitle);
            }

            form.append('template_type', templateType);

            if (templateType === 'existing') {
                form.append('tr_templateId', formData.tr_email_template_id);
            }


            // Required nested fields
            form.append("invoice[providerID]", formData.provider_id || "");
            form.append("invoice[status]", formData.status || "1");

            form.append("invoiceMeta[subject]", formData.subject || "");
            form.append("invoiceMeta[sender_email]", formData.sender_email || "");
            form.append("invoiceMeta[bcc_email]", formData.bcc_email || "");
            form.append("invoiceMeta[email_template]", contentRef.current || "");

            form.append("invoiceMeta[info_text_1]", formData.info_text_1 || "");
            form.append("invoiceMeta[info_text_2]", formData.info_text_2 || "");
            form.append("invoiceMeta[footer_text]", formData.footer_text || "");
            form.append("invoiceMeta[footer_description]", formData.footer_description || "");

            // Additional flat fields (these were missing)
            form.append("sender_address_1", formData.sender_address_1 || "");
            form.append("sender_address_2", formData.sender_address_2 || "");
            form.append("payment_url", formData.payment_url || "");
            form.append("payable_company_name", formData.payable_company_name || "");
            form.append("payable_address_1", formData.payable_address_1 || "");
            form.append("payable_address_2", formData.payable_address_2 || "");

            // Optional template/theme
            if (selectedTemplateId) {
                form.append("emailTemplateID", selectedTemplateId);
            }

            if (selectedThemeId) {
                form.append("templateID", selectedThemeId);
            }

            // Optional CSV file
            if (formData.csvfile) {
                form.append("csvfile", formData.csvfile);
            }

            const response = await axios.post(apiRoutes.processTransactionalEmails, form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            if (response.data.status) {
                setImportId(response.data.import_id);
                setImportStatus('pending');

                setIsPolling(true);

                fetchTransactionTemplates();
                closeMenu();
            } else {
                setImportStatus('error');
            }
        } catch (err) {
            console.error("Submit Error:", err);
            alert("Unexpected error occurred. Try again.");
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    }

    const handleImportComplete = useCallback(() => {
        setImportStatus('completed');
        setShowSuccessMessage(true);
        setIsPolling(false);
        fetchTransactionalEmails(currentPage, searchQuery);

        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 10000);
    }, [currentPage, searchQuery]);

    const applyImportStatusUpdate = useCallback((res) => {
        if (!res?.status) return;

        if (res.status === 'completed') {
            handleImportComplete();
            return;
        }

        if (res.status === 'failed' || res.status === 'header_mismatch') {
            setImportStatus(res.status);
            setIsPolling(false);
            return;
        }

        setImportStatus(res.status);

        if (res.total_customers !== undefined) {
            setTotalCustomers(res.total_customers);
        }

        if (res.completed_jobs !== undefined && res.total_jobs !== undefined) {
            setJobsCount([res.completed_jobs, res.total_jobs]);
        }
    }, [handleImportComplete]);

    const pollImportStatusOnce = useCallback(async () => {
        if (!importId) return;

        const response = await fetch(apiRoutes.transactionalEmailStatus, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ importId }),
        });

        const res = await response.json();
        if (response.ok) {
            applyImportStatusUpdate(res);
        }
    }, [importId, token, applyImportStatusUpdate]);

    useEffect(() => {
        if (!importId || !userId) return;

        const importStatusRef = ref(database, `transaction_status/${importId}/${userId}`);

        const unsubscribe = onValue(importStatusRef, (snapshot) => {
            const res = snapshot.val();
            if (!res) return;
            applyImportStatusUpdate(res);
        });

        return () => {
            off(importStatusRef);
            unsubscribe();
        };
    }, [importId, userId, applyImportStatusUpdate]);

    useEffect(() => {
        if (!importId || !isPolling) return;

        pollImportStatusOnce();

        const interval = setInterval(() => {
            pollImportStatusOnce().catch(() => {
                setImportStatus('error');
                setIsPolling(false);
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [importId, isPolling, pollImportStatusOnce]);

    const handleCheckboxChange = (id, isChecked) => {
        setSelectedTransactions((prev) => 
            isChecked ? [...prev, id] : prev.filter((leadId) => leadId !== id)
        );
    };

    const deleteSelectedTransaction = async () => {
        if (selectedTransactions.length === 0) {
            alert('Please select at least one lead to delete.');
            return;
        }
    
        if (!window.confirm('Are you sure you want to delete selected leads?')) {
            return;
        }
    
        try {
            const response = await fetch(apiRoutes.deleteMultipleTransactions, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ids: selectedTransactions }),
            });
    
            const result = await response.json();
    
            if (response.ok && result.status) {
                alert(result.message);
                setSelectedTransactions([]);
                fetchTransactionalEmails(currentPage, searchQuery)
            } else {
                alert(result.message || 'Failed to delete selected leads.');
                console.error(result);
            }
        } catch (error) {
            console.error('Error deleting leads:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Transaction Emails</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={() => showCreateFormDisplay()} className="btn btn-primary b-r-22">
                            <UserPlus /> Create Transaction
                        </button>
                    </div>
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
                        {showSuccessMessage && (
                            <div className="badge text-light-success mt-2 pt-3 pb-3 pa-s-20 pa-e-20" role="alert">
                                <CheckCircle size='20' /> Invoice import completed successfully!
                            </div>
                        )}

                        {[
                            'pending',
                            'processing',
                            'inserting_rows',
                            'grouping_customers',
                            'grouping_complete',
                            'initializing_process',
                            'processing_invoices',
                            'parsing_complete'
                        ].includes(importStatus) && (
                            <div className="progress-box bg-light-primary text-primary-dark f-w-600 w-100">
                                <div className="progress-content">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <span
                                                aria-hidden="true"
                                                className="spinner-border spinner-border-sm me-2 ms-2"
                                                role="status"
                                            ></span>
                                            <p className="mb-0">Importing Invoices...</p>
                                        </div>
            
                                        <span className={`badge text-bg-${statusClass}`}>
                                            {label}
                                        </span>
                                    </div>

                                    <div className="d-flex align-items-center justify-content-end mt-2">
                                        {['parsing_complete', 'inserting_rows'].includes(importStatus) && (
                                            <span>Total Rows : {totalCustomers}</span>
                                        )}

                                        {['initializing_process', 'grouping_complete', 'processing_invoices'].includes(importStatus) && (
                                            <span>{jobsCount[0]} / {jobsCount[1]}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="progress w-100 h-5" role="progressbar"
                                    aria-valuemax="100"
                                    aria-valuemin="0"
                                    aria-valuenow={jobsCount[1] > 0 ? (jobsCount[0] / jobsCount[1]) * 100 : 0}>
                                    <div className="progress-bar bg-primary h-5"
                                        style={{
                                            width: jobsCount[1] > 0
                                                ? `${(jobsCount[0] / jobsCount[1]) * 100}%`
                                                : "100%"
                                        }}></div>
                                </div>
                            </div>
                        )}

                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">&nbsp;</th>
                                        <th scope="col">Provider</th>
                                        <th scope="col">Customer</th>
                                        <th scope="col">Invoice Count</th>
                                        <th scope="col">Selected Template</th>
                                        <th scope="col">Delivery Date</th>
                                        <th scope="col">Open Date</th>
                                        <th scope="col">Email Status</th>
                                        <th scope="col">Email Status</th>
                                        <th scope="col">Response</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">Loading...</td>
                                    </tr>
                                ) : transactionEmails.length > 0 ? (
                                    (transactionEmails || []).map((email) => (
                                        <tr key={email.id}>
                                            <td>
                                                <label className="check-box">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedTransactions.includes(email.id)}
                                                        onChange={(e) => handleCheckboxChange(email.id, e.target.checked)}
                                                    />
                                                    <span className="checkmark outline-primary ms-2"></span>
                                                </label>
                                            </td>
                                            <td className="f-w-500">{email.providers.title || '—'}</td>
                                            <td>
                                                <div className="sm-data">
                                                    <span><strong>Name : </strong>{email.patient.name}</span>
                                                    <span><strong>Email : </strong>{email.patient.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {email.invoiceCount || '0'} &nbsp;
                                                <a href={`/patients/invoices/${email.patient.id}`} target="_blank" className="badge text-light-primary">View</a>
                                            </td>
                                            <td>
                                            <span className="badge text-light-primary">
                                            <a
                                                href={apiRoutes.invoiceThemePreview(email.customer_invoice[0].invoice_template_id, email.provider_id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                            {
                                                email.customer_invoice && email.customer_invoice.length > 0
                                                    ? email.customer_invoice[0].invoice_template?.name || '—'
                                                    : '—'
                                            }
                                            </a>
                                            </span>
                                            </td>
                                            <td>{email.created_at || '—'}</td>
                                            <td>{email.opened_at || '—'}</td>
                                            <td>{email.email_delivery_status || '—'}</td>
                                            <td>
                                                <span className={`badge ${email.email_status === 'failed' ? 'text-light-danger' : 'text-light-success'}`}>
                                                    {email.email_status || '—'}
                                                </span>
                                            </td>
                                            <td>{email.response || '—'}</td>
                                            <td>
                                                {Array.isArray(email.invoice_urls) && email.invoice_urls.length > 0 && (
                                                    <div className="mt-2">
                                                    {email.invoice_urls.map((url, index) => (
                                                        <a
                                                        key={index}
                                                        href={url}
                                                        className="btn btn-info btn-sm me-2 mt-1"
                                                        download
                                                        >
                                                        Download Invoice {index + 1}
                                                        </a>
                                                    ))}
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => deleteInvoice(email.id)} className="btn btn-light-danger icon-btn b-r-4 ms-2">
                                                    <Trash size={12} width={16} />
                                                </button>
                                            </td>
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

            {burgerActive && (
                <div className={`burger-menu ${addActiveClass ? "active-in" : ""}`}>
                    <div className="burger-menu-wrapper">
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={closeMenu}>
                            <Xmark />
                        </a>

                        <div className="col-wrapper-full" ref={burgerMenuWrapperRef}>
                            <div className="col-md-12 full-loader">
                                {selectThemeForm &&  (
                                    <div className="templates-preview">
                                        {(themes || []).map((theme, index) => (
                                            <div className="template-selector" key={index}>
                                                <a
                                                    href="#"
                                                    className={`select-template ${selectedThemeId === theme.id ? 'selected-theme' : ''}`}
                                                    onClick={(e) => {
                                                    e.preventDefault();
                                                    setTheme(theme.id);
                                                    }}
                                                >
                                                    <div className="template-preview-thumbnail">
                                                        <img src={theme.preview_image} alt={theme.name} />
                                                        <span>{theme.name}</span>
                                                    </div>
                                                </a>

                                                <a href={apiRoutes.invoiceThemePreview(theme.id, formData.provider_id)} className="btn btn-primary b-r-22 btn-sm" target="_blank" rel="noopener noreferrer">Preview</a>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">{showEditForm ? 'Edit' : 'Create'} Transaction Email</h2>
                                        
                                        <form method="POST" onSubmit={processCreateTransactionalEmail}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Template Type</label>
                                                            <div className="check-container d-flex gap-5">
                                                                <label className="check-box">
                                                                    <input 
                                                                        name="radio-group1"
                                                                        value="new"
                                                                        checked={templateType === 'new'}
                                                                        onChange={handleRadioChange} 
                                                                        type="radio" 
                                                                    />
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span>New</span>
                                                                </label>

                                                                <label className="check-box">
                                                                    <input 
                                                                        name="radio-group1"
                                                                        value="existing"
                                                                        checked={templateType === 'existing'}
                                                                        onChange={handleRadioChange} 
                                                                        type="radio" 
                                                                    />
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span>Existing</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        {templateType === "existing" && (
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Select Template</label>
                                                            <select
                                                                name="tr_email_template_id"
                                                                className="form-select"
                                                                value={formData.tr_email_template_id || ""}
                                                                onChange={handleTemplateSelect}
                                                            >
                                                                <option value="">Select Template</option>
                                                                {(transactionTemplates || []).map((template) => (
                                                                    <option key={template.id} value={template.id}>
                                                                        {template.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {(templateType === 'new' || (templateType === 'existing' && formData.tr_email_template_id)) && (
                                                    <>
                                                    {displayPreview &&  (
                                                        <>
                                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                                <h2 className="card-title f-s-16">Template Preview</h2>
                                                                <a
                                                                    href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleModifyTemplate();
                                                                    }} 
                                                                    className="btn btn-primary b-r-22"
                                                                >Modify Template</a>
                                                            </div>

                                                                <div style={{ height: '600px', marginBottom: '20px', position: 'relative' }}>
                                                                    {previewLoading && (
                                                                        <div className="d-flex align-items-center justify-content-center h-100">
                                                                            <p className="mb-0">Generating invoice preview... this may take 10-30 seconds.</p>
                                                                        </div>
                                                                    )}
                                                                    {!previewLoading && previewUrl && (
                                                                        <iframe
                                                                            id="previewTemplate"
                                                                            src={previewUrl}
                                                                            width="100%"
                                                                            height="100%"
                                                                            style={{ border: 'none' }}
                                                                            title="Invoice Preview"
                                                                        />
                                                                    )}
                                                                </div>
                                                        </>
                                                    )}

                                                    {!displayPreview &&  (
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label" htmlFor="username">Select Sender Profile</label>
                                                                <select
                                                                    name="group_id"
                                                                    className="form-select"
                                                                    value={formData.provider_id || ""}
                                                                    onChange={(e) => {
                                                                        const selectedId = e.target.value;
                                                                        const selectedProvider = providers.find((p) => p.id.toString() === selectedId);
                                                                    
                                                                        if (selectedProvider) {
                                                                            setSelectedProvider(selectedProvider);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">Select Provider</option>
                                                                    {(providers || [])
                                                                    .filter((provider) => provider && provider.id && provider.title)
                                                                    .map((provider) => (
                                                                        <option key={provider.id} value={provider.id}>
                                                                        {provider.title}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                <span className="supporting-label d-flex justify-content-end">
                                                                    <a href="#" onClick={
                                                                        (e) => {
                                                                            e.preventDefault();
                                                                            createNewProvider();
                                                                        }
                                                                    }
                                                                    >Create Sender Profile</a>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    )}
                                                    {isProviderSelected && (
                                                        <>
                                                        <div className="row">
                                                            {!displayPreview &&  (
                                                                <>
                                                                    <div className="col-md-12">
                                                                        <h4>Invoice Details</h4>
                                                                    </div>

                                                                    <div className="col-md-4">
                                                                        <div className="mb-3">
                                                                            <label className="form-label" htmlFor="username">Logo</label>
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={providerDisplayData.provider_logo_url}
                                                                                    alt={providerDisplayData.provider_name}
                                                                                    style={{ maxHeight: '120px', borderRadius: '6px' }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-md-8"></div>

                                                                    <div className="col-md-6">
                                                                        <div className="mb-3">
                                                                            <h4 className="box-title">Sender Details</h4>
                                                                        </div>

                                                                        <div className="mb-3">
                                                                            <label className="form-label" htmlFor="username">Mail Address 1</label>
                                                                            <input
                                                                                className="form-control"
                                                                                name="sender_address_1"
                                                                                type="text"
                                                                                value={formData.sender_address_1}
                                                                                onChange={(e) => setFormData({ ...formData, sender_address_1: e.target.value })}
                                                                            />
                                                                        </div>
                                
                                                                        <div className="mb-3">
                                                                            <label className="form-label" htmlFor="username">Mail Address 2</label>
                                                                            <input
                                                                                className="form-control"
                                                                                name="company"
                                                                                type="text"
                                                                                value={formData.sender_address_2}
                                                                                onChange={(e) => setFormData({ ...formData, sender_address_2: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-md-6">
                                                                        <div className="mb-3">
                                                                            <h4 className="box-title">Check Payable To & Mail To</h4>
                                                                        </div>

                                                                        <div className="mb-3">
                                                                            <label className="form-label">Company Name</label>
                                                                            <input
                                                                                className="form-control"
                                                                                name="company"
                                                                                type="text"
                                                                                value={formData.payable_company_name}
                                                                                onChange={(e) => setFormData({ ...formData, payable_company_name: e.target.value })}
                                                                            />
                                                                        </div>

                                                                        <div className="mb-3">
                                                                            <label className="form-label">Address Line 1</label>
                                                                            <input
                                                                                className="form-control"
                                                                                name="payable_address_1"
                                                                                type="text"
                                                                                value={formData.payable_address_1}
                                                                                onChange={(e) => setFormData({ ...formData, payable_address_1: e.target.value })}
                                                                            />
                                                                        </div>

                                                                        <div className="mb-3">
                                                                            <label className="form-label">Address Line 2</label>
                                                                            <input
                                                                                className="form-control"
                                                                                name="payable_address_2"
                                                                                type="text"
                                                                                value={formData.payable_address_2}
                                                                                onChange={(e) => setFormData({ ...formData, payable_address_2: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-md-12">
                                                                        <div className="mb-3">
                                                                            <h4 className="box-title">Payment Details</h4>
                                                                        </div>

                                                                        <div className="mb-3 m-0">
                                                                            <label className="form-label">QR Code</label>

                                                                            <div className="file-uploader">
                                                                                <input type="file" name="qrCode" className="form-control" />

                                                                                {qrCodePreview &&
                                                                                <div className="preview-qr-logo thumnail-img">
                                                                                    <img src={qrCodePreview} />
                                                                                </div>
                                                                                }
                                                                            </div>
                                                                        </div>

                                                                        <div className="mb-3">
                                                                            <label className="form-label">Payment Url</label>
                                                                            <input
                                                                                className="form-control"
                                                                                name="payment_url"
                                                                                type="text"
                                                                                value={formData.payment_url}
                                                                                onChange={(e) => setFormData({ ...formData, payment_url: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-3 col-6">
                                                                        <label className="form-label">Info Text 1</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="info_text_1"
                                                                            type="text"
                                                                            value={formData.info_text_1}
                                                                            onChange={(e) => setFormData({ ...formData, info_text_1: e.target.value })}
                                                                        />
                                                                    </div>

                                                                    <div className="mb-3 col-6">
                                                                        <label className="form-label">Info Text 2</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="info_text_2"
                                                                            type="text"
                                                                            value={formData.info_text_2}
                                                                            onChange={(e) => setFormData({ ...formData, info_text_2: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}


                                                            {!displayPreview &&  (
                                                                <>
                                                                    <div className="mb-3 col-md-6">
                                                                        <label className="form-label">Footer Text</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="footer_text"
                                                                            type="text"
                                                                            value={formData.footer_text}
                                                                            onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                                                                        />
                                                                    </div>

                                                                    <div className="mb-3 col-md-6">
                                                                        <label className="form-label">Footer Description</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="footer_description"
                                                                            type="text"
                                                                            value={formData.footer_description}
                                                                            onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
                                                                        />
                                                                    </div>

                                                                    <div className="mb-3 col-md-6">
                                                                        <label className="form-label">Select Invoice Theme</label>
                                                                        <div className="d-flex align-items-center gap-15">
                                                                            <button 
                                                                                ref={selectThemeRef}
                                                                                type="button" 
                                                                                className="btn btn-sm b-r-22 btn-primary" 
                                                                                onClick={() => selectTheme()}
                                                                            >Select Theme</button>

                                                                            <span className="templateName">
                                                                                {selectedTheme ? (
                                                                                    <>
                                                                                    <CheckCircle size={12} width={14} className="icon-check text-success me-1" />
                                                                                    {selectedTheme.name}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                    <i className="ti ti-circle-x text-danger me-1"></i>
                                                                                    No theme selected
                                                                                    </>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="mb-3 col-md-6">
                                                                        <a 
                                                                            href="#"
                                                                            onClick={invoiceTemplatePreview}
                                                                            className="btn btn-primary b-r-22"
                                                                        >{previewLoading ? 'Generating Preview...' : 'Preview Invoice'}</a>
                                                                    </div>

                                                                    <hr />
                                                                </>
                                                            )}

                                                            <div className="mb-3 col-6">
                                                                <label className="form-label">CSV Import</label>
                                                                <input 
                                                                    type="file" 
                                                                    name="csvfile" 
                                                                    className="form-control" 
                                                                    onChange={(e) => {
                                                                        setFormData(prev => ({
                                                                        ...prev,
                                                                        csvfile: e.target.files[0]
                                                                        }));
                                                                    }} 
                                                                />

                                                                <div className=" d-flex justify-content-between">
                                                                    <label className="selectedFile text-sm text-grey">
                                                                        {formData.csvfile ? (
                                                                            <>
                                                                                <CheckCircle size={12} width={14} className="icon-check text-success me-1" />
                                                                                {formData.csvfile.name} 
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="ti ti-circle-x text-danger me-1"></i> 
                                                                                No file selected
                                                                            </>
                                                                        )}
                                                                    </label>
                                                                    <span className="supporting-label">
                                                                        <a href="#">Download Sample csv</a>
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="col-md-12">
                                                                <div className="mb-3">
                                                                    <h4 className="box-title">Email Template</h4>
                                                                </div>
                                                            </div>

                                                            <div className="mb-3 col-md-12">
                                                                <label className="form-label">Sender Email</label>
                                                                <input
                                                                    className="form-control"
                                                                    name="sender_email"
                                                                    type="text"
                                                                    value={formData.sender_email}
                                                                    onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                                                                />
                                                            </div>

                                                            <div className="mb-3 col-md-12">
                                                                <label className="form-label">Bcc Email (Optional)</label>
                                                                <input
                                                                    className="form-control"
                                                                    name="bcc_email"
                                                                    type="text"
                                                                    value={formData.bcc_email}
                                                                    onChange={(e) => setFormData({ ...formData, bcc_email: e.target.value })}
                                                                />
                                                            </div>

                                                            <div className="mb-3 col-md-12">
                                                                <label className="form-label">Subject</label>
                                                                <input
                                                                    className="form-control"
                                                                    name="subject"
                                                                    type="text"
                                                                    value={formData.subject}
                                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                                />
                                                            </div>

                                                            <div className="mb-3 col-md-8">
                                                                <div className="mb-2 inline-tab-header d-flex align-items-center justify-content-between">
                                                                    <label className="form-label">Email Content</label>
                                                                    <select 
                                                                        name="emailTemplateID" 
                                                                        className="form-select" 
                                                                        value={selectedTemplateId} 
                                                                        onChange={(e) => {
                                                                            const selectedId = e.target.value;
                                                                            setSelectedTemplateId(selectedId);

                                                                            const selected = templates.find(t => t.id.toString() === selectedId);
                                                                            if (selected) {
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    subject: selected.subject || "",
                                                                                    message: selected.message || "",
                                                                                });

                                                                                contentRef.current = selected.message || "";

                                                                                // Update summernote content directly
                                                                                if (summernoteRef.current) {
                                                                                    summernoteRef.current.summernote('code', selected.message || "");
                                                                                }
                                                                            }
                                                                        }}                                                                    
                                                                    >
                                                                    <option value="">Select Email Template</option>     
                                                                    {(templates || []).map((template) => (
                                                                        <option key={template.id} value={template.id}>
                                                                        {template.title}
                                                                        </option>
                                                                    ))}
                                                                    </select>
                                                                </div>

        
                                                                <HtmlEditor
                                                                    message={formData.message}
                                                                    onChange={handleEditorChange}
                                                                    summernoteRef={summernoteRef}
                                                                />
                                                            </div>

                                                            <div className="col-md-4">
                                                                <label className="form-label">Shortcode for template email</label>

                                                                <div className="codeBlock">
                                                                    {shortcodes.map((code) => (
                                                                        <label key={code}>
                                                                        <p>{code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} :</p>
                                                                        <a
                                                                            href="#"
                                                                            className="add-shortcode"
                                                                            onClick={(e) => {
                                                                            e.preventDefault();
                                                                            if (summernoteRef.current) {
                                                                                summernoteRef.current.summernote('insertText', `[${code}]`);
                                                                            }
                                                                            }}
                                                                        >
                                                                            [{code}]
                                                                        </a>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="mb-3 col-md-12">
                                                                <div className="main-switch main-switch-color">
                                                                    <div className="switch-warning swich-size2 my-3">
                                                                        <input type="checkbox" id="check-005" className="toggle" 
                                                                            checked={saveTemplate}
                                                                            onChange={(e) => setSaveTemplate(e.target.checked)}
                                                                        />
                                                                        <label htmlFor="check-005">Save this template for future use</label>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {saveTemplate && (
                                                                <>
                                                                    <div className="col-md-6 mb-3">
                                                                        <label className="form-label">Template Name</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            name="templateName"
                                                                            value={transactionTemplateTitle}
                                                                            onChange={(e) => {
                                                                                setTransactionTemplateTitle(e.target.value )
                                                                                setTemplateNameError('');
                                                                            }}
                                                                        />       
                                                                        
                                                                        {templateFieldError && (
                                                                            <small className="text-danger">{templateFieldError}</small>
                                                                        )}                                                        
                                                                    </div>                                                                    
                                                                </>
                                                            )}

                                                            {/* <div className="mb-3 col-md-12">
                                                                <div className="main-switch main-switch-color">
                                                                    <div className="switch-warning swich-size2 my-3">
                                                                        <input type="checkbox" id="check-005" className="toggle" 
                                                                            checked={scheduleLater}
                                                                            onChange={(e) => setScheduleLater(e.target.checked)}
                                                                        />
                                                                        <label htmlFor="check-005">Schedule for later</label>
                                                                    </div>
                                                                </div>
                                                            </div> */}

                                                            {scheduleLater && (
                                                            <>
                                                                <div className="col-md-6 mb-3">
                                                                    <label className="form-label">Select Date: </label>
                                                                    <input
                                                                        type="date"
                                                                        className="form-control"
                                                                        name="schedule_date"
                                                                        value={formData.schedule_date}
                                                                        onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                                                                    />                                                               
                                                                </div>
                                                                <div className="col-md-6 mb-3">
                                                                    <label className="form-label">Select Time:</label>
                                                                    <input
                                                                        type="time"
                                                                        className="form-control"
                                                                        name="schedule_time"
                                                                        value={formData.schedule_time}
                                                                        onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                                                                    />                                                                
                                                                </div>
                                                            </>
                                                            )}
                                                        </div>

                                                        <div className="d-flex align-items-center gap-30">
                                                            <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                                Process Transaction
                                                            </button>

                                                            {btnLoader && (
                                                                <div className="left d-flex align-items-center">
                                                                    <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                                    <b className="me-1 ms-1">{uploadProgress}%</b> Uploading File
                                                                </div>
                                                            )}
                                                        </div>
                                                        </>
                                                    )}
                                                    </>
                                                )}
                                            </div>
                                        </form>
                                    </>
                                )}

                                {createProviderForm && (
                                    <>
                                        <h2 className="card-title mb-4 d-flex gap-5 align-items-center">
                                            <span>Create Sender Profile</span>
                                            <a href="#" className="btn btn-primary b-r-22"
                                                onClick={ (e) => {
                                                    e.preventDefault();
                                                    returnBackForm();
                                                }

                                                }
                                            >
                                                <FastArrowLeft />
                                                Back
                                            </a>
                                        </h2>

                                        <form method="POST" onSubmit={handleProcessProviderForm}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-12 mb-3">
                                                        <label className="form-label" htmlFor="username">Company Name</label>
                                                        <input
                                                            className="form-control"
                                                            name="name"
                                                            type="text"
                                                            value={providerFormData.provider_name}
                                                            onChange={(e) => setProviderFormData({ ...providerFormData, provider_name: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Email</label>
                                                            <input
                                                                className="form-control"
                                                                name="email"
                                                                type="text"
                                                                value={providerFormData.email}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, email: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Phone</label>
                                                            <input
                                                                className="form-control"
                                                                name="phone"
                                                                type="text"
                                                                value={providerFormData.phone}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, phone: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Logo</label>
                                                            <input className="form-control" name="logo" type="file"
                                                                accept=".jpg,.jpeg,.png,.webp"
                                                                onChange={handleFileChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                    {logoPreview && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={logoPreview}
                                                                alt="Logo Preview"
                                                                style={{ maxHeight: '120px', borderRadius: '6px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Mailing Address 1</label>
                                                            <input
                                                                className="form-control"
                                                                name="mailing_address_1"
                                                                type="text"
                                                                value={providerFormData.mailing_address_1}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, mailing_address_1: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Mailing Address 2</label>
                                                            <input
                                                                className="form-control"
                                                                name="mailing_address_2"
                                                                type="text"
                                                                value={providerFormData.mailing_address_2}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, mailing_address_2: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Billing Address 1</label>
                                                            <input
                                                                className="form-control"
                                                                name="billing_address_1"
                                                                type="text"
                                                                value={providerFormData.billing_address_1}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, billing_address_1: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Billing Address 2</label>
                                                            <input
                                                                className="form-control"
                                                                name="billing_address_2"
                                                                type="text"
                                                                value={providerFormData.billing_address_2}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, billing_address_2: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Payment Url</label>
                                                            <input
                                                                className="form-control"
                                                                name="payment_url"
                                                                type="text"
                                                                value={providerFormData.payment_url}
                                                                onChange={(e) => setProviderFormData({ ...providerFormData, payment_url: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Payment QR Code</label>
                                                            <input className="form-control" name="qr_code" type="file"
                                                                accept=".jpg,.jpeg,.png,.webp"
                                                                onChange={handleFileChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                    {qrCodePreview && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={qrCodePreview}
                                                                alt="QR Code Preview"
                                                                style={{ maxHeight: '120px', borderRadius: '6px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>

                                                <button type="submit" className="btn btn-primary b-r-22">
                                                    Create New
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {reqLoader && (
                                    <div className="full-loader-wrapper" style={{ display: "block" }}>
                                        <div className="loader-sub">
                                            <div className="lds-ellipsis">
                                                <div></div><div></div><div></div><div></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}

export default TransactionalEmails;