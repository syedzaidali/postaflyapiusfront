import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './assets/css/responsive.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import ProtectedRoute from "./utils/ProtectedRoute";
import TemplatesRoute from "./utils/TemplatesRoute";
import { ADMIN_ROUTE_PREFIX } from "./constants/DomainRoutes";
import Notfound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import Signup from "./pages/Signup";
import OtpVerification from "./pages/OtpVerification";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Leadgroups from "./pages/Leadgroups";
import Campaigns from "./pages/Campaigns";
import SendersProfile from "./pages/SendersProfile";
import TransactionalEmails from "./pages/TransactionalEmails";
import AllEmailLogs from "./pages/AllEmailLogs";
import BatchDownloads from "./pages/BatchDownloads";
import InvoiceTemplates from "./pages/InvoiceTemplates";
import InvoiceHistory from "./pages/InvoiceHistory";
import InvoicePreview from "./pages/InvoicePreview";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Users from "./pages/Users";
import Support from "./pages/Support";
import ViewTicket from "./pages/ViewTicket";
import Account from "./pages/Account";
import BillingHistory from "./pages/BillingHistory";
import BillingInformation from "./pages/BillingInformation";
import Subscriptions from "./pages/Subscriptions";
import PaymentMethods from "./pages/PaymentMethods";
import EmailLogs from "./pages/Reports";



//Super Admin Pages Import
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserProfile from "./pages/admin/UserProfile";
import AdminUserSecurity from "./pages/admin/UserSecuritySettings";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminPaymentMethods from "./pages/admin/PaymentMethods";
import AdminPackages from "./pages/admin/Packages";
import AdminTransactions from "./pages/admin/Transactions";
import UserBillingHistory from "./pages/admin/userBillingHistory";
import AdminSupport from "./pages/admin/Support";
import AdminViewTicket from "./pages/admin/ViewSupportTicket";
import AdminSystemUsers from "./pages/admin/SystemUsers";
import AdminUserReports from "./pages/admin/Reports";
import AdminActivityLogs from "./pages/admin/ActivityLogs";
import AdminProfile from "./pages/admin/Profile";
import AdminSettings from "./pages/admin/Settings";

function App() {
    useEffect(() => {
        NProgress.start();

        const timer = setTimeout(() => {
            NProgress.done();
        }, 500);

        return () => {
            clearTimeout(timer);
            NProgress.done();
        };
    }, []);

    const hostname      = window.location.hostname;
    const isDev         = import.meta.env.MODE === 'development';
    const isAdminDomain = hostname.startsWith("admin") || (isDev && window.location.pathname.startsWith("/admin"));

    return (
        <Router>
            <Routes>
                {/*Public Route */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/verify-otp" element={<OtpVerification />} />
                  
                {!isAdminDomain && (
                    <>
                        {/* Managers / Admins Routes */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute
                            element={<Dashboard />}
                            allowedRoles={['admin', 'manager']}
                            />
                        } />

                        <Route path="/leads" element={
                            <ProtectedRoute
                                element={<Leads />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['leads.view']}
                            />
                        } />

                        <Route path="/leads/groups" element={
                            <ProtectedRoute
                                element={<Leadgroups />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['leads.view']}
                            />
                        } />

                        <Route path="/templates/:type" element={<TemplatesRoute />} />

                        <Route path="/campaigns" element={
                            <ProtectedRoute
                                element={<Campaigns />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['campaigns.view']}
                            />
                        } />

                        <Route path="/senders" element={
                            <ProtectedRoute
                                element={<SendersProfile />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['providers.view']}
                            />
                        } />

                        <Route path="/transactional-emails" element={
                            <ProtectedRoute
                                element={<TransactionalEmails />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/transactional-emails-logs" element={
                            <ProtectedRoute
                                element={<AllEmailLogs />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/transactional-emails/batch-downloads" element={
                            <ProtectedRoute
                                element={<BatchDownloads />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/invoice-templates" element={
                            <ProtectedRoute
                                element={<InvoiceTemplates />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['invoice_themes.view']}
                            />
                        } />

                        <Route path="/invoice-history" element={
                            <ProtectedRoute
                                element={<InvoiceHistory />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/invoice/preview/:invoiceId" element={
                            <ProtectedRoute
                                element={<InvoicePreview />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/patients" element={
                            <ProtectedRoute
                                element={<Patients />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/patients/profile/:patient_id" element={
                            <ProtectedRoute
                                element={<PatientProfile />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/patients/invoices/:patient_id" element={
                            <ProtectedRoute
                                element={<InvoiceHistory />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['transaction_email.view']}
                            />
                        } />

                        <Route path="/users" element={
                            <ProtectedRoute
                                element={<Users />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['users.view']}
                            />
                        } />

                        <Route path="/support" element={
                            <ProtectedRoute
                                element={<Support />}
                                allowedRoles={['admin', 'manager']}
                            />
                        } />

                        <Route path="/support/ticket/view/:ticket_id" element={
                            <ProtectedRoute
                                element={<ViewTicket />}
                                allowedRoles={['admin', 'manager']}
                            />
                        } />

                        <Route path="/account" element={
                            <ProtectedRoute
                                element={<Account />}
                                allowedRoles={['admin', 'manager']}
                            />
                        } />

                        <Route path="/account/billing/subscriptions" element={
                            <ProtectedRoute
                                element={<Subscriptions />}
                                allowedRoles={['admin']}
                            />
                        } />

                        <Route path="/account/billing/history" element={
                            <ProtectedRoute
                                element={<BillingHistory />}
                                allowedRoles={['admin']}
                            />
                        } />

                        <Route path="/account/billing/details" element={
                            <ProtectedRoute
                                element={<BillingInformation />}
                                allowedRoles={['admin']}
                            />
                        } />

                        <Route path="/account/billing/payment-methods" element={
                            <ProtectedRoute
                                element={<PaymentMethods />}
                                allowedRoles={['admin']}
                            />
                        } />

                        <Route path="/reports" element={
                            <ProtectedRoute
                                element={<EmailLogs />}
                                allowedRoles={['admin', 'manager']}
                                requiredPermissions={['reports.view']}
                            />
                        } />                        
                    </>
                )}

                {isAdminDomain && (
                    <>
                        {/* Super Admin Routes */}
                        <Route path={`${ADMIN_ROUTE_PREFIX}/dashboard`} element={
                            <ProtectedRoute 
                                element={<AdminDashboard />} 
                                allowedRoles={["super_admin"]} 
                            />
                        } />
                        
                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/users`} element={
                                <ProtectedRoute 
                                    element={<AdminUsers />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/user/view/:user_id`} element={
                                <ProtectedRoute 
                                    element={<AdminUserProfile />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/user/payment-methods/:user_id`} element={
                                <ProtectedRoute 
                                    element={<AdminPaymentMethods />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/user/billing-history/:user_id`} element={
                                <ProtectedRoute 
                                    element={<UserBillingHistory  />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/user/security-settings/:user_id`} element={
                                <ProtectedRoute 
                                    element={<AdminUserSecurity />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />
                        
                        <Route
                            path={`${ADMIN_ROUTE_PREFIX}/subscriptions`}
                            element={
                                <ProtectedRoute element={<AdminSubscriptions />} 
                                allowedRoles={["super_admin"]}
                            />}
                        />

                        <Route
                            path={`${ADMIN_ROUTE_PREFIX}/transactions`}
                            element={
                                <ProtectedRoute element={<AdminTransactions />} 
                                allowedRoles={["super_admin"]}
                            />}
                        />

                        <Route
                            path={`${ADMIN_ROUTE_PREFIX}/packages`}
                            element={
                                <ProtectedRoute element={<AdminPackages />} 
                                allowedRoles={["super_admin"]}
                            />}
                        />
                        
                        <Route
                            path={`${ADMIN_ROUTE_PREFIX}/support`}
                            element={
                                <ProtectedRoute element={<AdminSupport />} 
                                allowedRoles={["super_admin"]}
                            />}
                        />

                        <Route
                            path={`${ADMIN_ROUTE_PREFIX}/support/ticket/view/:ticket_id`}
                            element={
                                <ProtectedRoute element={<AdminViewTicket />} 
                                allowedRoles={["super_admin"]}
                            />}
                        />

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/system-users`} element={
                                <ProtectedRoute 
                                    element={<AdminSystemUsers />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/account`} element={
                                <ProtectedRoute 
                                    element={<AdminProfile />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />

                        <Route path={`${ADMIN_ROUTE_PREFIX}/reports`} element={
                            <ProtectedRoute
                                element={<AdminUserReports />}
                                allowedRoles={['super_admin']}
                            />
                        } />   

                        <Route path={`${ADMIN_ROUTE_PREFIX}/activity-logs`} element={
                            <ProtectedRoute
                                element={<AdminActivityLogs />}
                                allowedRoles={['super_admin']}
                            />
                        } />   

                        <Route 
                            path={`${ADMIN_ROUTE_PREFIX}/settings`} element={
                                <ProtectedRoute 
                                    element={<AdminSettings />} 
                                    allowedRoles={["super_admin"]} 
                                />
                            } 
                        />
                    </>
                )}

                <Route path="*" element={<Notfound />} />
            </Routes>
        </Router>
    )
}

export default App
