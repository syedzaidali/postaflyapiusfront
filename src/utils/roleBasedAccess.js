export const getUserRole = () => localStorage.getItem("user_role");

export const isTenantAdmin = () => getUserRole() === "admin";

export const getUserPermissions = () => {
    try {
        const raw = localStorage.getItem("user_permissions");
        if (!raw || raw === "[object Object]") {
            return {};
        }

        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const isAllowed = (value) => {
    if (Array.isArray(value)) {
        return !!value[0];
    }

    return value === true || value === 1 || value === "1";
};

export const moduleAllowed = (module, action = "view") => {
    if (isTenantAdmin()) {
        return true;
    }

    const permissions = getUserPermissions();
    return isAllowed(permissions?.[module]?.[action]);
};

export const hasPermission = (requiredPermissions = []) => {
    if (isTenantAdmin()) {
        return true;
    }

    if (!requiredPermissions.length) {
        return true;
    }

    return requiredPermissions.some((perm) => {
        const [module, action = "view"] = perm.split(".");
        return moduleAllowed(module, action);
    });
};

const TENANT_HOME_CANDIDATES = [
    ["dashboard", "/dashboard"],
    ["leads", "/leads"],
    ["campaigns", "/campaigns"],
    ["marketing_email_templates", "/templates/marketing"],
    ["providers", "/senders"],
    ["transaction_email_templates", "/templates/transaction-email"],
    ["transaction_email", "/transactional-emails"],
    ["invoice_history", "/invoice-history"],
    ["patients", "/patients"],
    ["invoice_themes", "/invoice-templates"],
    ["users", "/users"],
    ["reports", "/reports"],
    ["support", "/support"],
    ["settings", "/settings"],
];

export const getTenantHomePath = () => {
    if (isTenantAdmin()) {
        return "/dashboard";
    }

    for (const [module, path] of TENANT_HOME_CANDIDATES) {
        if (moduleAllowed(module, "view")) {
            return path;
        }
    }

    return "/account";
};
