import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LuSave, LuPencilLine, LuArrowLeft, LuX } from "react-icons/lu";
import MDEditor from '@uiw/react-md-editor';

const ViewFinding = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const { id } = useParams();

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/get_report/${id}`);
      const parsedReport = parseReport(response.data);
      setReport(parsedReport);
      setEditedFields(parsedReport.report);
      setError(null);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(`Error fetching report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseReport = (reportData) => {
    if (typeof reportData.report === 'string') {
      try {
        return {
          ...reportData,
          report: JSON.parse(reportData.report)
        };
      } catch (parseError) {
        console.error('Error parsing report JSON:', parseError);
        throw new Error('Error parsing report data. The report might be in an invalid format.');
      }
    }
    return reportData;
  };

  const handleEdit = (key, value) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const updatedReport = {
        ...report,
        report: JSON.stringify(editedFields)
      };
      const response = await axios.put(`http://localhost:5000/update_report/${id}`, updatedReport);

      if (response.data.message === 'Report updated successfully') {
        setReport(prevReport => ({
          ...prevReport,
          report: editedFields
        }));
        setEditing(false);
        setError(null);
      } else {
        const savedReport = parseReport(response.data);
        setReport(savedReport);
        setEditedFields(savedReport.report);
        setEditing(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error saving report:', err);
      setError(`Error saving report: ${err.response?.data?.error || err.message}`);
    }
  };

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.join('\n\n');
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value || '');
  };

  const renderField = (key, value) => {
    const formattedValue = formatValue(value);
    return (
      <motion.div 
        key={key} 
        className="report-field"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3>{key}</h3>
        {editing ? (
          <MDEditor
            value={formatValue(editedFields[key])}
            onChange={(newValue) => handleEdit(key, newValue)}
            preview="edit"
            height={200}
          />
        ) : (
          <MDEditor.Markdown source={formattedValue} />
        )}
      </motion.div>
    );
  };

  const renderReport = () => {
    if (!report) return null;

    const fieldOrder = [
      'Title',
      'CVSS',
      'CVSS_String_Explanation',
      'Mitre_Attack_ID',
      'Risk_Rating',
      'Impact_Rating_Explanation',
      'Likelihood_Rating_Explanation',
      'Overview',
      'Business_Impact',
      'Mitigations',
      'References'
    ];

    return (
      <>
        <motion.h2 
          className="report-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {editing ? (
            <MDEditor
              value={formatValue(editedFields.Title)}
              onChange={(newValue) => handleEdit('Title', newValue)}
              preview="edit"
              height={100}
            />
          ) : (
            <MDEditor.Markdown source={formatValue(report.report.Title) || 'Untitled Report'} />
          )}
        </motion.h2>
        {fieldOrder.map(key => {
          if (key !== 'Title' && report.report.hasOwnProperty(key)) {
            return renderField(key, report.report[key]);
          }
          return null;
        })}
      </>
    );
  };

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/view-findings" className="back-link">
          <LuArrowLeft /> Back to Findings
        </Link>
      </motion.div>

      {loading ? (
        <motion.div 
          className="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="loader"></div>
          <p>Loading report...</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="error"
        >
          {error}
        </motion.div>
      ) : report ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="report-container"
        >
          {renderReport()}
          <div className="report-actions">
            <motion.button 
              className="icon-button"
              onClick={editing ? handleSave : () => setEditing(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {editing ? <LuSave /> : <LuPencilLine />}
              <span className="tooltip">{editing ? 'Save changes' : 'Edit report'}</span>
            </motion.button>
            {editing && (
              <motion.button 
                className="icon-button"
                onClick={() => {
                  setEditing(false);
                  setEditedFields(report.report);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <LuX />
                <span className="tooltip">Cancel editing</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="error"
        >
          Report not found
        </motion.div>
      )}
    </div>
  );
};

export default ViewFinding;