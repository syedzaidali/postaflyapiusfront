import { useParams } from "react-router-dom";
import Templates from "../pages/Templates";
import ProtectedRoute from "./ProtectedRoute";

const TEMPLATE_PERMISSIONS = {
    "transaction-email": ["transaction_email_templates.view"],
    marketing: ["marketing_email_templates.view"],
};

const TemplatesRoute = () => {
    const { type } = useParams();
    const requiredPermissions = TEMPLATE_PERMISSIONS[type] || [
        "transaction_email_templates.view",
        "marketing_email_templates.view",
    ];

    return (
        <ProtectedRoute
            element={<Templates />}
            allowedRoles={["admin", "manager"]}
            requiredPermissions={requiredPermissions}
        />
    );
};

export default TemplatesRoute;
