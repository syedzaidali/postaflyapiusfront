import { Navigate } from "react-router-dom";
import { ADMIN_ROUTE_PREFIX } from "../constants/DomainRoutes";
import { hasPermission } from "./roleBasedAccess";

const ProtectedRoute = ({ element, allowedRoles, requiredPermissions }) => {
    const isAuthenticated = localStorage.getItem("auth_token") !== null;
    const userRole = localStorage.getItem("user_role");
    const hostname = window.location.hostname;
    const isDev = import.meta.env.MODE === "development";
    const isAdminDomain = hostname.startsWith("admin") || isDev && window.location.pathname.startsWith("/admin");

    const roleRedirects = {
        super_admin: `${ADMIN_ROUTE_PREFIX}/dashboard`,
        admin: "/dashboard",
        manager: "/dashboard",
    };

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (isAdminDomain && userRole !== "super_admin") {
        return <Navigate to="/dashboard" replace />;
    }

    if (!isAdminDomain && userRole === "super_admin") {
        return <Navigate to={`${ADMIN_ROUTE_PREFIX}/dashboard`} replace />;
    }

    if (!allowedRoles.includes(userRole)) {
        return <Navigate to={roleRedirects[userRole] || "/"} replace />;
    }

    if (requiredPermissions?.length && !hasPermission(requiredPermissions)) {
        return <Navigate to={roleRedirects[userRole] || "/dashboard"} replace />;
    }

    return element;
};

export default ProtectedRoute;
