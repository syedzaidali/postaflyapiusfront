import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
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
    InfoCircle
  } from '../utils/icons';

const SendersProfile = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const formFields = {
        provider_name: "",
        email: "",
        phone: "",
        mailing_address_1: "",
        mailing_address_2: "",
        billing_address_1: "",
        billing_address_2: "",
        payment_url: "",
        status: "",
        logo: null,        
        qr_code: null
    }

    const [providerId, setProviderId] = useState("");
    const [logoPreview, setLogoPreview] = useState(null);
    const [qrCodePreview, setqrCodePreview] = useState(null);

    //Initilize Constants
    const [addActiveClass, setAddActiveClass]   = useState(false);
    const [burgerActive, setBurgerActive]       = useState(false);
    const [title, setTitle]                     = useState(false);
    const [formData, setFormData] = useState(formFields);
    const [createForm, setCreateForm] = useState(false);
    const [editForm, setEditForm]         = useState(false);
    const [providers, setProviders]   = useState([]);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [reqLoader, setReqLoader] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    //Defining success and error mesages const stats
    const [showMessageError, setShowMessageError] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [showMessageSuccess, setShowMessageSuccess] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [resendLoadingMap, setResendLoadingMap] = useState({})
    const [statusLoadingMap, setStatusLoadingMap] = useState({})

    /*
     * Create required functions
     */
    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setTitle("");

        setTimeout(() => {
            setBurgerActive(false);
            setCreateForm(false);
            setEditForm(false);

            setFormData({
                provider_name: "",
                email: "",
                phone: "",
                mailing_address_1: "",
                mailing_address_2: "",
                billing_address_1: "",
                billing_address_2: "",
                payment_url: "",
                status: ""
            }); 

            setLogoPreview(null);
            setqrCodePreview(null);

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
    
    const handleCheckboxChange = (groupId, checked) => {
        setSelectedGroups(prev =>
            checked ? [...prev, groupId] : prev.filter(id => id !== groupId)
        );
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
    
        if (!file) return;
    
        setFormData((prev) => ({ ...prev, [name]: file }));
    
        const reader = new FileReader();
        reader.onloadend = () => {
            if (name === "logo") {
                setLogoPreview(reader.result);
            } else if (name === "qr_code") {
                setqrCodePreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const openCreateForm = () => {
        setCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    }

    //Edit lead form
    const handleProviderEditForm = (provider) => {
        setFormData({
            provider_name: provider.title || "",
            email: provider.email || "",
            phone: provider.phone || "",
            mailing_address_1: provider.mail_address_1 || "",
            mailing_address_2: provider.mail_address_2 ||  "",
            billing_address_1: provider.billing_address_1 ||  "",
            billing_address_2: provider.billing_address_2 || "",
            payment_url: provider.payment_link || "",
            status: provider.status || ""
        }); 

        setLogoPreview(provider.logo_url);
        setqrCodePreview(provider.qr_code_url);
        
        openCreateForm();
        setEditForm(true);
        setProviderId(provider.id);
    };

    const handleProviderStatusCheck = async providerId => {
        setStatusLoadingMap(prev => ({ ...prev, [providerId]: true }))

        try {
        const response = await axios.post(
            `${apiRoutes.statusCheck}/${providerId}`,
            {},
            {
            headers: {
                Authorization: `Bearer ${token}`
            }
            }
        )

        if (response.data.status) {
            alert(response.data.message || 'Status check successful!')
            fetchProviders() // Refresh table
        } else {
            alert(response.data.error || 'Failed to check status.')
        }
        } catch (error) {
        console.error(error)
        alert('Something went wrong. Try again.')
        } finally {
        setStatusLoadingMap(prev => ({ ...prev, [providerId]: false }))
        }
    }

    const handleResendAuthorization = async providerId => {
        setResendLoadingMap(prev => ({ ...prev, [providerId]: true }))

        try {
        const response = await axios.post(
            `${apiRoutes.resendAuthorization}/${providerId}`,
            {},
            {
            headers: {
                Authorization: `Bearer ${token}`
            }
            }
        )

        if (response.data.status) {
            alert(response.data.message || 'Authorization resent successfully!')
            fetchProviders() // Refresh table
        } else {
            alert(response.data.error || 'Failed to resend authorization.')
        }
        } catch (error) {
        console.error(error)
        alert('Something went wrong. Try again.')
        } finally {
        setResendLoadingMap(prev => ({ ...prev, [providerId]: false }))
        }
    }
    /*
     * Api calls 
     */
     //Fetch Groups Data
    const fetchProviders = async () => {
        setLoading(true);
        try {
            const response = await fetch(apiRoutes.getProviders, {
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

            setProviders(result.data.data || []);
        } catch (error) {
            console.error("Failed to fetch groups", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    //Process Create Group
    const handleProcessForm = async (e) => {
        e.preventDefault();
        setReqLoader(true);
    
        const isEdit = providerId !== "";
    
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.provider_name);
            formDataToSend.append("email", formData.email || "");
            formDataToSend.append("phone", formData.phone || "");
            formDataToSend.append("mail_address_1", formData.mailing_address_1 || "");
            formDataToSend.append("mail_address_2", formData.mailing_address_2 || "");
            formDataToSend.append("billing_address_1", formData.billing_address_1 || "");
            formDataToSend.append("billing_address_2", formData.billing_address_2 || "");
            formDataToSend.append("payment_url", formData.payment_url || "");
    
            if (providerId) {
                formDataToSend.append("id", providerId);
            }
    
            if (formData.logo) {
                formDataToSend.append("logo", formData.logo);
            }
    
            if (formData.qr_code) {
                formDataToSend.append("qr_code", formData.qr_code);
            }
    
            const response = await axios.post(apiRoutes.createProvider, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
    
            if (response.status) {
                setDisplayMessageSuccess(true);
                setMessageText(`Provider ${isEdit ? "updated" : "created"} successfully!`);
    
                // Reset form
                setProviderId("");
                setFormData({
                    provider_name: "",
                    email: "",
                    phone: "",
                    mailing_address_1: "",
                    mailing_address_2: "",
                    billing_address_1: "",
                    billing_address_2: "",
                    payment_url: "",
                    logo: null,
                    qr_code: null,
                });
                
                setLogoPreview(null);
                setqrCodePreview(null);
                setCreateForm(false);

                fetchProviders(1, searchQuery);

                closeMenu();
            } else {
                setDisplayMessageError(true);
                setMessageText(response.message || "Failed to process provider.");
            }
        } catch (error) {
            console.error("Error:", error);
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again.");
        } finally {
            setReqLoader(false);
            setTimeout(() => setShowMessageError(false), 4500);
            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    };
    
    //Process Lead provider 
    const deleteProvider = async (providerId) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) {
            return; // User cancelled
        }
    
        try {
            const response = await fetch(apiRoutes.deleteProviders, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ids: [providerId], 
                }),
            });
    
            const result = await response.json();
            if (response.ok && result.status) {
                alert(result.message);
                fetchProviders(currentPage, searchQuery); 
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
                    <h4 className="main-title f-s-26">Sender Profile</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={openCreateForm} className="btn btn-primary b-r-22">
                            Create New Sender
                        </button>
                    </div>
                </div>
            </div>

            <div className="col-lg-12 col-xxl-12">
                <div className="card">
                    <div className="card-header">
                        <h5>Manage Sender Profiles</h5>
                    </div>

                    <div className="card-body full-loader">
                        <div className="table-responsive mt-4">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">&nbsp;</th>
                                        <th scope="col">Logo</th>
                                        <th scope="col">Title</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">Loading...</td>
                                    </tr>
                                ) : providers.length > 0 ? (
                                    providers.map((provider) => (
                                        <tr key={provider.id}>
                                            <td>
                                                <label className="check-box">
                                                    <input 
                                                        type="checkbox" 
                                                        id="primary"
                                                        checked={selectedProviders.includes(provider.id)}
                                                        onChange={(e) => handleCheckboxChange(provider.id, e.target.checked)}
                                                    />
                                                    <span className="checkmark outline-primary ms-2"></span>
                                                </label>
                                            </td>
                                            <td>
                                            {provider.logo_url ? (
                                                <img
                                                    src={provider.logo_url}
                                                    alt="Logo"
                                                    style={{ height: "40px", width: "auto", borderRadius: "4px" }}
                                                />
                                            ) : (
                                                <span className="text-muted">No Logo</span>
                                            )}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <p className="mb-0 f-w-500">{provider.title || '—'}</p>
                                                </div>
                                            </td>
                                            <td>
                                                {/* Status Badge */}
                                                <span
                                                className={`badge ${
                                                    provider.status === 1
                                                    ? 'text-light-success'
                                                    : provider.status === 2
                                                    ? 'text-light-danger'
                                                    : 'text-light-warning'
                                                }`}
                                                >
                                                {provider.status === 1
                                                    ? 'Active'
                                                    : provider.status === 2
                                                    ? 'Inactive'
                                                    : 'Pending'}
                                                </span>

                                                {/* Info icon for Pending/Inactive */}
                                                {provider.status !== 1 && (
                                                <span
                                                    data-tooltip-id={`status-tooltip-${provider.id}`}
                                                    style={{ marginLeft: '8px', cursor: 'pointer' }}
                                                >
                                                    <InfoCircle size={14} />
                                                </span>
                                                )}

                                                {/* Tooltip for Pending/Inactive */}
                                                <Tooltip className="card bg-primary-300 product-sold-card"
                                                id={`status-tooltip-${provider.id}`}
                                                place='top'
                                                clickable
                                                render={() =>
                                                    provider.status === 0 ? (
                                                    <span>Authorization is pending</span>
                                                    ) : (
                                                    <div >
                                                        <span style={{color: 'black'}}>Authorization expired</span>
                                                        <br />
                                                        <button
                                                        className='btn btn-sm btn-primary mt-1'
                                                        disabled={resendLoadingMap[provider.id]}
                                                        onClick={() =>
                                                            handleResendAuthorization(provider.id)
                                                        }
                                                        >
                                                        {resendLoadingMap[provider.id]
                                                            ? 'Resending...'
                                                            : 'Resend Authorization'}
                                                        </button>
                                                    </div>
                                                    )
                                                }
                                                />
                                            </td>

                                            <td>
                                                <button
                                                type='button'
                                                onClick={() => handleProviderStatusCheck(provider.id)}
                                                className='btn btn-light-warning icon-btn b-r-4'
                                                >
                                                <UserCircle
                                                    size={12}
                                                    width={16}
                                                    className='text-success'
                                                />
                                                </button>
                                                <button
                                                type='button'
                                                onClick={() => handleProviderEditForm(provider)}
                                                className='btn btn-light-success icon-btn b-r-4 mg-s-5'
                                                >
                                                <Edit
                                                    size={12}
                                                    width={16}
                                                    className='text-success'
                                                />
                                                </button>
                                                <button
                                                type='button'
                                                onClick={() => deleteProvider(provider.id)}
                                                className='btn btn-light-danger icon-btn b-r-4 mg-s-5'
                                                >
                                                <Trash size={12} width={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center">No senders found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

                            {selectedProviders.length > 0 && (
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

            {burgerActive && (
                <div className={`burger-menu ${addActiveClass ? "active-in" : ""}`}>
                    <div className="burger-menu-wrapper">
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={closeMenu}>
                            <Xmark />
                        </a>

                        <div className="col-wrapper-full">
                            <div className="col-md-12 full-loader">
                                {createForm && (
                                    <>
                                        <h2 className="card-title mb-4">{editForm ? 'Edit ' : 'Create '} Sender Profile</h2>
                                        
                                        <form method="POST" onSubmit={handleProcessForm}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-12 mb-3">
                                                        <label className="form-label" htmlFor="username">Company Name</label>
                                                        <input
                                                            className="form-control"
                                                            name="name"
                                                            type="text"
                                                            value={formData.provider_name}
                                                            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                                        />
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
                                                            <label className="form-label" htmlFor="username">Logo</label>
                                                            <input className="form-control" name="logo" type="file"
                                                                accept=".jpg,.jpeg,.png,.webp"
                                                                onChange={handleFileChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                    {logoPreview && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={logoPreview}
                                                                alt="Logo Preview"
                                                                style={{ maxHeight: '120px', borderRadius: '6px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Mailing Address 1</label>
                                                            <input
                                                                className="form-control"
                                                                name="mailing_address_1"
                                                                type="text"
                                                                value={formData.mailing_address_1}
                                                                onChange={(e) => setFormData({ ...formData, mailing_address_1: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Mailing Address 2</label>
                                                            <input
                                                                className="form-control"
                                                                name="mailing_address_2"
                                                                type="text"
                                                                value={formData.mailing_address_2}
                                                                onChange={(e) => setFormData({ ...formData, mailing_address_2: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Billing Address 1</label>
                                                            <input
                                                                className="form-control"
                                                                name="billing_address_1"
                                                                type="text"
                                                                value={formData.billing_address_1}
                                                                onChange={(e) => setFormData({ ...formData, billing_address_1: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Billing Address 2</label>
                                                            <input
                                                                className="form-control"
                                                                name="billing_address_2"
                                                                type="text"
                                                                value={formData.billing_address_2}
                                                                onChange={(e) => setFormData({ ...formData, billing_address_2: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Payment Url</label>
                                                            <input
                                                                className="form-control"
                                                                name="payment_url"
                                                                type="text"
                                                                value={formData.payment_url}
                                                                onChange={(e) => setFormData({ ...formData, payment_url: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Payment QR Code</label>
                                                            <input className="form-control" name="qr_code" type="file"
                                                                accept=".jpg,.jpeg,.png,.webp"
                                                                onChange={handleFileChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                    {qrCodePreview && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={qrCodePreview}
                                                                alt="QR Code Preview"
                                                                style={{ maxHeight: '120px', borderRadius: '6px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>

                                                {providerId !== "" && (
                                                    <input type="hidden" name="id" value={providerId} />
                                                )}

                                                <button type="submit" className="btn btn-primary b-r-22">
                                                    {editForm ? 'Update Sender' : 'Create New'}
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
    )
}

export default SendersProfile