import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import usePagination from '../../hooks/usePagination';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import { unwrapLastPage, unwrapPagedRows, authGetHeaders } from '../../utils/listResponse';
import {
    UserPlus,
    Search,
    Edit,
    Lock,
    Trash,
    CheckCircle,
    Xmark,
    Eye,
    EyeClosed,
  } from '../../utils/icons';

const Users = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const [userID, setUserID]     = useState("");
    const [name, setName]                       = useState("");
    const [username, setUsername]               = useState("");
    const [email, setEmail]                     = useState("");
    const [accountType, setAccountType]         = useState("");
    const [invoiceOption, setInvoiceOption]     = useState("");
    const [password, setPassword]               = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    
    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive]     = useState(false);
    const [usersList, setListAllUsers] = useState([]);    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [usersDeletedList, setListAllDeletedUsers] = useState([]);    
    const [searchQueryDeleted, setSearchQueryDeleted] = useState('');
    const [currentPageDeleted, setCurrentPageDeleted] = useState(1);
    const [perPageDeleted, setPerPageDeleted] = useState(15);
    const [totalPagesDeleted, setTotalPagesDeleted] = useState(1);
    const [displayDeletedUsers, setDisplayDeletedUsers] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [rowLoader, setRowLoader] = useState({});
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [showUserCreateForm, setUserCreateForm] = useState(false);
    const [editUserForm, setEditUserForm] = useState(false);
    const [permissionsData, setPermissionsData] = useState({});
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showEditForm, setshowEditForm] = useState(false);
    
    //Defining sucess and error mesages const stats
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
    const createUserFormDisplay = () => {
        setName("");
        setUsername("");
        setEmail("");
        setAccountType("");
        setInvoiceOption("");
        setPassword("");
        setPasswordConfirm("");
        setUserID("");
        setEditUserForm(false);
        setUserCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    const [isPasswordFocused, setIsPasswordFocused]           = useState(false);
    const [passwordVisible, setPasswordVisible]               = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
        
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

    const isFormValid = () => {
        const rules = checkPasswordRules(password);
        const passwordValid = Object.values(rules).every(Boolean);
        const passwordsMatch = password === passwordConfirm;

        return (
            name.trim() !== "" &&
            username.trim() !== "" &&
            email.trim() !== "" &&
            accountType !== "" &&
            password !== "" &&
            passwordConfirm !== "" &&
            passwordValid &&
            passwordsMatch &&
            (accountType !== "transaction_email" || invoiceOption !== "")
        );
    };

    /*
     * Pagination slicing code
     */

    const paginationItems = usePagination({
        currentPage: displayDeletedUsers ? currentPageDeleted : currentPage,
        totalPages: displayDeletedUsers ? totalPagesDeleted : totalPages,
        setCurrentPage: displayDeletedUsers ? setCurrentPageDeleted : setCurrentPage,
        maxVisiblePages: 10,
    });

    /*
     * Api calls 
     */
    //Fetch All Users
    const fetchUsers = async (page = 1, search = '') => {
        setLoading(true);
        setSelectedUsers([]);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                _ts: Date.now(),
                ...(search && { search })
            });

            const response = await fetch(`${apiRoutes.getAllTenantUsers}?${queryParams}`, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();

            if (response.ok) {
                setListAllUsers(unwrapPagedRows(result));
                setTotalPages(unwrapLastPage(result));
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
        fetchUsers(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const fetchDeletedUsers = async (page = 1, search = '') => {
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

            const response = await fetch(`${apiRoutes.getAllTenantDeletedUsers}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();
            console.log(JSON.stringify(result));
            if (response.ok) {
                setListAllDeletedUsers(result.data); 
                setTotalPagesDeleted(result.pagination?.last_page || 1);
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", JSON.stringify(error));
        } 
    }

    useEffect(() => {
        fetchDeletedUsers(currentPageDeleted, searchQueryDeleted);
    }, [currentPageDeleted, searchQueryDeleted]);

    /*
     * Initialize and process user form
     */      
    const processCreateUser = async (e) => {
        e.preventDefault();
        setReqLoader(true);

        const url = apiRoutes.createTenantUser;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
        
        const body = {
            name,
            username,
            email,
            account_type: accountType,
            invoice_option: accountType === "transaction_email" ? invoiceOption : null,
            ...(userID ? { userID } : {}),
            ...(!userID || password ? {
                password,
                password_confirmation: passwordConfirm,
                confirmPassword: passwordConfirm,
            } : {}),
        };
        
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (response.ok) {
                setDisplayMessageSuccess(true);
                setDisplayMessageError(false);
                setMessageText(result.message || (userID ? "User updated successfully!" : "User created successfully!"));

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText(""); 
                }, 8000);

                setCurrentPage(1);
                await fetchUsers(1);
                closeMenu();
            } else {          
                const validationMessage = result.errors
                    ? Object.values(result.errors).flat().join(' ')
                    : (result.message || "Unable to save user.");

                setDisplayMessageError(true);
                setDisplayMessageSuccess(false);
                setMessageText(validationMessage);

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText(""); 
                }, 8000);
            }
        } catch (error) {
            setMessageText("An unexpected error occurred. Please try again.");

            setTimeout(() => {
                setMessageText(""); 
            }, 8000);
        } finally {
            setReqLoader(false);
        }
    };

    /*
     * Edit user form & process user update 
     */
    const handleUserEditForm = (user) => {
        setName(user.name || "");
        setUsername(user.username || "");
        setEmail(user.email || "");
        setAccountType(user.account_type || "");
        setInvoiceOption(user.invoice_management || "");
        setPassword("");
        setPasswordConfirm("");
        setUserID(user.id);
        setEditUserForm(true);
        setUserCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    /*
     * User delete function 
     */
    const handleDeleteAccount = async (user_id) => {
        setRowLoader(prev => ({ ...prev, [`${user_id}_delete`]: true }));

        const url = apiRoutes.deleteTenantUser;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            user_id : user_id,
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
                    setDisplayMessageError(true);
                    setMessageText(result.message || "Password update failed.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    setDisplayMessageSuccess(true);
                    setMessageText(result.message || "User deleted successfully.");

                    setTimeout(() => {
                        setDisplayMessageSuccess(false);
                        setMessageText("");
                    }, 8000);

                    setDisplayDeletedUsers(false);
                    fetchDeletedUsers(currentPage);
                    fetchUsers(currentPage);
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
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
            setRowLoader(prev => ({ ...prev, [`${user_id}_delete`]: false }));
        }
    }

    const activeList = displayDeletedUsers ? usersDeletedList : usersList;

    const handleRestoreUser = async (user_id) => {
        setRowLoader(prev => ({ ...prev, [`${user_id}_restore`]: true }));

        const url = apiRoutes.restoreTenantUser;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            user_id : user_id,
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
                    setDisplayMessageError(true);
                    setMessageText(result.message || "failed to restore user.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    setDisplayMessageSuccess(true);
                    setMessageText(result.message || "User restored successfully.");

                    setTimeout(() => {
                        setDisplayMessageSuccess(false);
                        setMessageText("");
                    }, 8000);

                    setDisplayDeletedUsers(false);
                    fetchUsers(currentPage);
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
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
            setRowLoader(prev => ({ ...prev, [`${user_id}_restore`]: false }));
        }
    }

    const handleUserDeletePermanently = async (user_id) => {
        setRowLoader(prev => ({ ...prev, [`${user_id}_delete`]: true }));

        const url = apiRoutes.deleteTenantPermanently;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            user_id : user_id,
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
                    setDisplayMessageError(true);
                    setMessageText(result.message || "failed to restore user.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    setDisplayMessageSuccess(true);
                    setMessageText(result.message || "User deleted successfully.");

                    setTimeout(() => {
                        setDisplayMessageSuccess(false);
                        setMessageText("");
                    }, 8000);

                    setDisplayDeletedUsers(false);
                    fetchUsers(currentPage);
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
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
            setRowLoader(prev => ({ ...prev, [`${user_id}_restore`]: false }));
        }
    }

    return <div>
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Users Management</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={() => createUserFormDisplay()} className="btn btn-primary b-r-22">
                            <UserPlus /> Create Account
                        </button>

                        {usersDeletedList.length > 0 && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setDisplayDeletedUsers(!displayDeletedUsers);

                                    if (!displayDeletedUsers) {
                                        fetchDeletedUsers(currentPageDeleted, searchQueryDeleted);
                                    } else {
                                        fetchUsers(currentPage, searchQuery);
                                    }
                                }}
                                className="btn btn-primary b-r-22">
                                {displayDeletedUsers ? (
                                    "Return Back to Users"
                                ) : (
                                    <>
                                        <Trash /> View Deleted Users
                                    </>
                                )}
                            </button>                          
                        )}
                    </div>
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

                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">Name</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Account Type</th>
                                        <th scope="col">Date Created</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">Loading...</td>
                                    </tr>
                                ) : activeList.length > 0 ? (
                                    activeList.map((user) => (
                                        <tr key={user.id}>
                                            <td className="f-w-500">
                                                <div className="sm-data">
                                                    <span>{user.name}</span>
                                                    <span><strong>Username : </strong>@{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="f-w-500">{user.email}</td>
                                            <td>
                                                {user.account_type === 'transaction_email'
                                                    ? 'Transaction Email'
                                                    : 'Email Marketing'}
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {displayDeletedUsers ? (
                                                    <span className="badge text-light-danger">Deleted</span>
                                                ) : (
                                                    <span
                                                        className={`badge ${
                                                            user.status === 'active'
                                                                ? 'text-light-success'
                                                                : user.status === 'pending'
                                                                ? 'text-light-warning'
                                                                : 'text-light-danger'
                                                        }`}
                                                    >
                                                        {user.status === 'active'
                                                            ? 'Active'
                                                            : user.status === 'pending'
                                                            ? 'Pending'
                                                            : 'Offline'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {!displayDeletedUsers ? (
                                                    <>
                                                        <a href={`${ADMIN_ROUTE_PREFIX}/user/view/` + user.id} className="btn btn-light-primary icon-btn b-r-4">
                                                            <Eye size={12} width={16}  />
                                                        </a>
                                                        <button type="button" onClick={() => handleUserEditForm(user)} className="btn btn-light-success icon-btn b-r-4 mg-s-5">
                                                            <Edit size={12} width={16} className="text-success" />
                                                        </button>
                                                        <button type="button" onClick={() => handleDeleteAccount(user.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                            {rowLoader[`${user.id}_delete`] ? (
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            ) : (
                                                                <>
                                                                    <Trash size={12} width={16} />
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleRestoreUser(user.id)} className="btn btn-light-warning b-r-4 mg-s-5">
                                                            {rowLoader[`${user.id}_restore`] ? (
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            ) : (
                                                               <> ♻ Restore User</>
                                                            )}
                                                        </button>

                                                        <button type="button" onClick={() => handleUserDeletePermanently(user.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                            {rowLoader[`${user.id}_delete`] ? (
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            ) : (
                                                                <>
                                                                    <Trash size={12} width={16} />
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center">No users found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

                            {selectedUsers.length > 0 && (
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
                                    <li className={`page-item ${(displayDeletedUsers ? currentPageDeleted : currentPage) === 1 ? 'disabled' : ''}`}>
                                        <a className="page-link" href="#" aria-label="Previous"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const current = displayDeletedUsers ? currentPageDeleted : currentPage;
                                                const setter = displayDeletedUsers ? setCurrentPageDeleted : setCurrentPage;
                                                if (current > 1) setter(current - 1);
                                            }}>
                                            <span aria-hidden="true">«</span>
                                        </a>
                                    </li>

                                    {paginationItems}

                                    <li className={`page-item ${(displayDeletedUsers ? currentPageDeleted : currentPage) === (displayDeletedUsers ? totalPagesDeleted : totalPages) ? 'disabled' : ''}`}>
                                        <a className="page-link" href="#" aria-label="Next"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const current = displayDeletedUsers ? currentPageDeleted : currentPage;
                                                const total = displayDeletedUsers ? totalPagesDeleted : totalPages;
                                                const setter = displayDeletedUsers ? setCurrentPageDeleted : setCurrentPage;
                                                if (current < total) setter(current + 1);
                                            }}>
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
                                        <h2 className="card-title mb-4">{editUserForm ? 'Edit' : 'Create'} Account</h2>
                                        
                                        <form method="POST" onSubmit={processCreateUser}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Fullname</label>
                                                            <input
                                                                className="form-control"
                                                                name="name"
                                                                type="text"
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
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
                                                                name="Username"
                                                                type="text"
                                                                value={username}
                                                                onChange={(e) => setUsername(e.target.value)}
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
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <>
                                                            <div className="mb-3 col-md-6">
                                                                <div className="mb-3 text-left">
                                                                    <i className="iconoir-eye"></i>
                                                                    <label className="mb-1">{editUserForm ? 'New password (optional)' : 'Password'}</label>
                                                                    <div className="input-icon-btn">
                                                                        <input 
                                                                            type={passwordVisible ? "text" : "password"}
                                                                            className="form-control"
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            onFocus={() => setIsPasswordFocused(true)}
                                                                            onBlur={() => setIsPasswordFocused(false)}
                                                                            required={!editUserForm}
                                                                            placeholder={editUserForm ? "Leave blank to keep current password" : "Enter Password"}
                                                                        />
                                                                        <a 
                                                                            href="#" 
                                                                            onClick={(e) => {e.preventDefault(); setPasswordVisible(!passwordVisible)}} 
                                                                            className={`icon-btn ${passwordVisible ? "text-primary" : "text-light"}`}
                                                                        >
                                                                            {passwordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                                        </a>
                                                                    </div>
                                                                    {isPasswordFocused && password && <PasswordRulesBox password={password} />}
                                                                </div>
                                                            </div>

                                                            <div className="mb-3 col-md-6">
                                                                <label className="mb-1">Confirm Password</label>
                                                                <div className="input-icon-btn">
                                                                    <input 
                                                                        type={confirmPasswordVisible ? "text" : "password"}
                                                                        className="form-control"
                                                                        value={passwordConfirm}
                                                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                                                        required={!editUserForm}
                                                                        placeholder="Confirm Password"
                                                                    />
                                                                    <a 
                                                                        href="#"  
                                                                        onClick={(e) => {e.preventDefault(); setConfirmPasswordVisible(!confirmPasswordVisible)}} 
                                                                        className={`icon-btn ${confirmPasswordVisible ? "text-primary" : "text-light"}`}
                                                                    >
                                                                        {confirmPasswordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                                    </a>
                                                                </div>
                        
                                                                {passwordConfirm && (
                                                                    <div
                                                                        className="mt-1"
                                                                        style={{ color: password === passwordConfirm ? "green" : "red" }}
                                                                    >
                                                                        {password === passwordConfirm ? (
                                                                        <span style={{ color: "green" }}>
                                                                            <CheckCircle width="14" className="me-1" />
                                                                            Passwords match
                                                                        </span>
                                                                        ) : (
                                                                        <span style={{ color: "red" }}>
                                                                            <Xmark width="14" className="me-1" />
                                                                            Passwords do not match
                                                                        </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                    </>

                                                    <div className="col-12">
                                                        <div className="mb-3 text-left">
                                                            <label className="mb-1">Account Type</label>
                                                            <div className="check-container">
                                                                <label className="check-box">
                                                                    <input 
                                                                        type="radio" 
                                                                        name="account_type"
                                                                        value="transaction_email"
                                                                        checked={accountType === "transaction_email"}
                                                                        onChange={(e) => setAccountType(e.target.value)}
                                                                        required
                                                                    />{" "}
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span className="text-secondary">Transaction Email</span>
                                                                </label>
                                                                <label className="check-box">
                                                                    <input 
                                                                        type="radio" 
                                                                        name="account_type"
                                                                        value="email_marketing"
                                                                        checked={accountType === "email_marketing"}
                                                                        onChange={(e) => setAccountType(e.target.value)}
                                                                        required
                                                                    />{" "}
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span className="text-secondary"> Email Marketing</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {accountType === "transaction_email" && (
                                                        <div className="col-12">
                                                            <div className="mb-3 text-left">
                                                                <label className="mb-1">Invoice Management</label>
                                                                <div className="row">
                                                                    <div className="card shadow-none col-6">
                                                                        <div className="card-body custom-selection b-1-light rounded">
                                                                            <div className="position-relative">
                                                                                <label className="check-box">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name="invoice_option"
                                                                                        value="multiple"
                                                                                        checked={invoiceOption === "multiple"}
                                                                                        onChange={(e) => setInvoiceOption(e.target.value)}
                                                                                        required
                                                                                    />{" "}
                                                                                    <span className="radiomark outline-secondary position-absolute"></span>
                                                                                    <span className="ms-4 fs-10">Create multiple invoices</span>
                                                                                </label>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted f-s-12">Separate invoices for multiple invoice numbers with the same customer.</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="card shadow-none col-6">
                                                                        <div className="card-body custom-selection b-1-light rounded">
                                                                            <div className="position-relative">
                                                                                <label className="check-box">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name="invoice_option"
                                                                                        value="merge"
                                                                                        checked={invoiceOption === "merge"}
                                                                                        onChange={(e) => setInvoiceOption(e.target.value)}
                                                                                        required
                                                                                    />{" "}
                                                                                    <span className="radiomark outline-secondary position-absolute"></span>
                                                                                    <span className="ms-4 fs-10">Create Single invoices</span>
                                                                                </label>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-muted f-s-12">Single invoices for multiple invoice numbers with the same customer. This will Merge all invoices into a single PDF</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        )}
                                                                
                                                    {editUserForm && (
                                                        <input
                                                            type="hidden"
                                                            name="userID"
                                                            value={userID}
                                                            onChange={(e) => setUserID(e.target.value)}
                                                        />
                                                    )}
                                                </div>

                                                <div className="d-flex align-items-center gap-30">
                                                    <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                        {editUserForm ? 'Update Account' : 'Save'}
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
    </div>
}

export default Users