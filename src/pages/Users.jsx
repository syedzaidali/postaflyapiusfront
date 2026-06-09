import React, { useState, useEffect } from "react";
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import { hasPermission } from '../utils/roleBasedAccess';
import {
    UserPlus,
    Search,
    Edit,
    Trash,
    Xmark
} from '../utils/icons';

const formFields = {
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "manager",
    permissions: {},
};

const Users = () => {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');

    const canCreate = userRole === 'admin' || hasPermission(['users.create']);
    const canEdit = userRole === 'admin' || hasPermission(['users.edit']);
    const canDelete = userRole === 'admin' || hasPermission(['users.delete']);

    const [userID, setUserID] = useState("");
    const [formData, setFormData] = useState(formFields);
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive] = useState(false);
    const [usersList, setListAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [showUserCreateForm, setUserCreateForm] = useState(false);
    const [editUserForm, setEditUserForm] = useState(false);
    const [permissionsData, setPermissionsData] = useState({});
    const [roleOptions, setRoleOptions] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [error, setError] = useState("");

    const resetForm = () => {
        setFormData(formFields);
        setUserID("");
        setEditUserForm(false);
    };

    const closeMenu = () => {
        setAddActiveClass(false);
        setTimeout(() => {
            setBurgerActive(false);
            setUserCreateForm(false);
            resetForm();
            document.body.classList.remove("fixed-body");
        }, 300);
    };

    useEffect(() => {
        if (burgerActive) {
            const timer = setTimeout(() => setAddActiveClass(true), 100);
            return () => clearTimeout(timer);
        }
        setAddActiveClass(false);
    }, [burgerActive]);

    const openCreateForm = () => {
        resetForm();
        setUserCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            if (type === "checkbox") {
                const [moduleKey, field] = name.split(".");
                return {
                    ...prev,
                    permissions: {
                        ...prev.permissions,
                        [moduleKey]: {
                            ...prev.permissions[moduleKey],
                            [field]: checked,
                        },
                    },
                };
            }

            return { ...prev, [name]: value };
        });
    };

    const fetchUsers = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                ...(search && { search }),
            });

            const response = await fetch(`${apiRoutes.getAllUsers}?${queryParams}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (response.ok) {
                setListAllUsers(result.data || []);
                setTotalPages(result.pagination?.last_page || 1);
            } else {
                setError(result.message || "Failed to load users.");
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPermissions = async () => {
        try {
            const response = await fetch(apiRoutes.getUserPermissions, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                },
            });

            const result = await response.json();

            if (response.ok) {
                setPermissionsData(result.data || {});
                setRoleOptions(result.roles || []);
            }
        } catch (err) {
            console.error("Failed to fetch permissions:", err);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    useEffect(() => {
        fetchUserPermissions();
    }, [token]);

    const processCreateUser = async (e) => {
        e.preventDefault();
        setReqLoader(true);
        setError("");
        setMessageText("");

        const payload = {
            ...formData,
            ...(userID ? { userID } : {}),
        };

        if (editUserForm) {
            delete payload.password;
            delete payload.confirmPassword;
        }

        try {
            const response = await fetch(apiRoutes.createUser, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageText(userID ? "User updated successfully!" : "User created successfully!");
                fetchUsers(currentPage, searchQuery);
                closeMenu();
            } else {
                setError(result.message || Object.values(result.errors || {}).flat().join(' ') || "Unable to save user.");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setReqLoader(false);
        }
    };

    const parsePermissions = (permissions) => {
        if (!permissions) return {};
        if (typeof permissions === 'string') {
            try {
                return JSON.parse(permissions);
            } catch {
                return {};
            }
        }
        return permissions;
    };

    const handleUserEditForm = (user) => {
        if (!canEdit) return;

        setFormData({
            name: user.name || "",
            username: user.username || "",
            email: user.email || "",
            password: "",
            confirmPassword: "",
            role: user.role || "manager",
            permissions: parsePermissions(user.permissions),
        });
        setUserID(user.id);
        setEditUserForm(true);
        setUserCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
        setTimeout(() => setAddActiveClass(true), 100);
    };

    const handleUserDelete = async (id) => {
        if (!canDelete) return;
        if (!window.confirm("Delete this user?")) return;

        setLoading(true);
        try {
            const response = await fetch(apiRoutes.deleteUser, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ userID: id }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageText(result.message || "User deleted successfully!");
                fetchUsers(currentPage, searchQuery);
            } else {
                setError(result.message || "Unable to delete user.");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const totalPagesToShow = 5;
    const paginationItems = [];
    let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2));
    let endPage = startPage + totalPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationItems.push(
            <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}>{i}</a>
            </li>
        );
    }

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Users Management</h4>
                </div>
                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        {canCreate && (
                            <button type="button" onClick={openCreateForm} className="btn btn-primary b-r-22">
                                <UserPlus /> Create User
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {messageText && <div className="alert alert-success">{messageText}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Manage Users</h5>
                            <div className="app-form app-icon-form">
                                <div className="position-relative icon-input-form">
                                    <input
                                        aria-label="Search"
                                        className="form-control search-filter"
                                        placeholder="Search..."
                                        type="search"
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
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>User Type</th>
                                        <th>Date Created</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                                    ) : usersList.length > 0 ? (
                                        usersList.map((user) => (
                                            <tr key={user.id}>
                                                <td className="f-w-500">
                                                    <div className="sm-data">
                                                        <span>{user.name}</span>
                                                        <span><strong>Username: </strong>@{user.username}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td className="text-capitalize">{user.role}</td>
                                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        user.status === 'active' ? 'text-light-success'
                                                        : user.status === 'pending' ? 'text-light-warning'
                                                        : 'text-light-danger'
                                                    }`}>
                                                        {user.status || 'offline'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {canEdit && (
                                                        <button type="button" onClick={() => handleUserEditForm(user)} className="btn btn-light-success icon-btn b-r-4">
                                                            <Edit size={12} width={16} className="text-success" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button type="button" onClick={() => handleUserDelete(user.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                            <Trash size={12} width={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="text-center">No users found.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="mt-3">
                                <ul className="pagination app-pagination">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>«</a>
                                    </li>
                                    {paginationItems}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>»</a>
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
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={(e) => { e.preventDefault(); closeMenu(); }}>
                            <Xmark />
                        </a>

                        <div className="col-wrapper-full">
                            <div className="col-md-12 full-loader">
                                {showUserCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">{editUserForm ? 'Edit' : 'Create'} User</h2>
                                        <form onSubmit={processCreateUser}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Full Name</label>
                                                        <input className="form-control" name="name" type="text" value={formData.name} onChange={handleChange} required />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Username</label>
                                                        <input className="form-control" name="username" type="text" value={formData.username} onChange={handleChange} />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Email</label>
                                                        <input className="form-control" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">User Role</label>
                                                        <select name="role" className="form-select" value={formData.role} onChange={handleChange} required>
                                                            {(roleOptions.length ? roleOptions : [
                                                                { value: 'admin', label: 'Admin' },
                                                                { value: 'manager', label: 'Manager' },
                                                                { value: 'agent', label: 'Agent' },
                                                            ]).map((role) => (
                                                                <option key={role.value} value={role.value}>{role.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {!editUserForm && (
                                                        <>
                                                            <div className="col-md-6 mb-3">
                                                                <label className="form-label">Password</label>
                                                                <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
                                                            </div>
                                                            <div className="col-md-6 mb-3">
                                                                <label className="form-label">Confirm Password</label>
                                                                <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} required />
                                                            </div>
                                                        </>
                                                    )}

                                                    {formData.role !== 'admin' && (
                                                        <div className="col-md-12 mb-3">
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
                                                                                            name={`${moduleKey}.${field}`}
                                                                                            checked={!!formData.permissions[moduleKey]?.[field]}
                                                                                            onChange={handleChange}
                                                                                        />
                                                                                        <span className="checkmark check-primary ms-2"></span>
                                                                                        <span className="text-dark text-capitalize">{field}</span>
                                                                                    </label>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button type="submit" className="btn btn-primary b-r-22" disabled={reqLoader}>
                                                    {reqLoader ? 'Saving...' : (editUserForm ? 'Update User' : 'Create User')}
                                                </button>
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
    );
};

export default Users;
