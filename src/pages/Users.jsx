import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    UserPlus,
    Search,
    Edit,
    Trash,
    CheckCircle,
    Xmark
  } from '../utils/icons';

const Users = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const formFields = {
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "admin",
        permissions: {},
    }

    const [userID, setUserID]     = useState("");
    const [formData, setFormData] = useState(formFields);
    
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

    //Initializing create user form button
    const createUserFormDisplay = () => {
        setUserCreateForm(true);
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

            const response = await fetch(`${apiRoutes.getAllUsers}?${queryParams}`, {
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

    //Get current avaialble permsissions Data
    const fetchUserPermissions = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(apiRoutes.getUserPermissions, {
                method: "GET",
                headers,
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

        const url =  apiRoutes.createUser;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
        
        const payload = {
            ...formData,
            ...(userID ? { userID } : {}),
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

                setFormData(formFields);
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
        setTableLoader(true);

        const url = ApiUrl + '/users/delete';

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
                    setShowMessageSuccess(false);
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
                    setShowMessageError(false);
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
                setShowMessageError(false);
            }, 4500);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText(""); 
            }, 8000);
        } finally {
            setTableLoader(false);
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
                            <UserPlus /> Create User
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
                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">&nbsp;</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">User Type</th>
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
                                            <td>
                                                <label className="check-box">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={(e) => handleCheckboxChange(user.id, e.target.checked)}
                                                    />
                                                    <span className="checkmark outline-primary ms-2"></span>
                                                </label>
                                            </td>
                                            <td className="f-w-500">
                                                <div className="sm-data">
                                                    <span>{user.name}</span>
                                                    <span><strong>Username : </strong>@{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="f-w-500">{user.email}</td>
                                            <td>{user.role}</td>
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
                                                <button type="button" onClick={() => handleUserEditForm(user)} className="btn btn-light-success icon-btn b-r-4">
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
                                        <h2 className="card-title mb-4">{showEditForm ? 'Edit' : 'Create'} User</h2>
                                        
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
                                                                <label>Password</label>
                                                                <input
                                                                    type="password"
                                                                    name="password"
                                                                    className="form-control"
                                                                    value={formData.password}
                                                                    onChange={handleChange}
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="mb-3 col-md-6">
                                                                <label>Confirm Password</label>
                                                                <input
                                                                    type="password"
                                                                    name="confirmPassword"
                                                                    className="form-control"
                                                                    value={formData.confirmPassword}
                                                                    onChange={handleChange}
                                                                    required
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="mb-3 col-md-6">
                                                        <label>User Role</label>
                                                        <select
                                                            name="role"
                                                            className="form-select"
                                                            value={formData.role}
                                                            onChange={handleChange}
                                                            required
                                                        >
                                                            <option value="admin">Admin</option>
                                                            <option value="manager">Manager</option>
                                                        </select>
                                                    </div>

                                                    {formData.role === 'manager' && (
                                                        <div className="mb-3 col-md-12">        
                                                            <h4>Manage Permissions</h4>
                                                            
                                                            <div className="row">
                                                                {Object.entries(permissionsData).map(([moduleKey, module]) => (
                                                                    <div key={moduleKey} className="col-md-4 mb-2">
                                                                        <label>{module.label}</label>
                                                                        <div className="check-container mt-2">
                                                                            {module.fields.map((field) => (
                                                                                <div key={field}>
                                                                                    <label className="check-box">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            id={`${moduleKey}-${field}`}
                                                                                            name={`${moduleKey}.${field}`}
                                                                                            checked={!!formData.permissions[moduleKey]?.[field]}
                                                                                            onChange={handleChange}
                                                                                        />
                                                                                        <span className="checkmark check-primary ms-2"></span>
                                                                                        <span className="text-dark">
                                                                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                                                                        </span>
                                                                                    </label>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
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
                                                        Create User
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

export default Users