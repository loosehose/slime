import React from 'react';
import MDEditor from '@uiw/react-md-editor';

const ReportRenderer = ({ report, isEditing, onEdit }) => {
  const parsedReport = typeof report === 'string' ? JSON.parse(report) : report;

  const renderField = (key, value) => {
    if (isEditing) {
      return (
        <div className="report-field" key={key}>
          <strong>{key}:</strong>
          <MDEditor
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(newValue) => onEdit(key, newValue)}
          />
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="report-field" key={key}>
          <strong>{key}:</strong>
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      );
    }
    
    return (
      <div className="report-field" key={key}>
        <strong>{key}:</strong> {value}
      </div>
    );
  };

  return (
    <div className="report-content">
      {Object.entries(parsedReport).map(([key, value]) => renderField(key, value))}
    </div>
  );
};

export default ReportRenderer;