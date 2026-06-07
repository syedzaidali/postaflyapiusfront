import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
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

const Leadgroups = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilize Constants
    const [groupName, setGroupName] = useState("");
    const [status, setStatus] = useState(1);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [groupID, setGroupID] = useState('');
    const [reqLoader, setReqLoader] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    /*
     * Create required functions
     */
    const handleCheckboxChange = (groupId, checked) => {
        setSelectedGroups(prev =>
            checked ? [...prev, groupId] : prev.filter(id => id !== groupId)
        );
    };


    /*
     * Api calls 
     */
     //Fetch Groups Data
    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await axios.get(apiRoutes.getGroups); 
            if (response.data.success) {
                setGroups(response.data.groups);
            }
        } catch (error) {
            console.error("Failed to fetch groups", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                const response = await fetch(apiRoutes.getGroups, {
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

                setGroups(result.groups || []);
            } catch (error) {
                console.error("Failed to fetch groups", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchGroups();
    }, [token]);

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
    
            if (response.ok) {
                setDisplayMessageSuccess(true);
                setMessageText("Group created successfully!");
                setGroupName("");
                setStatus(1);

                const newGroupRaw = result.data || result.group || result;

                const newGroup = {
                    id: newGroupRaw.ID,
                    name: newGroupRaw.title,
                    status: newGroupRaw.status,
                };

                setGroups((prevGroups) => [...prevGroups, newGroup]);

                setCreateGroupForm(false);

                if (initPath === 'import') {
                    setImportFormData((prevData) => ({
                        ...prevData,
                        group_id: newGroup.id,
                    }));
                    setImportLeadForm(true);
                } else {
                    setFormData((prevData) => ({
                        ...prevData,
                        group_id: newGroup.id,
                    }));
                    setLeadCreateForm(true);
                }
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

    //Process Group Delete 
    const deleteGroup = async (leadId) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) {
            return; // User cancelled
        }
    
        try {
            const response = await fetch(apiRoutes.deleteGroup.replace('{id}', leadId), {
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

    return ( 
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Lead Groups</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={() => navigate('/leads')} className="btn btn-primary b-r-22">
                            <FastArrowLeft /> Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-5 col-xxl-4">
                    <div className="card">
                        <div className="card-header">
                            <h5>Create Group</h5>
                        </div>

                        <div className="card-body full-loader">
                            <form method="POST" onSubmit={handleCreateGroupSubmit}>
                                <div className="app-form">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Group Name</label>
                                        <input
                                            className="form-control"
                                            name="groupName"
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-3">
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
                                                    onChange={(e) => setStatus(Number(e.target.value))}
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
                                                    onChange={(e) => setStatus(Number(e.target.value))}
                                                />
                                                <label className="form-check-label" htmlFor="radio_inactive">
                                                    Inactive
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="btn btn-primary b-r-22">
                                        Create Group
                                    </button>
                                </div>
                            </form>  

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

                <div className="col-lg-8 col-xxl-8">
                    <div className="card">
                        <div className="card-header">
                            <h5>Manage Groups</h5>
                        </div>

                        <div className="card-body full-loader">
                            <div className="table-responsive mt-4">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">&nbsp;</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Leads</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center">Loading...</td>
                                        </tr>
                                    ) : groups.length > 0 ? (
                                        groups.map((group) => (
                                            <tr key={group.id}>
                                                <td>
                                                    <label className="check-box">
                                                        <input 
                                                            type="checkbox" 
                                                            id="primary"
                                                            checked={selectedGroups.includes(group.id)}
                                                            onChange={(e) => handleCheckboxChange(group.id, e.target.checked)}
                                                        />
                                                        <span className="checkmark outline-primary ms-2"></span>
                                                    </label>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <p className="mb-0 f-w-500">{group.title || '—'}</p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${group.status === 1 ? "text-light-success" : "text-light-warning"}`}>
                                                        {group.status === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td>{group.leadsCount}</td>
                                                <td>
                                                    <button type="button" onClick={() => handleLeadEditForm(group)} className="btn btn-light-success icon-btn b-r-4">
                                                        <Edit size={12} width={16} className="text-success" />
                                                    </button>
                                                    <button type="button" onClick={() => deleteLead(group.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
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

                                {selectedGroups.length > 0 && (
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default Leadgroups