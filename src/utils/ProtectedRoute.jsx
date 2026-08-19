import { Navigate, useLocation } from "react-router-dom";
import { getAdminDashboardPath } from "../constants/DomainRoutes";
import { getTenantHomePath, hasPermission } from "./roleBasedAccess";

const ProtectedRoute = ({ element, allowedRoles, requiredPermissions }) => {
    const isAuthenticated = localStorage.getItem("auth_token") !== null;
    const userRole = localStorage.getItem("user_role");
    const { pathname } = useLocation();
    const isAdminArea = pathname.startsWith("/admin");

    const roleRedirects = {
        super_admin: getAdminDashboardPath(),
        admin: "/dashboard",
        manager: getTenantHomePath(),
    };

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (isAdminArea && userRole !== "super_admin") {
        return <Navigate to="/dashboard" replace />;
    }

    if (!isAdminArea && userRole === "super_admin") {
        return <Navigate to={getAdminDashboardPath()} replace />;
    }

    if (!allowedRoles.includes(userRole)) {
        if (userRole === "super_admin") {
            return <Navigate to={getAdminDashboardPath()} replace />;
        }
        return <Navigate to={roleRedirects[userRole] || "/"} replace />;
    }

    if (requiredPermissions?.length && !hasPermission(requiredPermissions)) {
        return <Navigate to={roleRedirects[userRole] || getTenantHomePath()} replace />;
    }

    return element;
};

export default ProtectedRoute;
