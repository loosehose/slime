-- schema.sql

-- Create findings table
CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    report_type TEXT NOT NULL,
    overview TEXT NOT NULL,
    report TEXT NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Create project_findings table
CREATE TABLE IF NOT EXISTS project_findings (
    project_id TEXT,
    finding_id TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (finding_id) REFERENCES findings (id),
    PRIMARY KEY (project_id, finding_id)
);

-- Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    project_summary TEXT,
    executive_summary TEXT,
    assessment_overview TEXT,
    detailed_assessment_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_findings_project_id ON project_findings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_findings_finding_id ON project_findings(finding_id);
CREATE INDEX IF NOT EXISTS idx_summaries_project_id ON summaries(project_id);