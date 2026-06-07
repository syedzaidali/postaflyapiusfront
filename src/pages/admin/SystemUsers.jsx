import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    UserPlus,
    Search,
    Edit,
    Trash,
    CheckCircle,
    Xmark,
    Eye,
    EyeClosed,
  } from '../../utils/icons';

const SystemUsers = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const [userID, setUserID]     = useState("");
    const formFields = {
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "super_admin",
        permissions: {},
    }

    const [formData, setFormData] = useState(formFields);
    const [password, setPassword]               = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [title, setTitle] = useState("");
    
    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive]     = useState(false);
    const [usersList, setListAllUsers] = useState([]);    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
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
            passwordsMatch
        );
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
    //Fetch All Users
    const fetchUsers = async (page = 1, search = '') => {
        setLoading(true);
        setSelectedUsers([]);

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

            const response = await fetch(`${apiRoutes.getAdminSystemUsers}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok) {
                setListAllUsers(result.data); 
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
        fetchUsers(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    //Fetch User Permissions
    const fetchUserPermissions = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(`${apiRoutes.systemUserPermissions}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();
            
            if (response.ok) {
                setPermissionsData(result.data);
            } else {
                console.error("Error fetching screens:", result.message);
            }
        } catch (error) {
            console.error("Error fetching channels:", error);
        } 
    };

    useEffect(() => {
        fetchUserPermissions();
    }, [token]);


    /*
     * Initialize and process user form
     */      
    const processCreateUser = async (e) => {
        e.preventDefault();
        setReqLoader(true);

        const url = apiRoutes.createUpdateSystemUser;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
        
        const payload = {
            ...formData,
            ...(userID ? { userID } : {}),
            ...(password ? { password } : {}),
            ...(passwordConfirm && { password_confirmation: passwordConfirm }),
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageText("User created successfully!");

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText(""); 
                }, 8000);

                fetchUsers(currentPage);

                closeMenu();
            } else {          
                setError(result.errors);

                setTimeout(() => {
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
        const permissions = JSON.parse(user.permissions);

        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: permissions
        }); 

        createUserFormDisplay();
        setEditUserForm(true);
        setUserID(user.id);
    };

    /*
     * User delete function 
     */
    const handleUserDelete = async (userID) => {
        const url = apiRoutes.deleteSystemUser;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const body = {
            userID: userID
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (response.ok) {
                setDisplayMessageSuccess(true);
                setMessageText("User deleted successfully!");

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                }, 4500);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText(""); 
                }, 8000);

                fetchUsers(currentPage);
            } else {
                setDisplayMessageError(true);
            
                setMessageText(result.message || "Unable to delete user please try again.");

                setTimeout(() => {
                    setDisplayMessageError(false);
                }, 4500);

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText(""); 
                }, 8000);
            }
        } catch (error) {
            setDisplayMessageError(true);
            
            setMessageText("An unexpected error occurred. Please try again.");

            setTimeout(() => {
                setDisplayMessageError(false);
            }, 4500);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText(""); 
            }, 8000);
        }
    };

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
                                ) : usersList.length > 0 ? (
                                    usersList.map((user) => (
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
                                            </td>
                                            <td>
                                                <a href={`${ADMIN_ROUTE_PREFIX}/user/view/` + user.id} className="btn btn-light-primary icon-btn b-r-4">
                                                    <Eye size={12} width={16}  />
                                                </a>
                                                <button type="button" onClick={() => handleUserEditForm(user)} className="btn btn-light-success icon-btn b-r-4 mg-s-5">
                                                    <Edit size={12} width={16} className="text-success" />
                                                </button>
                                                <button type="button" onClick={() => handleUserDelete(user.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                    <Trash size={12} width={16} />
                                                </button>
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
                                        <h2 className="card-title mb-4">{showEditForm ? 'Edit' : 'Create'} Account</h2>
                                        
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

                                                    {!editUserForm && (
                                                        <>
                                                            <div className="mb-3 col-md-6">
                                                                <div className="mb-3 text-left">
                                                                    <i className="iconoir-eye"></i>
                                                                    <label className="mb-1">Password</label>
                                                                    <div className="input-icon-btn">
                                                                        <input 
                                                                            type={passwordVisible ? "text" : "password"}
                                                                            className="form-control"
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            onFocus={() => setIsPasswordFocused(true)}
                                                                            onBlur={() => setIsPasswordFocused(false)}
                                                                            required
                                                                            placeholder="Enter Password"
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
                                                                        required
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
                                                    )}

                                                    <div className="col-4">
                                                        <div className="mb-3 text-left">
                                                            <label className="mb-1">User Role</label>
                                                            <select
                                                                name="role"
                                                                className="form-control bg-gray rounded-half"
                                                                value={formData.role}
                                                                onChange={handleChange}
                                                                required
                                                            >
                                                                <option value="super_admin">Admin</option>
                                                                <option value="agent">Agent</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-12 mb-3 text-left">     
                                                        <label className="mb-1">Manage Permissions</label>
                                                            
                                                        <div className="checkbox-options boxed-inputs nested-box-inputs">
                                                        {Object.entries(permissionsData).map(([moduleKey, module]) => (
                                                            <div key={moduleKey} className="nested-group-wrapper">
                                                                <label>{module.label}</label>
                                                                <div className="nested-group">
                                                                    {module.fields.map((field) => (
                                                                    <div key={field} className="d-flex align-items-center">
                                                                        <div className="form-switch d-flex">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`${moduleKey}-${field}`}
                                                                                name={`${moduleKey}.${field}`}
                                                                                checked={!!formData.permissions[moduleKey]?.[field]}
                                                                                onChange={handleChange}
                                                                                className="setActivate"
                                                                            />
                                                                            <label htmlFor={`${moduleKey}-${field}`}></label>
                                                                        </div>
                                                                        <label className="form-check-label" htmlFor={`${moduleKey}-${field}`}>
                                                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                                                        </label>
                                                                    </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        </div>
                                                    </div>
                                                                
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
                                                        Save
                                                    </button>

                                                    {btnLoader && (
                                                        <div className="left d-flex align-items-center">
                                                            <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                            <b className="me-1 ms-1">{uploadProgress}%</b> Uploading File
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

export default SystemUsers