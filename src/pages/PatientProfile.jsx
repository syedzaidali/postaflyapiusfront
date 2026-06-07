import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    EyeClosed,
    Search,
    Eye,
    Xmark,
    Trash,
    CheckCircle,
    Calendar,
    User
  } from '../utils/icons';


const PatientProfile = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();
    const {patient_id} = useParams();

    //Initilizing form fields
    const formFields = {
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "patient",
        permissions: {},
    }

    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass]   = useState(false);
    const [burgerActive, setBurgerActive]       = useState(false);
    const [title, setTitle]                     = useState(false);
    const [formData, setFormData] = useState(formFields);
    const [showUserCreateForm, setUserCreateForm] = useState(false);
    const [showUserPasswordForm, setUserPasswordForm] = useState(false);
    const [patientData, setPatientData] = useState([]);
    const [invoiceHistory, setInvoiceHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        invoice_number: '',
        from_date: "",
        to_date: ""
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [messageText, setMessageText] = useState("");

    /*
     * Page Functionalities
     */
    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setTitle("");

        setTimeout(() => {
            setBurgerActive(false);
            setUserCreateForm(false);
            setUserPasswordForm(false);

            setFormData(formFields);  
            setPassword("");
            setConfirmPassword("");

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

    //Initializing create user form button
    const createUserFormDisplay = () => {
        setUserCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    const changePasswqordFormDisplay = () => {
        setUserPasswordForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            if (type === "checkbox") {
                // Handle permissions as a nested object
                const [moduleKey, field] = name.split(".");

                return {
                    ...prev,
                    permissions: {
                        ...prev.permissions,
                        [moduleKey]: {
                            ...prev.permissions[moduleKey],
                            [field]: checked ? 1 : 0,
                        },
                    },
                };
            }

            // Handle text, email, password, select fields
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const generateRandomPassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let randomPassword = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            randomPassword += charset.charAt(Math.floor(Math.random() * n));
        }

        setPassword(randomPassword);
        setConfirmPassword(randomPassword);
    };

    //User password
    const isMatch = confirmPassword === password && password.length > 0;
    
    const checkPasswordRules = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const getPasswordStrength = (password) => {
        const rules = checkPasswordRules(password);

        const passed = Object.values(rules).filter(Boolean).length;

        if (passed <= 2) return "Weak";
        if (passed <= 4) return "Medium";

        return "Strong";
    };

    const PasswordRulesBox = ({ password }) => {
        const rules = checkPasswordRules(password);
        const strength = getPasswordStrength(password);

        const renderRule = (label, valid) => (
            <div style={{ color: valid ? "green" : "red" }}>
            {valid ? <CheckCircle width="14" /> : <Xmark width="14" />} {label}
            </div>
        );

        return (
            <div className="p-4 border rounded mt-2 bg-light-subtle">
            {renderRule("Minimum 8 characters", rules.length)}
            {renderRule("At least one uppercase letter", rules.uppercase)}
            {renderRule("At least one lowercase letter", rules.lowercase)}
            {renderRule("At least one number", rules.number)}
            {renderRule("At least one special character", rules.special)}

            <div className="mt-2 fw-bold">
                Strength:{" "}
                <span
                style={{
                    color:
                    strength === "Weak"
                        ? "red"
                        : strength === "Medium"
                        ? "orange"
                        : "green",
                }}
                >
                {strength}
                </span>
            </div>
            </div>
        );
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

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    /*
     * Api calls 
     */
    //Fetch All transactional batches
    const fetchPatientDetails = async () => {
        setLoading(true);
        try {

            const body = {
                patient_id :patient_id 
            }
            const response = await fetch(`${apiRoutes.getPatientById}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setPatientData(result.data.patient);
                console.log(result.data);

                setFormData(prev => ({
                    ...prev,
                    name: result.data.patient.name
                }));

                setFormData(prev => ({
                    ...prev,
                    email: result.data.patient.email
                }));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPatientDetails();
    }, []);

     //Fetch All transactional batches
    const fetchAllCustomerInvoices = async (page = 1, filters = {}) => {
        setBtnLoader(true);
        setBtnDisabled(true);
        setSelectedTransactions([]);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                patient_id: patient_id, 
                ...(filters.name && { name: filters.name }),
                ...(filters.email && { email: filters.email }),
                ...(filters.invoice_number && { invoice_number: filters.invoice_number })
            });

            const response = await fetch(`${apiRoutes.getCustomerInvoices}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setInvoiceHistory(result.data.data);
                setTotalPages(result.data.last_page || 1);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };
    
    useEffect(() => {
        fetchAllCustomerInvoices(currentPage, appliedFilters);
    }, [currentPage, appliedFilters]);

    const handleSearch = () => {
        setBtnDisabled(true);
        setBtnLoader(true);

        fetchAllCustomerInvoices(1, filters).finally(() => {
            setBtnDisabled(false);
            setBtnLoader(false);
        });
    };

    /*
     * Initialize and process user form
     */      
    const processCreateUser = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const url = apiRoutes.createUser;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const updatedFormData = {
            ...formData,
            password,
            confirmPassword,
            verify: true
        };
       
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(updatedFormData),
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccessMessage(true);
                setMessageText(result.message);

                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setMessageText("");
                }, 8000);

                setFormData(formFields);
                fetchPatientDetails();

                closeMenu();
            } else {          
                if (result.errors) {
                    setErrors(result.errors); 
                }
                    
                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            etDisplayMessageError(true);
            setMessageText(result.message || "Password update failed.");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const url = apiRoutes.updatePatientPassword;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            password: password,
            password_confirmation: confirmPassword,
            user_id: patientData.registered_user_id
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                if(result.success == false) {
                    if (result.errors) {
                        setErrors(result.errors); 
                    }
                        
                    setDisplayMessageError(true);
                    setMessageText(result.message || "Password update failed.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    setShowSuccessMessage(true);
                    setMessageText(result.message);

                    setTimeout(() => {
                        setShowSuccessMessage(false);
                        setMessageText("");
                    }, 8000);

                    setPassword("");
                    setConfirmPassword("");

                    closeMenu();
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setShowSuccessMessage(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again later!");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Patient Profile</h4>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">  
                    <div className="card-body">
                        {showSuccessMessage && (
                            <div className="badge text-light-success mb-3 mt-2 pt-3 pb-3 pa-s-20 pa-e-20" role="alert">
                                <CheckCircle size='20' /> {messageText}
                            </div>
                        )}

                        <div className="profile-container">
                            <div className="person-details text-left">
                                <div className="d-flex align-items-start justify-content-between">
                                    <div>
                                        <h5 className="f-w-600">{patientData.name} &nbsp;
                                            <img alt="instagram-check-mark" className="w-20 h-20" src="/images/profile-app/01.png" />
                                        </h5>

                                        <p>{patientData.email}</p>

                                        {/* Address and Phone */}
                                        <div className="mb-3 mt-2">
                                            <div className="text-muted f-s-13">
                                                <i className="ti ti-map-pin text-primary me-1"></i>
                                                {patientData.address_1 || "N/A"}{patientData.address_2 ? `, ${patientData.address_2}` : ""}
                                            </div>
                                            <div className="text-muted f-s-13 mt-1">
                                                <i className="ti ti-calendar text-primary me-1"></i>
                                                <strong>Date Of Birth : </strong>
                                                {patientData.date_of_birth
                                                ? new Date(patientData.date_of_birth).toLocaleDateString('en-US', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                    })
                                                : "N/A"}
                                            </div>
                                            <div className="text-muted f-s-13 mt-1">
                                                <i className="ti ti-phone-call text-primary me-1"></i>
                                                {patientData.phone || "N/A"}
                                            </div>
                                        </div>

                                        {/* Account Info */}
                                        {loading ? (
                                            <div className="left d-flex align-items-center">
                                                <span
                                                    aria-hidden="true"
                                                    className="spinner-border spinner-border-sm me-2 ms-2"
                                                    role="status"
                                                ></span>
                                                Loading
                                            </div>
                                        ) : patientData.is_member ? (
                                            <>
                                                <span className="badge bg-success">Registered Patient</span>
                                                <div className="mt-3">
                                                    <div class="about-list mb-3">
                                                        <div>
                                                            <span class="fw-medium"><i class="ti ti-user"></i> Username</span>
                                                            <span class="float-end f-s-13 text-secondary">{patientData.username || 'N/A'}</span>
                                                        </div>

                                                        <div>
                                                            <span class="fw-medium"><i class="ti ti-clock"></i> Last Login</span>
                                                            <span class="float-end f-s-13 text-secondary">
                                                                {patientData.last_login
                                                                    ? new Date(patientData.last_login).toLocaleString()
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>

                                                        <div className="d-flex gap-3 justify-content-between">
                                                            <span class="fw-medium"><i class="ti ti-calendar"></i> Registered On</span>
                                                            <span class="float-end f-s-13 text-secondary">
                                                                {patientData.user_created_at
                                                                    ? new Date(patientData.user_created_at).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                    
                                                    <button onClick={() => changePasswqordFormDisplay()} className="btn btn-outline-primary rounded f-s-12 btn-sm">
                                                        Change Password
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="badge bg-secondary f-s-10">Non Registered Patient</span>
                                                <div className="mt-2">
                                                    <button onClick={() => createUserFormDisplay()} className="btn btn-primary btn-sm rounded f-s-12">
                                                        Create Account
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="details text-left m-0">
                                        <div>
                                            <h4 className="text-primary">{patientData.total_invoices}</h4>
                                            <p className="text-secondary">Total Invoices</p>
                                        </div>
                                        <div>
                                            <h4 className="text-primary">{new Date(patientData.last_transaction_date).toLocaleDateString()}</h4>
                                            <p className="text-secondary">Last Activity</p>
                                        </div>
                                        <div>
                                            <h4 className="text-primary">{patientData.mrn}</h4>
                                            <p className="text-secondary">MRN</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                    
            <div className="col-md-12">
                <div className="card">  
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Invoice History</h5>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        <div className="app-form app-icon-form row g-3">
                                <div className="col-md-2 position-relative">
                                    <input
                                        className="form-control"
                                        placeholder="Invoice Number"
                                        type="text"
                                        value={filters.invoice_number}
                                        onChange={(e) => handleFilterChange("invoice_number", e.target.value)}
                                    />
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
                                            <th scope="col">Invoice ID</th>
                                            <th scope="col">Provider</th>
                                            <th scope="col">Service Date</th>
                                            <th scope="col">Generated At</th>
                                            <th scope="col">Invoice Total</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="9" className="text-center">Loading...</td>
                                            </tr>
                                        ) : invoiceHistory.length > 0 ? (
                                            invoiceHistory.map((invoice, index) => {
                                                return (
                                                    <tr key={invoice.cs_invoiceId}>
                                                        <td>{invoice.invoice_id}</td>                                                    
                                                        <td>
                                                            <span className="badge text-light-primary">
                                                                {invoice.provider_name}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(invoice.service_date).toLocaleDateString('en-GB')}</td>
                                                        <td>{new Date(invoice.created_at).toLocaleDateString('en-GB')}</td>
                                                        <td>{invoice.sub_total}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                fetch(`https://api.postafly.com/api/v1/invoice/preview/${invoice.cs_invoiceId}`)
                                                                    .then(res => res.blob())
                                                                    .then(blob => {
                                                                        const url = window.URL.createObjectURL(blob);
                                                                        const link = document.createElement('a');
                                                                        link.href = url;
                                                                        link.download = "invoice-"+ invoice.cs_invoiceId +".pdf"; 
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        link.remove();
                                                                        window.URL.revokeObjectURL(url);
                                                                    });
                                                                }}
                                                                className="btn btn-primary btn-sm b-r-22 mg-s-5 f-s-12"
                                                            >
                                                                Download Invoice
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center">No invoices found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
    
                                {selectedTransactions.length > 0 && (
                                    <button type="button" className="btn btn-pinterest" onClick={deleteSelectedTransaction}>
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

                        <div className="col-wrapper-full">
                            <div className="col-md-12 full-loader">
                                {showUserPasswordForm && (
                                    <>
                                        <h2 className="card-title mb-4">Change User Password</h2>

                                        <form method="POST" onSubmit={handlePasswordUpdate}>
                                            <div className="app-form">
                                                <div className='row'>
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">New Password</label>
                                                            <div className="d-flex gap-2">
                                                                <div className="w-100">
                                                                    <div className="input-icon-btn">
                                                                        <input
                                                                            type={passwordVisible ? "text" : "password"}
                                                                            name="password"
                                                                            className="form-control"
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            onFocus={() => setIsPasswordFocused(true)}
                                                                            onBlur={() => setIsPasswordFocused(false)}
                                                                            required
                                                                        />
                                                                        <a 
                                                                            href="#" 
                                                                            onClick={(e) => {e.preventDefault(); setPasswordVisible(!passwordVisible)}} 
                                                                            className={`icon-btn ${passwordVisible ? "text-primary" : "text-light"}`}
                                                                        >
                                                                            {passwordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary rounded f-s-12"
                                                                    onClick={generateRandomPassword}
                                                                >
                                                                    Generate
                                                                </button>
                                                            </div>                                                                

                                                            {errors.password && (
                                                                <small className="text-danger">{errors.password[0]}</small>
                                                            )}

                                                            {isPasswordFocused && password && <PasswordRulesBox password={password} />}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Confirm Password</label>
                                                            <div className="input-icon-btn">
                                                                <input
                                                                    className="form-control"
                                                                    name="title"
                                                                    type={confirmPasswordVisible ? "text" : "password"}
                                                                    value={confirmPassword}
                                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                                />

                                                                <a 
                                                                    href="#" 
                                                                    onClick={(e) => {e.preventDefault(); setConfirmPasswordVisible(!confirmPasswordVisible)}} 
                                                                    className={`icon-btn ${confirmPasswordVisible ? "text-primary" : "text-light"}`}
                                                                >
                                                                    {confirmPasswordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                                </a>
                                                            </div>

                                                            {errors.password_confirmation && (
                                                                <small className="text-danger">{errors.password_confirmation[0]}</small>
                                                            )}

                                                            {!isMatch && confirmPassword && !errors.password_confirmation && (
                                                                <small className="text-danger">Passwords do not match.</small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-30">
                                                    <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                        Update Password
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

                                {showUserCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">Create User Account</h2>
                                        
                                        <form method="POST" onSubmit={processCreateUser}>
                                            <div className="app-form">
                                                {displayMessageError && (
                                                    <div className="badge text-light-danger mb-3 mt-2 pt-3 pb-3 pa-s-20 pa-e-20" role="alert">
                                                        <i className="ti ti-circle-x text-danger f-s-16 me-1"></i> {messageText}
                                                    </div>
                                                )}
                                                
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Fullname</label>
                                                            <input
                                                                className="form-control"
                                                                name="name"
                                                                type="text"
                                                                value={formData.name}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6"></div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Username</label>
                                                            <input
                                                                className="form-control"
                                                                name="username"
                                                                type="text"
                                                                value={formData.username}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Email</label>
                                                            <input
                                                                className="form-control"
                                                                name="email"
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 col-md-6">
                                                        <label className="form-label">Password</label>
                                                        <div className="d-flex gap-2">
                                                            <div className="w-100">
                                                                <div className="input-icon-btn">
                                                                    <input
                                                                        type={passwordVisible ? "text" : "password"}
                                                                        name="password"
                                                                        className="form-control"
                                                                        value={password}
                                                                        onChange={(e) => setPassword(e.target.value)}
                                                                        onFocus={() => setIsPasswordFocused(true)}
                                                                        onBlur={() => setIsPasswordFocused(false)}
                                                                        required
                                                                    />
                                                                    <a 
                                                                        href="#" 
                                                                        onClick={(e) => {e.preventDefault(); setPasswordVisible(!passwordVisible)}} 
                                                                        className={`icon-btn ${passwordVisible ? "text-primary" : "text-light"}`}
                                                                    >
                                                                        {passwordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary rounded f-s-12"
                                                                onClick={generateRandomPassword}
                                                            >
                                                                Generate
                                                            </button>
                                                        </div>

                                                        {errors.current_password && (
                                                            <small className="text-danger">{errors.current_password[0]}</small>
                                                        )}

                                                        {isPasswordFocused && password && <PasswordRulesBox password={password} />}
                                                    </div>

                                                    <div className="mb-3 col-md-6">
                                                        <label className="form-label">Confirm Password</label>
                                                        <div className="input-icon-btn">
                                                            <input
                                                                className="form-control"
                                                                name="title"
                                                                type={confirmPasswordVisible ? "text" : "password"}
                                                                value={confirmPassword}
                                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                            />

                                                            <a 
                                                                href="#" 
                                                                onClick={(e) => {e.preventDefault(); setConfirmPasswordVisible(!confirmPasswordVisible)}} 
                                                                className={`icon-btn ${confirmPasswordVisible ? "text-primary" : "text-light"}`}
                                                            >
                                                                {confirmPasswordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                            </a>
                                                        </div>

                                                        {errors.password_confirmation && (
                                                            <small className="text-danger">{errors.password_confirmation[0]}</small>
                                                        )}

                                                        {!isMatch && confirmPassword && !errors.password_confirmation && (
                                                            <small className="text-danger">Passwords do not match.</small>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-30">
                                                    <button type="submit" className="btn btn-primary b-r-22 f-s-12" disabled={btnDisabled}>
                                                        Create User
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

export default PatientProfile;