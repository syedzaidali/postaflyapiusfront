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
    EyeClosed,
    Globe,
    Lock
  } from '../../utils/icons';

const UserSecuritySettings = () => {
    const navigate = useNavigate();
    const token  = localStorage.getItem('auth_token');
    
    //Define All Required constants
    const { user_id } = useParams();
    const [userSecuritySettings, setUserSecuritySettings] = useState([]);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    
    //Defining Page constants 
    const [displayMessageSuccess, setShowSuccessMessage] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [btnLoader, setBtnLoader] = useState(false);
    const [formLoader, setFormLoader] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    //Page functionalities

    //User password
    const isMatch = confirmPassword === newPassword && newPassword.length > 0;
    
    const checkPasswordRules = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const getPasswordStrength = (password) => {
        const rules = checkPasswordRules(password);

        const passed = Object.values(rules).filter(Boolean).length;

        if (passed <= 2) return "Weak";
        if (passed <= 4) return "Medium";

        return "Strong";
    };

    const PasswordRulesBox = ({ password }) => {
        const rules    = checkPasswordRules(password);
        const strength = getPasswordStrength(password);

        const renderRule = (label, valid) => (
            <div style={{ color: valid ? "green" : "red" }}>
            {valid ? <CheckCircle width="14" /> : <Xmark width="14" />} {label}
            </div>
        );

        return (
            <div className="p-4 border rounded mt-2 bg-light-subtle">
            {renderRule("Minimum 8 characters", rules.length)}
            {renderRule("At least one uppercase letter", rules.uppercase)}
            {renderRule("At least one lowercase letter", rules.lowercase)}
            {renderRule("At least one number", rules.number)}
            {renderRule("At least one special character", rules.special)}

            <div className="mt-2 fw-bold">
                Strength:{" "}
                <span
                style={{
                    color:
                    strength === "Weak"
                        ? "red"
                        : strength === "Medium"
                        ? "orange"
                        : "green",
                }}
                >
                {strength}
                </span>
            </div>
            </div>
        );
    };

    const fetchUserSettings = async () => {
        try {    
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.userSecuritySettings}/${user_id}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();
            
            if (result.success == true) {
                setUserSecuritySettings(result.data); 
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    };


    useEffect(() => {
        fetchUserSettings();
    }, []);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setBtnLoader(true);

        const url = apiRoutes.adminUpdateUserPassword;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            user_id : user_id,
            password: newPassword,
            confirm_password: confirmPassword,
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                if(result.success == false) {
                    if (result.errors) {
                        setErrors(result.errors); 
                    }
                        
                    setDisplayMessageError(true);
                    setMessageText(result.message || "Password update failed.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    setShowSuccessMessage(true);
                    setMessageText(result.message);

                    setTimeout(() => {
                        setShowSuccessMessage(false);
                        setMessageText("");
                    }, 8000);

                    setNewPassword("");
                    setConfirmPassword("");
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again later!");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            setBtnLoader(false);
        }
    };

    const handleAccountStatus = async (account_status) => {
        setFormLoader(true);

        const url = apiRoutes.updateUserAccountStatus;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            user_id : user_id,
            status: account_status,
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                if(result.success == false) {
                    setDisplayMessageError(true);
                    setMessageText(result.message || "Password update failed.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    setShowSuccessMessage(true);
                    setMessageText(result.message);

                    setUserSecuritySettings(prev => ({
                        ...prev,
                        user: {
                            ...prev.user,
                            status: account_status, 
                        }
                    }));
                    
                    setTimeout(() => {
                        setShowSuccessMessage(false);
                        setMessageText("");
                    }, 8000);
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again later!");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            setFormLoader(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoader(true);

        const url = apiRoutes.deleteTenantUser;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            user_id : user_id,
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                if(result.success == false) {
                    setDisplayMessageError(true);
                    setMessageText(result.message || "Password update failed.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText("");
                    }, 8000);
                } else {
                    navigate(`${ADMIN_ROUTE_PREFIX}/users`);
                }
            } else {
                if (result.errors) setErrors(result.errors);

                setDisplayMessageError(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText("");
                }, 8000);
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again later!");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        } finally {
            setDeleteLoader(false);
        }
    }

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">User Security Settings</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href={`${ADMIN_ROUTE_PREFIX}/user/payment-methods/` + user_id} className="btn btn-primary b-r-22">
                            Payment Methods
                        </a>
                        <a href={`${ADMIN_ROUTE_PREFIX}/user/billing-history/` + user_id} className="btn btn-primary b-r-22">
                            Payment History
                        </a>

                        <a href={`${ADMIN_ROUTE_PREFIX}/users`} className="btn btn-outline-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>   

            <div className="col-md-12">
                {displayMessageSuccess && (
                    <div className="col-12">
                        <div className="alert alert-light-success" role="alert">
                            {messageText}
                        </div>
                    </div>
                )}

                {displayMessageError && (
                    <div className="col-12">
                        <div className="alert alert-light-danger" role="alert">
                            {messageText}
                        </div>
                    </div>
                )}
                                    
            </div>

            <div className="col-md-7">
                <div className="card">
                    <div className="card-header">
                        <h5>Update Password</h5>
                    </div>

                    <div className="card-body">
                        <form method="POST" onSubmit={handlePasswordUpdate}>
                            <div className="app-form">
                                <div className='row'>                 
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">New Password</label>
                                            <div className="input-icon-btn">
                                                <input
                                                    className="form-control"
                                                    name="title"
                                                    type={passwordVisible ? "text" : "password"}
                                                    value={newPassword}
                                                    onFocus={() => setIsPasswordFocused(true)}
                                                    onBlur={() => setIsPasswordFocused(false)}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />

                                                <a 
                                                    href="#" 
                                                    onClick={(e) => {e.preventDefault(); setPasswordVisible(!passwordVisible)}} 
                                                    className={`icon-btn ${passwordVisible ? "text-primary" : "text-light"}`}
                                                >
                                                    {passwordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                </a>
                                            </div>                                                                

                                            {errors.password && (
                                                <small className="text-danger">{errors.password[0]}</small>
                                            )}

                                            {isPasswordFocused && <PasswordRulesBox password={newPassword} />}
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Confirm Password</label>
                                            <div className="input-icon-btn">
                                                <input
                                                    className="form-control"
                                                    name="title"
                                                    type={confirmPasswordVisible ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />

                                                <a 
                                                    href="#" 
                                                    onClick={(e) => {e.preventDefault(); setConfirmPasswordVisible(!confirmPasswordVisible)}} 
                                                    className={`icon-btn ${confirmPasswordVisible ? "text-primary" : "text-light"}`}
                                                >
                                                    {confirmPasswordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                </a>
                                            </div>

                                            {errors.password_confirmation && (
                                                <small className="text-danger">{errors.password_confirmation[0]}</small>
                                            )}

                                            {!isMatch && confirmPassword && !errors.password_confirmation && (
                                                <small className="text-danger">Passwords do not match.</small>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-30">
                                    <button type="submit" className="btn btn-primary b-r-22" disabled={btnLoader}>
                                        Update Password
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
                    </div>
                </div>
            </div>

            <div className="col-md-5">
                <div className="card">
                    <div className="card-header">
                        <h5>Account Status</h5>
                    </div>
                    
                    <div className="card-body">
                        <div className="app-form">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="username">Current Status</label>
                                        <p>
                                            <span
                                                className={`badge ${
                                                userSecuritySettings?.user?.status === 'active'
                                                    ? 'text-light-success'
                                                    : userSecuritySettings?.user?.status === 'pending'
                                                    ? 'text-light-warning'
                                                    : userSecuritySettings?.user?.status === 'suspended'
                                                    ? 'text-light-danger'
                                                    : 'text-light-warning'
                                                }`}
                                            >
                                                {userSecuritySettings?.user?.status === 'active'
                                                ? 'Active'
                                                : userSecuritySettings?.user?.status === 'pending'
                                                ? 'Pending'
                                                : userSecuritySettings?.user?.status === 'suspended'
                                                ? 'Suspended'
                                                : 'Deactivated'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    {formLoader && (
                                        <div className="left d-flex align-items-end">
                                            <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                            Processing
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-12 d-flex justify-content-between">
                                    <>
                                        {userSecuritySettings?.user?.status === "pending" && (
                                            <button
                                                className="btn btn-primary b-r-22"
                                                onClick={() => handleAccountStatus("active")}
                                            >
                                                Activate Account
                                            </button>
                                        )}

                                        {userSecuritySettings?.user?.status === "active" && (
                                            <>
                                                <button
                                                    className="btn btn-primary b-r-22"
                                                    onClick={() => handleAccountStatus("suspended")}
                                                >
                                                    Suspend Account
                                                </button>

                                                <button
                                                    className="btn btn-primary b-r-22"
                                                    onClick={() => handleAccountStatus("deactivated")}
                                                >
                                                    Deactivate Account
                                                </button>
                                            </>
                                        )}

                                        {userSecuritySettings?.user?.status === "suspended" && (
                                            <button
                                                className="btn btn-primary b-r-22"
                                                onClick={() => handleAccountStatus("active")}
                                            >
                                                Activate Account
                                            </button>
                                        )}

                                        {userSecuritySettings?.user?.status === "deactivated" && (
                                            <button
                                                className="btn btn-primary b-r-22"
                                                onClick={() => handleAccountStatus("active")}
                                            >
                                                Activate Account
                                            </button>
                                        )}
                                    </>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-6">
                <div className="card">
                    <div className="card-header">
                        <h5>Recent Login Activity</h5>
                    </div>
                    
                    <div className="card-body">
                        <div className="about-list mg-t-20">
                            <div>
                                <span className="fw-medium"><Calendar width={16} /> Last Login</span>
                                <span className="float-end f-s-13 text-secondary">{userSecuritySettings?.last_login_date}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><Globe width={16} /> IP Address</span>
                                <span className="float-end f-s-13 text-secondary">{userSecuritySettings?.lastLogin?.ip_address ?? "N/A"}</span>
                            </div>

                            <div>
                                <span className="fw-medium"><Lock width={16} /> Password Last Updated</span>
                                <span className="float-end f-s-13 text-secondary">{userSecuritySettings?.last_pass_change_date}</span>
                            </div>
                        </div>                    
                    </div>
                </div>
            </div>

            <div className="col-md-6">
                <div className="card">
                    <div className="card-header">
                        <h5>Danger Zone</h5>
                    </div>
                    
                    <div className="card-body">
                        <p className="text-muted mb-3">
                            Deleting this user will permanently remove all their data, including transactions, customers, and history.
                        </p>

                        <div className="d-flex align-items-center gap-30">
                            <button type="button" onClick={() => handleDeleteAccount()} class="btn btn-danger b-r-22">                                
                                <Trash width={16} /> Permanently Delete User
                            </button>

                            {deleteLoader && (
                                <div className="left d-flex align-items-center">
                                    <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                    Processing
                                </div>
                            )}
                        </div>                        
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default UserSecuritySettings;