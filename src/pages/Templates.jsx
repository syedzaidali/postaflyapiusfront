import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams  } from "react-router-dom";
import axios from 'axios';
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import HtmlEditor from '../components/Editors/HtmlEditor';
import { ReactSummernoteLite } from '@easylogic/react-summernote-lite';
import { useDropzone } from 'react-dropzone';
import { unwrapLastPage, unwrapPagedRows, prependRow, authGetHeaders } from '../utils/listResponse';
import {
    LayoutLeft,
    Search,
    Download,
    FastArrowLeft,
    Xmark,
    Edit,
    Trash,
    CheckCircle
  } from '../utils/icons';

const Templates = () => {
    const token  = localStorage.getItem('auth_token');
    const navigate = useNavigate();
    const { type } = useParams();
    const templateType = type === 'transaction-email' ? 'transactional' : type;

    //Initilizing form fields
    const [formFields, setFormFields] = useState({
        title: "",
        subject: "",
        message: "",
        status: ""
    })

    const [templateId, setTemplateId]   = useState('');
    const contentRef = useRef(formFields.message);
    const [files, setFiles] = useState([]);

    //Initialize All Required constants
    const [addActiveClass, setAddActiveClass]   = useState(false);
    const [burgerActive, setBurgerActive]       = useState(false);
    const [title, setTitle]                     = useState(false);
    const [status, setStatus] = useState(1);
    const [templateCreateForm, setTemplateCreateForm] = useState(false);
    const [editTemplateForm, setEditTemplateForm]         = useState(false);
    const [importLeadForm, setImportLeadForm] = useState(false);
    const [createGroupForm, setCreateGroupForm] = useState(false);
    const [reqLoader, setReqLoader] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedTemplates, setSelectedTemplates] = useState([]);

    //Defining success and error mesages const stats
    const [showMessageError, setShowMessageError] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);
    const [showMessageSuccess, setShowMessageSuccess] = useState(false);
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [messageText, setMessageText] = useState("");
    
    const summernoteRef = useRef();

    const handleEditorChange = (content) => {
        contentRef.current = content;
    };

    //Mapping shortcodes
    const shortcodes = [
        'patient_name',
        'patient_phone',
        'patient_balance',
        'company_name',
        'company_email',
        'company_phone',
        'company_logo',
        'company_address_1',
        'company_address_2',
        'billing_address_1',
        'billing_address_2',
        'payment_link',
    ];

    /*
     * Page Functionalities
     */

    //Closing burger menu
    const closeMenu = () => {
        setAddActiveClass(false);
        setTitle("");

        setTimeout(() => {
            setBurgerActive(false);
            setTemplateCreateForm(false);
            setEditTemplateForm(false);

            setFormFields({
                title: "",
                subject: "",
                message: "",
                status: ""
            }); 

            setFiles([]);

            setStatus(1);
            setTemplateId("");

            document.body.classList.remove("fixed-body");
        }, 500);
    };

    //Burger Menu Action
    useEffect(() => {
        if (burgerActive) {
           const timer = setTimeout(() => {
               setAddActiveClass(true);
           }, 100); 

           return () => clearTimeout(timer);
       } else {
           setAddActiveClass(false); 
       }
    }, [burgerActive]);

    //Initializing Error  / Success Messages
    useEffect(() => {
        if (displayMessageError) {
            const timer = setTimeout(() => {
                setShowMessageError(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setShowMessageError(false); 
        }

        if (displayMessageSuccess) {
            const timer = setTimeout(() => {
                setShowMessageSuccess(true);
            }, 500); 

            return () => clearTimeout(timer);
        } else {
            setShowMessageSuccess(false); 
        }
    }, [displayMessageError, displayMessageSuccess]);    

    const handleStatusChange = (e) => {
        setStatus(Number(e.target.value));
    };
    
    /*
     * Initialize Burger menu forms
     */
    //Create template form
    const createTemplateFormDisplay = () => {
        setTemplateCreateForm(true);
        setBurgerActive(true);
        document.body.classList.add("fixed-body");
    };

    //Edit template form
    const handleTemplateEditForm = (template) => {
        setFormFields({
            title: template.title || "",
            subject: template.subject || "",
            message: template.message || "",
            status: template.status || ""
        }); 

        if (template.attachments) {
            const filePaths = JSON.parse(template.attachments);

            const existingFiles = filePaths.map((path, index) => {
                const fileName = path.split('/').pop();
                return {
                    id: index + 1,        
                    name: fileName,
                    uploaded: true,
                    isPreUploaded: true,
                    url: `${path}` 
                };
            });

            setFiles(existingFiles);
        }

        createTemplateFormDisplay();
        setEditTemplateForm(true);
        setTemplateId(template.id);
        setStatus(template.status);
    };

    //Initialize dropzone functionalities
    const startUpload = (file) => {
        const newFile = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            progress: 0,
            isPreUploaded: false,
            uploaded: false,
        };
        setFiles((prev) => [...prev, newFile]);

        const interval = setInterval(() => {
            setFiles((prev) =>
                prev.map((f) => {
                    if (f.id === newFile.id) {
                        if (f.progress >= 100) {
                            clearInterval(interval);
                            return { ...f, uploaded: true, progress: 100 };
                        }
                        return { ...f, progress: f.progress + 10 };
                    }
                    return f;
                })
            );
        }, 200);
    };

    const onDrop = useCallback(
        (acceptedFiles) => {
            acceptedFiles.forEach(startUpload);
        },
        []
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [],
        },
        multiple: true,
    });

    const removeFile = (id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    /*
     * Api calls 
     */

    //Fetch templates Data
    const fetchTemplates = async (page = 1, search = '') => {
        setLoading(true);
        setSelectedTemplates([]);

        try {
            const queryParams = new URLSearchParams({
                page,
                per_page: perPage,
                _ts: Date.now(),
                ...(search && { search })
            });

            const type = templateType;
            const url = `${apiRoutes.getAllTemplates}?type=${encodeURIComponent(type)}&${queryParams}`;

            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                headers: authGetHeaders(token),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                const rows = unwrapPagedRows(result);
                setTemplates((prev) => {
                    const ids = new Set(rows.map((row) => row.id));
                    const pending = prev.filter((row) => row._justCreated && !ids.has(row.id));
                    return [...pending, ...rows];
                });
                setTotalPages(unwrapLastPage(result));
            } else {
                console.error(result);
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTemplates(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    //Create / Update Lead
    const processCreateTemplate = async (e) => {
        e.preventDefault();
        setReqLoader(true);
        
        const headers = {
            "Authorization": `Bearer ${token}`,
        };

        try {
            const formData = new FormData();
  
            if (templateId !== "") formData.append("id", templateId);
            
            formData.append("title", formFields.title);
            formData.append("subject", formFields.subject);
            formData.append("message", contentRef.current);
            formData.append("type", templateType);
       
            files.forEach((file, index) => {
                if (file.uploaded && file.file instanceof File) {
                    formData.append("attachments[]", file.file);
                }
            });

            const response = await fetch(apiRoutes.createTemplate, {
                method: "POST",
                headers: headers,
                body: formData,
            });
    
            const result = await response.json();
    
            if (response.ok) {
                setFormFields({
                    title: "",
                    subject: "",
                    message: "",
                    type: "",
                    status: ""
                });

                contentRef.current = "";

                setFiles([]);

                setTemplates((prev) => prependRow(prev, result.data));
                closeMenu();
            } else {
                alert(result.message || "Failed to create contact.");
            }
        } catch (error) {
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.values(validationErrors).forEach(errs => {
                  errs.forEach(err => console.log(err));
                });
            } else {
                console.log("Unexpected error occurred.");
            }
        }  finally {
            setReqLoader(false);
    
            setTimeout(() => {
                setShowMessageError(false);
            }, 4500);
    
            setTimeout(() => {
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    }

    //Process Lead Delete 
    const deleteLead = async (leadId) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) {
            return; // User cancelled
        }
    
        try {
            const response = await fetch(apiRoutes.deleteLead.replace('{id}', leadId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            const result = await response.json();
            if (response.ok && result.status) {
                alert(result.message);
                fetchLeads(currentPage, searchQuery); 
            } else if (response.status === 404) {
                alert(result.message || 'Lead not found.');
            } else if (response.status === 401) {
                alert(result.message || 'Unauthorized. Please log in again.');
            } else {
                alert(result.message || 'Failed to delete lead.');
                console.error(result);
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('An error occurred. Please try again.');
        }
    };

    //Delete multiple Leads
    const handleCheckboxChange = (id, isChecked) => {
        setSelectedTemplates((prev) => 
            isChecked ? [...prev, id] : prev.filter((leadId) => leadId !== id)
        );
    };

    //Process Multiple Delete
    const deleteSelectedLeads = async () => {
        if (selectedLeads.length === 0) {
            alert('Please select at least one lead to delete.');
            return;
        }
    
        if (!window.confirm('Are you sure you want to delete selected leads?')) {
            return;
        }
    
        try {
            const response = await fetch(apiRoutes.deleteMultipleLeads, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ids: selectedLeads }),
            });
    
            const result = await response.json();
    
            if (response.ok && result.status) {
                alert(result.message);
                setSelectedTemplates([]);
                fetchTemplates(currentPage, searchQuery);
            } else {
                alert(result.message || 'Failed to delete selected leads.');
                console.error(result);
            }
        } catch (error) {
            console.error('Error deleting leads:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return ( 
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Templates</h4>
                </div>

                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={createTemplateFormDisplay} className="btn btn-primary b-r-22">
                            <LayoutLeft /> Create Template
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center m-b-40">
                                <h5>Manage Templates</h5>
                                
                                <div className="app-form app-icon-form">
                                    <div className="position-relative icon-input-form">
                                        <input aria-label="Search" className="form-control search-filter" placeholder="Search..." type="search"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1); 
                                        }}
                                        />
                                        <Search className="svg-dark" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="table-responsive mt-4">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">&nbsp;</th>
                                            <th scope="col">Title</th>
                                            <th scope="col">Subject</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center">Loading...</td>
                                        </tr>
                                    ) : (templates || []).length > 0 ? (
                                        templates.map((template) => (
                                            <tr key={template.id}>
                                                <td>
                                                    <label className="check-box">
                                                        <input 
                                                            type="checkbox" 
                                                            id="primary"
                                                            checked={selectedTemplates.includes(template.id)}
                                                            onChange={(e) => handleCheckboxChange(template.id, e.target.checked)}
                                                        />
                                                        <span className="checkmark outline-primary ms-2"></span>
                                                    </label>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <p className="mb-0 f-w-500">{template.title || '—'}</p>
                                                    </div>
                                                </td>
                                                <td className="f-w-500">{template.subject || '—'}</td>
                                                <td>
                                                    <span className={`badge ${template.status === 1 ? "text-light-success" : "text-light-warning"}`}>
                                                        {template.status === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => handleTemplateEditForm(template)} className="btn btn-light-success icon-btn b-r-4">
                                                        <Edit size={12} width={16} className="text-success" />
                                                    </button>
                                                    <button type="button" onClick={() => deleteLead(template.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                        <Trash size={12} width={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center">No templates found.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>

                                {selectedTemplates.length > 0 && (
                                    <button type="button" className="btn btn-pinterest" onClick={deleteSelectedLeads}>
                                        <span
                                            className="loader spinner-border spinner-border-sm me-2"
                                            style={{ display: 'none' }}
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        <span className="loaderIcon"><Trash size={12} width={16} /></span> Delete Templates
                                    </button>
                                )}

                                <div className="mt-3">
                                    <ul className="pagination app-pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <a
                                                className="page-link"
                                                href="#"
                                                aria-label="Previous"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                }}
                                            >
                                                <span aria-hidden="true">«</span>
                                            </a>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                <a
                                                    className="page-link"
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentPage(pageNum);
                                                    }}
                                                >
                                                    {pageNum}
                                                </a>
                                            </li>
                                        ))}

                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <a
                                                className="page-link"
                                                href="#"
                                                aria-label="Next"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                }}
                                            >
                                                <span aria-hidden="true">»</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {burgerActive && (
                <div className={`burger-menu ${addActiveClass ? "active-in" : ""}`}>
                    <div className="burger-menu-wrapper">
                        <a href="#" className={`close-menu ${addActiveClass ? "jump-in" : ""}`} onClick={closeMenu}>
                            <Xmark />
                        </a>

                        <div className="col-wrapper-full">
                            <div className="col-md-12 full-loader">
                                {templateCreateForm && (
                                    <>
                                        <h2 className="card-title mb-4">{editTemplateForm ? 'Edit Template' : 'Create Template'}</h2>
                                        
                                        <form method="POST" onSubmit={processCreateTemplate} encType="multipart/form-data">
                                            <div className="app-form">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Title</label>
                                                            <input
                                                                className="form-control"
                                                                name="title"
                                                                type="text"
                                                                value={formFields.title}
                                                                onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                    
                                                    </div>

                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label" htmlFor="username">Subject</label>
                                                            <input
                                                                className="form-control"
                                                                name="subject"
                                                                type="text"
                                                                value={formFields.subject}
                                                                onChange={(e) => setFormFields({ ...formFields, subject: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            {templateType === 'transactional' ? (
                                                                <div className="row">
                                                                    <div className="col-md-8">
                                                                        <label className="form-label" htmlFor="username">Message</label>
                                                                        {/* <ReactSummernoteLite
                                                                            id="sample-editor"
                                                                            ref={summernoteRef}
                                                                            height={310}
                                                                            placeholder="Type your content here..."
                                                                            onInit={({ note }) => {
                                                                                if (formFields.message) {
                                                                                    note.summernote('code', formFields.message);
                                                                                }
                                                                                summernoteRef.current = note;
                                                                            }}
                                                                            onChange={(content) => {
                                                                                contentRef.current = content;
                                                                            }}
                                                                        /> */}

                                                                        <HtmlEditor
                                                                            message={formFields.message}
                                                                            onChange={handleEditorChange}
                                                                            summernoteRef={summernoteRef}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <label className="form-label">Shortcode for template email</label>

                                                                        <div className="codeBlock">
                                                                            {shortcodes.map((code) => (
                                                                                <label key={code}>
                                                                                <p>{code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} :</p>
                                                                                <a
                                                                                    href="#"
                                                                                    className="add-shortcode"
                                                                                    onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    if (summernoteRef.current) {
                                                                                        summernoteRef.current.summernote('insertText', `[${code}]`);
                                                                                    }
                                                                                    }}
                                                                                >
                                                                                    [{code}]
                                                                                </a>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <label className="form-label" htmlFor="username">Message</label>
                                                                    <HtmlEditor
                                                                        message={formFields.message}
                                                                        onChange={handleEditorChange}
                                                                        summernoteRef={summernoteRef}
                                                                    />                                                             
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <div
                                                            {...getRootProps()}
                                                            style={{
                                                                border: "2px dashed #ccc",
                                                                padding: 20,
                                                                textAlign: "center",
                                                                cursor: "pointer",
                                                                backgroundColor: isDragActive ? "#f0f8ff" : "transparent",
                                                                marginBottom: 20,
                                                            }}
                                                        >
                                                            <input {...getInputProps()} />
                                                            <p>
                                                                {isDragActive
                                                                    ? "Drop images here..."
                                                                    : "Drag & drop images here, or click to select files"}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            {files.map((file) => (
                                                                <div
                                                                    key={file.id}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "space-between",
                                                                        marginBottom: 10,
                                                                        padding: 10,
                                                                        paddingLeft: 10,
                                                                        paddingRight: 10,
                                                                        border: "1px solid #ccc",
                                                                        borderRadius: 10,
                                                                    }}
                                                                >
                                                                    {file.isPreUploaded ? (
                                                                        <img 
                                                                            src={file.url} 
                                                                            style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, marginRight: 10 }} 
                                                                        />
                                                                    ) : (
                                                                        <div className="badge text-light-primary" title={file.name}>
                                                                            {file.name}
                                                                        </div>
                                                                    )}

                                                                    {!file.uploaded && (
                                                                        <div className="progress w-100" role="progressbar" aria-valuenow={file.progress} aria-valuemin="0"
                                                                        aria-valuemax="100">
                                                                            <div className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                                                                                style={{
                                                                                    width: `${file.progress}%`,
                                                                                    transition: 'width 0.3s ease'
                                                                                }}
                                                                            > 
                                                                            {file.progress}%
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="btn-row">
                                                                        {file.uploaded && (
                                                                            <div className="btn btn-light-success icon-btn b-r-4 btn-sm-rounded">
                                                                                <CheckCircle size={12} width={16} className="text-success" />
                                                                            </div>
                                                                        )}

                                                                        <button type="button" onClick={() => removeFile(file.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5  btn-sm-rounded">
                                                                            <Trash size={12} width={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {templateId !== "" && (
                                                    <input type="hidden" name="id" value={templateId} />
                                                )}

                                                <button type="submit" className="btn btn-primary b-r-22">
                                                    {editTemplateForm ? 'Update Template' : 'Create New'}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {reqLoader && (
                                    <div className="full-loader-wrapper" style={{ display: "block" }}>
                                        <div className="loader-sub">
                                            <div className="lds-ellipsis">
                                                <div></div><div></div><div></div><div></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout> 
    );
}

export default Templates;
