export const hasPermission = (requiredPermissions) => {
    const userPermissions = JSON.parse(localStorage.getItem("user_permissions") || "{}");
    
    if (!userPermissions || typeof userPermissions !== "object") return false;

    return requiredPermissions.some((perm) => {
        const [module, action] = perm.split("."); // Example: "users.create" → ["users", "create"]
        const permissionValue = userPermissions[module]?.[action];

        if (Array.isArray(permissionValue)) {
            return permissionValue[0]; // Extract the boolean value from `[false, 1]`
        }
        
        return permissionValue === true;
    });
};
