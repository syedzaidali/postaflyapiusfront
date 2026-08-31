import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import { unwrapLastPage, unwrapPagedRows, prependRow, authGetHeaders } from '../utils/listResponse';
import {
    UserPlus,
    Upload,
    UserCircle,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash
  } from '../utils/icons';

const Leads = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const formFields = {
        first_name: "",
        last_name: "",
        company: "",
        email: "",
        phone: "",
        group_id: "",
    }

    const [importFormData, setImportFormData] = useState({
        file: null,
        group_id: "",
    });

    const [groupName, setGroupName] = useState("");
    const [status, setStatus] = useState(1);
    const [groups, setGroups] = useState([]);
    const [groupID, setGroupID] = useState('');
    const [leadId, setLeadId]   = useState('');

    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass]   = useState(false);
    const [burgerActive, setBurgerActive]       = useState(false);
    const [title, setTitle]                     = useState(false);
    const [leadCreateForm, setLeadCreateForm] = useState(false);
    const [editLeadForm, setEditLeadForm]         = useState(false);
    const [importLeadForm, setImportLeadForm] = useState(false);
    const [createGroupForm, setCreateGroupForm] = useState(false);
    const [formData, setFormData] = useState(formFields);
    const [initPath, setInitPath] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [leads, setLeads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [importStatus, setImportStatus] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    //Defining success and error mesages const stats
    const [showMessageError, setShowMessageError] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [showMessageSuccess, setShowMessageSuccess] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
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
            setLeadCreateForm(false);
            setImportLeadForm(false);
            setCreateGroupForm(false);
            setEditLeadForm(false);

            setFormData({
                first_name: "",
                last_name: "",
                company: "",
                email: "",
                phone: "",
                group_id: "",
            }); 

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

    //Initializing Error  / Success Messages
    useEffect(() => {
        if (displayMessageError) {
            const timer = setTimeout(() => {
                setShowMessageError(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setShowMessageError(false); 
        }

        if (displayMessageSuccess) {
            const timer = setTimeout(() => {
                setShowMessageSuccess(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setShowMessageSuccess(false); 
        }
    }, [displayMessageError, displayMessageSuccess]);

    /*
     * Initialize Burger menu forms
     */
    //Create lead form
    const createLeadFormDisplay = () => {
        setLeadCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
        fetchGroupsList();
    };

    //Importing leads form
    const createImportLeadFormDisplay = () => {
        setImportLeadForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
        fetchGroupsList();
    };

    //Creating new group form inline
    const createNewGroup = (path) => {
        setCreateGroupForm(true);

        setInitPath(path);

        if(path == 'import') {
            setImportLeadForm(false);
        } else {
            setLeadCreateForm(false);
        }
    }

    const returnBackImportForm = () => {
        setCreateGroupForm(false);
        
        if(initPath == 'import') {
            setImportLeadForm(true);
        } else {
            setLeadCreateForm(true);
        }
    }

    //Edit lead form
    const handleLeadEditForm = (lead) => {
        setFormData({
            first_name: lead.first_name || "",
            last_name: lead.last_name || "",
            company: lead.company || "",
            email: lead.email || "",
            phone: lead.phone || "",
            group_id: lead.group_id || "",
        }); 

        createLeadFormDisplay();
        setEditLeadForm(true);
        setLeadId(lead.id);
    };

    /*
     * Api calls 
     */

    //Fetch leads Data
    const fetchLeads = async (page = 1, search = '') => {
        setLoading(true);
        setSelectedLeads([]);
        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                _ts: Date.now(),
                ...(search && { search })
            });

            const response = await fetch(`${apiRoutes.getLeads}?${queryParams}`, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                const rows = unwrapPagedRows(result);
                setLeads((prev) => {
                    const ids = new Set(rows.map((row) => row.id));
                    const pending = prev.filter((row) => row._justCreated && !ids.has(row.id));
                    return [...pending, ...rows];
                });
                setTotalPages(unwrapLastPage(result));
            } else {
                console.error(result);
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchLeads(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    //Fetch Groups Data
    const normalizeGroup = (group) => ({
        id: group?.id || group?.ID || "",
        title: group?.title || group?.name || "",
        name: group?.title || group?.name || "",
        status: Number(group?.status ?? 1),
        leadsCount: group?.leadsCount ?? group?.leads_count ?? 0,
    });

    const fetchGroupsList = async () => {
        try {
            const response = await fetch(`${apiRoutes.getGroups}?_ts=${Date.now()}`, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();
            const rows = (result.groups || []).map(normalizeGroup).filter((g) => g.id && g.title);
            setGroups(rows);
            return rows;
        } catch (error) {
            console.error("Failed to fetch groups", error);
            setGroups([]);
            return [];
        }
    };

    useEffect(() => {
        fetchGroupsList();
    }, []);

    const pollImportStatus = useCallback(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(apiRoutes.importLeadsStatus, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    method: "POST",
                });
    
                const res = await response.json();
                
                if (res.status === 'completed') {
                    clearInterval(interval);
                    setImportStatus('success');
                    fetchLeads(1, searchQuery);
                    setIsPolling(false);
                } else if (res.status === 'failed') {
                    clearInterval(interval); 
                    setIsPolling(false);
                }
            } catch (err) {
                console.log('Error : ' + JSON.stringify(err));
                clearInterval(interval);
                setImportStatus('error');
                setIsPolling(false);
            }
        }, 5000); 
      
        return () => clearInterval(interval);
    }, [fetchLeads, searchQuery, token]);
    
    useEffect(() => {
        if (importStatus === 'processing' && !isPolling) {
            setIsPolling(true);
            const cleanup = pollImportStatus();
        
            return () => {
                cleanup();
                setIsPolling(false);
            };
        }
      
        if (importStatus !== 'processing' && isPolling) {
          setIsPolling(false);
        }
    }, [importStatus, isPolling, pollImportStatus]);
    
    //Create / Update Lead
    const processCreateLead = async (e) => {
        e.preventDefault();
        setReqLoader(true);
    
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        try {
            if (!formData.email || !formData.group_id) {
                alert("Email and group is required.");
                return;
            }

            const response = await fetch(apiRoutes.createLead, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(formData),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert("Lead created successfully!");
                setFormData({ ...formFields });
                setLeads((prev) => prependRow(prev, result.data));
                setCurrentPage(1);
                await fetchLeads(1, searchQuery);
                closeMenu();
            } else {
                alert(result.message || "Failed to create contact.");
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again.");
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setReqLoader(false);
    
            setTimeout(() => {
                setShowMessageError(false);
            }, 4500);
    
            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    }

    //Process Import Leads
    const handleFileChange = (e) => {
        setImportFormData({ ...importFormData, import_csv: e.target.files[0] });
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        setReqLoader(true);
    
        if (!importFormData.import_csv || !importFormData.group_id) {
            setReqLoader(false);
            return;
        }
    
        const formData = new FormData();
        formData.append('file', importFormData.import_csv);
        formData.append('group_id', importFormData.group_id);
    
        try {
            const response = await axios.post(apiRoutes.importLeads, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
    
            if (response.data.status) {
                setImportStatus('processing');

                setIsPolling(true);

                closeMenu();

                setImportFormData({ group_id: '', import_csv: null });
            } else {
                setImportStatus('error');
                console.log('Import failed.');
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setErrors(error.response.data.message || 'Import error occurred.');
            } else {
                setErrors('Network or server error.');
            }
        } finally {
            setReqLoader(false);
        }
    };

    useEffect(() => {
        if (isPolling) {
            const cleanup = pollImportStatus();
            return cleanup;
        }
    }, [isPolling, pollImportStatus]);
    
    //Process Lead Delete 
    const deleteLead = async (leadId) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) {
            return; // User cancelled
        }
    
        try {
            const response = await fetch(apiRoutes.deleteLead.replace('{id}', leadId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            const result = await response.json();
            if (response.ok && result.status) {
                alert(result.message);
                fetchLeads(currentPage, searchQuery); 
            } else if (response.status === 404) {
                alert(result.message || 'Lead not found.');
            } else if (response.status === 401) {
                alert(result.message || 'Unauthorized. Please log in again.');
            } else {
                alert(result.message || 'Failed to delete lead.');
                console.error(result);
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('An error occurred. Please try again.');
        }
    };

    //Process Create Group
    const handleCreateGroupSubmit = async (e) => {
        e.preventDefault();
        setReqLoader(true);
    
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
    
        const body = {
            id: groupID,
            name: groupName,
            status: status,
        };
    
        try {
            const response = await fetch(apiRoutes.createGroup, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body), 
            });
    
            const result = await response.json();
    
            if (response.ok && result.status) {
                setDisplayMessageSuccess(true);
                setMessageText(result.message || "Group created successfully!");
                setGroupName("");
                setStatus(1);

                const newGroup = normalizeGroup({
                    ...(result.data || result.group || {}),
                    title: (result.data || result.group || {}).title
                        || (result.data || result.group || {}).name
                        || groupName,
                });

                if (newGroup.id) {
                    setGroups((prevGroups) => [
                        newGroup,
                        ...prevGroups.filter((g) => (g.id || g.ID) !== newGroup.id),
                    ]);
                }

                await fetchGroupsList();

                setCreateGroupForm(false);
                setGroupID("");

                if (initPath === 'import') {
                    setImportFormData((prevData) => ({
                        ...prevData,
                        group_id: newGroup.id || "",
                    }));
                    setImportLeadForm(true);
                    setLeadCreateForm(false);
                } else {
                    setFormData((prevData) => ({
                        ...prevData,
                        group_id: newGroup.id || "",
                    }));
                    setLeadCreateForm(true);
                    setImportLeadForm(false);
                }
                // Keep the side panel open so the new group stays selected in Create Lead
            } else {
                setDisplayMessageError(true);
                setMessageText(result.message || "Failed to create group.");
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again.");
        } finally {
            setReqLoader(false);
    
            setTimeout(() => {
                setShowMessageError(false);
            }, 4500);
    
            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    };   
    
    //Delete multiple Leads
    const handleCheckboxChange = (id, isChecked) => {
        setSelectedLeads((prev) => 
            isChecked ? [...prev, id] : prev.filter((leadId) => leadId !== id)
        );
    };

    //Process Multiple Delete
    const deleteSelectedLeads = async () => {
        if (selectedLeads.length === 0) {
            alert('Please select at least one lead to delete.');
            return;
        }
    
        if (!window.confirm('Are you sure you want to delete selected leads?')) {
            return;
        }
    
        try {
            const response = await fetch(apiRoutes.deleteMultipleLeads, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ids: selectedLeads }),
            });
    
            const result = await response.json();
    
            if (response.ok && result.status) {
                alert(result.message);
                setSelectedLeads([]);
                fetchLeads(currentPage, searchQuery);
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
                    <h4 className="main-title f-s-26">Leads</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={createLeadFormDisplay} className="btn btn-primary b-r-22">
                            <UserPlus /> Create Lead
                        </button>

                        <button type="button" onClick={createImportLeadFormDisplay} className="btn btn-primary b-r-22">
                            <Upload /> Import Leads
                        </button>

                        <button type="button" onClick={() => navigate('/leads/groups')} className="btn btn-primary b-r-22">
                            <UserCircle /> Leads Group
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Manage Leads</h5>
                                
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
                            {importStatus === 'processing' && (
                                <div className="progress-box bg-light-primary text-primary-dark f-w-600 w-100">
                                    <div className="progress-content">
                                        <div>
                                            <div className="left d-flex align-items-center">
                                                <span
                                                    aria-hidden="true"
                                                    className="spinner-border spinner-border-sm me-2 ms-2"
                                                    role="status"
                                                ></span>
                                                Importing Leads...
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        aria-valuemax="100"
                                        aria-valuemin="0"
                                        aria-valuenow="0"
                                        className="progress w-100 h-5"
                                        role="progressbar"
                                    >
                                        <div
                                            className="progress-bar bg-primary h-5"
                                            style={{ width: "100%" }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            <div className="table-responsive mt-4">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">&nbsp;</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Company</th>
                                            <th scope="col">Phone</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Group</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center">Loading...</td>
                                        </tr>
                                    ) : (leads || []).length > 0 ? (
                                        leads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td>
                                                    <label className="check-box">
                                                        <input 
                                                            type="checkbox" 
                                                            id="primary"
                                                            checked={selectedLeads.includes(lead.id)}
                                                            onChange={(e) => handleCheckboxChange(lead.id, e.target.checked)}
                                                        />
                                                        <span className="checkmark outline-primary ms-2"></span>
                                                    </label>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <p className="mb-0 f-w-500">{lead.full_name || '—'}</p>
                                                    </div>
                                                </td>
                                                <td className="f-w-500">{lead.company || '—'}</td>
                                                <td>{lead.phone || '—'}</td>
                                                <td className="text-info f-w-500">{lead.email}</td>
                                                <td>
                                                    <span className="badge text-light-primary">
                                                        {lead.group || "N/A"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => handleLeadEditForm(lead)} className="btn btn-light-success icon-btn b-r-4">
                                                        <Edit size={12} width={16} className="text-success" />
                                                    </button>
                                                    <button type="button" onClick={() => deleteLead(lead.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                        <Trash size={12} width={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center">No leads found.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>

                                {selectedLeads.length > 0 && (
                                    <button type="button" className="btn btn-pinterest" onClick={deleteSelectedLeads}>
                                        <span
                                            className="loader spinner-border spinner-border-sm me-2"
                                            style={{ display: 'none' }}
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        <span className="loaderIcon"><Trash size={12} width={16} /></span> Delete Leads
                                    </button>
                                )}

                                <div className="mt-3">
                                    <ul className="pagination app-pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <a
                                                className="page-link"
                                                href="#"
                                                aria-label="Previous"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                }}
                                            >
                                                <span aria-hidden="true">«</span>
                                            </a>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                <a
                                                    className="page-link"
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentPage(pageNum);
                                                    }}
                                                >
                                                    {pageNum}
                                                </a>
                                            </li>
                                        ))}

                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <a
                                                className="page-link"
                                                href="#"
                                                aria-label="Next"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                }}
                                            >
                                                <span aria-hidden="true">»</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
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
                                {leadCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">{editLeadForm ? 'Edit Lead' : 'Create Lead'}</h2>
                                        
                                        <form method="POST" onSubmit={processCreateLead}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">First Name</label>
                                                            <input
                                                                className="form-control"
                                                                name="first_name"
                                                                type="text"
                                                                value={formData.first_name}
                                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Last Name</label>
                                                            <input
                                                                className="form-control"
                                                                name="last_name"
                                                                type="text"
                                                                value={formData.last_name}
                                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Company (Optional)</label>
                                                            <input
                                                                className="form-control"
                                                                name="company"
                                                                type="text"
                                                                value={formData.company || ""}
                                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Email</label>
                                                            <input
                                                                className="form-control"
                                                                name="email"
                                                                type="text"
                                                                value={formData.email}
                                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                                                value={formData.phone}
                                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Lead Group</label>
                                                            <select
                                                                name="group_id"
                                                                className="form-select"
                                                                value={formData.group_id || ""}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({ ...prev, group_id: e.target.value }))
                                                                }
                                                            >
                                                                <option value="">Select Group</option>
                                                                {groups
                                                                .filter((group) => group && (group.id || group.ID) && (group.title || group.name))
                                                                .map((group) => (
                                                                    <option key={group.id || group.ID} value={group.id || group.ID}>
                                                                    {group.title || group.name}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <span className="supporting-label d-flex justify-content-end">
                                                                <a href="#" onClick={
                                                                    (e) => {
                                                                        e.preventDefault();
                                                                        createNewGroup('createContact');
                                                                    }
                                                                }
                                                                >Create Group</a>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {leadId !== "" && (
                                                    <input type="hidden" name="id" value={leadId} />
                                                )}

                                                <button type="submit" className="btn btn-primary b-r-22">
                                                    {editLeadForm ? 'Update Lead' : 'Create New'}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {importLeadForm && (
                                    <>
                                        <h2 className="card-title mb-4">Import Leads</h2>
                                        
                                        <form method="POST" onSubmit={handleImportSubmit}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <p className="text-secondary">
                                                            Download Sample File
                                                            <a href="#" className="btn btn-primary b-r-22 mg-s-10">
                                                                <Download /> Download
                                                            </a>
                                                        </p>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Csv File</label>
                                                            <input className="form-control" name="import_csv" type="file"
                                                                accept=".csv,text/csv"
                                                                onChange={handleFileChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6"></div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Assign Group</label>
                                                            <select
                                                                name="group_id"
                                                                className="form-select"
                                                                value={importFormData.group_id}
                                                                onChange={(e) =>
                                                                    setImportFormData({ ...importFormData, group_id: e.target.value })
                                                                }
                                                            >
                                                                <option value="">Select Group</option>
                                                                {groups
                                                                    .filter((group) => group && (group.id || group.ID) && (group.title || group.name))
                                                                    .map((group) => (
                                                                    <option key={group.id || group.ID} value={group.id || group.ID}>
                                                                    {group.title || group.name}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <span className="supporting-label d-flex justify-content-end">
                                                                <a href="#" onClick={
                                                                    (e) => {
                                                                        e.preventDefault();
                                                                        createNewGroup('import');
                                                                    }
                                                                }
                                                                >Create Group</a>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button type="submit" className="btn btn-primary b-r-22">
                                                    Import
                                                </button>
                                            </div>
                                        </form>     
                                    </>
                                )}

                                {createGroupForm && (
                                    <>
                                        <h2 className="card-title mb-4 d-flex gap-5 align-items-center">
                                            <span>Create New Group</span>
                                            <a href="#" className="btn btn-primary b-r-22"
                                                onClick={ (e) => {
                                                    e.preventDefault();
                                                    returnBackImportForm();
                                                }

                                                }
                                            >
                                                <FastArrowLeft />
                                                Back
                                            </a>
                                        </h2>
                                        
                                        <form method="POST" onSubmit={handleCreateGroupSubmit}>
                                            <div className="app-form">
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label" htmlFor="username">Group Name</label>
                                                        <input
                                                            className="form-control"
                                                            name="groupName"
                                                            type="text"
                                                            value={groupName}
                                                            onChange={(e) => setGroupName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label" htmlFor="username">Status</label>

                                                        <div className="d-flex">
                                                            <div className="form-check d-flex align-items-center gap-1">
                                                                <input
                                                                    className="form-check-input f-s-18 mb-1"
                                                                    id="radio_active"
                                                                    name="status"
                                                                    type="radio"
                                                                    value="1"
                                                                    checked={status === 1}
                                                                    onChange={(e) => setStatus(e.target.value)}
                                                                />
                                                                <label className="form-check-label" htmlFor="radio_active">
                                                                    Active
                                                                </label>
                                                            </div>

                                                            <div className="form-check d-flex align-items-center gap-1 mg-s-10">
                                                                <input
                                                                    className="form-check-input f-s-18 m-1"
                                                                    id="radio_inactive"
                                                                    name="status"
                                                                    type="radio"
                                                                    value="0"
                                                                    checked={status === 0}
                                                                    onChange={(e) => setStatus(e.target.value)}
                                                                />
                                                                <label className="form-check-label" htmlFor="radio_inactive">
                                                                    Inactive
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <button type="submit" className="btn btn-primary b-r-22">
                                                    Create Group
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
    );
}

export default Leads;
