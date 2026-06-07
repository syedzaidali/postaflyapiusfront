import React, { useState, useEffect, useRef } from "react";
import apiRoutes from '../routes/api/apiRoutes';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {
    Facebook,
    Google
  } from '../utils/icons';
import { useLocation, useNavigate } from "react-router-dom";

const OtpVerification = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [settingsData, setSettingsData] = useState([]);
    const [logoUrl, setLogoUrl]    = useState("/images/image-preview.png");
    const [faviconUrl,setFaviconUrl]    = useState("/images/image-preview.png");
    const inputsRef = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let token   = queryParams.get("token");
    let isLogin = 0; 

    if (!token) {
        token   = localStorage.getItem("access_token");
        isLogin = 1; 
    }

    //Defining sucess and error mesages const stats
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");

    const [btnLoader, setBtnLoader] = useState(false);
    
    const handleChange = (e, index) => {
        const value = e.target.value;
        if (!/^\d?$/.test(value)) return;

        const updatedOtp = [...otp];
        updatedOtp[index] = value;
        setOtp(updatedOtp);

        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const updatedOtp = [...otp];
            updatedOtp[index - 1] = "";
            setOtp(updatedOtp);
            inputsRef.current[index - 1]?.focus();
        }
    };

    const getAllSettingsData = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
            };

            const response = await fetch(`${apiRoutes.getAppSettings}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (result.status) {
                setLogoUrl(result.data.site_logo);
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

        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        NProgress.start();
        setError("");

        try {
            const response = await fetch(apiRoutes.verifyOtp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ otp: enteredOtp, token, is_login: isLogin }),
            });

            const data = await response.json();
          
            if (!response.ok) {
                setError(data.message || "OTP verification failed.");
            } else {
                if(isLogin == 1) {
                    localStorage.setItem('auth_token', data.data.access_token);
                    localStorage.setItem('user_role', data.data.role);
                    localStorage.setItem('user_permissions', data.data.permissions);
                    localStorage.setItem('name', data.data.name);
                    localStorage.setItem('email', data.data.email);
                    localStorage.setItem('username', data.data.username);
                    localStorage.setItem('account', data.data.account);

                    if (data.data.role === 'super_admin') {
                        navigate('/admin/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                } else {
                    navigate("/dashboard");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Try again.");
        } finally {
            NProgress.done();
            setBtnLoader(false);
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        setBtnLoader(true);

        NProgress.start();

        try {
            const response = await fetch(apiRoutes.resendOtp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ email: localStorage.getItem('temp_user_email') }),
            });

            const data = await response.json();

            if (data.success == true) {
                setDisplayMessageSuccess(true);

                setMessageText(data.message || "Otp sent please check your email.");

                setTimeout(() => {
                    setDisplayMessageSuccess(false);
                    setMessageText('');
                }, 8000);
            } else {
                setDisplayMessageError(true);

                setMessageText(data.message || "Otp Failed to send. Please try again.");

                setTimeout(() => {
                    setDisplayMessageError(false);
                    setMessageText('');
                }, 8000);
            }
        } catch (err) {
            console.error(err);
            setDisplayMessageError(true);

            setMessageText("Otp Failed to send. Please try again.");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText('');
            }, 8000);
        } finally {
            NProgress.done();
            setBtnLoader(false);
        }
    };

    useEffect(() => {
        document.body.classList.add("sign-in-bg");
    });
    
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12 p-0 ">
                    <div className="login-form-container">
                        <div className="mb-4">
                            <a className="logo d-inline-block" href="index.html">
                                <img alt="#" src={logoUrl} width="250" />
                            </a>
                        </div>
                        <div className="form_container">
                            <form className="app-form rounded-control" onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-12">
                                        <div className="mb-5 text-center">
                                            <h2 className="text-primary-dark">Verify OTP</h2>
                                            <p>Enter the 5 digit code sent to the registered email Id</p>
                                        </div>
                                    </div>

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
                                    
                                    <div className="col-12">
                                        <div className="verification-box">
                                            {otp.map((digit, index) => (
                                                <div key={`otp-${index}`}>
                                                    <input
                                                        key={index}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength="1"
                                                        value={digit}
                                                        onChange={(e) => handleChange(e, index)}
                                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                                        ref={(el) => (inputsRef.current[index] = el)}
                                                        className="form-control h-60 w-60 text-center"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <p>
                                            Did not recieve a code 
                                            <a 
                                                className="link-primary text-decoration-underline"
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault(); 
                                                    handleResend(e);
                                                }}
                                            >
                                            Resend!</a>
                                        </p>
                                    </div>
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <button className="btn btn-light-primary w-100" type="submit">
                                                {btnLoader ? (
                                                    <div className="left d-flex align-items-center justify-content-center">
                                                        <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                        Processing
                                                    </div>
                                                ) : (
                                                    <>
                                                        Verify
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OtpVerification;
