import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const styles = {
  container: {
    padding: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    background: 'linear-gradient(to right, #63b3ed, #4fd1c5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#4a5568',
    color: '#e2e8f0',
    border: '1px solid #718096',
    borderRadius: '0.375rem',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  link: {
    color: '#63b3ed',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '0.5rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    marginBottom: '1rem',
  },
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({ title: '' });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/reports', newReport);
      setNewReport({ title: '' });
      fetchReports();
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Reports</h2>
      <form onSubmit={handleCreateReport} style={styles.form}>
        <input
          type="text"
          value={newReport.title}
          onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
          placeholder="New Report Title"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Create Report</button>
      </form>
      <ul style={styles.list}>
        {reports.map(report => (
          <li key={report.id} style={styles.listItem}>
            <Link to={`/report/${report.id}`} style={styles.link}>{report.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reports;