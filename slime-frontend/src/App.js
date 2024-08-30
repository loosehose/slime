import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FindingGenerator from './components/FindingGenerator';
import ViewFindings from './components/ViewFindings';
import ViewFinding from './components/ViewFinding';
import Sidebar from './components/Sidebar';
import ProjectsPage from './components/ProjectsPage';
import ProjectDetailsPage from './components/ProjectDetailsPage';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<FindingGenerator />} />
            <Route path="/view-findings" element={<ViewFindings />} />
            <Route path="/view-report/:id" element={<ViewFinding />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;