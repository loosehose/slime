import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LuWand2, LuClipboardCopy, LuSave, LuSaveAll, LuCalendar } from "react-icons/lu";
import MDEditor from '@uiw/react-md-editor';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const ProjectSummaryGenerator = ({ project, findings }) => {
    const [projectSummary, setProjectSummary] = useState("");
    const [executiveSummary, setExecutiveSummary] = useState("");
    const [assessmentOverview, setAssessmentOverview] = useState("");
    const [detailedAssessmentSummary, setDetailedAssessmentSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    ]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchSavedSummaries();
    }, [project.id]);

    const fetchSavedSummaries = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/get_project_summaries/${project.id}`);
            if (response.data && !response.data.error) {
                setProjectSummary(response.data.project_summary || "");
                setExecutiveSummary(response.data.executive_summary || "");
                setAssessmentOverview(response.data.assessment_overview || "");
                setDetailedAssessmentSummary(response.data.detailed_assessment_summary || "");
            }
        } catch (err) {
            console.error('Error fetching saved summaries:', err);
            setError('Failed to fetch saved summaries. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateSummaries = async () => {
        setLoading(true);
        setError(null);
        try {
            const findingsOverview = findings.map(finding => finding.overview).join('\n\n');
            const response = await axios.post('http://localhost:5000/generate_summaries', {
                project_id: project.id,
                project_name: project.name,
                findings_overview: findingsOverview,
                project_summary: projectSummary,
                start_date: dateRange[0].startDate.toISOString().split('T')[0],
                end_date: dateRange[0].endDate.toISOString().split('T')[0]
            });
            setExecutiveSummary(response.data.ExecutiveSummary || "");
            setAssessmentOverview(response.data.AssessmentOverview || "");
            setDetailedAssessmentSummary(response.data.DetailedAssessmentSummary || "");
        } catch (err) {
            console.error('Error generating summaries:', err);
            setError(err.response?.data?.error || 'Failed to generate summaries. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const saveSummary = async (type, content) => {
        try {
            await axios.put(`http://localhost:5000/update_project_summary/${project.id}`, {
                [type]: content
            });
            alert(`${type} saved successfully!`);
        } catch (err) {
            console.error(`Error saving ${type}:`, err);
            setError(`Failed to save ${type}. Please try again.`);
        }
    };

    const saveAllSummaries = async () => {
        try {
            await axios.put(`http://localhost:5000/update_project_summary/${project.id}`, {
                project_summary: projectSummary,
                executive_summary: executiveSummary,
                assessment_overview: assessmentOverview,
                detailed_assessment_summary: detailedAssessmentSummary
            });
            alert('All summaries saved successfully!');
        } catch (err) {
            console.error('Error saving all summaries:', err);
            setError('Failed to save all summaries. Please try again.');
        }
    };

    return (
        <div className="summary-generator">
            <div className="summary-generator-header">
                <button 
                    className="icon-button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    aria-label="Select Date Range"
                >
                    <LuCalendar />
                    <span className="tooltip">Select Date Range</span>
                </button>
                <button 
                    className="icon-button"
                    onClick={generateSummaries}
                    disabled={loading}
                >
                    <LuWand2 />
                    <span className="tooltip">Generate Summaries</span>
                </button>
                <button 
                    className="icon-button save-all-button"
                    onClick={saveAllSummaries}
                    aria-label="Save All Summaries"
                >
                    <LuSaveAll />
                    <span className="tooltip">Save all summaries</span>
                </button>
            </div>

            {showDatePicker && (
                <div className="date-picker-wrapper">
                    <DateRangePicker
                        onChange={item => setDateRange([item.selection])}
                        showSelectionPreview={true}
                        moveRangeOnFirstSelection={false}
                        months={2}
                        ranges={dateRange}
                        direction="horizontal"
                        rangeColors={['var(--accent-color)']}
                    />
                </div>
            )}

            {loading && <div className="loading">Generating summaries...</div>}
            {error && <div className="error">{error}</div>}

            <div className="summaries">
                <SummarySection 
                    title="Project Summary" 
                    content={projectSummary} 
                    onContentChange={setProjectSummary} 
                    onSave={() => saveSummary('project_summary', projectSummary)} 
                />
                <SummarySection 
                    title="Executive Summary" 
                    content={executiveSummary} 
                    onContentChange={setExecutiveSummary} 
                    onSave={() => saveSummary('executive_summary', executiveSummary)} 
                />
                <SummarySection 
                    title="Assessment Overview" 
                    content={assessmentOverview} 
                    onContentChange={setAssessmentOverview} 
                    onSave={() => saveSummary('assessment_overview', assessmentOverview)} 
                />
                <SummarySection 
                    title="Detailed Assessment Summary" 
                    content={detailedAssessmentSummary} 
                    onContentChange={setDetailedAssessmentSummary} 
                    onSave={() => saveSummary('detailed_assessment_summary', detailedAssessmentSummary)} 
                />
            </div>
        </div>
    );
};

const SummarySection = ({ title, content, onContentChange, onSave }) => (
    <div className="summary-section">
        <div className="summary-header">
            <h4>{title}</h4>
            <div className="summary-actions">
                <button 
                    className="icon-button"
                    onClick={() => navigator.clipboard.writeText(content)}
                    aria-label={`Copy ${title}`}
                >
                    <LuClipboardCopy />
                    <span className="tooltip">Copy to clipboard</span>
                </button>
                <button 
                    className="icon-button"
                    onClick={onSave}
                    aria-label={`Save ${title}`}
                >
                    <LuSave />
                    <span className="tooltip">Save this summary</span>
                </button>
            </div>
        </div>
        <MDEditor
            value={content}
            onChange={onContentChange}
            preview="edit"
            hideToolbar={false}
            visibleDragbar={false}
            height={300}
            style={{ backgroundColor: 'var(--secondary-bg)', color: 'var(--primary-text)' }}
        />
    </div>
);

export default ProjectSummaryGenerator;