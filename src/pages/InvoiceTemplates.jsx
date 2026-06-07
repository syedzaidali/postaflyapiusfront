import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    UserPlus,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../utils/icons';

const InvoiceTemplates = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    
    //Initialize All Required constants
    const [themes, setThemes] = useState([]);

    /*
     * Api calls 
     */
    //Fetch invoice Themes
    const fetchThemes = async () => {
        try {    
            const url = `${apiRoutes.getAllInvoiceThemes}`;

            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            };

            const response = await fetch(url, {
                method: "GET",
                headers: headers
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setThemes(result.data);
            } else {
                console.error(result);
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        }
    };

    useEffect(() => {
        fetchThemes();
    }, []);

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Invoice Themes</h4>
                </div>
            </div>

            <div className="col-md-12">
                <div className="card">
                    <div className="templates-preview p-4">
                       {themes.map((template) => (
                            <div key={template.id} className="template-selector no-selector">
                                <a
                                    href="javascript:void(0);"
                                    className="select-template"
                                    data-id={template.id}
                                    data-title={template.name}
                                    onClick={() => console.log("Selected template ID:", template.id)}
                                >
                                    <div className="template-preview-thumbnail">
                                        <img src={template.preview_image} alt={template.name} />
                                        <span>{template.name}</span>
                                    </div>
                                </a>

                                <a
                                    href={`https://api.postafly.com/invoice-theme/${template.id}`}
                                    className="btn btn-primary"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Preview
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default InvoiceTemplates;