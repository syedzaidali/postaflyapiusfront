import { Navigate } from "react-router-dom";
import { ADMIN_ROUTE_PREFIX } from "../constants/DomainRoutes";

const ProtectedRoute = ({ element, allowedRoles }) => {
    const isAuthenticated = localStorage.getItem("auth_token") !== null;
    const userRole = localStorage.getItem("user_role"); // "super_admin", "admin", "manager"
    const hostname = window.location.hostname;
    const isDev = import.meta.env.MODE === "development";
    const isAdminDomain = hostname.startsWith("admin") || isDev && window.location.pathname.startsWith("/admin");
    
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Subdomain restriction
    if (isAdminDomain && userRole !== "super_admin") {
        return <Navigate to="/dashboard" replace />; // SPA path
    }

    if (!isAdminDomain && userRole === "super_admin") {
        return <Navigate to={`${ADMIN_ROUTE_PREFIX}/dashboard`} replace />; // SPA path
    }

    // Role access restriction
    if (!allowedRoles.includes(userRole)) {
        const roleRedirects = {
            super_admin: `${ADMIN_ROUTE_PREFIX}/dashboard`,
            admin: "/dashboard",
            manager: "/dashboard"
        };

        return <Navigate to={roleRedirects[userRole] || "/"} replace />;
    }

    return element;
};

export default ProtectedRoute;
