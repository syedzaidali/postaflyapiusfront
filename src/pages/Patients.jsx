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

const Patients = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    const formFields = {
        name: "",
        username: "",
        email: "",
        date_of_birth: "",
        mrn: "",
        address_1: "",
        address_2: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "patient",
        permissions: {},
    }

    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass]   = useState(false);
    const [burgerActive, setBurgerActive]       = useState(false);
    const [title, setTitle]                     = useState(false);
    const [showUserCreateForm, setUserCreateForm] = useState(false);
    const [formData, setFormData] = useState(formFields);
    const [patients, setPatients] = useState([]);
    const [createPatient, setCreatePatient] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [filters, setFilters] = useState({
        mrn: '',
        name: '',
        email: '',
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
    const createUserFormDisplay = (name, email, mrn) => {
        setUserCreateForm(true);
        setBurgerActive(true);

        setFormData(prev => ({
            ...prev,
            name: name || "",
            email: email || "",
            mrn: mrn || ""
        }));
        setCreatePatient(1);
        document.body.classList.add("fixed-body");
    };

    const createPatientFormDisplay = () => {
        setUserCreateForm(true);
        setBurgerActive(true);
        
        setCreatePatient(2);

        document.body.classList.add("fixed-body");
    }
    
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
    const fetchAllPatients = async (page = 1, filters = {}) => {
        setBtnLoader(true);
        setBtnDisabled(true);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                ...(filters.name && { name: filters.name }),
                ...(filters.email && { email: filters.email }),
            });

            const response = await fetch(`${apiRoutes.getAllPatients}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setPatients(result.data.data);
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
        fetchAllPatients(currentPage, appliedFilters);
    }, [currentPage, appliedFilters]);

    const handleSearch = () => {
        setBtnDisabled(true);
        setBtnLoader(true);

        fetchAllPatients(1, filters).finally(() => {
            setBtnDisabled(false);
            setBtnLoader(false);
        });
    };

    const processCreateUser = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const url = apiRoutes.createPatient;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
       
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccessMessage(true);
                setMessageText(result.message);

                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setMessageText("");
                }, 8000);

                fetchAllPatients(currentPage, appliedFilters);

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

    const pluralize = (count, singular, plural = null) => {
        return `${count} ${count === 1 ? singular : (plural || singular + 's')}`;
    };

    const deletePatient = async (patientId) => {
        const url = apiRoutes.deletePatient;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
       
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    patientId: patientId
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccessMessage(true);
                setMessageText(result.message);

                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setMessageText("");
                }, 8000);

                fetchAllPatients(currentPage, appliedFilters);
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
            setDisplayMessageError(true);
            setMessageText(result.message || "Password update failed.");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } 
    }

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Patients Management</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={createPatientFormDisplay} className="btn btn-primary b-r-22">
                            <UserPlus /> Create Patient
                        </button>
                    </div>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Patients</h5>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="app-form app-icon-form row g-3">
                            <div className="col-md-2 position-relative">
                                <input
                                    className="form-control"
                                    placeholder="MRN Number"
                                    type="text"
                                    value={filters.mrn}
                                    onChange={(e) => handleFilterChange("mrn", e.target.value)}
                                />
                            </div>
                            <div className="col-md-2 position-relative">
                                <input
                                    className="form-control"
                                    placeholder="Patient Name"
                                    type="text"
                                    value={filters.name}
                                    onChange={(e) => handleFilterChange("name", e.target.value)}
                                />
                            </div>
                            <div className="col-md-3 position-relative">
                                <input
                                    className="form-control"
                                    placeholder="Patient Email"
                                    type="text"
                                    value={filters.email}
                                    onChange={(e) => handleFilterChange("email", e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.from_date}
                                    onChange={(e) => handleFilterChange("from_date", e.target.value)}
                                />
                                <small>Date From</small>
                            </div>
                            <div className="col-md-2">
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.to_date}
                                    onChange={(e) => handleFilterChange("to_date", e.target.value)}
                                />
                                <small>Date To</small>
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
                                        <th>#</th>
                                        <th>MRN</th>
                                        <th>Patient</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Total Invoices</th>
                                        <th>Last Activity</th>
                                        <th>Account Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Loading patients...
                                            </td>
                                        </tr>
                                    ) : patients.length > 0 ? (
                                        patients.map((patient, index) => (
                                            <tr key={patient.mrn}>
                                                <td>{index + 1}</td>
                                                <td>{patient.mrn}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div>
                                                            {patient.name}<br />
                                                            <small className="text-muted">{patient.address_1}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{patient.email}</td>
                                                <td>{patient.phone || '-'}</td>
                                                <td>
                                                    <a href={`/patients/invoices/${patient.id}`}>
                                                        <span className="badge bg-primary">
                                                            {pluralize(patient.total_invoices, 'invoice')}
                                                        </span>
                                                    </a>
                                                </td>
                                                <td>
                                                    {!patient.last_transaction_date ? (
                                                        "No activity"
                                                    ) : (
                                                        new Date(patient.last_transaction_date).toLocaleDateString()
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                    <span className={`badge ${patient.registered_user_id ? 'bg-warning' : 'bg-secondary'}`}>
                                                        {patient.registered_user_id ? 'Registered' : 'Guest'}
                                                    </span> &nbsp;
                                                    {!patient.registered_user_id &&
                                                        <a 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                createUserFormDisplay(patient.name, patient.email, patient.mrn);
                                                            }}
                                                            className="btn btn-sm f-s-10 btn-light-warning rounded">Register</a>
                                                    }
                                                    </div>
                                                </td>
                                                <td>
                                                    <a
                                                        href={`/patients/profile/${patient.id}`}
                                                        className="btn btn-light-success icon-btn b-r-4 ms-2"
                                                        title="View Profile"
                                                    >
                                                        <i className="ti ti-user-search"></i>
                                                    </a>

                                                    <a
                                                        href={`/patients/invoices/${patient.id}`}
                                                        className="btn btn-light-primary  icon-btn b-r-4 ms-2"
                                                        title="View Invoices"
                                                    >
                                                        <i className="ti ti-receipt"></i>
                                                    </a>

                                                    <button 
                                                        type="button" 
                                                        onClick={() => deletePatient(patient.id)} 
                                                        className="btn btn-light-danger btn-sm icon-btn b-r-4 ms-2"
                                                    >
                                                        <Trash size={12} width={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No patients found.</td>
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
                                {showUserCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">Create Patient Account</h2>
                                        
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

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="date_of_birth">Date Of Birth</label>
                                                            <input
                                                                className="form-control"
                                                                name="date_of_birth"
                                                                type="date"
                                                                value={formData.date_of_birth}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>


                                                    {/* Patient Details */}
                                                    {createPatient == 2 ? (
                                                        <>
                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label" htmlFor="mrn">MRN#</label>
                                                                    <input
                                                                        className="form-control"
                                                                        name="mrn"
                                                                        type="text"
                                                                        value={formData.mrn}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label" htmlFor="address_1">Address Line 1</label>
                                                                    <input
                                                                        className="form-control"
                                                                        name="address_1"
                                                                        type="text"
                                                                        value={formData.address_1}
                                                                        onChange={handleChange}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label" htmlFor="address_2">Address Line 2</label>
                                                                    <input
                                                                        className="form-control"
                                                                        name="address_2"
                                                                        type="text"
                                                                        value={formData.address_2}
                                                                        onChange={handleChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="col-md-12"></div>
                                                    )}
                                                    

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

                                                                {errors.current_password && (
                                                                    <small className="text-danger">{errors.current_password[0]}</small>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary rounded f-s-12"
                                                                onClick={generateRandomPassword}
                                                            >
                                                                Generate
                                                            </button>
                                                        </div>
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

export default Patients;