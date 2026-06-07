import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from 'axios';
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

const Subscriptions = () => {
    const navigate = useNavigate();

    const token  = localStorage.getItem('auth_token');

    /*
     * Get user subscription details
     */
    //Fetch subscription details
    const [subscription, setSubscription]     = useState([]);
    const [packages, setPackages]             = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [isCurrentPlan, setIsCurrentPlan]   = useState(null);
    const [reqLoader, setReqLoader] = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);

    //Defining sucess and error mesages const stats
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");

    /*
     * Page functionalities
     */
    const handlePlanSelection = (packageId) => {
        setSelectedPlanId(packageId);
    };
    
    const fetchSubscriptionData = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(apiRoutes.getCurrentSubscription, {
                method: "GET",
                headers,
            });

            const result = await response.json();

            if (response.ok) {
                setSubscription(result.data);
                setIsCurrentPlan(result.data.package_id);
                setSelectedPlanId(result.data.package_id);
            } else {
                console.error("Error fetching  data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } 
    };

    const fetchPackagesData = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(apiRoutes.getUserPackages, {
                method: "GET",
                headers,
            });

            const result = await response.json();
            
            if (response.ok) {
                setPackages(result.packages);
            } else {
                console.error("Error fetching  data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } 
    };

    useEffect(() => {
        fetchSubscriptionData();
        fetchPackagesData();
    }, []);

    const handleChangePlan = async (pkgId, upgrade) => {
        setReqLoader(true);
        setBtnDisabled(true);
        console.log(pkgId);
        try {
            const url = (upgrade ? apiRoutes.userPackageUpgrade : apiRoutes.userPackageDowngrade);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ package_id: pkgId }),
            });

            const result = await response.json();
           
            if (response.ok) {
                fetchSubscriptionData(); 

                setMessageText(result.message || "Plan upgraded successfully!");
                setDisplayMessageSuccess(true);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText("");
                }, 8000);

            } else {
                setMessageText(result.message || "Plan change failed");
                setDisplayMessageError(true);


                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            setMessageText("Change plan error: " + error);
            setDisplayMessageError(true);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setReqLoader(false);
            setBtnDisabled(false);
        }
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Manage Subscripitons</h4>
                </div>
            </div>

            <div className="col-lg-4 col-xxl-3">
                <div className="card">
                    <div className="card-body">
                        <div className="vertical-tab setting-tab">
                            <ul className="nav nav-tabs tab-light-primary">
                                <li className="nav-item" role="presentation">
                                    <a href="/account/billing/subscriptions" className="nav-link active">
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
                                    <a href="/account/billing/details"className="nav-link">
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
                        <div className="d-flex justify-content-between align-items-center m-b-40">
                            <h5>Subscription</h5>

                            <p className='card-info-lg m-b-15'>Next payment: {subscription.next_billing}</p>
                        </div>
                    </div>


                    <div className="card-body">
                        <div className="subscription-plan">
                            <div className="plan-choose">
                                <h6 className="mb-0">Choose plan</h6>
                            </div>

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

                            {packages.length > 0 ? (
                                packages.map((pkg, index) => (
                                    <div className="form-selectgroup mt-5 pkg-item">
                                        <div className="select-item" key={pkg.id}>
                                            <input
                                                value={pkg.id} 
                                                checked={pkg.id === selectedPlanId}
                                                onChange={() => handlePlanSelection(pkg.id)}
                                                className="form-check-input form-check-primary w-20 h-20"
                                                id={`planCheckbox${index}`}
                                                name="planoption" 
                                                type="radio"
                                            />
                                            <label 
                                                className="form-check-label"
                                                htmlFor={`planCheckbox${index}`}
                                            >
                                                <span className="d-flex align-items-center">
                                                    <span className="ms-2">
                                                        <span className="fs-6 mb-0">
                                                            {pkg.name}
                                                            {isCurrentPlan == pkg.id && (
                                                                <span className="badge bg-light-success text-light-success ms-2">Current</span>
                                                            )}
                                                        </span>
                                                        <span className="d-block text-secondary mb-0">
                                                            {pkg.description}
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                            <div className="select-item-2 ms-2 text-right">
                                                <h6 className="fs-6 mb-0">
                                                    {pkg.price === "0.00" ? "FREE" : `$${parseFloat(pkg.price).toFixed(2)}`}
                                                </h6>
                                                <p className="text-secondary">
                                                    <div className="pricing-content">
                                                    <ul className="pricing-list">
                                                    {pkg.features.map((feature, index) => (
                                                        <li>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                    </ul>
                                                    </div>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                ))
                            ) : (
                                <div className="p-3 text-center text-secondary">No subscription plans available.</div>
                            )}   

                            {(() => {
                                const selectedPackage = packages.find(pkg => pkg.id === selectedPlanId);
                                const currentPlan     = packages.find(pkg => pkg.id === isCurrentPlan);
                                
                                if (selectedPackage && selectedPlanId !== subscription?.package_id) {
                                    
                                    const isUpgrade = subscription && parseFloat(selectedPackage.price) > parseFloat(currentPlan.price || 0);

                                    return (
                                        <div className="d-flex justify-content-end mt-4">
                                            <button
                                                onClick={() => handleChangePlan(selectedPlanId, isUpgrade)}
                                                className={`btn ${isUpgrade ? 'btn-light-primary' : 'btn-light-danger'} b-r-22`}
                                                disabled={btnDisabled}
                                            >
                                                {isUpgrade ? 'Upgrade' : 'Downgrade'} Plan
                                            </button>

                                            {reqLoader && (
                                                <div className="left d-flex align-items-center">
                                                    <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                    Processing
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>                     
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default Subscriptions;