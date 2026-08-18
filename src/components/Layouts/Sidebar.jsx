import React from 'react';
import {
    HomeAlt,
    UserCircle,
    CreditCard,
    Wallet,
    Megaphone,
    StatUp,
    LayoutLeft,
    Settings,
    FastArrowRight,
    PageFlip,
    HospitalCircle,
    Activity,
    Clock,
    HelpCircle,
    Package
} from '../../utils/icons';
import { ADMIN_ROUTE_PREFIX } from "../../constants/DomainRoutes";
import { isTenantAdmin, moduleAllowed } from '../../utils/roleBasedAccess';

const Sidebar = ({ isSemiNav, appLogoUrl }) => {
    const accountType = localStorage.getItem('account');
    const userRole    = localStorage.getItem("user_role");
    const isAdmin     = isTenantAdmin();
    const isManager   = userRole === "manager";

    const canView = (module) => moduleAllowed(module, 'view');
    const canCreate = (module) => moduleAllowed(module, 'create');

    const isTransactionalAccount = accountType === "transaction_email";
    const isMarketingAccount = accountType === "email_marketing";

    const showMarketingSection = isMarketingAccount && (
        isAdmin ||
        canView('leads') ||
        canView('campaigns') ||
        canView('marketing_email_templates')
    );

    const showTransactionalSection = (isTransactionalAccount || isManager) && (
        isAdmin ||
        canView('providers') ||
        canView('transaction_email') ||
        canView('transaction_email_templates') ||
        canView('invoice_themes') ||
        canView('invoice_history') ||
        canView('patients')
    );

    return (
        <nav className={`vertical-sidebar ${isSemiNav ? "semi-nav" : ""}`}>
            <div className="app-logo">
                <a className="logo d-inline-block" href="/dashboard">
                    <img alt="#" src={appLogoUrl} />
                </a>
                <span className="bg-light-primary toggle-semi-nav">
                    <FastArrowRight className="svg-20" />
                </span>
            </div>
            <div className="app-nav" id="app-simple-bar">
                <ul className="main-nav p-0 mt-2">
                    {userRole === 'super_admin' ? (
                        <>
                            <li className="menu-title">
                                <span>Dashboard</span>
                            </li>
                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/dashboard`}>
                                    <HomeAlt />
                                    Dashboard
                                </a>
                            </li>

                            <li className="menu-title">
                                <span>Billing & Plans</span>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/packages`}>
                                    <Package />
                                    Packages (Tiers)
                                </a>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/subscriptions`}>
                                    <CreditCard />
                                    Subscriptions
                                </a>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/transactions`}>
                                    <Wallet />
                                    Transactions
                                </a>
                            </li>

                            <li className="menu-title">
                                <span>User Management</span>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/users`}>
                                    <UserCircle />
                                    Client Accounts
                                </a>
                            </li>

                            <li className="menu-title">
                                <span>Support & Reporting</span>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/support`}>
                                    <HelpCircle />
                                    Support Tickets
                                </a>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/reports`}>
                                    <StatUp />
                                    Reports
                                </a>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/activity-logs`}>
                                    <Activity />
                                    Activity Logs
                                </a>
                            </li>

                            <li className="menu-title">
                                <span>System Management</span>
                            </li>

                            <li className="no-sub">
                                <a href={`${ADMIN_ROUTE_PREFIX}/system-users`}>
                                    <UserCircle />
                                    Users
                                </a>
                            </li>

                            <li className="no-sub">
                                <a>
                                    <Settings />
                                    Settings
                                </a>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="menu-title">
                                <span>Dashboard</span>
                            </li>
                            {canView('dashboard') && (
                            <li className="no-sub">
                                <a href="/dashboard">
                                    <HomeAlt />
                                    Dashboard
                                </a>
                            </li>
                            )}

                            {showMarketingSection && (
                                <>
                                    <li className="menu-title">
                                        <span>Marketing</span>
                                    </li>

                                    {canView('leads') && (
                                        <li className="no-sub">
                                            <a href="/leads">
                                                <UserCircle />
                                                Leads
                                            </a>
                                        </li>
                                    )}

                                    {canView('campaigns') && (
                                        <li>
                                            <a aria-expanded="false" className="" data-bs-toggle="collapse" href="#campaigns">
                                                <Megaphone />
                                                Campaigns
                                            </a>
                                            <ul className="collapse" id="campaigns">
                                                <li><a href="/campaigns">All Campaigns</a></li>
                                                {canCreate('campaigns') && (
                                                    <li><a href="/campaigns#create">Create Campaign</a></li>
                                                )}
                                                <li><a href="/reports/campaigns">Log Reports</a></li>
                                            </ul>
                                        </li>
                                    )}

                                    {canView('marketing_email_templates') && (
                                        <li>
                                            <a aria-expanded="false" className="" data-bs-toggle="collapse" href="#templates">
                                                <LayoutLeft />
                                                Email Templates
                                            </a>
                                            <ul className="collapse" id="templates">
                                                <li><a href="/templates/marketing">All Templates</a></li>
                                                {canCreate('marketing_email_templates') && (
                                                    <li><a href="/templates/marketing?create=1">Create Template</a></li>
                                                )}
                                            </ul>
                                        </li>
                                    )}
                                </>
                            )}

                            {showTransactionalSection && (
                                <>
                                    <li className="menu-title">
                                        <span>Transactional</span>
                                    </li>

                                    {canView('providers') && (
                                        <li className="no-sub">
                                            <a href="/senders">
                                                <HospitalCircle />
                                                Sender Profile
                                            </a>
                                        </li>
                                    )}

                                    {canView('transaction_email_templates') && (
                                        <li>
                                            <a data-bs-toggle="collapse" href="#transactionTemplates">
                                                <LayoutLeft />
                                                Email Templates
                                            </a>
                                            <ul className="collapse" id="transactionTemplates">
                                                <li><a href="/templates/transaction-email">All Templates</a></li>
                                                {canCreate('transaction_email_templates') && (
                                                    <li><a href="/templates/transaction-email?create=1">Create Template</a></li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {canView('transaction_email') && (
                                        <li>
                                            <a data-bs-toggle="collapse" href="#transactionalEmails">
                                                <i className="ti ti-mail-forward"></i>
                                                Transactional Emails
                                            </a>
                                            <ul className="collapse" id="transactionalEmails">
                                                <li><a href="/transactional-emails">All Emails</a></li>
                                                <li><a href="/transactional-emails-logs">All Emails Logs</a></li>
                                                {canCreate('transaction_email') && (
                                                    <li><a href="/transactional-emails#create">Create Email</a></li>
                                                )}
                                                <li><a href="/transactional-emails/batch-downloads">Invoice Batches</a></li>
                                            </ul>
                                        </li>
                                    )}

                                    {canView('invoice_history') && (
                                        <li className="no-sub">
                                            <a href="/invoice-history">
                                                <Clock />
                                                Invoice History
                                            </a>
                                        </li>
                                    )}

                                    {canView('patients') && (
                                        <li className="no-sub">
                                            <a href="/patients">
                                                <i className="ti ti-user"></i>
                                                Patient Insights
                                            </a>
                                        </li>
                                    )}

                                    {canView('invoice_themes') && (
                                        <li className="no-sub">
                                            <a href="/invoice-templates">
                                                <PageFlip />
                                                Invoice Templates
                                            </a>
                                        </li>
                                    )}
                                </>
                            )}

                            <li className="menu-title">
                                <span>System</span>
                            </li>

                            {canView('users') && (
                                <li className="no-sub">
                                    <a href="/users">
                                        <UserCircle />
                                        Users
                                    </a>
                                </li>
                            )}

                            {canView('reports') && (
                                <li className="no-sub">
                                    <a href="/reports">
                                        <StatUp />
                                        Reports
                                    </a>
                                </li>
                            )}

                            {canView('support') && (
                                <li className="no-sub">
                                    <a >
                                        <HelpCircle />
                                        Support
                                    </a>
                                </li>
                            )}

                            {canView('settings') && (
                                <li className="no-sub">
                                    <a >
                                        <Settings />
                                        Settings
                                    </a>
                                </li>
                            )}
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Sidebar;
