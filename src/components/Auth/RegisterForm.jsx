import React, { useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import apiRoutes from '../../routes/api/apiRoutes';
import { goToAdminHome } from "../../constants/DomainRoutes";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {
    Facebook,
    Google,
    CheckCircle,
    Xmark,
    Eye,
    EyeClosed,
  } from '../../utils/icons';
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
    const [name, setName]                       = useState("");
    const [username, setUsername]               = useState("");
    const [email, setEmail]                     = useState("");
    const [accountType, setAccountType]         = useState("");
    const [invoiceOption, setInvoiceOption]     = useState("");
    const [password, setPassword]               = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [error, setError]       = useState("");   
    const [success, setSuccess]   = useState("");   
    const [isLoader, setIsLoader] = useState(false);

    const navigate = useNavigate();

    const [isPasswordFocused, setIsPasswordFocused]           = useState(false);
    const [passwordVisible, setPasswordVisible]               = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    
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

    const isFormValid = () => {
        const rules = checkPasswordRules(password);
        const passwordValid = Object.values(rules).every(Boolean);
        const passwordsMatch = password === passwordConfirm;

        return (
            name.trim() !== "" &&
            username.trim() !== "" &&
            email.trim() !== "" &&
            accountType !== "" &&
            password !== "" &&
            passwordConfirm !== "" &&
            passwordValid &&
            passwordsMatch &&
            (accountType !== "transaction_email" || invoiceOption !== "")
        );
    };

    useEffect(() => {
        const token    = localStorage.getItem('auth_token'); 
        const userRole = localStorage.getItem("user_role");

        if (token) {
            if (userRole === 'super_admin') {
                goToAdminHome(navigate);
            } else {
                navigate('/dashboard');
            }
        }
    }, [navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoader(true);
        setError(null);
        NProgress.start();

        const recaptchaToken = grecaptcha.getResponse();
        if (!recaptchaToken) {
            setError("Please complete the reCAPTCHA.");
            setIsLoader(false);
            NProgress.done();
            return;
        }

        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        };

        const body = {
            name,
            username,
            email,
            password,
            password_confirmation: passwordConfirm,
            account_type: accountType,
            invoice_option: accountType === "transaction_email" ? invoiceOption : null,
            "recaptcha_token": recaptchaToken,
        };

        try {
            const response = await fetch(apiRoutes.register, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    const messages = Object.values(data.errors).flat().join(" ");
                    setError(messages || "Validation failed.");
                } else {
                    setError(data.message || "Registration failed. Please try again.");
                }
            } else {
                setSuccess(data.message);
                navigate(`/verify-otp?token=${data.token}`);
            }
        } catch (error) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoader(false);
            NProgress.done();
            grecaptcha.reset();
        }
    };

    useEffect(() => {
        document.body.classList.add("sign-in-bg");
    });
    
    return (
        <div className="container">
            <div className="row sign-in-content-bg">
                <div className="col-lg-6 image-contentbox d-none d-lg-block">
                    <div className="form-container">
                        <div className="signup-content mt-4">
                            <span>
                                <img src="/images/logo-postafly.png" alt="Logo" className="img-fluid" />
                            </span>
                        </div>
                        
                        <div className="signup-bg-img">
                            <img src="/images/login-01.png" alt="Background" className="img-fluid" />
                        </div>
                    </div>
                </div>

                <div className="col-lg-6 form-contentbox">
                    <div className="form-container">
                        <form className="app-form rounded-control" method="POST" onSubmit={handleRegister}>
                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-5 text-center text-lg-start">
                                        <h2 className="text-primary-dark f-w-600">Create a New Account</h2>
                                        <p>Register using your details below.</p>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label className="mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="Enter Your Name"
                                        />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label className="mb-1">Username</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            placeholder="Enter Your Username"
                                        />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label className="mb-1">Work Email Address</label>
                                        <input 
                                            type="email" 
                                            className="form-control"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="Enter Your Email"
                                        />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label className="mb-1">Account Type</label>
                                        <div className="check-container">
                                            <label className="check-box">
                                                <input 
                                                    type="radio" 
                                                    name="account_type"
                                                    value="transaction_email"
                                                    checked={accountType === "transaction_email"}
                                                    onChange={(e) => setAccountType(e.target.value)}
                                                    required
                                                />{" "}
                                                <span className="radiomark light-primary mr-2"></span>
                                                <span className="text-secondary">Transaction Email</span>
                                            </label>
                                            <label className="check-box">
                                                <input 
                                                    type="radio" 
                                                    name="account_type"
                                                    value="email_marketing"
                                                    checked={accountType === "email_marketing"}
                                                    onChange={(e) => setAccountType(e.target.value)}
                                                    required
                                                />{" "}
                                                <span className="radiomark light-primary mr-2"></span>
                                                <span className="text-secondary"> Email Marketing</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {accountType === "transaction_email" && (
                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label className="mb-1">Invoice Management</label>
                                        <div className="row">
                                            <div className="card shadow-none col-6">
                                                <div className="card-body custom-selection b-1-light rounded">
                                                    <div className="position-relative">
                                                        <label className="check-box">
                                                            <input 
                                                                type="radio" 
                                                                name="invoice_option"
                                                                value="multiple"
                                                                checked={invoiceOption === "multiple"}
                                                                onChange={(e) => setInvoiceOption(e.target.value)}
                                                                required
                                                            />{" "}
                                                            <span className="radiomark outline-secondary position-absolute"></span>
                                                            <span className="ms-4 fs-10">Create multiple invoices</span>
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted f-s-12">Separate invoices for multiple invoice numbers with the same customer.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card shadow-none col-6">
                                                <div className="card-body custom-selection b-1-light rounded">
                                                    <div className="position-relative">
                                                        <label className="check-box">
                                                            <input 
                                                                type="radio" 
                                                                name="invoice_option"
                                                                value="merge"
                                                                checked={invoiceOption === "merge"}
                                                                onChange={(e) => setInvoiceOption(e.target.value)}
                                                                required
                                                            />{" "}
                                                            <span className="radiomark outline-secondary position-absolute"></span>
                                                            <span className="ms-4 fs-10">Create Single invoices</span>
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted f-s-12">Single invoices for multiple invoice numbers with the same customer. This will Merge all invoices into a single PDF</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <i className="iconoir-eye"></i>
                                        <label className="mb-1">Password</label>
                                        <div className="input-icon-btn">
                                            <input 
                                                type={passwordVisible ? "text" : "password"}
                                                className="form-control"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setIsPasswordFocused(true)}
                                                onBlur={() => setIsPasswordFocused(false)}
                                                required
                                                placeholder="Enter Password"
                                            />
                                            <a 
                                                href="#" 
                                                onClick={(e) => {e.preventDefault(); setPasswordVisible(!passwordVisible)}} 
                                                className={`icon-btn ${passwordVisible ? "text-primary" : "text-light"}`}
                                            >
                                                {passwordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                            </a>
                                        </div>
                                        {isPasswordFocused && password && <PasswordRulesBox password={password} />}
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label className="mb-1">Confirm Password</label>
                                        <div className="input-icon-btn">
                                            <input 
                                                type={confirmPasswordVisible ? "text" : "password"}
                                                className="form-control"
                                                value={passwordConfirm}
                                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                                required
                                                placeholder="Confirm Password"
                                            />
                                            <a 
                                                href="#"  
                                                onClick={(e) => {e.preventDefault(); setConfirmPasswordVisible(!confirmPasswordVisible)}} 
                                                className={`icon-btn ${confirmPasswordVisible ? "text-primary" : "text-light"}`}
                                            >
                                                {confirmPasswordVisible ? <Eye width={22} /> : <EyeClosed width={22} />}
                                            </a>
                                        </div>

                                        {passwordConfirm && (
                                            <div
                                                className="mt-1"
                                                style={{ color: password === passwordConfirm ? "green" : "red" }}
                                            >
                                                {password === passwordConfirm ? (
                                                    <span style={{ color: "green" }}>
                                                        <CheckCircle width="14" className="me-1" />
                                                        Passwords match
                                                    </span>
                                                    ) : (
                                                    <span style={{ color: "red" }}>
                                                        <Xmark width="14" className="me-1" />
                                                        Passwords do not match
                                                    </span>
                                                    )}
                                                </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3 d-flex justify-content-center">
                                        <ReCAPTCHA
                                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                            onChange={(value) => {
                                                console.log("Captcha value:", value);
                                                // You can store this in form state
                                            }}
                                            />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3">
                                        <button 
                                            type="submit" 
                                            disabled={!isFormValid()} 
                                            className="btn btn-light-primary w-100"
                                        >
                                            <div className="left d-flex align-items-center justify-content-center">
                                            Register
                                                {isLoader && (
                                                    <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="text-center">
                                        Already have an account?
                                        <a className="link-primary-dark text-decoration-underline" href="/login">
                                        Login
                                        </a>
                                    </div>
                                </div>

                                <div className="app-divider-v justify-content-center">
                                    <p>Or sign in with</p>
                                </div>

                                <div className="col-12">
                                    <div className="text-center">
                                        <button className="btn btn-light-facebook icon-btn b-r-22 m-1">
                                            <Facebook size={16} />
                                        </button>
                                        <button className="btn btn-light-gmail icon-btn b-r-22 m-1">
                                            <Google size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
