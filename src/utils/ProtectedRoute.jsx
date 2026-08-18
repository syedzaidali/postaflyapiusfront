import { Navigate } from "react-router-dom";
import { ACTIVE_DOMAIN_APP, getAdminDashboardPath, goToAdminHome, isAdminHost, isDevEnv } from "../constants/DomainRoutes";
import { getTenantHomePath, hasPermission } from "./roleBasedAccess";

const ProtectedRoute = ({ element, allowedRoles, requiredPermissions }) => {
    const isAuthenticated = localStorage.getItem("auth_token") !== null;
    const userRole = localStorage.getItem("user_role");
    const isAdminDomain = isAdminHost() || (isDevEnv() && window.location.pathname.startsWith("/admin"));

    const roleRedirects = {
        super_admin: getAdminDashboardPath(),
        admin: "/dashboard",
        manager: getTenantHomePath(),
    };

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (isAdminDomain && userRole !== "super_admin") {
        if (isDevEnv()) {
            return <Navigate to="/dashboard" replace />;
        }
        window.location.assign(`${ACTIVE_DOMAIN_APP}/dashboard`);
        return null;
    }

    if (!isAdminDomain && userRole === "super_admin") {
        if (isDevEnv()) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        goToAdminHome();
        return null;
    }

    if (!allowedRoles.includes(userRole)) {
        if (userRole === "super_admin") {
            if (isDevEnv()) {
                return <Navigate to="/admin/dashboard" replace />;
            }
            goToAdminHome();
            return null;
        }
        return <Navigate to={roleRedirects[userRole] || "/"} replace />;
    }

    if (requiredPermissions?.length && !hasPermission(requiredPermissions)) {
        return <Navigate to={roleRedirects[userRole] || getTenantHomePath()} replace />;
    }

    return element;
};

export default ProtectedRoute;
