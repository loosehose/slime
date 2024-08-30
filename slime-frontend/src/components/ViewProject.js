import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LuX } from "react-icons/lu";

const ViewProject = ({ project, onClose }) => {
    const [findingDetails, setFindingDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFindingDetails = async () => {
            try {
                const findingPromises = project.findings.map(finding => 
                    axios.get(`http://localhost:5000/get_report/${finding.id}`)
                );
                const findingResponses = await Promise.all(findingPromises);
                const details = findingResponses.map(response => ({
                    id: response.data.id,
                    title: JSON.parse(response.data.report).Title
                }));
                setFindingDetails(details);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching finding details:', err);
                setError('Failed to load finding details');
                setLoading(false);
            }
        };

        fetchFindingDetails();
    }, [project.findings]);

    if (loading) return <div className="modal"><div className="modal-content">Loading...</div></div>;
    if (error) return <div className="modal"><div className="modal-content">Error: {error}</div></div>;

    return (
        <div className="modal">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    <LuX />
                </button>
                <h2 className="modal-title">{project.name}</h2>
                <p><strong>ID:</strong> {project.id}</p>
                <p><strong>Description:</strong> {project.description}</p>
                <h3>Associated Findings:</h3>
                <ul className="findings-list">
                    {findingDetails.map(finding => (
                        <li key={finding.id}>{finding.id} - {finding.title}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ViewProject;