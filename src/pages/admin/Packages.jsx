import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const Packages = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    //Initilizing form fields
    const [packageId, setPackageId] = useState("");
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        price: '0.00',
        discount_type: 'flat',
        discount: 0,
        currency: 'USD',
        is_trial: 0,
        billing_cycle: 'monthly',
        description: '',
    });

    const [features, setFeatures] = useState([]);

    const [settings, setSettings] = useState([]);
    const [settingsData, setSettingsData] = useState({});
    const [finalCost, setFinalCost] = useState(0);
    const [title, setTitle] = useState("");
    
    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass] = useState(false);
    const [burgerActive, setBurgerActive]     = useState(false);
    const [packagesData, setPackagesData] = useState([]);    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [showPackageCreateForm, setPackageCreateForm] = useState(false);
    const [showEditForm, setDhowEditForm] = useState(false);
    
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
    const createPacakgeFormDisplay = () => {
        setPackageCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let  updatedFormData = { ...prev, [name]: value };
            
            if (['price', 'discount_type', 'discount'].includes(name)) {
                calculateDiscount(updatedFormData);
            }

            if(name == 'billing_cycle') {
                const isTrial = (value === '7'); 
            
                updatedFormData = { 
                    ...updatedFormData, 
                    is_trial: isTrial ? 1 : 0 
                };
            }
            
            return updatedFormData;
        });
    };

    const handleAddFeature = () => {
        setFeatures(prev => [...prev, { text: '', available: 1, tempId: Date.now() }]);
    };

    const handleRemoveFeature = (tempId) => {
        setFeatures(prev => prev.filter(f => f.tempId !== tempId));
    };

    const handleFeatureChange = (tempId, field, value) => {
        setFeatures(prev =>
            prev.map(f =>
                f.tempId === tempId ? { ...f, [field]: value } : f
            )
        );
    };

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;

        const keyMatch = name.match(/\[(.*?)\]/);
        const key = keyMatch ? keyMatch[1] : name; 

        let newValue = value;
        if (type === 'checkbox') {
            newValue = checked ? 1 : 0;
        }

        setSettingsData(prev => ({
            ...prev,
            [key]: newValue
        }));
    };

    const calculateDiscount = (updatedForm) => {
        const discountType  = updatedForm.discount_type;
        const packagePrice  = parseFloat(updatedForm.price) || 0;
        const discountValue = parseFloat(updatedForm.discount) || 0;
        let finalPrice    = 0;

        if (discountValue > 0) {
            if(discountType == 'flat') {
                finalPrice = packagePrice - discountValue;
            } else {
                const percentageValue = (packagePrice / 100) * discountValue;
                
                finalPrice = packagePrice - percentageValue;
            }

            setFinalCost(finalPrice);
        } else {
            setFinalCost(packagePrice);
        }
    }

    const formatBillingCycle = (cycle) => {
        switch (cycle) {
            case 'monthly':
                return 'Monthly';
            case 'yearly':
                return 'Yearly';
            case 7:
                return '7 Days Trial';
            default:
                return `${cycle} Days`;
        }
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
    const fetchPackages = async (page = 1, search = '') => {
        setLoading(true);

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

            const response = await fetch(`${apiRoutes.getPackages}?${queryParams}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok) {
                setPackagesData(result.data); 
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
        fetchPackages(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const fetchPackageSettings = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getPackageSettings}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            console.log(JSON.stringify(result.data));

            if (response.ok) {
                setSettings(result.data);
                const settingsSchema = result.data;

                const initialSettingsData = {};
                
                Object.keys(settingsSchema).forEach(key => {
                    const setting = settingsSchema[key];
                    
                    let initialValue = setting.default;

                    if (setting.type === 'boolean') {
                        initialValue = !!initialValue; 
                    }
                    
                    initialSettingsData[key] = initialValue;
                });

                setSettingsData(initialSettingsData);
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    }

    useEffect(() => {
        fetchPackageSettings();
    }, []);

    /*
     * Initialize and process user form
     */      
    const processCreatePackage = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const url = apiRoutes.createUpdatePackage;
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
        
        console.log(JSON.stringify(settingsData));
        
        const payload = {
            ...formData,
            ...(packageId ? { packageId } : {}),
 
            features: features.map(f => ({
                text: f.text,
                available: f.available
            })),
            
            settings: settingsData
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

                fetchPackages(currentPage);

                // closeMenu();
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
            setBtnLoader(false);
            setBtnDisabled(false);
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
                    <h4 className="main-title f-s-26">Packages</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={() => createPacakgeFormDisplay()} className="btn btn-primary b-r-22">
                            + Create Package
                        </button>
                    </div>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Manage Plans</h5>
                            
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
                                        <th scope="col">Title</th>
                                        <th scope="col">Price</th>
                                        <th scope="col">Billing Cycle</th>
                                        <th scope="col">Discount</th>
                                        <th scope="col">Subscriptions</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Date Created</th>
                                        <th scope="col">Last Updated</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">Loading...</td>
                                    </tr>
                                ) : packagesData.length > 0 ? (
                                    packagesData.map((pkg, index) => (
                                        <tr key={index}>
                                            <td className="f-w-500">
                                                {pkg.name}
                                            </td>
                                            <td>${pkg.price}</td>
                                            <td>{formatBillingCycle(pkg.billing_cycle)}</td>
                                            <td>${pkg.discounted_price}</td>
                                            <td>{pkg.subscriptions_count || 0}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        pkg.status === 'active'
                                                            ? 'text-light-success'
                                                            : pkg.status === 'pending'
                                                            ? 'text-light-warning'
                                                            : 'text-light-danger'
                                                    }`}
                                                >
                                                    {pkg.status === 'active'
                                                        ? 'Active'
                                                        : pkg.status === 'pending'
                                                        ? 'Pending'
                                                        : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{new Date(pkg.created_at).toLocaleDateString()}</td>
                                            <td>{new Date(pkg.updated_at).toLocaleDateString()}</td>
                                            <td>
                                                <button className="btn btn-light-primary icon-btn b-r-4">
                                                    <Eye size={12} width={16}  />
                                                </button>
                                                <button type="button" onClick={() => handleUserEditForm(pkg)} className="btn btn-light-success icon-btn b-r-4 mg-s-5">
                                                    <Edit size={12} width={16} className="text-success" />
                                                </button>
                                                <button type="button" onClick={() => handleUserDelete(pkg.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                    <Trash size={12} width={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center">No packages found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

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
                                {showPackageCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">{showEditForm ? 'Edit' : 'Create'} Package</h2>
                                        
                                        <form method="POST" onSubmit={processCreatePackage}>
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Package Title</label>
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

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Price</label>
                                                            <input
                                                                className="form-control"
                                                                name="price"
                                                                type="text"
                                                                placeholder="0.00"
                                                                value={formData.price}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Discount Type</label>
                                                            <div className="check-container d-flex gap-5">
                                                                <label className="check-box">
                                                                    <input 
                                                                        name="discount_type"
                                                                        value="flat"
                                                                        checked={formData.discount_type === 'flat'}
                                                                        onChange={handleChange}
                                                                        type="radio" 
                                                                    />
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span>Flat</span>
                                                                </label>

                                                                <label className="check-box">
                                                                    <input 
                                                                        name="discount_type"
                                                                        value="percentage"
                                                                        checked={formData.discount_type === 'percentage'}
                                                                        onChange={handleChange} 
                                                                        type="radio" 
                                                                    />
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span>Percentage</span>
                                                                </label>

                                                                <label className="check-box">
                                                                    <input 
                                                                        name="discount_type"
                                                                        value="none"
                                                                        checked={formData.discount_type === 'none'}
                                                                        onChange={handleChange} 
                                                                        type="radio" 
                                                                    />
                                                                    <span className="radiomark light-primary mr-2"></span>
                                                                    <span>None</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6"></div>

                                                    {formData.discount_type !== 'none' && (
                                                        <>
                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label" htmlFor="username">Discount Value</label>
                                                                    <input
                                                                        className="form-control"
                                                                        name="discount"
                                                                        type="text"
                                                                        value={formData.discount}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label" htmlFor="username">Package Price After Discount</label>
                                                                    <input
                                                                        className="form-control"
                                                                        name="finalCost"
                                                                        type="text"
                                                                        value={finalCost}
                                                                        readonly
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label" htmlFor="username">Billing Cycle</label>
                                                        <select 
                                                            className="form-select"
                                                            name="billing_cycle"
                                                            id="billing_cycle"
                                                            value={formData.billing_cycle}
                                                            onChange={handleChange} 
                                                        >
                                                            <option value="monthly" selected="">Monthly</option>
                                                            <option value="yearly">Yearly</option>
                                                            <option value="7">Trial (07 Days)</option>
                                                        </select>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Description</label>
                                                            <textarea
                                                                className="form-control h-100"
                                                                name="description"
                                                                type="text"
                                                                onChange={handleChange}
                                                                rows="4"
                                                            >{formData.description}</textarea>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-12 d-flex align-items-center justify-content-between mg-b-15">
                                                    <label className="form-label" htmlFor="username">Package Features</label>

                                                    <button 
                                                        type="button"
                                                        onClick={handleAddFeature} 
                                                        className="btn btn-light-primary btn-sm f-s-12 b-r-22 mg-s-5"
                                                    >
                                                        Add Feature
                                                    </button>
                                                </div>

                                                <div className="featureWrapper mb-3">
                                                    {features && features.map((feature, index) => (
                                                        <div 
                                                            key={feature.tempId} 
                                                            className="row g-2 align-items-center inline-form mg-b-20"
                                                        >
                                                            <div className="col-md-8">
                                                                <input 
                                                                    className="form-control" 
                                                                    placeholder="Feature" 
                                                                    type="text" 
                                                                    value={feature.text}
                                                                    onChange={(e) => handleFeatureChange(feature.tempId, 'text', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="col-md-3">
                                                                <label className="form-label mg-0">Avilability</label>
                                                                <div className="check-container d-flex gap-5">
                                                                    <label className="check-box mg-0">
                                                                        <input 
                                                                            name={`feature_status_${feature.tempId}`}
                                                                            value={1}
                                                                            type="radio" 
                                                                            checked={feature.available === 1}
                                                                            onChange={() => handleFeatureChange(feature.tempId, 'available', 1)}
                                                                        />
                                                                        <span className="radiomark light-primary mr-2"></span>
                                                                        <span>Available</span>
                                                                    </label>

                                                                    <label className="check-box mg-0">
                                                                        <input 
                                                                            name={`feature_status_${feature.tempId}`}
                                                                            value={0}
                                                                            type="radio" 
                                                                            checked={feature.available === 0}
                                                                            onChange={() => handleFeatureChange(feature.tempId, 'available', 0)}
                                                                        />
                                                                        <span className="radiomark light-primary mr-2"></span>
                                                                        <span>Not Available</span>
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            <div className="col-md-1 d-flex justify-content-end">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleRemoveFeature(feature.tempId)}
                                                                    className="btn btn-light-danger icon-btn b-r-4 mg-s-5"
                                                                >
                                                                    <Trash size={12} width={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {(!features || features.length === 0) && (
                                                        <p className="text-muted text-center py-2">Click 'Add Feature' to list package benefits.</p>
                                                    )}
                                                </div>

                                                <div className="col-md-12 mg-b-15">
                                                    <label className="form-label">Package Settings</label>
                                                </div>

                                                <div className="row">
                                                    {settings && Object.entries(settings).map(([key, setting]) => (
                                                        <div key={key} className="form-group col-md-4 mb-3">
                                                            <label className="form-label mg-0">{setting.label}</label>
                                                            <span className="f-s-10">{setting.description}</span>
                                                            {setting.type === 'number' && (
                                                                <input
                                                                    type="number"
                                                                    name={`settings[${key}]`} 
                                                                    className="form-control bg-gray rounded-half"
                                                                    placeholder={setting.label}
                                                                    onChange={handleSettingChange}
                                                                    value={settingsData[key] || setting.default}
                                                                />
                                                            )}

                                                            {setting.type === 'boolean' && (
                                                                <div className="form-check form-switch mt-1 p-0">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        name={`settings[${key}]`}
                                                                        id={`setting-checkbox-${key}`}
                                                                        checked={!!settingsData[key]}
                                                                        value="1"
                                                                        onChange={handleSettingChange}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={`setting-checkbox-${key}`}>{setting.description}</label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="d-flex align-items-center gap-30">
                                                    <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                        Save
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

export default Packages