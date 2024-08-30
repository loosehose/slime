import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LuEye, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';

const ViewFindings = () => {
    const [findings, setFindings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchFindings();
    }, []);

    const fetchFindings = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/get_findings');
            setFindings(response.data);
            setError(null);
        } catch (err) {
            console.error('Error details:', err);
            setError(`Error fetching findings: ${err.message}. ${err.response?.data?.error || ''}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteFinding = async (id) => {
        if (window.confirm('Are you sure you want to delete this finding?')) {
            try {
                await axios.delete(`http://localhost:5000/delete_finding/${id}`);
                setFindings(findings.filter(finding => finding.id !== id));
                setError(null);
            } catch (err) {
                console.error('Error deleting finding:', err);
                setError(`Error deleting finding: ${err.message}. ${err.response?.data?.error || ''}`);
            }
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredFindings = findings.filter(finding =>
        (finding.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (finding.overview?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedFindings = React.useMemo(() => {
        let sortableItems = [...filteredFindings];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] == null) return 1;
                if (b[sortConfig.key] == null) return -1;
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredFindings, sortConfig]);

    const viewFindingDetail = (id) => {
        navigate(`/view-report/${id}`);
    };

    const renderOverview = (overview) => {
        const maxLength = 200; // Adjust this value to change the maximum length of the overview
        if (overview && overview.length > maxLength) {
            return overview.substring(0, maxLength) + '...';
        }
        return overview || 'N/A';
    };

    return (
        <div className="container">
            <motion.h1 
                className="title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Findings
            </motion.h1>

            <motion.div 
                className="controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="search-container">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search findings..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                </div>
                <motion.button
                    className="icon-button"
                    onClick={fetchFindings}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Refresh Findings"
                >
                    <LuRefreshCw />
                    <span className="tooltip">Refresh</span>
                </motion.button>
            </motion.div>

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

            {loading ? (
                <motion.div 
                    className="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="loader"></div>
                    <p>Loading findings...</p>
                </motion.div>
            ) : sortedFindings.length === 0 ? (
                <motion.p
                    className="no-findings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    No findings available.
                </motion.p>
            ) : (
                <motion.div 
                    className="table-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <table className="findings-table">
                        <thead>
                            <tr>
                                {['id', 'title', 'overview'].map((key) => (
                                    <th key={key} onClick={() => requestSort(key)}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                        {sortConfig.key === key && (
                                            <span className="sort-indicator">
                                                {sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}
                                            </span>
                                        )}
                                    </th>
                                ))}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {sortedFindings.map((finding, index) => (
                                    <motion.tr 
                                        key={finding.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <td>{finding.id}</td>
                                        <td>{finding.title || 'N/A'}</td>
                                        <td>{renderOverview(finding.overview)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <motion.button
                                                    className="icon-button"
                                                    onClick={() => viewFindingDetail(finding.id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <LuEye />
                                                    <span className="tooltip">View</span>
                                                </motion.button>
                                                <motion.button
                                                    className="icon-button delete-button"
                                                    onClick={() => deleteFinding(finding.id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <LuTrash2 />
                                                    <span className="tooltip">Delete</span>
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    );
};

export default ViewFindings;