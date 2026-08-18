import React from 'react';
import apiRoutes from '../routes/api/apiRoutes';
import { useNavigate } from "react-router-dom";
import {
    UserLove,
    Settings,
    Lock
  } from '../utils/icons';
import { ADMIN_ROUTE_PREFIX } from "../constants/DomainRoutes";

const ProfilePanel = () => {
    const navigate = useNavigate();

    const name     = localStorage.getItem('name') || '';
    const email    = localStorage.getItem('email') || '';
    const userRole = localStorage.getItem("user_role");

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

    const getFirstName = () => {
        const fullName = (localStorage.getItem('name') || '').trim();
        if (!fullName) return '';
        const parts = fullName.split(/\s+/);
        return parts.length > 0 ? parts[0] : '';
    };

    const firstName = getFirstName();

    const clearSession = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_permissions');
        localStorage.removeItem('name');
        localStorage.removeItem('email');
        localStorage.removeItem('username');
        localStorage.removeItem('account');
        navigate('/');
    };

    const handleLogout = async () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            clearSession();
            return;
        }

        try {
            await fetch(apiRoutes.logout, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            clearSession();
        }
    };

    return (
        <li className="header-profile">
            <a 
                aria-controls="profilecanvasRight" 
                className="d-block head-icon"
                data-bs-target="#profilecanvasRight" 
                data-bs-toggle="offcanvas"
                href="#" 
                role="button"
            >
                <div
                    style={{
                        backgroundColor: bgColor,
                        color: '#fff',
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '8px',
                    }}
                >
                    {initials}
                </div>
            </a>

            <div aria-labelledby="profilecanvasRight"
                className="offcanvas offcanvas-end header-profile-canvas"
                id="profilecanvasRight">
                <div className="offcanvas-body app-scroll">
                    <ul className="">
                        <li className="d-flex gap-3 mb-3">
                            <div className="d-flex-center">
                                <span className="h-45 w-45 d-flex-center b-r-10 position-relative">
                                <div className="b-r-10"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: '#fff',
                                        width: '45px',
                                        height: '45px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {initials}
                                </div>
                                </span>
                            </div>
                            <div className="text-left mt-2">
                                <h6 className="mb-0"> {name}
                                    <img
                                        alt="instagram-check-mark"
                                        className="w-20 h-20"
                                        src="/images/profile-app/01.png" />
                                    </h6>
                                <p className="f-s-12 mb-0 text-secondary">{email}</p>
                            </div>
                        </li>

                        {userRole == 'super_admin' ? (
                            <>
                                <li>
                                    <a className="f-w-500" href={`${ADMIN_ROUTE_PREFIX}/account`}>
                                        <UserLove className="pe-1 f-s-20" /> My Account
                                    </a>
                                </li>

                                <li>
                                    <a className="f-w-500" href={`${ADMIN_ROUTE_PREFIX}/account#password`}>
                                        <Lock className="pe-1 f-s-20" /> Change Password
                                    </a>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <a className="f-w-500" href="/account">
                                        <UserLove className="pe-1 f-s-20" /> My Account
                                    </a>
                                </li>

                                <li>
                                    <a href="#" 
                                        onClick={(e) => {
                                            e.preventDefault(); 
                                            navigate('/account/billing/subscriptions');
                                        }}
                                        className="f-w-500">
                                        <i className="ph-duotone ph-package pe-1 f-s-20"></i> Manage Subscriptions
                                    </a>
                                </li>

                                <li>
                                    <a href="#" 
                                        onClick={(e) => {
                                            e.preventDefault(); 
                                            navigate('/account/billing/history');
                                        }}
                                        className="f-w-500">
                                        <i className="ph-duotone ph-file-doc pe-1 f-s-20"></i> Billing History
                                    </a> 
                                </li>
                            </>
                        )}
                        <li className="app-divider-v dotted py-1"></li>

                        <li>
                            <a className="mb-0 btn btn-light-danger btn-sm justify-content-center "
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}
                            role="button">
                                <i className="ph-duotone  ph-sign-out pe-1 f-s-20"></i> Log Out
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </li>
    );
};
  
export default ProfilePanel;  