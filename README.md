<div align="center">
  <img src="./images/slime.png" alt="Slime" width="150"/>
</div>

# slime

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [License](#license)

## Overview
Slime is a web-based application designed to streamline the process of creating and managing red team assessment reports. It provides a user-friendly interface for security professionals to generate, edit, and organize findings from red team engagements.

## Features
- **Project Management**: Create, view, edit, and delete security assessment projects.
- **Finding Generation**: Automatically generate detailed findings based on user input.
- **Report Summaries**: Generate executive summaries, assessment overviews, and detailed assessment summaries.
- **Customizable Reports**: Edit and customize generated reports to fit specific needs.
- **User-friendly Interface**: Intuitive web interface for easy navigation and management.

## Technology Stack
- **Frontend**: React.js
- **Backend**: Flask (Python)
- **Database**: SQLite
- **API**: RESTful API
- **AI Integration**: OpenAI's GPT-4 for report generation

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Node.js and npm installed
- Python 3.7+ installed
- OpenAI API key

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/loosehose/slime.git
   cd slime
   ```

2. Set up the backend:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. Set up the frontend:

   ```
   cd ./slime-frontend
   npm i
   ```

4. Configure the OpenAI API key:

   - Create a `.env` file in the `backend` directory
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`

## Running the Application

1. Start the backend server:

   ```
   cd backend
   flask run
   ```

2. In a new terminal, start the frontend development server:

   ```
   cd ./slime-frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3001`

## Usage

1. **Creating a Project**: 
   - Click on "Add New Project" on the Projects page
   - Fill in the project details and submit

2. **Generating Findings**:
   - Navigate to a project
   - Click on "Generate Finding"
   - Provide the necessary information and submit

3. **Generating Summaries**:
   - On the project page, click on "Generate Summaries"
   - Review and edit the generated summaries as needed

4. **Editing Reports**:
   - Use the inline editors to modify report content
   - Click save to update the changes

## License

Distributed under the MIT License. See `LICENSE` for more information.
