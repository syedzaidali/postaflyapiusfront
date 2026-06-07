import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import {
    Eye,
    EyeClosed,
    UserCircle,
    Lock,
    Xmark,
    CheckCircle
  } from '../../utils/icons';

const Profile = () => {
    const navigate = useNavigate();

    const token  = localStorage.getItem('auth_token');
    const name   = localStorage.getItem('name') || '';

    //Initilizing form fields
    const [firstName , setFirstName] = useState("");
    const [lastName , setLastName] = useState("");
    const [email, setEmail]        = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [profileInfo, setProfileInfo] = useState([]);

    //Defining Page constants 
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [btnLoader, setBtnLoader] = useState(false);
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    //Page functionalities
    const getInitials = (name = "") =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

    const getColorFromName = (name = "") => {
        const colors = ["#FF5722", "#4CAF50", "#3F51B5", "#9C27B0", "#00BCD4"];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const initials = getInitials(name);
    const bgColor  = getColorFromName(name);

    const [activeTab, setActiveTab] = useState('basic');

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);

        window.history.pushState(null, '', `#${tabName}`);
    };

    useEffect(() => {
        let initialTab = window.location.hash.substring(1); 
        
        if (initialTab && (initialTab === 'basic' || initialTab === 'password')) {
            setActiveTab(initialTab);
        }
        
        if (!window.location.hash) {
            window.history.replaceState(null, '', `#${activeTab}`);
        }
    }, []);

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
        const rules = checkPasswordRules(password);
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

    const getInputClass = (field) => {
        const baseClass = "form-control bg-gray rounded-half";
        if (errors[field]) return `${baseClass} is-invalid`;
        if (field === 'confirmPassword' && confirmPassword) {
            return `${baseClass} ${isMatch ? 'is-valid' : 'is-invalid'}`;
        }
        return baseClass;
    };

    /*
     * Api Calls
     */
    //Fetch User Information    
    const fetchProfileData = async (page = 1) => {
        try {
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            };

            const url = apiRoutes.userData;

            const response = await fetch(url, {
                method: "POST",
                headers,
            });

            const result = await response.json();
            
            if (response.ok) {
                const fullName = result.data.user.name || '';
                const nameParts = fullName.trim().split(' ');
                const first = nameParts[0] || '';
                const last = nameParts.slice(1).join(' ') || '';
                setFirstName(first);
                setLastName(last);
                setEmail(result.data.user.email || '');
            } else {
                console.error("Error fetching  data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } 
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const url = apiRoutes.updateUserInfo;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const fullName = `${firstName} ${lastName}`.trim();

        const payload = {
            name: fullName,
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccessMessage(true);
                setMessageText("Profile updated successfully!");

                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setMessageText("");
                }, 8000);

                fetchProfileData();
            } else {
                setDisplayMessageError(true);
                setMessageText(result.message || "Failed to update profile.");

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
                setMessageText("");
            }, 8000);
        } finally {
            setBtnLoader(false);
            setBtnDisabled(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setBtnLoader(true);
        setBtnDisabled(true);

        const url = apiRoutes.updateUserPassword;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        const payload = {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmPassword,
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
                }
                
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                if (result.errors) setErrors(result.errors);

                setShowSuccessMessage(true);
                setMessageText(result.message || "Password update failed.");

                setTimeout(() => {
                    setShowSuccessMessage(false);
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
            setBtnDisabled(false);
        }
    };

    return <div>
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">My Account</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-primary b-r-22">
                            Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Account Settings</h5>
                            </div>
                        </div>
                        
                        <div className="card-body">
                            <div className='row'>
                                <div className='col-md-7'>
                                    <ul className="nav nav-tabs tab-light-primary" role="tablist">
                                        <li className="nav-item">
                                            <a
                                                className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                                                href="#basic"
                                                onClick={(e) => {
                                                e.preventDefault();
                                                    handleTabClick('basic');
                                                }}
                                            >
                                                <UserCircle width={16} /> &nbsp; Basic Info
                                            </a>
                                        </li>

                                        <li className="nav-item">
                                            <a
                                                className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                                                href="#password"
                                                onClick={(e) => {
                                                e.preventDefault();
                                                handleTabClick('password');
                                                }}
                                            >
                                                <Lock width={16} /> &nbsp; Change Password
                                            </a>
                                        </li>
                                    </ul>

                                    <div className="tab-content">
                                        {showSuccessMessage && (
                                            <div className="badge text-light-success mb-3 mt-2 pt-3 pb-3 pa-s-20 pa-e-20" role="alert">
                                                <CheckCircle size='20' /> {messageText}
                                            </div>
                                        )}

                                        {displayMessageError && (
                                            <div className="badge text-light-danger mb-3 mt-2 pt-3 pb-3 pa-s-20 pa-e-20" role="alert">
                                                <i className="ti ti-circle-x text-danger f-s-16 me-1"></i> {messageText}
                                            </div>
                                        )}

                                        <div
                                            className={`tab-pane ${activeTab === 'basic' ? 'active' : ''}`}
                                            id="basic"
                                            role="tabpanel"
                                        >
                                            <form method="POST" encType="multipart/form-data" onSubmit={ handleSubmit }>
                                                <div className="app-form">
                                                    <h4 className="box-title mb-5">Personal Info</h4>

                                                    <div className='row'>
                                                        <div className='col-md-3'>
                                                            <div className="mb-3 col-md-12">
                                                                <div className='h-120 w-120 d-flex-center b-rounded f-s-32 text-white' style={{
                                                                    backgroundColor: bgColor
                                                                }}
                                                                >{initials}</div>
                                                            </div>
                                                        </div>

                                                        <div className='col-md-9'>
                                                            <div className="row">
                                                                <div className="col-md-6">
                                                                    <div className="mb-3">
                                                                        <label className="form-label">First Name</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="title"
                                                                            type="text"
                                                                            value={firstName}
                                                                            onChange={(e) => setFirstName( e.target.value) }
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="col-md-6">
                                                                    <div className="mb-3">
                                                                        <label className="form-label">Last Name</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="title"
                                                                            type="text"
                                                                            value={lastName}
                                                                            onChange={(e) => setLastName( e.target.value) }
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="col-md-6">
                                                                    <div className="mb-3">
                                                                        <label className="form-label">Email</label>
                                                                        <input
                                                                            className="form-control"
                                                                            name="title"
                                                                            type="text"
                                                                            value={email}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="d-flex align-items-center gap-30">
                                                                <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                                                    Update Profile
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
                                                </div>
                                            </form>
                                        </div>

                                        <div
                                            className={`tab-pane ${activeTab === 'password' ? 'active' : ''}`}
                                            id="password"
                                            role="tabpanel"
                                        >
                                            <form method="POST" onSubmit={handlePasswordUpdate}>
                                                <div className="app-form">
                                                    <h4 className="box-title mb-5">Change Password</h4>

                                                    <div className='row'>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Current Password</label>
                                                                <div className="input-icon-btn">
                                                                    <input
                                                                        className="form-control"
                                                                        name="title"
                                                                        type={currentPasswordVisible ? "text" : "password"}
                                                                        value={currentPassword}
                                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                                    />

                                                                    <a 
                                                                        href="#" 
                                                                        onClick={(e) => {e.preventDefault(); setCurrentPasswordVisible(!currentPasswordVisible)}} 
                                                                        className={`icon-btn ${currentPasswordVisible ? "text-primary" : "text-light"}`}
                                                                    >
                                                                        {currentPasswordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                                                    </a>
                                                                </div>

                                                                {errors.current_password && (
                                                                    <small className="text-danger">{errors.current_password[0]}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="col-md-6"></div>

                                                        <div className="col-md-6">
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

                                                                {isPasswordFocused && password && <PasswordRulesBox password={newPassword} />}
                                                            </div>
                                                        </div>

                                                        <div className="col-md-6">
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
                                                        <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>      
        </AppLayout>
    </div>
}

export default Profile;