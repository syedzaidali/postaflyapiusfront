import React, { useState, useEffect } from "react";
import apiRoutes from '../../routes/api/apiRoutes';
import { goToAdminHome } from "../../constants/DomainRoutes";
import { getTenantHomePath } from "../../utils/roleBasedAccess";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {
    Facebook,
    Google
  } from '../../utils/icons';
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [login, setLogin]       = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState("");   
    const navigate                = useNavigate();

    //Defining sucess and error mesages const stats
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");

    const [btnLoader, setBtnLoader] = useState(false);

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

    useEffect(() => {
        const token    = localStorage.getItem('auth_token'); 
        const userRole = localStorage.getItem("user_role");

        if (token) {
            if (userRole === 'super_admin') {
                goToAdminHome(navigate);
            } else {
                navigate(getTenantHomePath());
            }
        }
    }, [navigate]);

    
    const handleLogin = async (e) => {
        e.preventDefault();
        setBtnLoader(true);

        NProgress.start();

        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        };

        const body = {
            login,
            password,
        };

        try {
            const response = await fetch(apiRoutes.login, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });

            const data = await response.json();

            console.log(JSON.stringify(data));

            if (!response.ok) {
                if (response.status === 401) {
                    setDisplayMessageError(true);
                    setMessageText("Invalid credentials. Please check your email and password.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText('');
                    }, 8000);
                } else {
                    setDisplayMessageError(true);

                    setMessageText(data.message || "Login failed. Please try again.");

                    setTimeout(() => {
                        setDisplayMessageError(false);
                        setMessageText('');
                    }, 8000);
                }
            } else {
                console.log(JSON.stringify(data));

                if (data.data.needs_2fa) {
                    localStorage.setItem('temp_user_email', data.data.email);
                    localStorage.setItem('access_token', data.data.token);

                    navigate('/verify-otp');
                } else {
                    localStorage.setItem('auth_token', data.data.access_token);
                    localStorage.setItem('user_role', data.data.role);
                    localStorage.setItem('user_permissions', JSON.stringify(data.data.permissions ?? {}));
                    localStorage.setItem('name', data.data.name);
                    localStorage.setItem('email', data.data.email);
                    localStorage.setItem('username', data.data.username);
                    localStorage.setItem('account', data.data.account);

                    if (data.data.role === 'super_admin') {
                        goToAdminHome(navigate);
                    } else {
                        navigate(getTenantHomePath());
                    }
                }
            }
        } catch (error) {
            setDisplayMessageError(true);
            console.log(JSON.stringify(error));
            setMessageText("Something went wrong. Please try again.");

            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText('');
            }, 8000);
        } finally {
            NProgress.done(); // End progress regardless of result
            setBtnLoader(false);
        }
    };

    const handleForgotPasswordDisplay = () => {
        showPasswordForm(true);
    }

    const handlePasswordRecovery = async (e) => {

    }

    const backToLogin = () => {
        showPasswordForm(false);
    }

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
                        <form className="app-form rounded-control" method="POST" onSubmit={handleLogin}>
                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-5 text-center text-lg-start">
                                        <h2 className="text-primary-dark f-w-600">Welcome To Postafly! </h2>
                                        <p>Sign in with your data that you enterd during your registration</p>
                                    </div>
                                </div>

                                {displayMessageSuccess && (
                                    <div className="col-12">
                                        <div className="alert alert-light-success" role="alert">
                                            {messageText || "Settings completed successfully!"}
                                        </div>
                                    </div>
                                )}

                                {displayMessageError && (
                                    <div className="col-12">
                                        <div className="alert alert-light-danger" role="alert">
                                            {messageText || "Something went wrong. Please try again."}
                                        </div>
                                    </div>
                                )}

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label htmlFor="username" className="mb-1">Username</label>
                                        <input 
                                            type="text" className="form-control" 
                                            value={login}
                                            onChange={(e) => setLogin(e.target.value)}
                                            required
                                            id="username" placeholder="Enter Your Username" 
                                        />
                                    </div>
                                </div>
             

                                <div className="col-12">
                                    <div className="mb-3 text-left">
                                        <label htmlFor="password" className="mb-1">Password</label>
                                        <a className="link-primary-dark float-end mb-1" href="/reset-password">Forgot Password?</a>
                                        <input type="password" className="form-control" id="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required
                                        placeholder="Enter Your Password" />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3">
                                        <button type="submit" className="btn btn-light-primary w-100" disabled={btnLoader}>
                                            {btnLoader ? (
                                                <div className="left d-flex align-items-center justify-content-center">
                                                    <span aria-hidden="true" className="spinner-border spinner-border-sm me-2 ms-2" role="status"></span>
                                                    Processing
                                                </div>
                                            ) : (
                                                <>
                                                    Sign In
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="text-center">
                                        Don't Have Your Account yet?{" "}
                                        <a className="link-primary-dark text-decoration-underline" href="/register">
                                        Sign up
                                        </a>
                                    </div>
                                </div>

                                {/*
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
                                </div> */}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
