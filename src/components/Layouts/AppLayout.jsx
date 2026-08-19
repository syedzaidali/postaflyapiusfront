import React, {useEffect, useState} from "react";
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import apiRoutes from '../../routes/api/apiRoutes';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'animate.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'prismjs/themes/prism.css';
import {
    ArrowUp,
  } from '../../utils/icons';

const AppLayout = ({ children }) => {    
    const [showLoader, setShowLoader] = useState(true);
    const [isSemiNav, setIsSemiNav]   = useState(false);
    const [appLogoUrl, setAppLogoUrl] = useState("/images/logo-postafly.png"); // The logo state
    const token  = localStorage.getItem('auth_token');

    const updateLogo = (newUrl) => { 
        setAppLogoUrl(newUrl);
    };
    
    const getAllSettingsData = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(`${apiRoutes.getAppSettings}`, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (result.status && result.data?.site_logo) {
                setAppLogoUrl(result.data.site_logo);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    }

    useEffect(() => {
        getAllSettingsData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoader(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const weights = ["regular", "thin", "light", "bold", "fill", "duotone"];
        weights.forEach((weight) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `https://unpkg.com/@phosphor-icons/web@2.0.3/src/${weight}/style.css`;
            document.head.appendChild(link);
        });
    }, []);

    useEffect(() => {
        document.body.classList.remove("sign-in-bg");
    });

    return (
        <>
            <div className="app-wrapper">
                {showLoader && (
                    <div className="loader-wrapper fade-out">
                        <div className="loader_16"></div>
                    </div>
                )}

                <Sidebar isSemiNav={isSemiNav} appLogoUrl={appLogoUrl} />

                <div className="app-content">
                    <Header onToggleNav={() => setIsSemiNav(prev => !prev)} />  
                    <main>
                        <div className="container-fluid mt-3">
                            <div className="row">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>

                <div className="go-top">
                    <span className="progress-value">
                        <ArrowUp />
                    </span>
                </div>

                <Footer />
            </div>
        </>
    );
}

export default AppLayout;