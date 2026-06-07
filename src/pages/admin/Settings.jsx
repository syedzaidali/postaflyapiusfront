import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import {
    UserPlus,
    Search,
    Eye,
    EyeClosed,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../../utils/icons';

const Settings = ({ updateAppLogo }) => {
    const navigate = useNavigate();

    const token  = localStorage.getItem('auth_token');
    
    //Defining burger menu and loader const stats 
    const [btnLoader, setBtnLoader]     = useState(false);
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    //Defining sucess and error mesages const stats
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");

    //Initializing Error  / Success Messages
    useEffect(() => {
        if (displayMessageError) {
            const timer = setTimeout(() => {
                setDisplayMessageError(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setMessageText(false); 
        }

        if (displayMessageSuccess) {
            const timer = setTimeout(() => {
                setDisplayMessageSuccess(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setMessageText(false); 
        }
    }, [displayMessageError, displayMessageSuccess]);

    //Data Constants
    const [settingsData, setSettingsData] = useState([]);
    const [logoUrl, setLogoUrl]    = useState("/images/image-preview.png");
    const [faviconUrl,setFaviconUrl]    = useState("/images/image-preview.png");
    const [files, setFiles] = useState({});

    //Initilizing form fields
    const formFields = {
        sandbox_api_key: "",
        sandbox_api_secret: "",
        live_api_key: "",
        live_api_secret: "",
        payment_mode: "sandbox",
        email_from_name: "",
        email_from_email: "",
        smtp_host: "",
        smtp_port: "",
        smtp_username: "",
        smtp_password: "",
        smtp_encryption: "",
        captcha_enabled: false, 
        two_fa_email_enabled: false,
        two_fa_email_admin_enabled: false, 
        captcha_site_key: "",
        captcha_secret_key: "",
        min_password_length: 8,
    }

    const [formData, setFormData] = useState(formFields);

    //Form Functionalities
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData((prev) => {
            if (type === "checkbox") {
                if (name === "payment_mode") {
                    return {
                        ...prev,
                        [name]: checked ? "live" : "sandbox",
                    };
                }

                return {
                    ...prev,
                    [name]: checked,
                };
            }

            return {
                ...prev,
                [name]: value,
            };
        });
    }

    const logoInputRef = useRef(null);
    const faviconInputRef = useRef(null);

    const handleFileSelect = async (e, name) => {
        const file = e.target.files[0];
       
        if (!file) return;

        const errors = validateFile(file);

        if (errors.length > 0) {
            setDisplayMessageError(true);
            setMessageText(errors.join(" "));

            setTimeout(() => setDisplayMessageError(false), 12000);
            return;
        }

        setFiles((prev) => ({ ...prev, [name]: file }));

        await uploadFile(name, file);

        if (name === "logo" && logoInputRef.current) {
            logoInputRef.current.value = "";
        }
        if (name === "favicon" && faviconInputRef.current) {
            faviconInputRef.current.value = "";
        }

        setFiles(prev => ({ ...prev, [name]: null }));
    };

    const MAX_SIZE_MB = 2;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    const validateFile = (file) => {
        const maxSize = MAX_SIZE_MB * 1024 * 1024;
        const errors = [];

        if (!file) {
            errors.push("No file selected.");
            return errors;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            errors.push("Unsupported file type. Allowed: JPG, PNG, WEBP.");
        }

        if (file.size > maxSize) {
            errors.push(`File exceeds limit of ${MAX_SIZE_MB}MB.`);
        }

        return errors;
    };

    //Api Calls & form Process
    // Handle file upload
    const uploadFile = async (name, file) => {
        setUploadProgress(0);

        const formData = new FormData();
       
        formData.append(name, file);   // ✅ use passed file
        formData.append("type", name);

        try {
            const response = await axios.post(apiRoutes.updateBranding, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            });

            const uploadedData = response.data.data;

            const type = uploadedData.file_type; 

            if(type == 'logo') {
                setLogoUrl(uploadedData.file_path);
            } else {
                setFaviconUrl(uploadedData.file_path);
            }

            setDisplayMessageSuccess(true);
            setMessageText(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully!`);

            setTimeout(() => {
                setDisplayMessageSuccess(false);
                setMessageText('');
            }, 8000);
        } catch (error) {
            console.log(JSON.stringify(error));
            const res = error.response?.data;
            const errorMessages = res?.errors
                ? Object.values(res.errors).flat().join(", ")
                : "Upload failed";

            setDisplayMessageError(true);
            setMessageText(errorMessages);

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText('');
            }, 8000);
        } finally {
            setUploadProgress(0);
        }
    };

    const getAllSettingsData = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getAllSettings}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            console.log(JSON.stringify(result));
            if (result.status) {
                setLogoUrl(result.data.site_logo);
                setSettingsData(result.data);

                setFormData(prevFormData => ({
                    ...prevFormData, 
                    ...result.data  
                }));
            } else {
                console.error('Error : ' + JSON.stringify(result));
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    }

    useEffect(() => {
        getAllSettingsData();
    }, []);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setBtnLoader(true);

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
        
        try {
            const response = await fetch(apiRoutes.updateSettings, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setDisplayMessageSuccess(true);
                setMessageText("Settings updated successfully!");

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                }, 8000);
            } else {
                setDisplayMessageError(true);
            
                setMessageText(result.message || "Failed to create user. Please try again.");;

                setTimeout(() => {
                    setDisplayMessageError(false);
                }, 8000);
            }
        } catch (error) {
            setDisplayMessageError(true);
            
            setMessageText("An unexpected error occurred. Please try again.");

            setTimeout(() => {
                setDisplayMessageError(false);
            }, 8000);
        } finally {
            setBtnLoader(false);
        }
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Settings</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <a href="/dashboard" className="btn btn-primary b-r-22">
                            Back
                        </a>
                    </div>
                </div>
            </div>  

            <div className="col-lg-12">
                <div className="card">
                    <div className="card-body">
                        {displayMessageSuccess && (
                            <div className="alert alert-light-success" role="alert">
                                {messageText || "Settings completed successfully!"}
                            </div>
                        )}

                        {displayMessageError && (
                            <div className="alert alert-light-danger" role="alert">
                                {messageText || "Something went wrong. Please try again."}
                            </div>
                        )}

                        {uploadProgress > 0 && (
                            <div className="col-md-12">
                                <div aria-valuemax="100" aria-valuemin="0" aria-valuenow="0" className="progress w-100" role="progressbar">
                                    <div className="progress-bar bg-light-primary text-primary-dark" style={{ width: `${uploadProgress}%`, height: '15px' }}>{uploadProgress}%</div>
                                </div>
                            </div>
                        )}
                        <div className="app-form">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="logo">Logo</label>
                                        <input
                                            className="form-control"
                                            ref={logoInputRef}
                                            name="logo"
                                            type="file"
                                            onChange={(e) => handleFileSelect(e, "logo")}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <div className="image-preview logoPreview">
                                            <div className="image-block">
                                                <img src={logoUrl} />
                                            </div>
                                            <span>Image Preview</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-8 mb-4">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="favicon">Favicon</label>
                                        <input
                                            className="form-control"
                                            ref={faviconInputRef}
                                            name="favicon"
                                            type="file"
                                            onChange={(e) => handleFileSelect(e, "favicon")}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <div className="image-preview faviconPreview">
                                            <div className="image-block">
                                                <img src={faviconUrl} />
                                            </div>
                                            <span>Image Preview</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-12 mb-4"><hr /></div>
                            </div>
                        </div>

                        <form method="POST" onSubmit={handleSubmit}>
                            <div className="app-form">
                                <div className="row">
                                    <div className="col-md-12">
                                        <h5 className="mb-2 text-dark f-w-600">Payment Settings (Stripe)</h5>
                                        <p className="text-muted small">
                                            Enter your Stripe API credentials for both sandbox (test) and live environments.
                                            Make sure to keep these keys secure.
                                        </p>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <div className="mb-3 col-md-12">
                                                <div className="main-switch main-switch-color">
                                                    <div className="switch-warning swich-size2 my-3">
                                                        <input type="checkbox" id="check-005" className="toggle" 
                                                            name="payment_mode"
                                                            checked={formData.payment_mode === "live"}
                                                            onChange={handleChange}
                                                        />
                                                        <label htmlFor="check-005">Enable Live Mode</label>
                                                    </div>
                                                </div>

                                                <small className="text-muted">
                                                    {formData.payment_mode === "live"
                                                        ? "Live mode is active. Transactions will use real money."
                                                        : "Sandbox mode is active. Transactions are for testing only."}
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6"></div>
                                    
                                    {formData.payment_mode === "sandbox" ? (
                                        <>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="username">Api Key</label>
                                                    <input
                                                        className="form-control"
                                                        id="sandbox_api_key"
                                                        name="sandbox_api_key"
                                                        type="text"
                                                        placeholder="Enter your Stripe Test API Key"
                                                        value={formData.sandbox_api_key}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="username">Api Secret</label>
                                                    <input
                                                        className="form-control"
                                                        id="sandbox_api_secret"
                                                        name="sandbox_api_secret"
                                                        type="text"
                                                        placeholder="Enter your Stripe Test API Secret"
                                                        value={formData.sandbox_api_secret}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="username">Api Key</label>
                                                    <input
                                                        className="form-control"
                                                        id="live_api_key"
                                                        name="live_api_key"
                                                        type="text"
                                                        placeholder="Enter your Stripe Test API Secret"
                                                        value={formData.live_api_key}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="username">Api Secret</label>
                                                    <input
                                                        className="form-control"
                                                        id="live_api_secret"
                                                        name="live_api_secret"
                                                        type="text"
                                                        placeholder="Enter your Stripe Test API Secret"
                                                        value={formData.live_api_secret}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="col-md-12 mb-4"><hr /></div>

                                    <div className="col-md-12 mb-3">
                                        <h5 className="mb-2 text-dark f-w-600">SMTP Configuration (Email Settings)</h5>
                                        <p className="text-muted small">
                                            Configure your application's outgoing email server details. These settings allow the system to send notifications, invoices, and password resets securely. 
                                            <span className="fw-semibold d-flex">Note:</span> Sensitive fields like password will be stored securely and applied at runtime.
                                        </p>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="email_from_name">Sender Name</label>
                                            <input
                                                className="form-control"
                                                id="email_from_name"
                                                name="email_from_name"
                                                type="text"
                                                placeholder="e.g., Your Company Name"
                                                value={formData.email_from_name || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="email_from_email">Sender Email Address</label>
                                            <input
                                                className="form-control"
                                                id="email_from_email"
                                                name="email_from_email"
                                                type="email"
                                                placeholder="e.g., no-reply@yourdomain.com"
                                                value={formData.email_from_email || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="smtp_host">SMTP Host</label>
                                            <input
                                                className="form-control"
                                                id="smtp_host"
                                                name="smtp_host"
                                                type="text"
                                                placeholder="e.g., smtp.sendgrid.net"
                                                value={formData.smtp_host || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="smtp_port">Port</label>
                                            <input
                                                className="form-control"
                                                id="smtp_port"
                                                name="smtp_port"
                                                type="number"
                                                placeholder="e.g., 587 or 465"
                                                value={formData.smtp_port || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="smtp_username">Username</label>
                                            <input
                                                className="form-control"
                                                id="smtp_username"
                                                name="smtp_username"
                                                type="text"
                                                placeholder="e.g., API Key ID"
                                                value={formData.smtp_username || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="smtp_password">Password</label>
                                            <input
                                                className="form-control"
                                                id="smtp_password"
                                                name="smtp_password"
                                                type="password"
                                                placeholder="********"
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="smtp_encryption">Encryption</label>
                                            <select
                                                className="form-control"
                                                id="smtp_encryption"
                                                name="smtp_encryption"
                                                value={formData.smtp_encryption || 'tls'}
                                                onChange={handleChange}
                                            >
                                                <option value="null">None</option>
                                                <option value="tls">TLS (Recommended for 587)</option>
                                                <option value="ssl">SSL (Recommended for 465)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-12 mb-4"><hr /></div>

                                    <div className="col-md-12 mb-3">
                                        <h5 className="mb-2 text-dark f-w-600">Security & Access Configuration</h5>
                                        <p className="text-muted small">
                                            Manage critical security features like bot protection and multi-factor authentication for administrative accounts.
                                        </p>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <div className="mb-3 col-md-12">
                                                <div className="main-switch main-switch-color">
                                                    <div className="switch-warning swich-size2 my-3">
                                                        <input 
                                                            type="checkbox" 
                                                            className="toggle" 
                                                            id="captcha_enabled"
                                                            name="captcha_enabled"
                                                            checked={formData.captcha_enabled || false}
                                                            onChange={handleChange}
                                                        />
                                                        <label htmlFor="captcha_enabled">Enable Google reCAPTCHA</label>
                                                    </div>
                                                </div>

                                                <small className="text-muted">
                                                    These configuration settings are exclusively for Google reCAPTCHA v2 (Checkbox Challenge). They are not compatible with reCAPTCHA v3.
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6"></div>

                                    {formData.captcha_enabled && (
                                        <>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="captcha_site_key">reCAPTCHA Site Key (v2 Checkbox)</label>
                                                    <input
                                                        className="form-control"
                                                        id="captcha_site_key"
                                                        name="captcha_site_key"
                                                        type="text"
                                                        placeholder="Public key (for client-side forms)"
                                                        value={formData.captcha_site_key || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="captcha_secret_key">reCAPTCHA Secret Key</label>
                                                    <input
                                                        className="form-control"
                                                        id="captcha_secret_key"
                                                        name="captcha_secret_key"
                                                        type="password"
                                                        placeholder="Private key (stored securely in DB)"
                                                        value={formData.captcha_secret_key || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <div className="mb-3 col-md-12">
                                                <div className="main-switch main-switch-color">
                                                    <div className="switch-warning swich-size2 my-3">
                                                        <input 
                                                            type="checkbox" 
                                                            className="toggle" 
                                                            id="two_fa_email_enabled"
                                                            name="two_fa_email_enabled"
                                                            checked={formData.two_fa_email_enabled || false}
                                                            onChange={handleChange}
                                                        />
                                                        <label htmlFor="two_fa_email_enabled">Require 2FA for User Login (via Email)</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <div className="mb-3 col-md-12">
                                                <div className="main-switch main-switch-color">
                                                    <div className="switch-warning swich-size2 my-3">
                                                        <input 
                                                            type="checkbox" 
                                                            className="toggle" 
                                                            id="two_fa_email_enabled_admin"
                                                            name="two_fa_email_enabled_admin"
                                                            checked={formData.two_fa_email_enabled_admin || false}
                                                            onChange={handleChange}
                                                        />
                                                        <label htmlFor="two_fa_email_enabled_admin">Require 2FA for Admin Login (via Email)</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="min_password_length">Min. Password Length (Recommended: 8)</label>
                                            <input
                                                className="form-control"
                                                id="min_password_length"
                                                name="min_password_length"
                                                type="number"
                                                min="8" 
                                                max="64"
                                                placeholder="e.g., 8"
                                                value={formData.min_password_length || 8}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-30">
                                        <button type="submit" className="btn btn-primary b-r-22" disabled={btnDisabled}>
                                            Update Settings
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

export default Settings;