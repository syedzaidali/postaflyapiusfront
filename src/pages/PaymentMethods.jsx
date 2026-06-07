import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import StripeProvider from "../libs/stripe/StripeProvider";
import CardForm from "../components/CardForm";
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

const PaymentMethods = () => {
    const navigate = useNavigate();

    const token  = localStorage.getItem('auth_token');

    //Burger Menu
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [addActiveClass, setAddActiveClass]     = useState(false);
    const [burgerActive, setBurgerActive] = useState(false);
    const [loading, setLoading]             = useState(true);
    const [reqLoader, setReqLoader]         = useState(false);

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

    const closeMenu = () => {
        setAddActiveClass(false);;

        setTimeout(() => {
            setShowPaymentForm(false);
            setBurgerActive(false);
            document.body.classList.remove("fixed-body");
        }, 500);
    };

    const openPaymentForm = () => {

        setTimeout(() => {
            setShowPaymentForm(true);
        }, 400);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

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

    
    /*
     * Get user subscription details
     */
    //Fetch subscription details
    const [paymentMethods, setPaymentMethods] = useState([]);
    
    const fetchPaymentMethodsData = async () => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const response = await fetch(apiRoutes.getPaymentMethods, {
                method: "GET",
                headers,
            });

            const result = await response.json();
            
            if (response.ok) {
                setPaymentMethods(result.methods);
            } else {
                console.error("Error fetching  data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } 
    };

    useEffect(() => {
        fetchPaymentMethodsData();
    }, []);

    //Update card status
    const handleSetDefault = async (paymentMethodId, setDefault) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const body = { 
                payment_method_id: paymentMethodId,
                set_default: setDefault
            };

            const response = await fetch(apiRoutes.setPaymentMethodDefault, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (result.success) {
                fetchPaymentMethodsData(); 

                setMessageText(result.message || "Payment method added successfully!");
                setDisplayMessageSuccess(true);
                
                setTimeout(() => {
                    setShowMessageSuccess(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText("");
                }, 8000);
            } else {
                setMessageText(result.message || "Unable to set default payment method.");
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
        }
    };

    const handleDeleteMethod = async (paymentMethodId) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const body = { 
                payment_method_id: paymentMethodId
            };

            const response = await fetch(apiRoutes.deletePaymentMethod, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (result.success) {
                fetchPaymentMethodsData(); 

                setMessageText(result.message || "Payment method deleted successfully!");
                setDisplayMessageSuccess(true);
                
                setTimeout(() => {
                    setShowMessageSuccess(false);
                }, 8000);

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText("");
                }, 8000);
            } else {
                setMessageText(result.message || "Unable to delete payment method.");
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
        }
    } 

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Payment Methods</h4>
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
                                    <a href="/account/billing/payment-methods" className="nav-link active">
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

                        <div className='methodBoxWrapper'>
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((method, index) => (
                                <div className='methodRow has-btns-overlay' key={index}>
                                    <div className="overlayButtons overlayH">
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault(); 
                                            handleDeleteMethod(method.id);
                                        }} className="btnOverlay bg-lt-grey bg-light-danger delete-media">
                                            <Trash width={12} /> Delete Payment Method
                                        </a>
                                    </div>

                                    <div className='cardIcon'>
                                        <img src={`/images/${method.card_icon}.svg`} alt={method.card_type} />
                                    </div>

                                    <div className='infoCard'>
                                        <h2>{method.card_type} {method.last4}</h2>
                                        <span><strong>Card Expiry : </strong> {method.card_expiry}</span>
                                        <label className={`badge ${method.card_status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                                            {method.card_status.charAt(0).toUpperCase() + method.card_status.slice(1)}
                                        </label>
                                    </div>

                                    <div className='box-inputs'>
                                        <div className="d-flex align-items-center">
                                            <div className="form-switch d-flex">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`payment_method_${index}`}
                                                    checked={method.is_default}
                                                    onChange={(e) => handleSetDefault(method.id, e.target.checked)}
                                                />
                                                <label htmlFor={`payment_method_${index}`}></label>
                                            </div>
                                            <label className="form-check-label" htmlFor={`payment_method_${index}`}>
                                                Set As Default
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <h2 className="not-found wd-100">
                                    <i className="ti-na"></i>
                                    <span className="f-s-16 f-fw-400">No payment methods created.</span>      
                                </h2>
                            )}
                        </div>
                        
                        <button onClick={() => openPaymentForm()} className='btn btn-primary b-r-22 f-s-12'>Add Payment Method</button>
                    </div>
                </div>
            </div>
            
            {burgerActive && (
                <div className={`burger-menu ${addActiveClass ? "active-in" : ""}`}>
                    <div className="burger-menu-wrapper">
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={closeMenu}>
                            <i className="ti-close"></i>
                        </a>

                        <div className="col-wrapper-full">
                            <div className="col-md-12">
                                <div className="card">
                                    <div className="card-body full-loader">
                                        <div className="row">
                                            {showPaymentForm && (
                                                <div className="col-md-12">
                                                    <h2 className="card-title">Add Payment Method</h2>

                                                    <StripeProvider>
                                                        <CardForm
                                                            setReqLoader={setReqLoader}
                                                            setShowMessageSuccess={setShowMessageSuccess}
                                                            setDisplayMessageSuccess={setDisplayMessageSuccess}
                                                            setDisplayMessageError={setDisplayMessageError}
                                                            setShowMessageError={setShowMessageError}
                                                            setMessageText={setMessageText}
                                                            closeMenu={closeMenu}
                                                            fetchPaymentMethodsData={fetchPaymentMethodsData}
                                                        />
                                                    </StripeProvider>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}    
        </AppLayout>
    )
}

export default PaymentMethods;