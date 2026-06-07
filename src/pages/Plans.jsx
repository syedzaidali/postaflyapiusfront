import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../Layout';

const Plans = () => {
    const navigate = useNavigate();

    const ApiUrl = "https://api.dgsignpros.com/api/v1";
    const token  = localStorage.getItem('auth_token');

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


    /*
     * Get user subscription details
     */
    //Fetch subscription details
    const [packages, setPackages] = useState([]);
    
    const fetchPackagesData = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const url = ApiUrl + `/packages/all`;

            const response = await fetch(url, {
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
        fetchPackagesData();
    }, []);

    const iconMap = {
        "Free Trial": null,
        "Core": "basic.svg",
        "Pro": "pro.svg",
        "Enterprise": "enterprise.svg",
    };

    //Fetch subscription details
    const [subscription, setSubscription] = useState([]);
    
    const fetchSubscriptionData = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const url = ApiUrl + `/subscriptions/current`;

            const response = await fetch(url, {
                method: "GET",
                headers,
            });

            const result = await response.json();
            
            if (response.ok) {
                setSubscription(result.data);
            } else {
                console.error("Error fetching  data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } 
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    const getTierIndex = (pkgId) => {
        return packages.findIndex((pkg) => pkg.id === pkgId);
    };

    const isUpgrade = (currentId, targetId) => {
        const current = getTierIndex(currentId);
        const target = getTierIndex(targetId);
        return target > current;
    };

    const handleChangePlan = async (pkgId, upgrade) => {
        try {
            const url = ApiUrl + (upgrade ? "/subscriptions/upgrade" : "/subscriptions/downgrade");

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
                    setShowMessageSuccess(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText("");
                }, 8000);

            } else {
                setMessageText(result.message || "Plan change failed");
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
            setMessageText("Change plan error: " + error);
            setDisplayMessageError(true);

            setTimeout(() => {
                setShowMessageError(false);
            }, 8000);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    };

    return <div>
        <Layout>
            <div className="row page-titles">
                <div className="col-md-12 flex items-center justify-between">
                    <h4 className="text-themecolor">Change Plan</h4>

                    <div className="btn-row-inline d-flex gap-10">
                        <button className="btn btn-info btn-rounded" onClick={() => navigate('/dashboard')}>Back</button>
                    </div>
                </div>
            </div>

            <div className="row">
                {packages.map((pkg, index) => (
                    <div className="col-md-3" key={pkg.id}>
                        <div className={`pricing-block ${pkg.name === "Free Trial" ? "pricing-tier-free" : ""}`}>
                            <div className="inner-pricing">
                                <div className="pricing-header">
                                    {iconMap[pkg.name] && (
                                        <img
                                            src={`https://dgsignpros.com/assets/images/${iconMap[pkg.name]}`}
                                            alt={`${pkg.name} plan icon`}
                                        />
                                    )}
                                    <h3>{pkg.name}</h3>
                                    {pkg.name === "Free Trial" && <span>{pkg.description}</span>}
                                </div>

                                {pkg.name === "Free Trial" ? (
                                    <>
                                        <h4>Try any plan for free</h4>
                                        <div className="spec-desc">
                                            <p>{pkg.features || "Perfect for trying all our great features before a bigger deployment."}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="spec-desc">
                                            <p>{pkg.description}</p>
                                        </div>

                                        <div className="price-box">
                                            <span>From</span>
                                            <div className="price-data">
                                                <h2>${parseFloat(pkg.price).toFixed(2)}</h2>
                                                <p>per screen / month + VAT</p>
                                            </div>
                                            <p>No minimum screens</p>
                                        </div>

                                        <div className="features-wrapper">
                                            <h5>Features</h5>
                                            <ul>
                                                {(Array.isArray(pkg.features) ? pkg.features : []).map((feature, idx) => (
                                                    <li key={idx}>{feature}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}

                                {subscription.package_id === pkg.id ? (
                                    <div className="btn btn-outline-info btn-rounded">
                                        Current Plan
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-info btn-rounded"
                                        onClick={() => handleChangePlan(pkg.id, isUpgrade(subscription.package_id, pkg.id))}
                                    >
                                        {isUpgrade(subscription.package_id, pkg.id) ? "Upgrade Now" : "Change Plan"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>      

            {displayMessageSuccess && (
                <div className={`success-box message-box ${showMessageSuccess ? "messageShow" : ""}`}>
                    <div className="dot"></div>
                    <div className="dot two"></div>

                    <div className="face faceSuccess">
                        <img src="/assets/images/icon-happy.png" />
                    </div>

                    <div className="shadow scale"></div>

                    <div className="message">
                        <h1>Success!</h1>
                        <p>{messageText}</p>
                    </div>
                </div>
            )}

            {displayMessageError && (
                <div className={`error-box message-box ${showMessageError ? "messageShow" : ""}`}>
                    <div className="dot"></div>
                    <div className="dot two"></div>

                    <div className="face">
                        <i className="ti-face-sad"></i>
                    </div>

                    <div className="shadow move"></div>

                    <div className="message">
                        <h1>Error!</h1>
                        <p>{messageText || "Something went wrong!"}</p>
                    </div>
                </div>
            )}
        </Layout>
    </div>
}

export default Plans;