const APP_DOMAIN         = (import.meta.env.VITE_APP_URL || "https://app.postafly.com").replace(/\/+$/, "");
const ADMIN_DOMAIN       = (import.meta.env.VITE_ADMIN_URL || "https://admin.postafly.com").replace(/\/+$/, "");
const LOCAL_DOMAIN       = "http://localhost:5173";
const LOCAL_ADMIN_DOMAIN = "http://localhost:5173";

export const APP_ENV = import.meta.env.MODE === "production" ? "production" : "development";

// npm run dev  -> .env.development (localhost)
// npm run build -> .env.production  (app.postafly.com / admin.postafly.com)
export const ACTIVE_DOMAIN_APP = APP_ENV === "development" ? (import.meta.env.VITE_APP_URL || LOCAL_DOMAIN).replace(/\/+$/, "") : APP_DOMAIN;
export const ACTIVE_DOMAIN_ADMIN = APP_ENV === "development" ? (import.meta.env.VITE_ADMIN_URL || LOCAL_ADMIN_DOMAIN).replace(/\/+$/, "") : ADMIN_DOMAIN;

export const ADMIN_ROUTE_PREFIX = APP_ENV === "development" ? "/admin" : "";

export const getFullUrl = (domain, path = "/") => `${domain}${path}`;

export const isDevEnv = () => APP_ENV === "development";

export const isAdminHost = () => {
    if (typeof window === "undefined") return false;
    return window.location.hostname.startsWith("admin");
};

export const getAdminDashboardPath = () => `${ADMIN_ROUTE_PREFIX}/dashboard`;

/** Send super_admin to the correct admin home (local /admin vs production admin domain). */
export const goToAdminHome = (navigate) => {
    if (isDevEnv()) {
        if (navigate) {
            navigate("/admin/dashboard");
        }
        return;
    }

    if (isAdminHost()) {
        if (navigate) {
            navigate("/dashboard");
        }
        return;
    }

    window.location.assign(`${ADMIN_DOMAIN}/dashboard`);
};

export { APP_DOMAIN, ADMIN_DOMAIN, LOCAL_DOMAIN, LOCAL_ADMIN_DOMAIN };
