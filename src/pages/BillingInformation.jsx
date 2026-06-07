import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    Bell,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../utils/icons';

const BillingInformation = () => {
    const navigate = useNavigate();

    const token  = localStorage.getItem('auth_token');

    //Initilizing form fields
    const formFields = {
        billing_name: "",
        billing_email: "",
        billing_phone: "",
        billing_address_1: "",
        billing_address_2: "",
        billing_city: "",
        billing_state: "",
        billing_zipcode: "",
        billing_country: "",
        billing_vat: "",
    }

    const [formData, setFormData] = useState(formFields);

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

    //Burger Menu
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [addActiveClass, setAddActiveClass]     = useState(false);
    const [burgerActive, setBurgerActive] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);

    const [showMessageError, setShowMessageError] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [showMessageSuccess, setShowMessageSuccess] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");

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


    //Get all countries
    const [countries, setCountries] = useState([]);
    
    const fetchCountriesData = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(apiRoutes.getCountries, {
                method: "GET",
                headers,
            });

            const result = await response.json();
            
            if (response.ok) {
                setCountries(result.countries);
            } else {
                console.error("Error fetching  data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } 
    };

    useEffect(() => {
        fetchCountriesData();
    }, []);

    /*
     * Get user billing details
     */
    const fetchBillingDetails = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(apiRoutes.getBillingDetails, {
                method: "GET",
                headers,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setFormData((prev) => ({
                    ...prev,
                    billing_name: result.data.billing_name || "",
                    billing_email: result.data.billing_email || "",
                    billing_phone: result.data.billing_phone || "",
                    billing_address_1: result.data.billing_address_1 || "",
                    billing_address_2: result.data.billing_address_2 || "",
                    billing_city: result.data.billing_city || "",
                    billing_state: result.data.billing_state || "",
                    billing_zipcode: result.data.billing_zipcode || "",
                    billing_country: result.data.billing_country || "",
                    billing_vat: result.data.billing_vat || "",
                }));
            } else {
                console.error("Error fetching billing details:", result.message);
            }
        } catch (error) {
            console.error("API error:", error);
        }
    };

    useEffect(() => {
        fetchBillingDetails();
    }, []);

    //Update billing details
    const handleSubmit = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };
         
            const response = await fetch(apiRoutes.updateBillingDetails, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setMessageText(result.message || "Billing information updated successfully!");
                setDisplayMessageSuccess(true);

                setTimeout(() => {
                    setShowMessageSuccess(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText("");
                }, 8000);
            } else {
                setMessageText(result.message || "Unable to update billing information.");
                setDisplayMessageError(true);

                setTimeout(() => {
                    setShowMessageError(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            setMessageText("Something went wrong. Please try again.");
            setDisplayMessageError(true);

            setTimeout(() => {
                setShowMessageError(false);
            }, 8000);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth' 
            });
            
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };


    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Billing Details</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href="/subscription" className="btn btn-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>

            <div className="col-lg-4 col-xxl-3">
                <div className="card">
                    <div className="card-body">
                        <div className="vertical-tab setting-tab">
                            <ul className="nav nav-tabs tab-light-primary">
                                <li className="nav-item" role="presentation">
                                    <a href="/account/billing/subscriptions" className="nav-link">
                                        <i className="ph-bold ph-bell-simple pe-2"></i>
                                        Subscription
                                    </a>
                                </li>

                                <li className="nav-item" role="presentation">
                                    <a href="/account/billing/payment-methods" className="nav-link">
                                        <i className="ph-bold ph-cards pe-2"></i>
                                        Payment Methods
                                    </a>
                                </li>

                                <li className="nav-item" role="presentation">
                                    <a href="/account/billing/details"className="nav-link active">
                                        <i className="ph-bold ph-wallet pe-2"></i>
                                        Billing Information
                                    </a>
                                </li>

                                <li className="nav-item" role="presentation">
                                    <a href="/account/billing/history" className="nav-link">
                                        <i className="ph-bold ph-receipt pe-2"></i>
                                        Payment History
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-lg-8 col-xxl-9">
                <div className="card">
                    <div className="card-header">
                        <h5>Manage payment method</h5>
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

                        <form method="POST" onSubmit={handleSubmit}>
                            <div className="app-form">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Fullname</label>
                                            <input
                                                className="form-control"
                                                name="billing_name"
                                                type="text"
                                                value={formData.billing_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Email</label>
                                            <input
                                                className="form-control"
                                                name="billing_email"
                                                type="text"
                                                value={formData.billing_email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Phone</label>
                                            <input
                                                className="form-control"
                                                name="billing_phone"
                                                type="tel"
                                                value={formData.billing_phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">VAT Number (Optional)</label>
                                            <input
                                                className="form-control"
                                                name="billing_vat"
                                                type="tel"
                                                value={formData.billing_vat}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Address Line 1</label>
                                            <input
                                                className="form-control"
                                                name="billing_address_1"
                                                type="tel"
                                                value={formData.billing_address_1}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Address Line 2 (Optional)</label>
                                            <input
                                                className="form-control"
                                                name="billing_address_2"
                                                type="tel"
                                                value={formData.billing_address_2}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">City</label>
                                            <input
                                                className="form-control"
                                                name="billing_city"
                                                type="tel"
                                                value={formData.billing_city}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">State / Province</label>
                                            <input
                                                className="form-control"
                                                name="billing_state"
                                                type="tel"
                                                value={formData.billing_state}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Zip / Postal Code</label>
                                            <input
                                                className="form-control"
                                                name="billing_zipcode"
                                                type="tel"
                                                value={formData.billing_zipcode}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="username">Country</label>
                                            <select
                                                className="form-control"
                                                name="billing_country"
                                                type="tel"
                                                value={formData.billing_country}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select Country</option>
                                                {countries.map((country, idx) => (
                                                    <option key={idx} value={country.name}>
                                                        {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-30">
                                        <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                            Update Billing
                                        </button>

                                        {btnLoader && (
                                            <div className="left d-flex align-items-center">
                                                <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                Processing
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div> 
        </AppLayout>
    )
}

export default BillingInformation;