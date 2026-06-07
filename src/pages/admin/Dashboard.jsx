import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import apiRoutes from '../../routes/api/apiRoutes';
import AppLayout from '../../components/Layouts/AppLayout';
import {
    Calendar,
    ArrowDownRight,
  } from '../../utils/icons';

const Dashboard = () => {  
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();  
    
    //Defining constants
    const [chartData, setChartData] = useState({
        dates: [],
        values: [],
    });

    const [loading, setLoading]                   = useState(false);
    const [totalUsers, setTotalUsers]       = useState(0);
    const [TEUsers, setTEUsers]       = useState(0);
    const [marketingUsers, setMarketingUsers]       = useState(0);
    const [newSignups, setNewSignups]           = useState([]);
    const [supportTickets, setSupportTickets] = useState(0);
    const [revenueData, setRevenueData] = useState({
        total: 0,
        currentMonth: 0,
        lastMonth: 0,
        changePercentage: 0,
    });
    
    const [recentSignupsData, setRecentSignupsData] = useState([]);
    const [transactionsHistory, setTransactionsHistory] = useState([]);

    //Api Request
    const fetchDashboardKpi = async () => {
        setLoading(true);

        try {
            const response = await fetch(`${apiRoutes.adminDashboardOverview}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                //Main Kpi
                setTotalUsers(result.kpis.total_users);
                setTEUsers(result.kpis.transactional_email_users);
                setMarketingUsers(result.kpis.marketing_panel_users);

                //New Patients Data
                setNewSignups([
                    result.kpis.new_signups,
                    result.kpis.signupsDateFrom,
                    result.kpis.signupsDateTo,
                    result.kpis.signupsYear
                ])

                setSupportTickets(result.kpis.support_tickets);

                setRevenueData(result.revenue);
                
                //Setting Chart Data
                const values = result.chartData.totals.map(v => Number(v) || 0);
                setChartData({
                    dates: result.chartData.months,
                    values: result.chartData.totals,
                });                

                //Setting Invoice History
                setTransactionsHistory(result.recentTransactions);

                setRecentSignupsData(result.recentSignups);

                console.log(result.recentSignups);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardKpi();
    }, []);


    //Chart Js Code
    const options = {
        series: [{
            name: "Calories Burned",
            data: chartData.values,
        }],
        chart: {
        fontFamily: 'Montserrat, system-ui',
        type: "bar",
        height: 310,
        toolbar: {
            show: false,
        },
        },
        plotOptions: {
        bar: {
            borderRadius: 15,
            columnWidth: "60%",
            distributed: true,
            endingShape: "rounded",
        },
        },
        colors: [
            "rgba(var(--primary),1)",
            "rgba(var(--primary),.3)",
            "rgba(var(--primary),1)",
            "rgba(var(--primary),1)",
            "rgba(var(--danger),.3)",
            "rgba(var(--danger-dark),1)",
        ],
        dataLabels: {
        enabled: false,
        },
        legend: {
        show: false,
        },
        xaxis: {
        categories: chartData.dates,
        labels: {
            style: {
            fontSize: "14px",
            fontWeight: 600,
            colors: "rgba(var(--dark),1)",
            },
        },
        axisTicks: { show: false },
        axisBorder: { show: false },
        },
        yaxis: {
        show: false,
        },
        grid: {
        show: false,
        },
        tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            const data = series[seriesIndex][dataPointIndex];
            const category = w.config.xaxis.categories[dataPointIndex];
            return (
            '<div class="arrow_box p-2">' +
            `<span>${category}</span>` +
            '<div style="font-weight: bold; font-size: 14px;">Emails</div>' +
            `<span>Total ${data}</span>` +
            "</div>"
            );
        },
        style: {
            fontSize: "16px",
        },
        },
        fill: {
        type: ["solid", "solid", "image", "solid", "solid", "image"],
        image: {
            src: [
            "",
            "",
            "/assets/images/dashboard/ecommerce-dashboard/01.png",
            "",
            "",
            "/assets/images/dashboard/ecommerce-dashboard/03.png",
            ],
            width: 400,
            height: 400,
        },
        },
        responsive: [
        {
            breakpoint: 1399,
            options: {
            chart: {
                height: 350,
            },
            },
        },
        ],
    };

    //Invoice Batches Slides
    const settings = {
        dots: false,
        arrows: false,
        infinite: true,
        speed: 1200,
        slidesToShow: 3,
        slidesToScroll: 1,
        vertical: true,
        autoplay: true,
        autoplaySpeed: 5500,
        pauseOnHover: true,
        cssEase: "ease-in-out",
    };

    const recentSignups = recentSignupsData;

    return ( 
        <AppLayout>
            <div className="col-sm-6 col-lg-4 col-xxl-3 order--1-lg">
                <a href="/invoice-history">
                    <div className="card orders-provided-card">
                        <div className="card-body">
                            <i className="ph-bold  ph-circle circle-bg-img"></i>
                            <div>
                                <p className="f-s-18 f-w-600 text-dark txt-ellipsis-1">Total Users</p>
                                <h2 className="text-secondary-dark mb-0">{totalUsers}</h2>
                            </div>
                        </div>
                    </div>
                </a>
            </div>

            <div className="col-sm-6 col-lg-4 col-xxl-3 order--1-lg">
                <a href="/invoice-history">
                    <div className="card orders-provided-card">
                        <div className="card-body">
                            <i className="ph-bold  ph-circle circle-bg-img"></i>
                            <div>
                                <p className="f-s-18 f-w-600 text-dark txt-ellipsis-1">Transactional Email Users</p>
                                <h2 className="text-secondary-dark mb-0">{TEUsers}</h2>
                            </div>
                        </div>
                    </div>
                </a>
            </div>

            <div className="col-sm-6 col-lg-4 col-xxl-3 order--1-lg">
                <a href="/invoice-history">
                    <div className="card orders-provided-card">
                        <div className="card-body">
                            <i className="ph-bold  ph-circle circle-bg-img"></i>
                            <div>
                                <p className="f-s-18 f-w-600 text-dark txt-ellipsis-1">Marketing Panel Users</p>
                                <h2 className="text-secondary-dark mb-0">{marketingUsers}</h2>
                            </div>
                        </div>
                    </div>
                </a>
            </div>

            <div className="col-sm-6 col-lg-4 col-xxl-3 order--1-lg">
                <a href="/invoice-history">
                    <div className="card orders-provided-card">
                        <div className="card-body">
                            <i className="ph-bold  ph-circle circle-bg-img"></i>
                            <div>
                                <p className="f-s-18 f-w-600 text-dark txt-ellipsis-1">Revenue (This Month)</p>
                                <h2 className="text-secondary-dark mb-0">${revenueData.currentMonth.toLocaleString()}</h2>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        
            <div className="col-sm-6 col-lg-4 col-xxl-2 order--1-lg">
                <div className="row">                    
                    <div className="col-12">
                        <a href="/patients">
                            <div className="card bg-primary-300 product-sold-card">
                                <div className="card-body">
                                    <div>
                                        <h5 className="text-primary-dark f-w-600">New Signups</h5>
                                        <p className="text-dark f-w-600 mb-0 mt-2 txt-ellipsis-2">
                                            <Calendar className="svg-16 align-text-top me-2" /> 
                                            {newSignups[1]} -
                                            {newSignups[2]}, {newSignups[3]}
                                        </p>
                                    </div>
                                    <div className="my-4">
                                        <h4 className="text-primary-dark f-s-26">{newSignups[0]}</h4>
                                    </div>
                                    <div className="custom-progress-container">
                                        <div className="progress-bar productive"></div>
                                        <div className="progress-bar middle"></div>
                                        <div className="progress-bar idle"></div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="col-12">
                        <a href="/patients">
                            <div className="card product-store-card">
                                <div className="card-body">
                                    <i className="ph-bold  ph-circle circle-bg-img"></i>
                                    <div>
                                        <p className="text-info f-s-16 f-w-600">Support Tickets</p>
                                        <h2 className="text-success-dark mb-0">{supportTickets}</h2>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <div className="col-sm-6 col-lg-4 col-xxl-2 order--1-lg">
                <div className="row">
                    <div className="col-12">
                        <div className="card bg-danger-300 product-sold-card">
                            <div className="card-body">
                                <div>
                                    <h5 className="text-danger-dark f-w-600">Revenue Last Month</h5>
                                    <h2 className="text-danger-dark mb-0">${revenueData.lastMonth.toLocaleString()}</h2>
                                    <div style={{ height: "30px" }}></div>
                                </div>
                                <div>
                                    <h4>${revenueData.total.toLocaleString()}</h4>
                                    <p className="mb-0 text-dark f-w-500 f-s-12">Monthly Change
                                        <span
                                            className={`badge ms-2 ${
                                            revenueData.changePercentage > 0
                                                ? "bg-success text-success-dark"
                                                : revenueData.changePercentage < 0
                                                ? "bg-danger text-danger-dark"
                                                : "bg-light text-dark"
                                            }`}
                                        >
                                            {revenueData.changePercentage}%
                                        </span>
                                    </p>
                                </div>
                                <a className="bg-danger h-35 w-35 d-flex-center b-r-50 product-sold-icon"
                                    href="/transactional-emails/batch-downloads">
                                    <ArrowDownRight width={18} className="f-w-600 f-s-18 animate__pulse animate__fadeOutRight  animate__infinite animate__slower"></ArrowDownRight>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12">
                        <a href="/patients">
                            <div className="card product-store-card">
                                <div className="card-body">
                                    <i className="ph-bold  ph-circle circle-bg-img"></i>
                                    <div>
                                        <p className="text-info f-s-16 f-w-600">Total Revenue</p>
                                        <h2 className="text-success-dark mb-0">${revenueData.total.toLocaleString()}</h2>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="col-md-7 col-lg-5">
                <div className="card">
                    <div className="pt-3">
                        <h5 className="pa-s-20">Monthly Revenue</h5>
                    </div>

                    <div className="card-body p-0">
                        <Chart
                            options={options}
                            series={options.series}
                            type="bar"
                            height={options.chart.height}
                        />
                    </div>
                </div>
            </div>

            <div className="col-md-5 col-lg-4 col-xxl-3 order--1-lg">
                <div className="card order-detail-card pb-3 h-100">
                    <div className="pt-3">
                        <h5 className="pa-s-20">Recent Signups</h5>
                    </div>
                    <div className="card-body">
                        <ul className="order-content-list">
                            {recentSignups && recentSignups.length > 0 ? (
                            <Slider {...settings}>
                                {recentSignups.map((signup, index) => (
                                    <li key={index} className="bg-primary-300 mt-2">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <a href="/transactional-emails/batch-downloads">
                                                <h6 className={`text-success-dark f-w-600 mb-0`}>
                                                    <Calendar width={12} /> {signup.created_at}
                                                </h6>
                                            </a>

                                            <a href="/transactional-emails/batch-downloads">
                                                <span className={`badge ${signup.badgeClass} me-2 f-s-8`}>
                                                    Free Trial
                                                </span>
                                            </a>
                                        </div>

                                        <div>
                                            <a href="/transactional-emails/batch-downloads">
                                                <p className={`text-dark mb-0 txt-ellipsis-2 f-s-12`}>
                                                    {signup.username} <br />
                                                    {signup.email}
                                                </p>
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </Slider>
                            ): (
                                <>
                                    <h4 className="text-muted">No Data to show</h4>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col-lg-12 col-xxl-12">
                <div className="p-3">
                    <h5>Recent Invoices</h5>
                </div>

                <div className="card">
                    <div className="card-body">      
                        <div className="table-responsive mt-4">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">Invoice ID</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Generated At</th>
                                        <th scope="col">Invoice Total</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">Loading...</td>
                                        </tr>
                                    ) : transactionsHistory.length > 0 ? (
                                        transactionsHistory.map((invoice, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{invoice.invoice_id}</td>                                                    
                                                    <td>{invoice.patient_name}</td>
                                                    <td>{invoice.patient_email}</td>
                                                    <td>{new Date(invoice.created_at).toLocaleString()}</td>
                                                    <td>{invoice.sub_total}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/invoice/preview/${invoice.cs_invoiceId}`, '_blank')}
                                                            className="btn btn-primary btn-sm b-r-22 mg-s-5 f-s-12"
                                                        >
                                                            View Invoice
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center">No invoices found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div> 
                </div>  
            </div>
        </AppLayout>
    );
};

export default Dashboard;
