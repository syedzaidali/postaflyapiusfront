import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    Calendar,
    ArrowDownRight,
  } from '../utils/icons';

const Dashboard = () => {  
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();  
    
    //Defining constants
    const [chartData, setChartData] = useState({
        dates: [],
        values: [],
    });

    const [loading, setLoading]                   = useState(false);
    const [invoicesCount, setInvoicesCount]       = useState(0);
    const [newPatients, setNewPatients]           = useState([]);
    const [invoicesGenData, setInvoicesGenData]   = useState([]);
    const [totalPatients, setTotalPatients]       = useState(0);
    const [invoiceBatchData, setinvoiceBatchData] = useState([]);
    const [invoiceHistory, setInvoiceHistory]     = useState([]);

    //Api Request
    const fetchDashboardKpi = async () => {
        setLoading(true);

        try {
            const response = await fetch(`${apiRoutes.dashboardKpi}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setInvoicesCount(result.totalInvoices || 0);

                setNewPatients([
                    result.newPatients,
                    result.patientsDateFrom,
                    result.patientsDateTo,
                    result.patientsYear
                ])

                setInvoicesGenData(Array.isArray(result.invoicesLastWeek) ? result.invoicesLastWeek : []);
                setTotalPatients(result.totalPatients || 0);
                setinvoiceBatchData(Array.isArray(result.invoiceBatches) ? result.invoiceBatches : []);

                const chartValues = Array.isArray(result.chartData?.values) ? result.chartData.values : [];
                const chartDates = Array.isArray(result.chartData?.dates) ? result.chartData.dates : [];
                setChartData({
                    dates: chartDates,
                    values: chartValues.map(v => Number(v) || 0),
                });

                setInvoiceHistory(Array.isArray(result.recentInvoices) ? result.recentInvoices : []);
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
        height: 360,
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

    const invoiceBatches = invoiceBatchData;

    return ( 
        <AppLayout>
            <div className="col-sm-6 col-lg-4 col-xxl-2 order--1-lg">
                <div className="row">
                    <div className="col-12">
                        <a href="/invoice-history">
                            <div className="card orders-provided-card">
                                <div className="card-body">
                                    <i className="ph-bold  ph-circle circle-bg-img"></i>
                                    <div>
                                        <p className="f-s-18 f-w-600 text-dark txt-ellipsis-1">Invoices</p>
                                        <h2 className="text-secondary-dark mb-0">{invoicesCount}</h2>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div className="col-12">
                        <a href="/patients">
                            <div className="card bg-primary-300 product-sold-card">
                                <div className="card-body">
                                    <div>
                                        <h5 className="text-primary-dark f-w-600">New Patients</h5>
                                        <p className="text-dark f-w-600 mb-0 mt-2 txt-ellipsis-2">
                                            <Calendar className="svg-16 align-text-top me-2" /> 
                                            {newPatients[1]} -
                                            {newPatients[2]}, {newPatients[3]}
                                        </p>
                                    </div>
                                    <div className="my-4">
                                        <h4 className="text-primary-dark f-s-26">{newPatients[0]}</h4>
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
                </div>
            </div>

            <div className="col-sm-6 col-lg-4 col-xxl-2 order--1-lg">
                <div className="row">
                    <div className="col-12">
                        <div className="card bg-danger-300 product-sold-card">
                            <div className="card-body">
                                <div>
                                    <h5 className="text-danger-dark f-w-600">Invoices Generated</h5>
                                    <h2 className="text-danger-dark mb-0">{invoicesGenData.formatted}</h2>
                                    <div style={{ height: "30px" }}></div>
                                </div>
                                <div>
                                    <h4>${invoicesGenData.totalAmount}</h4>
                                    <p className="mb-0 text-dark f-w-500 txt-ellipsis-1">Last Week
                                         <span
                                            className={`badge ms-2 ${
                                                invoicesGenData.amountPercentageChangeFormatted
                                                ? parseFloat(invoicesGenData.amountPercentageChangeFormatted.replace("%", "")) > 0
                                                    ? "bg-success text-success-dark"
                                                    : parseFloat(invoicesGenData.amountPercentageChangeFormatted.replace("%", "")) < 0
                                                    ? "bg-danger text-danger-dark"
                                                    : "bg-light text-dark"
                                                : "bg-light text-dark"
                                            }`}
                                            >
                                            {invoicesGenData.amountPercentageChangeFormatted || "0.00%"}
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
                                        <p className="text-success f-s-18 f-w-600">Total Patients</p>
                                        <h2 className="text-success-dark mb-0">{totalPatients}</h2>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="col-md-7 col-lg-5">
                <div className="card">
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
                <div className="card order-detail-card pb-3">
                    <div className="pt-3">
                        <h5 className="pa-s-20">Recent Invoice Batches</h5>
                    </div>
                    <div className="card-body">
                        <ul className="order-content-list">
                            <Slider {...settings}>
                                {invoiceBatches.map((order, index) => (
                                    <li key={index} className={`${order.bg} mt-2`}>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <a href="/transactional-emails/batch-downloads">
                                                <h6 className={`text-${order.statusColor}-dark f-w-600 mb-0`}>
                                                    📦{order.id}
                                                </h6>
                                            </a>

                                            <a href="/transactional-emails/batch-downloads">
                                                <span className={`badge text-light-${order.statusColor} me-2 f-s-8`}>
                                                    {order.status}
                                                </span>
                                            </a>
                                        </div>

                                        <div>
                                            <a href="/transactional-emails/batch-downloads">
                                                <p className={`text-${order.statusColor} mb-0 txt-ellipsis-2 f-s-12`}>
                                                    {order.text}
                                                </p>
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </Slider>
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
                                    ) : (invoiceHistory || []).length > 0 ? (
                                        invoiceHistory.map((invoice, index) => {
                                            return (
                                                <tr key={invoice.cs_invoiceId}>
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
