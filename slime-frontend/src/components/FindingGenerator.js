import React, { useState } from 'react';
import axios from 'axios';
import { IoMdClipboard } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import useErrorHandler from '../hooks/useErrorHandler';
import ReportRenderer from './reportRenderer';
import '../styles/global.css';

const FindingGenerator = () => {
  const [reportType, setReportType] = useState('');
  const [overview, setOverview] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [obfuscateUsernames, setObfuscateUsernames] = useState(false);
  const [obfuscateMachines, setObfuscateMachines] = useState(false);
  const [obfuscateDomains, setObfuscateDomains] = useState(false);
  const [isGrammarCorrecting, setIsGrammarCorrecting] = useState(false);

  const { errors, isVisible, addError, clearAllErrors } = useErrorHandler();

  const handleGrammarCorrection = async () => {
    setIsGrammarCorrecting(true);
    try {
      const response = await axios.post('http://localhost:5000/correct_grammar', {
        text: JSON.stringify(report, null, 2),
      });
      setReport(JSON.parse(response.data.corrected_text));
      addError('Grammar correction completed successfully', 'success', 3000);
    } catch (error) {
      console.error('Error correcting grammar:', error);
      addError('Failed to correct grammar. Please try again.', 'error');
    } finally {
      setIsGrammarCorrecting(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      .then(() => {
        console.log('Text copied to clipboard');
        addError('Report copied to clipboard', 'success', 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        addError('Failed to copy text to clipboard', 'error');
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (!reportType || !overview.trim()) {
      addError('Please fill in all fields', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/generate_report', {
        report_type: reportType,
        parameters: { Overview: overview },
        obfuscate_usernames: obfuscateUsernames,
        obfuscate_machines: obfuscateMachines,
        obfuscate_domains: obfuscateDomains,
      });

      setReport(response.data.report);
      addError('Report generated successfully', 'success', 3000);
    } catch (error) {
      console.error('There was an error generating the report!', error);
      addError('Failed to generate report. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <motion.h1 
        className="title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Create a Finding
      </motion.h1>

      <motion.form 
        onSubmit={handleSubmit} 
        className="form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="form-group">
          <label className="label">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="select"
          >
            <option value="">Select Report Type</option>
            <option value="purple_team">Purple Team</option>
            <option value="red_team">Red Team</option>
          </select>
        </div>

        <motion.div 
          className="form-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <label className="label">Overview</label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="Provide a brief overview of the finding"
            className="textarea"
          />
        </motion.div>
        <motion.button
          type="submit"
          className={`button ${isLoading ? 'button-disabled' : ''}`}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? 'Generating Finding...' : 'Generate Finding'}
        </motion.button>
      </motion.form>

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="report-container"
          >
            <div className="toolbox">
              <motion.button
                onClick={handleCopyToClipboard}
                className="icon-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IoMdClipboard />
                <span className="tooltip">Copy to clipboard</span>
              </motion.button>
              <motion.button
                onClick={handleGrammarCorrection}
                className={`button ${isGrammarCorrecting ? 'button-disabled' : ''}`}
                disabled={isGrammarCorrecting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isGrammarCorrecting ? 'Correcting Grammar...' : 'Correct Grammar'}
              </motion.button>
            </div>
            <h2 className="report-title">Generated Report</h2>
            <ReportRenderer report={report} isEditing={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && errors.map((error) => (
          <motion.div
            key={error.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`notification ${error.severity}`}
            role="alert"
          >
            <p className="notification-title">
              {error.severity.charAt(0).toUpperCase() + error.severity.slice(1)}
            </p>
            <p>{error.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FindingGenerator;