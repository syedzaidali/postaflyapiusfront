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

const userFormFields = {
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    status: "active",
    permissions: {},
};

const roleFormFields = {
    name: "",
    permissions: {},
};

const PermissionCheckboxes = ({ permissionsData, values, onChange }) => (
    <div className="row">
        {Object.entries(permissionsData).map(([moduleKey, module]) => (
            <div key={moduleKey} className="col-md-4 mb-2">
                <label>{module.label}</label>
                <div className="check-container mt-2">
                    {(module.fields || []).map((field) => (
                        <div key={field}>
                            <label className="check-box">
                                <input
                                    type="checkbox"
                                    name={`${moduleKey}.${field}`}
                                    checked={!!values?.[moduleKey]?.[field]}
                                    onChange={onChange}
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
);

const Users = () => {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');

    const canCreate = userRole === 'admin' || hasPermission(['users.create']);
    const canEdit = userRole === 'admin' || hasPermission(['users.edit']);
    const canDelete = userRole === 'admin' || hasPermission(['users.delete']);

    const [activeTab, setActiveTab] = useState("users");
    const [userID, setUserID] = useState("");
    const [roleID, setRoleID] = useState("");
    const [formData, setFormData] = useState(userFormFields);
    const [roleForm, setRoleForm] = useState(roleFormFields);
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive] = useState(false);
    const [panelType, setPanelType] = useState("user");
    const [usersList, setListAllUsers] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [editUserForm, setEditUserForm] = useState(false);
    const [editRoleForm, setEditRoleForm] = useState(false);
    const [permissionsData, setPermissionsData] = useState({});
    const [roleOptions, setRoleOptions] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [error, setError] = useState("");

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
    };

    const resetUserForm = () => {
        setFormData(userFormFields);
        setUserID("");
        setEditUserForm(false);
    };

    const resetRoleForm = () => {
        setRoleForm(roleFormFields);
        setRoleID("");
        setEditRoleForm(false);
    };

    const closeMenu = () => {
        setAddActiveClass(false);
        setTimeout(() => {
            setBurgerActive(false);
            resetUserForm();
            resetRoleForm();
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

    const openPanel = (type) => {
        setPanelType(type);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    const openCreateUser = () => {
        resetUserForm();
        openPanel("user");
    };

    const openCreateRole = () => {
        resetRoleForm();
        openPanel("role");
    };

    const handleUserChange = (e) => {
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

            if (name === "role") {
                const selected = roleOptions.find((role) => role.value === value);
                return {
                    ...prev,
                    role: value,
                    permissions: selected?.type === "custom" ? (selected.permissions || {}) : {},
                };
            }

            return { ...prev, [name]: value };
        });
    };

    const handleRoleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setRoleForm((prev) => {
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
                headers: authHeaders,
            });

            const result = await response.json();

            if (response.ok) {
                setListAllUsers(result.data || []);
                setTotalPages(result.pagination?.last_page || 1);
            } else {
                setError(result.message || "Failed to load users.");
            }
        } catch (err) {
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch(apiRoutes.getRoles, {
                method: "GET",
                headers: authHeaders,
            });
            const result = await response.json();
            if (response.ok) {
                setRolesList(result.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch roles:", err);
        }
    };

    const fetchUserPermissions = async () => {
        try {
            const response = await fetch(apiRoutes.getUserPermissions, {
                method: "GET",
                headers: authHeaders,
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
        fetchRoles();
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

        if (!payload.password) {
            delete payload.password;
            delete payload.confirmPassword;
        }

        try {
            const response = await fetch(apiRoutes.createUser, {
                method: "POST",
                headers: authHeaders,
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

    const processCreateRole = async (e) => {
        e.preventDefault();
        setReqLoader(true);
        setError("");
        setMessageText("");

        try {
            const response = await fetch(apiRoutes.createRole, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    name: roleForm.name,
                    permissions: roleForm.permissions,
                    ...(roleID ? { roleID } : {}),
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageText(roleID ? "Role updated successfully!" : "Role created successfully!");
                fetchRoles();
                fetchUserPermissions();
                closeMenu();
            } else {
                setError(result.message || Object.values(result.errors || {}).flat().join(' ') || "Unable to save role.");
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
            role: user.custom_role_id || user.role || "admin",
            status: user.status || "active",
            permissions: parsePermissions(user.custom_role?.permissions || user.permissions),
        });
        setUserID(user.id);
        setEditUserForm(true);
        openPanel("user");
    };

    const handleRoleEditForm = (role) => {
        if (!canEdit) return;

        setRoleForm({
            name: role.name || "",
            permissions: parsePermissions(role.permissions),
        });
        setRoleID(role.id);
        setEditRoleForm(true);
        openPanel("role");
    };

    const handleUserDelete = async (id) => {
        if (!canDelete) return;
        if (!window.confirm("Delete this user?")) return;

        setLoading(true);
        try {
            const response = await fetch(apiRoutes.deleteUser, {
                method: "POST",
                headers: authHeaders,
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

    const handleRoleDelete = async (id) => {
        if (!canDelete) return;
        if (!window.confirm("Delete this role?")) return;

        setLoading(true);
        try {
            const response = await fetch(apiRoutes.deleteRole, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ roleID: id }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageText(result.message || "Role deleted successfully!");
                fetchRoles();
                fetchUserPermissions();
            } else {
                setError(result.message || "Unable to delete role.");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const userRoleLabel = (user) => user.custom_role?.name || user.role;
    const selectedRole = roleOptions.find((role) => role.value === formData.role);
    const showUserPermissions = formData.role !== 'admin';

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
                        {canCreate && activeTab === "roles" && (
                            <button type="button" onClick={openCreateRole} className="btn btn-primary b-r-22">
                                Create Role
                            </button>
                        )}
                        {canCreate && activeTab === "users" && (
                            <button type="button" onClick={openCreateUser} className="btn btn-primary b-r-22">
                                <UserPlus /> Create User
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {messageText && <div className="alert alert-success">{messageText}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Users</button>
                </li>
                <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>Roles</button>
                </li>
            </ul>

            {activeTab === "users" && (
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
                                        <th>Role</th>
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
                                                <td className="text-capitalize">{userRoleLabel(user)}</td>
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
            )}

            {activeTab === "roles" && (
            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <h5>Dynamic Roles</h5>
                        <p className="text-muted mb-0">Create a role, tick sidebar modules, then assign it when creating a user.</p>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive mt-3">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Role name</th>
                                        <th>Modules allowed</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rolesList.length > 0 ? rolesList.map((role) => {
                                        const enabled = Object.entries(parsePermissions(role.permissions) || {})
                                            .filter(([, actions]) => Object.values(actions || {}).some(Boolean))
                                            .map(([key]) => permissionsData[key]?.label || key);
                                        return (
                                            <tr key={role.id}>
                                                <td className="f-w-500">{role.name}</td>
                                                <td>{enabled.length ? enabled.join(", ") : "No modules selected"}</td>
                                                <td>
                                                    {canEdit && (
                                                        <button type="button" onClick={() => handleRoleEditForm(role)} className="btn btn-light-success icon-btn b-r-4">
                                                            <Edit size={12} width={16} className="text-success" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button type="button" onClick={() => handleRoleDelete(role.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                            <Trash size={12} width={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="3" className="text-center">No roles yet. Click Create Role.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {burgerActive && (
                <div className={`burger-menu ${addActiveClass ? "active-in" : ""}`}>
                    <div className="burger-menu-wrapper">
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={(e) => { e.preventDefault(); closeMenu(); }}>
                            <Xmark />
                        </a>

                        <div className="col-wrapper-full">
                            <div className="col-md-12 full-loader">
                                {panelType === "user" && (
                                    <>
                                        <h2 className="card-title mb-4">{editUserForm ? 'Edit' : 'Create'} User</h2>
                                        <form onSubmit={processCreateUser}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Full Name</label>
                                                        <input className="form-control" name="name" type="text" value={formData.name} onChange={handleUserChange} required />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Username</label>
                                                        <input className="form-control" name="username" type="text" value={formData.username} onChange={handleUserChange} />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Email</label>
                                                        <input className="form-control" name="email" type="email" value={formData.email} onChange={handleUserChange} required />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">User Role</label>
                                                        <select name="role" className="form-select" value={formData.role} onChange={handleUserChange} required>
                                                            {(roleOptions.length ? roleOptions : [{ value: 'admin', label: 'Admin' }]).map((role) => (
                                                                <option key={role.value} value={role.value}>{role.label}</option>
                                                            ))}
                                                        </select>
                                                        {roleOptions.filter((role) => role.type === 'custom').length === 0 && (
                                                            <small className="text-muted">Create a role in the Roles tab first to assign sidebar permissions.</small>
                                                        )}
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Status</label>
                                                        <select name="status" className="form-select" value={formData.status} onChange={handleUserChange}>
                                                            <option value="active">Active</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="deactivated">Deactivated</option>
                                                        </select>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">{editUserForm ? 'New password (optional)' : 'Password'}</label>
                                                        <input type="password" name="password" className="form-control" value={formData.password} onChange={handleUserChange} required={!editUserForm} />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Confirm Password</label>
                                                        <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleUserChange} required={!editUserForm} />
                                                    </div>

                                                    {showUserPermissions && (
                                                        <div className="col-md-12 mb-3">
                                                            <h4>Sidebar permissions</h4>
                                                            <p className="text-muted mb-2">
                                                                {selectedRole?.type === 'custom'
                                                                    ? `Loaded from role “${selectedRole.label}”. You can still adjust them for this user.`
                                                                    : 'Tick each module this user can open in the sidebar.'}
                                                            </p>
                                                            <PermissionCheckboxes permissionsData={permissionsData} values={formData.permissions} onChange={handleUserChange} />
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

                                {panelType === "role" && (
                                    <>
                                        <h2 className="card-title mb-4">{editRoleForm ? 'Edit' : 'Create'} Role</h2>
                                        <form onSubmit={processCreateRole}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Role name</label>
                                                        <input className="form-control" name="name" type="text" placeholder="Sales, Billing, Support..." value={roleForm.name} onChange={handleRoleChange} required />
                                                    </div>
                                                    <div className="col-md-12 mb-3">
                                                        <h4>Sidebar permissions</h4>
                                                        <p className="text-muted mb-2">Tick every module this role can access.</p>
                                                        <PermissionCheckboxes permissionsData={permissionsData} values={roleForm.permissions} onChange={handleRoleChange} />
                                                    </div>
                                                </div>
                                                <button type="submit" className="btn btn-primary b-r-22" disabled={reqLoader}>
                                                    {reqLoader ? 'Saving...' : (editRoleForm ? 'Update Role' : 'Create Role')}
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
