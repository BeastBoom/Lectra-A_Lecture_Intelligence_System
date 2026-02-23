from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS
from whisper_utils import transcribe_audio
from gemini_utils import analyze_meeting as generate_response

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'], methods=['POST', 'GET', 'OPTIONS'], 
     allow_headers=['Content-Type', 'Authorization'])

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    try:
        transcript = transcribe_audio(filepath)
        result = generate_response(transcript)
        return jsonify({
            "transcript": transcript,
            "response": result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)