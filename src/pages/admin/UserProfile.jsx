import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams  } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    Calendar,
    Search,
    Edit,
    Trash,
    CheckCircle,
    Xmark,
    Eye,
    CreditCard,
    Mail,
    User
  } from '../../utils/icons';

const UserProfile = () => {
    const navigate = useNavigate();
    const token  = localStorage.getItem('auth_token');
    
    //Define All Required constants
    const { user_id } = useParams();

    const [userProfile, setUserProfile] = useState([]);
    const [billing, setBilling] = useState([]);
    const [subscription, setSubscription] = useState([]);

    const fetchUser = async () => {
        try {    
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.userProfile}/${user_id}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (result.status == true) {
                setUserProfile(result.data); 

                setSubscription(result.data.subscription);
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    };

    const fetchBillingDetails = async () => {
        try {    
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getUserBillingDetails}/${user_id}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (result.status == true) {
                setBilling(result.data); 
                console.log(JSON.stringify(result));
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } 
    };
    
    useEffect(() => {
        fetchUser();
        fetchBillingDetails();
    }, []);

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Users Management</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href={`${ADMIN_ROUTE_PREFIX}/user/payment-methods/` + userProfile.id} className="btn btn-primary b-r-22">
                            Payment Methods
                        </a>
                        <a href={`${ADMIN_ROUTE_PREFIX}/user/billing-history/` + userProfile.id} className="btn btn-primary b-r-22">
                            Payment History
                        </a>
                        <a href={`${ADMIN_ROUTE_PREFIX}/user/security-settings/` + userProfile.id} className="btn btn-primary b-r-22">
                            Security
                        </a>

                        <a href={`${ADMIN_ROUTE_PREFIX}/users`} className="btn btn-outline-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>   

            <div className="col-md-4">
                <div className="card">
                    <div className="card-body">
                        <center className="m-t-30">
                            <h5 className="f-w-600 mg-b-5">{userProfile.name} &nbsp;
                                <img alt="instagram-check-mark" className="w-20 h-20" src="/images/profile-app/01.png" />
                            </h5>
                            
                            <p>{userProfile.account_type === 'transaction_email'
                                                    ? 'Transaction Email'
                                                    : 'Email Marketing'}</p>
                            <h5 className="card-subtitle mg-b-15 f-s-12">
                                Member since : {userProfile.joined_at}
                            </h5>
                            
                            <span className={`badge ${
                                subscription.status === 'Free Member'
                                    ? 'text-light-warning'
                                    : subscription.status === 'active'
                                    ? 'text-light-success'
                                    : 'text-light-danger'
                            }`}>
                                {subscription.status}
                            </span>
                        </center>
                       
                        <div className="about-list mg-t-20">
                            <div>
                                <span className="fw-medium"><Mail width={16} /> Email</span>
                                <span className="float-end f-s-13 text-secondary">{userProfile.email}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><User width={16} /> Username</span>
                                <span className="float-end f-s-13 text-secondary">@{userProfile.username}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><User width={16} /> Plan</span>
                                <span className="float-end f-s-13 text-secondary">{subscription.plan_name}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><Calendar width={16} /> Subscription Start Date</span>
                                <span className="float-end f-s-13 text-secondary">{subscription.start_date}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><Calendar width={16} /> Subscription End Date</span>
                                <span className="float-end f-s-13 text-secondary">{subscription.end_date}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><Calendar width={16} /> Billing Cycle</span>
                                <span className="float-end f-s-13 text-secondary">{subscription.cycle}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><CreditCard width={16} /> Amount</span>
                                <span className="float-end f-s-13 text-secondary">${parseFloat(subscription.amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-8">
                <div className="card">
                    <div className="card-header">
                        <h5>Billing Information</h5>
                    </div>
                    
                    <div className="card-body">
                        <div className="app-form">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Fullname</label>
                                        <p>{billing.billing_name}</p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Email</label>
                                        <p>{billing.billing_email}</p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Phone</label>
                                        <p>{billing.billing_phone}</p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">VAT Number</label>
                                        <p>{billing.billing_vat}</p>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Address Line 1</label>
                                        <p>{billing.billing_address_1}</p>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Address Line 2</label>
                                        <p>{billing.billing_address_2}</p>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">City</label>
                                        <p>{billing.billing_city}</p>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">State / Province</label>
                                        <p>{billing.billing_state}</p>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Zip / Postal Code</label>
                                        <p>{billing.billing_zipcode}</p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Country</label>
                                        <p>{billing.billing_country}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default UserProfile