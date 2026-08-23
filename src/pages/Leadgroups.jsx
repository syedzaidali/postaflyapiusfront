import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiRoutes from '../routes/api/apiRoutes';
import AppLayout from '../components/Layouts/AppLayout';
import {
    FastArrowLeft,
    Edit,
    Trash
} from '../utils/icons';

const Leadgroups = () => {
    const token = localStorage.getItem('auth_token');
    const navigate = useNavigate();

    const [groupName, setGroupName] = useState("");
    const [status, setStatus] = useState(1);
    const [groups, setGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [groupID, setGroupID] = useState('');
    const [reqLoader, setReqLoader] = useState(false);
    const [loading, setLoading] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [displayMessageSuccess, setDisplayMessageSuccess] = useState(false);
    const [displayMessageError, setDisplayMessageError] = useState(false);

    const handleCheckboxChange = (groupId, checked) => {
        setSelectedGroups((prev) =>
            checked ? [...prev, groupId] : prev.filter((id) => id !== groupId)
        );
    };

    const normalizeGroup = (group) => ({
        id: group.id || group.ID,
        title: group.title || group.name || "",
        status: Number(group.status ?? 1),
        leadsCount: group.leadsCount ?? group.leads_count ?? 0,
    });

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiRoutes.getGroups}?_ts=${Date.now()}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache",
                },
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setGroups((result.groups || []).map(normalizeGroup));
        } catch (error) {
            console.error("Failed to fetch groups", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [token]);

    const handleCreateGroupSubmit = async (e) => {
        e.preventDefault();

        if (!groupName.trim()) {
            setDisplayMessageError(true);
            setMessageText("Group name is required.");
            return;
        }

        setReqLoader(true);
        setDisplayMessageError(false);
        setDisplayMessageSuccess(false);

        try {
            const response = await fetch(apiRoutes.createGroup, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...(groupID ? { id: groupID } : {}),
                    name: groupName.trim(),
                    status,
                }),
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setDisplayMessageSuccess(true);
                setMessageText(result.message || "Group created successfully!");
                setGroupName("");
                setStatus(1);
                setGroupID("");

                const newGroup = normalizeGroup(result.data || result.group || {});
                if (newGroup.id) {
                    setGroups((prev) => [newGroup, ...prev.filter((g) => g.id !== newGroup.id)]);
                }

                await fetchGroups();
            } else {
                setDisplayMessageError(true);
                setMessageText(result.message || "Failed to create group.");
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An unexpected error occurred. Please try again.");
        } finally {
            setReqLoader(false);
            setTimeout(() => {
                setDisplayMessageSuccess(false);
                setDisplayMessageError(false);
                setMessageText("");
            }, 8000);
        }
    };

    const handleEditGroup = (group) => {
        setGroupID(group.id);
        setGroupName(group.title || "");
        setStatus(Number(group.status ?? 1));
    };

    const deleteGroup = async (id) => {
        if (!window.confirm("Are you sure you want to delete this group?")) {
            return;
        }

        try {
            const response = await fetch(apiRoutes.deleteGroup.replace("{id}", id), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (response.ok && result.status) {
                setGroups((prev) => prev.filter((g) => g.id !== id));
                setSelectedGroups((prev) => prev.filter((gid) => gid !== id));
                setDisplayMessageSuccess(true);
                setMessageText(result.message || "Group deleted successfully!");
                await fetchGroups();
            } else {
                setDisplayMessageError(true);
                setMessageText(result.message || "Failed to delete group.");
            }
        } catch (error) {
            setDisplayMessageError(true);
            setMessageText("An error occurred. Please try again.");
        }
    };

    const deleteSelectedGroups = async () => {
        if (!selectedGroups.length) return;
        if (!window.confirm(`Delete ${selectedGroups.length} selected group(s)?`)) {
            return;
        }

        for (const id of selectedGroups) {
            await deleteGroup(id);
        }
        setSelectedGroups([]);
    };

    return (
        <AppLayout>
            <div className="m-1 row mb-3">
                <div className="col-5">
                    <h4 className="main-title f-s-26">Lead Groups</h4>
                </div>
                <div className="col-7">
                    <div className="d-flex justify-content-end gap-10">
                        <button type="button" onClick={() => navigate("/leads")} className="btn btn-primary b-r-22">
                            <FastArrowLeft /> Back
                        </button>
                    </div>
                </div>
            </div>

            {(displayMessageSuccess || displayMessageError) && (
                <div className={`alert ${displayMessageSuccess ? "alert-success" : "alert-danger"}`}>
                    {messageText}
                </div>
            )}

            <div className="row">
                <div className="col-lg-5 col-xxl-4">
                    <div className="card">
                        <div className="card-header">
                            <h5>{groupID ? "Update Group" : "Create Group"}</h5>
                        </div>

                        <div className="card-body full-loader">
                            <form method="POST" onSubmit={handleCreateGroupSubmit}>
                                <div className="app-form">
                                    <div className="mb-3">
                                        <label className="form-label">Group Name</label>
                                        <input
                                            className="form-control"
                                            name="groupName"
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Status</label>
                                        <div className="d-flex">
                                            <div className="form-check d-flex align-items-center gap-1">
                                                <input
                                                    className="form-check-input f-s-18 mb-1"
                                                    id="radio_active"
                                                    name="status"
                                                    type="radio"
                                                    value="1"
                                                    checked={status === 1}
                                                    onChange={(e) => setStatus(Number(e.target.value))}
                                                />
                                                <label className="form-check-label" htmlFor="radio_active">
                                                    Active
                                                </label>
                                            </div>

                                            <div className="form-check d-flex align-items-center gap-1 mg-s-10">
                                                <input
                                                    className="form-check-input f-s-18 m-1"
                                                    id="radio_inactive"
                                                    name="status"
                                                    type="radio"
                                                    value="0"
                                                    checked={status === 0}
                                                    onChange={(e) => setStatus(Number(e.target.value))}
                                                />
                                                <label className="form-check-label" htmlFor="radio_inactive">
                                                    Inactive
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary b-r-22" disabled={reqLoader}>
                                        {reqLoader ? "Saving..." : (groupID ? "Update Group" : "Create Group")}
                                    </button>
                                    {groupID && (
                                        <button
                                            type="button"
                                            className="btn btn-light b-r-22 ms-2"
                                            onClick={() => {
                                                setGroupID("");
                                                setGroupName("");
                                                setStatus(1);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>

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

                <div className="col-lg-8 col-xxl-8">
                    <div className="card">
                        <div className="card-header">
                            <h5>Manage Groups</h5>
                        </div>

                        <div className="card-body full-loader">
                            <div className="table-responsive mt-4">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">&nbsp;</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Leads</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center">Loading...</td>
                                            </tr>
                                        ) : groups.length > 0 ? (
                                            groups.map((group) => (
                                                <tr key={group.id}>
                                                    <td>
                                                        <label className="check-box">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedGroups.includes(group.id)}
                                                                onChange={(e) => handleCheckboxChange(group.id, e.target.checked)}
                                                            />
                                                            <span className="checkmark outline-primary ms-2"></span>
                                                        </label>
                                                    </td>
                                                    <td>
                                                        <p className="mb-0 f-w-500">{group.title || "—"}</p>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${group.status === 1 ? "text-light-success" : "text-light-warning"}`}>
                                                            {group.status === 1 ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td>{group.leadsCount}</td>
                                                    <td>
                                                        <button type="button" onClick={() => handleEditGroup(group)} className="btn btn-light-success icon-btn b-r-4">
                                                            <Edit size={12} width={16} className="text-success" />
                                                        </button>
                                                        <button type="button" onClick={() => deleteGroup(group.id)} className="btn btn-light-danger icon-btn b-r-4 mg-s-5">
                                                            <Trash size={12} width={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center">No groups found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {selectedGroups.length > 0 && (
                                    <button type="button" className="btn btn-pinterest" onClick={deleteSelectedGroups}>
                                        <Trash size={12} width={16} /> Delete Groups
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Leadgroups;
