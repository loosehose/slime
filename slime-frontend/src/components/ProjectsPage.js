import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LuEye, LuTrash2, LuPencil, LuFolderPlus, LuX, LuSave } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';
import EditProject from './EditProject';

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [editingProject, setEditingProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/get_projects');
            setProjects(response.data);
            setError(null);
        } catch (err) {
            console.error('Error details:', err);
            setError(`Error fetching projects: ${err.message}. ${err.response?.data?.error || ''}`);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/create_project', newProject);
            setNewProject({ name: '', description: '' });
            fetchProjects();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error creating project:', err);
            setError(`Error creating project: ${err.message}. ${err.response?.data?.error || ''}`);
        }
    };

    const handleEditProject = async (id) => {
        try {
            const response = await axios.get(`http://localhost:5000/get_project/${id}`);
            const projectData = response.data;
            projectData.findings = Array.isArray(projectData.findings) ? projectData.findings : [];
            setEditingProject(projectData);
        } catch (err) {
            console.error('Error fetching project details:', err);
            setError(`Error fetching project details: ${err.message}. ${err.response?.data?.error || ''}`);
        }
    };

    const handleSaveProject = async (editedProject) => {
        try {
            await axios.put(`http://localhost:5000/update_project/${editedProject.id}`, editedProject);
            setEditingProject(null);
            fetchProjects();
        } catch (err) {
            console.error('Error saving project:', err);
            setError(`Error saving project: ${err.message}. ${err.response?.data?.error || ''}`);
        }
    };

    const deleteProject = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await axios.delete(`http://localhost:5000/delete_project/${id}`);
                setProjects(projects.filter(project => project.id !== id));
            } catch (err) {
                console.error('Error deleting project:', err);
                setError(`Error deleting project: ${err.message}. ${err.response?.data?.error || ''}`);
            }
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedProjects = React.useMemo(() => {
        let sortableItems = [...filteredProjects];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
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
    }, [filteredProjects, sortConfig]);

    return (
        <div className="container">
            <motion.h1 
                className="title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Projects
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
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                </div>
                <div className="button-container">
                    <motion.button
                        className="icon-button"
                        onClick={() => setIsModalOpen(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Add New Project"
                    >
                        <LuFolderPlus />
                        <span className="tooltip">Add New Project</span>
                    </motion.button>
                </div>
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
                    <p>Loading projects...</p>
                </motion.div>
            ) : sortedProjects.length === 0 ? (
                <motion.p
                    className="no-projects"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    No projects available.
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
                                {['id', 'name', 'description'].map((key) => (
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
                                {sortedProjects.map((project, index) => (
                                    <motion.tr 
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <td>{project.id}</td>
                                        <td>{project.name}</td>
                                        <td>{project.description}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/projects/${project.id}`}
                                                    className="icon-button"
                                                    aria-label="View Project"
                                                >
                                                    <LuEye />
                                                    <span className="tooltip">View Project</span>
                                                </Link>
                                                <motion.button
                                                    className="icon-button"
                                                    onClick={() => handleEditProject(project.id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    aria-label="Edit Project"
                                                >
                                                    <LuPencil />
                                                    <span className="tooltip">Edit Project</span>
                                                </motion.button>
                                                <motion.button
                                                    className="icon-button delete-button"
                                                    onClick={() => deleteProject(project.id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    aria-label="Delete Project"
                                                >
                                                    <LuTrash2 />
                                                    <span className="tooltip">Delete Project</span>
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

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="modal"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2 className="modal-title">Create New Project</h2>
                                    <motion.button 
                                        className="icon-button" 
                                        onClick={() => setIsModalOpen(false)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <LuX />
                                        <span className="tooltip">Close</span>
                                    </motion.button>
                                </div>
                                <form onSubmit={createProject}>
                                    <div className="form-group">
                                        <label htmlFor="name" className="label">Name:</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            className="input"
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="description" className="label">Description:</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className="textarea"
                                            value={newProject.description}
                                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="action-buttons">
                                        <motion.button 
                                            type="submit" 
                                            className="icon-button"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <LuSave />
                                            <span className="tooltip">Create Project</span>
                                        </motion.button>
                                        <motion.button 
                                            type="button" 
                                            className="icon-button"
                                            onClick={() => setIsModalOpen(false)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <LuX />
                                            <span className="tooltip">Cancel</span>
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {editingProject && (
                <EditProject
                    project={editingProject}
                    onSave={handleSaveProject}
                    onClose={() => setEditingProject(null)}
                />
            )}
        </div>
    );
};

export default ProjectsPage;