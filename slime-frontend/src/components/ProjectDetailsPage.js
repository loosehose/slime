import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LuEye, LuTrash2, LuArrowLeft } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';
import ProjectSummaryGenerator from './ProjectSummaryGenerator';

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [findings, setFindings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const projectResponse = await axios.get(`http://localhost:5000/get_project/${projectId}`);
                setProject(projectResponse.data);

                if (Array.isArray(projectResponse.data.findings)) {
                    const findingDetails = projectResponse.data.findings.map(finding => ({
                        id: finding.id,
                        title: finding.report ? JSON.parse(finding.report).Title : 'No Title',
                        overview: finding.overview || 'No Overview'
                    }));
                    setFindings(findingDetails);
                } else {
                    console.error('Findings data is not in the expected format:', projectResponse.data.findings);
                    setError('Findings data is not in the expected format');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching project details:', err);
                setError(`Error fetching project details: ${err.response?.data?.error || err.message}`);
                setLoading(false);
            }
        };

        fetchProjectDetails();
    }, [projectId]);

    const deleteFinding = async (id) => {
        if (window.confirm('Are you sure you want to remove this finding from the project?')) {
            try {
                // Here you would typically call an API to remove the finding from the project
                // For now, we'll just update the state
                setFindings(findings.filter(finding => finding.id !== id));
            } catch (err) {
                console.error('Error removing finding:', err);
                setError(`Error removing finding: ${err.message}`);
            }
        }
    };

    if (loading) return <div className="container"><div className="loading">Loading...</div></div>;
    if (error) return <div className="container"><div className="error">{error}</div></div>;
    if (!project) return <div className="container"><div className="error">Project not found</div></div>;

    return (
        <div className="container">
            <Link to="/projects" className="back-link">
                <LuArrowLeft /> Back to Projects
            </Link>
            <h1 className="title">{project.name}</h1>
            <p><strong>ID:</strong> {project.id}</p>
            <p><strong>Description:</strong> {project.description}</p>

            <ProjectSummaryGenerator project={project} findings={findings} />

            <h2>Associated Findings</h2>
            {findings.length === 0 ? (
                <p>No findings associated with this project.</p>
            ) : (
                <table className="findings-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Overview</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {findings.map((finding) => (
                            <tr key={finding.id}>
                                <td>{finding.id}</td>
                                <td>{finding.title}</td>
                                <td>{finding.overview}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="icon-button"
                                            onClick={() => window.open(`/view-report/${finding.id}`, '_blank')}
                                            aria-label="View Finding"
                                        >
                                            <LuEye className="view-button-icon" />
                                            <span className="tooltip">View Finding</span>
                                        </button>
                                        <button
                                            className="icon-button"
                                            onClick={() => deleteFinding(finding.id)}
                                            aria-label="Remove Finding"
                                        >
                                            <LuTrash2 className="delete-button-icon" />
                                            <span className="tooltip">Remove Finding</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="error"
                        role="alert"
                    >
                        <p className="error-title">Error</p>
                        <p>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectDetailsPage;