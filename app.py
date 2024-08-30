import os
from flask import Flask, request, jsonify
import openai
from flask_cors import CORS
import re
import sqlite3
import string
import random
import json
import traceback
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# OpenAI API Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')

# Database setup
DATABASE = 'findings.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with app.app_context():
        db = get_db_connection()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Utility Functions
def load_prompt(prompt_type):
    """Load prompt from a file."""
    with open(f"prompts/{prompt_type}.txt", "r") as file:
        return file.read()

def obfuscate_text(text, obfuscate_usernames, obfuscate_machines, obfuscate_domains):
    """Obfuscate sensitive information in the text."""
    if not isinstance(text, str):
        return str(text)

    username_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    machine_pattern = r'\b[A-Za-z0-9-]+\.[A-Za-z0-9.-]+\b'
    
    user_count = 0
    machine_count = 0
    domain_count = 0
    domain_mapping = {}
    
    try:
        if obfuscate_usernames:
            text = re.sub(username_pattern, lambda _: f"username{chr(65 + user_count)}@companyA.com", text)
            user_count += 1

        if obfuscate_machines or obfuscate_domains:
            def obfuscate_machine(match):
                nonlocal machine_count, domain_count, domain_mapping
                machine_name = match.group(0)
                parts = machine_name.split('.')
                if len(parts) > 1:
                    machine_part, domain_part = parts[0], '.'.join(parts[1:])
                    if obfuscate_machines:
                        machine_name = f"machine{chr(65 + machine_count)}.{domain_part}"
                        machine_count += 1
                    if obfuscate_domains:
                        if domain_part not in domain_mapping:
                            domain_mapping[domain_part] = f"company{chr(65 + domain_count)}.com"
                            domain_count += 1
                        machine_name = f"{parts[0]}.{domain_mapping[domain_part]}"
                return machine_name
            
            text = re.sub(machine_pattern, obfuscate_machine, text)
    
    except Exception as e:
        app.logger.error(f"Error during obfuscation: {str(e)}")
        return text
    
    return text

def generate_id():
    """Generate a random 8-character string for the finding ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

def validate_and_extract_json(response_text):
    """Validate and extract JSON from a response text."""
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start != -1 and json_end != -1:
            try:
                return json.loads(response_text[json_start:json_end])
            except json.JSONDecodeError:
                pass
    return None

def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            app.logger.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    return decorated_function

# API Routes
@app.route('/correct_grammar', methods=['POST'])
@handle_errors
def correct_grammar():
    data = request.json
    text = data.get('text')

    if not text:
        return jsonify({"error": "No text provided"}), 400

    prompt_template = load_prompt('writing_assistant')
    prompt = prompt_template.replace("{{text}}", text)

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that improves grammar and writing."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1500,
        temperature=0.7,
    )

    corrected_text = response['choices'][0]['message']['content'].strip()
    return jsonify({"corrected_text": corrected_text})

@app.route('/generate_report', methods=['POST'])
@handle_errors
def generate_report():
    data = request.json
    report_type = data.get('report_type')
    parameters = data.get('parameters', {})
    
    obfuscate_usernames = data.get('obfuscate_usernames', False)
    obfuscate_machines = data.get('obfuscate_machines', False)
    obfuscate_domains = data.get('obfuscate_domains', False)
    
    if report_type not in ['purple_team', 'red_team']:
        return jsonify({"error": "Invalid report type"}), 400
    
    overview = parameters.get('Overview', '')
    if not overview:
        return jsonify({"error": "Overview is required"}), 400

    prompt_template = load_prompt(report_type)
    obfuscated_overview = obfuscate_text(overview, obfuscate_usernames, obfuscate_machines, obfuscate_domains)
    prompt = prompt_template.replace("{{Overview}}", obfuscated_overview)
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1500,
        temperature=0.7,
    )
    
    response_text = response['choices'][0]['message']['content'].strip()
    generated_report = validate_and_extract_json(response_text)
    
    if generated_report is None:
        return jsonify({"error": "Invalid JSON format in generated report"}), 500
    
    finding_id = generate_id()
    
    with get_db_connection() as conn:
        conn.execute('INSERT INTO findings (id, report_type, overview, report) VALUES (?, ?, ?, ?)',
                     (finding_id, report_type, overview, json.dumps(generated_report)))
        conn.commit()
    
    return jsonify({"id": finding_id, "report": generated_report})

@app.route('/get_report/<string:finding_id>', methods=['GET'])
@handle_errors
def get_report(finding_id):
    with get_db_connection() as conn:
        finding = conn.execute('SELECT * FROM findings WHERE id = ?', (finding_id,)).fetchone()
    
    if finding is None:
        return jsonify({"error": "Finding not found"}), 404
    
    return jsonify({
        "id": finding['id'],
        "report_type": finding['report_type'],
        "overview": finding['overview'],
        "report": json.loads(finding['report'])
    })

@app.route('/get_findings', methods=['GET'])
@handle_errors
def get_findings():
    with get_db_connection() as conn:
        findings = conn.execute('''
            SELECT f.id, 
                   json_extract(f.report, '$.Title') as title,
                   json_extract(f.report, '$.Overview') as overview
            FROM findings f
        ''').fetchall()

    return jsonify([{
        'id': row['id'],
        'title': row['title'],
        'overview': row['overview']
    } for row in findings])

@app.route('/update_report/<string:finding_id>', methods=['PUT'])
@handle_errors
def update_report(finding_id):
    data = request.json
    new_report = data.get('report')
    
    if not new_report:
        return jsonify({"error": "New report content is required"}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE findings SET report = ? WHERE id = ?', (json.dumps(new_report), finding_id))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Finding not found or no changes made"}), 404
    
    return jsonify({"message": "Report updated successfully"}), 200

@app.route('/delete_finding/<string:finding_id>', methods=['DELETE'])
@handle_errors
def delete_finding(finding_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM findings WHERE id = ?', (finding_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Finding not found"}), 404
    
    return jsonify({"message": "Finding deleted successfully"}), 200

@app.route('/get_projects', methods=['GET'])
@handle_errors
def get_projects():
    with get_db_connection() as conn:
        projects = conn.execute('SELECT * FROM projects').fetchall()
    return jsonify([dict(row) for row in projects])

@app.route('/create_project', methods=['POST'])
@handle_errors
def create_project():
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    project_id = generate_id()
    
    with get_db_connection() as conn:
        conn.execute('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
                     (project_id, name, description))
        conn.commit()
    
    return jsonify({"id": project_id, "name": name, "description": description}), 201

@app.route('/get_project/<string:project_id>', methods=['GET'])
@handle_errors
def get_project(project_id):
    app.logger.info(f"Fetching project with ID: {project_id}")
    with get_db_connection() as conn:
        project = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        
        if project is None:
            app.logger.warning(f"Project with ID {project_id} not found")
            return jsonify({"error": "Project not found"}), 404
        
        findings = conn.execute('''
            SELECT f.* FROM findings f
            JOIN project_findings pf ON f.id = pf.finding_id
            WHERE pf.project_id = ?
        ''', (project_id,)).fetchall()
    
    response_data = {
        "id": project['id'],
        "name": project['name'],
        "description": project['description'],
        "findings": [dict(row) for row in findings]
    }
    # app.logger.info(f"Fetched project data: {response_data}")
    return jsonify(response_data)
@app.route('/update_project/<string:project_id>', methods=['PUT'])
@handle_errors
def update_project(project_id):
    data = request.json
    name = data.get('name')
    description = data.get('description')
    findings = data.get('findings', [])
    
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    if not isinstance(findings, list):
        return jsonify({"error": "Findings must be a list of finding IDs"}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check if project exists
        project = cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        if not project:
            return jsonify({"error": f"Project with id {project_id} not found"}), 404

        # Update project details
        cursor.execute('UPDATE projects SET name = ?, description = ? WHERE id = ?',
                       (name, description, project_id))
        
        # Delete existing project-finding associations
        cursor.execute('DELETE FROM project_findings WHERE project_id = ?', (project_id,))
        
        # Insert new project-finding associations
        for finding_id in findings:
            if not isinstance(finding_id, str):
                return jsonify({"error": f"Invalid finding ID: {finding_id}. All finding IDs must be strings."}), 400
            
            # Check if finding exists
            finding = cursor.execute('SELECT * FROM findings WHERE id = ?', (finding_id,)).fetchone()
            if not finding:
                return jsonify({"error": f"Finding with id {finding_id} not found"}), 404
            
            cursor.execute('INSERT INTO project_findings (project_id, finding_id) VALUES (?, ?)',
                           (project_id, finding_id))
        
        conn.commit()
    
    return jsonify({"message": "Project updated successfully"}), 200

@app.route('/generate_summaries', methods=['POST'])
@handle_errors
def generate_summaries():
    data = request.json
    project_id = data.get('project_id')
    project_name = data.get('project_name')
    findings_overview = data.get('findings_overview')
    project_summary = data.get('project_summary', '')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    if not project_id or not project_name or not findings_overview:
        return jsonify({"error": "Project ID, name, and findings overview are required"}), 400

    prompt_template = load_prompt('summaries')
    context = f"Project Name: {project_name}\n\n"
    
    if project_summary:
        context += f"Project Summary:\n{project_summary}\n\n"
    
    context += f"Findings Overview:\n{findings_overview}\n\n"
    
    if start_date and end_date:
        context += f"Assessment Date Range: {start_date} to {end_date}\n\n"
    
    prompt = prompt_template.replace("{{Summary}}", context)

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a senior red team engineer with 20 years of offensive security consulting experience."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=2000,
        temperature=0.7,
    )

    response_content = response['choices'][0]['message']['content'].strip()
    # app.logger.info(f"OpenAI Response: {response_content}")  # Log the response

    summaries = json.loads(response_content)
    
    # Ensure all summary fields are strings
    executive_summary = str(summaries.get('ExecutiveSummary', ''))
    assessment_overview = str(summaries.get('AssessmentOverview', ''))
    detailed_assessment_summary = str(summaries.get('DetailedAssessmentSummary', ''))

    # Save summaries to database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        summary_id = generate_id()
        cursor.execute('''
            INSERT INTO summaries (id, project_id, project_summary, executive_summary, assessment_overview, detailed_assessment_summary)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (summary_id, project_id, project_summary, executive_summary, assessment_overview, detailed_assessment_summary))
        conn.commit()

    return jsonify({**summaries, "id": summary_id})

@app.route('/get_project_summaries/<string:project_id>', methods=['GET'])
@handle_errors
def get_project_summaries(project_id):
    with get_db_connection() as conn:
        summary = conn.execute('''
            SELECT * FROM summaries 
            WHERE project_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ''', (project_id,)).fetchone()
    
    if summary:
        return jsonify(dict(summary))
    else:
        return jsonify({"message": "No summaries found for this project"}), 404

@app.route('/update_project_summary/<string:project_id>', methods=['PUT'])
@handle_errors
def update_project_summary(project_id):
    data = request.json
    project_summary = data.get('project_summary')
    executive_summary = data.get('executive_summary')
    assessment_overview = data.get('assessment_overview')
    detailed_assessment_summary = data.get('detailed_assessment_summary')

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check if a summary already exists for this project
        existing_summary = cursor.execute('SELECT id FROM summaries WHERE project_id = ?', (project_id,)).fetchone()

        if existing_summary:
            # Update existing summary
            cursor.execute('''
                UPDATE summaries 
                SET project_summary = ?,
                    executive_summary = ?, 
                    assessment_overview = ?, 
                    detailed_assessment_summary = ?,
                    created_at = CURRENT_TIMESTAMP
                WHERE project_id = ?
            ''', (project_summary, executive_summary, assessment_overview, detailed_assessment_summary, project_id))
        else:
            # Insert new summary
            summary_id = generate_id()
            cursor.execute('''
                INSERT INTO summaries (id, project_id, project_summary, executive_summary, assessment_overview, detailed_assessment_summary)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (summary_id, project_id, project_summary, executive_summary, assessment_overview, detailed_assessment_summary))

        conn.commit()

    return jsonify({"message": "Project summary updated successfully"}), 200

@app.route('/delete_project/<string:project_id>', methods=['DELETE'])
@handle_errors
def delete_project(project_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Project not found"}), 404
    
    return jsonify({"message": "Project deleted successfully"}), 200

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Server Error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

# Main execution
if __name__ == '__main__':
    init_db()  # Initialize the database schema
    app.run(debug=True)