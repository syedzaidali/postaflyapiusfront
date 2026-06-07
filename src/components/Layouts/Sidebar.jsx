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

const Sidebar = ({ isSemiNav, appLogoUrl }) => {
    const accountType = localStorage.getItem('account');
    const userRole    = localStorage.getItem("user_role");
    const rawPermissions = localStorage.getItem("user_permissions");

    let permissions = {};
    try {
        permissions = rawPermissions ? JSON.parse(rawPermissions) : {};
    } catch (e) {
        permissions = {};
    }

    const canView = (module) => permissions?.[module]?.view == 1;
    const canCreate = (module) => permissions?.[module]?.create == 1;
    const canEdit   = (module) => permissions?.[module]?.edit == 1;
    const canDelete = (module) => permissions?.[module]?.delete == 1;

    const isSuperAdmin = userRole === "super_admin";
    const isManager    = userRole === "manager";

    const isTransactionalAccount = accountType === "transaction_email";

    const canShowTransactionalMenu =
    (isTransactionalAccount || isManager || isSuperAdmin) &&
    (
        canView("providers") ||
        canView("transaction_email") ||
        canView("transaction_email_templates") ||
        canView("invoice_themes")
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
                    {userRole == 'super_admin' ? (
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
                                <a href={`${ADMIN_ROUTE_PREFIX}/settings`}>
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
                            <li className="no-sub">
                                <a href="/dashboard">
                                    <HomeAlt />
                                    Dashboard
                                </a>
                            </li>

                            {accountType === 'email_marketing' && (
                                <>
                                    <li className="menu-title">
                                        <span>Marketing</span>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/leads">
                                            <UserCircle />
                                            Leads
                                        </a>
                                    </li>
                                    <li>
                                        <a aria-expanded="false" className="" data-bs-toggle="collapse" href="#campaigns">
                                            <Megaphone />
                                            Campaigns
                                        </a>
                                        <ul className="collapse" id="campaigns">
                                            <li><a href="/campaigns">All Campaigns</a></li>
                                            <li><a href="/campaigns#create">Create Campaign</a></li>
                                            <li><a href="/reports/campaigns">Log Reports</a></li>
                                        </ul>
                                    </li>
                                    <li>
                                        <a aria-expanded="false" className="" data-bs-toggle="collapse" href="#templates">
                                            <LayoutLeft />
                                            Email Templates
                                        </a>
                                        <ul className="collapse" id="templates">
                                            <li><a href="/templates/marketing">All Templates</a></li>
                                            <li><a href="/templates/marketing?create=1">Create Template</a></li>
                                        </ul>
                                    </li>
                                </>
                            )}                   

                            {canShowTransactionalMenu && (
                            <>
                                <li className="menu-title">
                                    <span>Transactional</span>
                                </li>

                                {(isTransactionalAccount || isManager ) && canView("providers") && (
                                    <li className="no-sub">
                                        <a href="/senders">
                                            <HospitalCircle />
                                            Sender Profile
                                        </a>
                                    </li>
                                )}

                                {(isTransactionalAccount || isManager ) && canView("transaction_email_templates") && (
                                    <li>
                                        <a data-bs-toggle="collapse" href="#transactionTemplates">
                                            <LayoutLeft />
                                            Email Templates
                                        </a>
                                        <ul className="collapse" id="transactionTemplates">
                                            <li><a href="/templates/transaction-email">All Templates</a></li>

                                            {canCreate("transaction_email_templates") && (
                                                <li><a href="/templates/transaction-email?create=1">Create Template</a></li>
                                            )}
                                        </ul>
                                    </li>
                                )}

                                {(isTransactionalAccount || isManager ) && canView("transaction_email") && (
                                    <li>
                                        <a data-bs-toggle="collapse" href="#transactionalEmails">
                                            <i className="ti ti-mail-forward"></i>
                                            Transactional Emails
                                        </a>
                                        <ul className="collapse" id="transactionalEmails">
                                            <li><a href="/transactional-emails">All Emails</a></li>
                                            <li><a href="/transactional-emails-logs">All Emails Logs</a></li>

                                            {canCreate("transaction_email") && (
                                                <li><a href="/transactional-emails#create">Create Email</a></li>
                                            )}

                                            <li><a href="/transactional-emails/batch-downloads">Invoice Batches</a></li>
                                        </ul>
                                    </li>
                                )}

                                {(isTransactionalAccount || isManager ) && canView("invoice_themes") && (
                                    <li className="no-sub">
                                        <a href="/invoice-templates">
                                            <PageFlip />
                                            Invoice Templates
                                        </a>
                                    </li>
                                )}
                            </>
                            )}
                             {/* {accountType === 'transaction_email' || userRole == 'manager'  && ( */}
                                <>
                                    <li className="menu-title">
                                        <span>Transactional</span>
                                    </li>

                                   
                                        <li className="no-sub">
                                            <a href="/senders">
                                                <HospitalCircle />
                                                Sender Profile
                                            </a>
                                        </li>
                                        

                                    <li>
                                        <a data-bs-toggle="collapse" href="#transactionTemplates" aria-expanded="false">
                                            <LayoutLeft />
                                            Email Templates
                                        </a>
                                        <ul className="collapse" id="transactionTemplates">
                                            <li><a href="/templates/transaction-email">All Templates</a></li>
                                            <li><a href="/templates/transaction-email?create=1">Create Template</a></li>
                                        </ul>
                                    </li>

                                    <li>
                                        <a data-bs-toggle="collapse" href="#transactionalEmails" aria-expanded="false">
                                            <i className="ti ti-mail-forward"></i>
                                            Transactional Emails
                                        </a>
                                        <ul className="collapse" id="transactionalEmails">
                                            <li><a href="/transactional-emails">All Emails</a></li>
                                            <li><a href="/transactional-emails-logs">All Emails Logs</a></li>
                                            <li><a href="/transactional-emails#create">Create Email</a></li>
                                            <li><a href="/transactional-emails/batch-downloads">Invoice Batches</a></li>
                                        </ul>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/invoice-history">
                                            <Clock />
                                            Invoice History
                                        </a>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/patients">
                                            <i className="ti ti-user"></i>
                                            Patient Insights
                                        </a>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/invoice-templates">
                                            <PageFlip />
                                            Invoice Templates
                                        </a>
                                    </li>
                                </>
                            {/* )}  */}

                             {/* {canShowTransactionalMenu && isSuperAdmin && (
                                <> */}
                                    <li className="menu-title">
                                        <span>System</span>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/users">
                                            <UserCircle />
                                            Users
                                        </a>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/reports">
                                            <StatUp />
                                            Reports
                                        </a>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/support">
                                            <HelpCircle />
                                            Support
                                        </a>
                                    </li>

                                    <li className="no-sub">
                                        <a href="/settings">
                                            <Settings />
                                            Settings
                                        </a>
                                    </li>
                                {/* </>
                                )} */}
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Sidebar;
