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
    Trash,
    CheckCircle
  } from '../utils/icons';

const Campaigns = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const formFields = {
        title: "",
        senderEmail: "",
        start_date: "",
        end_date: "",
        group_id: "",
        template_id: "",
        status: ""
    }
    
    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive] = useState(false);
    const [title, setTitle] = useState(false);
    const [campaignCreateForm, setCampaignCreateForm] = useState(false);
    const [editCampaignForm, setEditCampaignForm] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [groups, setGroups] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [formData, setFormData] = useState(formFields);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    
    /*
     * Page Functionalities
     */

    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setTitle("");

        setTimeout(() => {
            setBurgerActive(false);
            setCampaignCreateForm(false);
            setFormData({
                title: "",
                senderEmail: "",
                start_date: "",
                end_date: "",
                group_id: "",
                template_id: "",
                status: ""
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

    //Create New Campaign form
    const createCampaignFormDisplay = () => {
        setCampaignCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    }

    useEffect(() => {
        if (window.location.hash === "#create") {
          createCampaignFormDisplay();
          
          history.replaceState(null, "", window.location.pathname);
        }
    }, []);
    
    /*
     * Api calls 
     */
    //Fetch campaigns Data
    const fetchCampaigns = async (page = 1, search = '') => {
        setLoading(true);
        setSelectedCampaigns([]);

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

            const response = await fetch(`${apiRoutes.getAllCampaigns}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();
            
            
            if (response.ok && result.status) {
                setCampaigns(result.data.data);
                setTotalPages(result.data.last_page || 1);
            } else {
                console.error(result);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCampaigns(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    //Fetch Groups Data
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch(apiRoutes.getGroups, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });
    
                const result = await response.json();

                setGroups(result.groups || []);
            } catch (error) {
                console.error("Failed to fetch groups", error);
            }
        };
    
        fetchGroups();
    }, []);

     //Fetch templates Data
    const fetchTemplates = async () => {
        try {
            const type = "marketing"; 
            const url = `${apiRoutes.getAllTemplates}?type=${encodeURIComponent(type)}`;

            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(url, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setTemplates(result.data.data);
            } else {
                console.error(result);
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } 
    };
    
    useEffect(() => {
        fetchTemplates();
    }, []);
    
    //Process Create Campaign
    const processCreateCampaign = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        try {
            const response = await fetch(apiRoutes.createCampaign, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(formData),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                setSuccessMessage(result.message);
                setShowSuccessMessage(true);
                setFormData(formFields);

                setTimeout(() => {
                    setShowSuccessMessage(false);
                }, 500);
                
                fetchCampaigns(1, searchQuery);

                closeMenu();
            } else {
                alert(result.message || "Failed to create contact.");
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again.");
        }  finally {
            setBtnLoader(false);
            setBtnDisabled(false);

            // setTimeout(() => {
            //     setShowMessageError(false);
            // }, 4500);
    
            // setTimeout(() => {
            //     setDisplayMessageError(false);
            //     setMessageText("");
            // }, 8000);
        }
    }

    //Delete multiple Leads
    const handleCheckboxChange = (id, isChecked) => {
        setSelectedLeads((prev) => 
            isChecked ? [...prev, id] : prev.filter((leadId) => leadId !== id)
        );
    };

    return ( 
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Campaigns</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={createCampaignFormDisplay} className="btn btn-primary b-r-22">
                            <UserPlus /> Create Campaign
                        </button>

                        <button type="button" onClick={() => navigate('/leads')} className="btn btn-primary b-r-22">
                            <UserCircle /> View Leads
                        </button>

                        <button type="button" onClick={() => navigate('/leads/groups')} className="btn btn-primary b-r-22">
                            <UserCircle /> Manage Groups
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Manage Campaigns</h5>
                                
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
                                    <CheckCircle size='20' /> {successMessage}
                                </div>
                            )}
                            
                            <div className="table-responsive mt-4">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">&nbsp;</th>
                                            <th scope="col">Title</th>
                                            <th scope="col">Sender Email</th>
                                            <th scope="col">Assigned Group</th>
                                            <th scope="col">Email Template</th>
                                            <th scope="col">Start Date</th>
                                            <th scope="col">End Date</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">Loading...</td>
                                        </tr>
                                    ) : campaigns.length > 0 ? (
                                        campaigns.map((campaign) => (
                                            <tr key={campaign.id}>
                                                <td>
                                                    <label className="check-box">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedCampaigns.includes(campaign.id)}
                                                            onChange={(e) => handleCheckboxChange(campaign.id, e.target.checked)}
                                                        />
                                                        <span className="checkmark outline-primary ms-2"></span>
                                                    </label>
                                                </td>
                                                <td className="f-w-500">{campaign.title || '—'}</td>
                                                <td>{campaign.senderEmail || '—'}</td>
                                                <td>
                                                    <span className="badge text-light-primary">
                                                        {campaign.group || '—'}
                                                    </span>
                                                </td>
                                                <td>{campaign.template?.title || '—'}</td>
                                                <td>{campaign.start_date || '—'}</td>
                                                <td>{campaign.end_date || '—'}</td>
                                                <td>
                                                    <span className={`badge ${campaign.status === 'active' ? 'text-light-success' : 'text-light-secondary'}`}>
                                                        {campaign.status || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => handleEditCampaign(campaign)} className="btn btn-light-success icon-btn b-r-4">
                                                        <Edit size={12} width={16} className="text-success" />
                                                    </button>
                                                    <button type="button" onClick={() => deleteCampaign(campaign.id)} className="btn btn-light-danger icon-btn b-r-4 ms-2">
                                                        <Trash size={12} width={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No campaigns found.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>

                                {selectedCampaigns.length > 0 && (
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
                                {campaignCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">{editCampaignForm ? 'Edit Campaign' : 'Create Campaign'}</h2>

                                        <form method="POST" onSubmit={processCreateCampaign}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Title</label>
                                                            <input
                                                                className="form-control"
                                                                name="title"
                                                                type="text"
                                                                value={formData.title}
                                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Sender Email</label>
                                                            <input
                                                                className="form-control"
                                                                name="senderEmail"
                                                                type="email"
                                                                value={formData.senderEmail}
                                                                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Lead Group</label>
                                                            <select
                                                                className="form-control"
                                                                name="group_id"
                                                                value={formData.group_id}
                                                                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                                                                required
                                                            >
                                                                <option value="">Select Group</option>
                                                                {groups.map((group) => (
                                                                    <option key={group.id} value={group.id}>
                                                                        {group.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Email Template</label>
                                                            <select
                                                                className="form-control"
                                                                name="template_id"
                                                                value={formData.template_id}
                                                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                                                required
                                                            >
                                                                <option value="">Select Template</option>
                                                                {templates.map((template) => (
                                                                    <option key={template.id} value={template.id}>
                                                                        {template.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Start Date</label>
                                                            <input
                                                                className="form-control"
                                                                name="start_date"
                                                                type="datetime-local"
                                                                value={formData.start_date}
                                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                            />
                                                            <small className="text-muted">Leave empty to start immediately</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-30">
                                                <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                    Create Campaign
                                                </button>

                                                {btnLoader && (
                                                    <div className="left d-flex align-items-center">
                                                        <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                        Processing
                                                    </div>
                                                )}
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

export default Campaigns;