import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LuX, LuSave, LuXCircle, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';

const EditProject = ({ project, onSave, onClose }) => {
    const [editedProject, setEditedProject] = useState(project);
    const [availableFindings, setAvailableFindings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const findingsPerPage = 12;

    useEffect(() => {
        const fetchAvailableFindings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/get_findings');
                setAvailableFindings(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching findings:', error);
                setError('Failed to load findings. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableFindings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedProject(prev => ({ ...prev, [name]: value }));
    };

    const handleFindingToggle = (findingId) => {
        setEditedProject(prev => {
            const findings = Array.isArray(prev.findings) 
                ? prev.findings.map(f => typeof f === 'object' ? f.id : f)
                : [];
            return {
                ...prev,
                findings: findings.includes(findingId)
                    ? findings.filter(id => id !== findingId)
                    : [...findings, findingId]
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedProject = {
            ...editedProject,
            findings: Array.isArray(editedProject.findings) 
                ? editedProject.findings.map(f => typeof f === 'object' ? f.id : f)
                : []
        };
        onSave(updatedProject);
    };

    const filteredFindings = availableFindings.filter(finding =>
        (finding.title && finding.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (finding.id && finding.id.toString().includes(searchTerm))
    );

    const indexOfLastFinding = currentPage * findingsPerPage;
    const indexOfFirstFinding = indexOfLastFinding - findingsPerPage;
    const currentFindings = filteredFindings.slice(indexOfFirstFinding, indexOfLastFinding);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="modal-backdrop">
            <motion.div 
                className="modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Edit Project</h2>
                        <motion.button 
                            className="icon-button" 
                            onClick={onClose} 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <LuX />
                            <span className="tooltip">Close</span>
                        </motion.button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name" className="label">Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="input"
                                value={editedProject.name || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description" className="label">Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                className="textarea"
                                value={editedProject.description || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Associated Findings:</label>
                            <div className="search-container">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search findings..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>
                            {loading ? (
                                <div className="loading">Loading findings...</div>
                            ) : error ? (
                                <div className="error">{error}</div>
                            ) : (
                                <>
                                    <div className="findings-grid">
                                        <AnimatePresence>
                                            {currentFindings.map(finding => (
                                                <motion.div 
                                                    key={finding.id} 
                                                    className={`finding-card ${
                                                        Array.isArray(editedProject.findings) && 
                                                        editedProject.findings.some(f => 
                                                            (typeof f === 'object' ? f.id : f) === finding.id
                                                        ) ? 'selected' : ''
                                                    }`}
                                                    onClick={() => handleFindingToggle(finding.id)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                >
                                                    <h4 title={finding.title}>{finding.title || 'Untitled'}</h4>
                                                    <p>ID: {finding.id}</p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                    <div className="pagination">
                                        <button 
                                            onClick={() => paginate(currentPage - 1)} 
                                            disabled={currentPage === 1}
                                            className="pagination-button"
                                        >
                                            <LuChevronLeft />
                                        </button>
                                        <span>{currentPage}</span>
                                        <button 
                                            onClick={() => paginate(currentPage + 1)} 
                                            disabled={indexOfLastFinding >= filteredFindings.length}
                                            className="pagination-button"
                                        >
                                            <LuChevronRight />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="action-buttons">
                            <motion.button 
                                type="submit" 
                                className="icon-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <LuSave />
                                <span className="tooltip">Save Changes</span>
                            </motion.button>
                            <motion.button 
                                type="button" 
                                className="icon-button"
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <LuXCircle />
                                <span className="tooltip">Cancel</span>
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default EditProject;