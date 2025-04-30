from flask import Flask, request, jsonify, render_template, send_from_directory
import json
import os
from datetime import datetime
import re

app = Flask(__name__, static_folder='.')

# Percorso del file JSON per salvare i dati degli studenti
DATA_FILE = 'students.json'

# Classe per la validazione
class Validator:
    @staticmethod
    def required(value):
        return value and value.strip() != ''
    
    @staticmethod
    def email(value):
        # Espressione regolare per validare le email
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, value) is not None
    
    @staticmethod
    def date_of_birth(value):
        try:
            # Converti la stringa in data
            birth_date = datetime.strptime(value, '%Y-%m-%d')
            today = datetime.now()
            
            # Controlla che la data sia nel passato
            if birth_date > today:
                return False
            
            # Calcola l'età
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            # Controlla che l'età sia almeno 16 anni
            return age >= 16
        except:
            return False

# Funzioni per la gestione dei dati
def get_students():
    if not os.path.exists(DATA_FILE):
        return []
    
    try:
        with open(DATA_FILE, 'r') as file:
            return json.load(file)
    except:
        return []

def save_students(students):
    with open(DATA_FILE, 'w') as file:
        json.dump(students, file, indent=2)

# Routes
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/students', methods=['GET'])
def get_all_students():
    return jsonify(get_students())

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    
    # Validazione
    errors = {}
    
    if not Validator.required(data.get('nome', '')):
        errors['nome'] = 'Il nome è obbligatorio'
    
    if not Validator.required(data.get('cognome', '')):
        errors['cognome'] = 'Il cognome è obbligatorio'
    
    if not Validator.required(data.get('dataNascita', '')):
        errors['dataNascita'] = 'La data di nascita è obbligatoria'
    elif not Validator.date_of_birth(data.get('dataNascita', '')):
        errors['dataNascita'] = 'La data di nascita deve essere valida e lo studente deve avere almeno 16 anni'
    
    if not Validator.required(data.get('email', '')):
        errors['email'] = 'L\'email è obbligatoria'
    elif not Validator.email(data.get('email', '')):
        errors['email'] = 'Inserisci un indirizzo email valido'
    else:
        # Verifica che l'email non sia già registrata
        students = get_students()
        if any(student['email'] == data['email'] for student in students):
            errors['email'] = 'Questa email è già registrata'
    
    if not Validator.required(data.get('corso', '')):
        errors['corso'] = 'Seleziona un corso'
    
    if errors:
        return jsonify({'success': False, 'errors': errors}), 400
    
    # Aggiunta dello studente
    students = get_students()
    student = {
        'nome': data['nome'],
        'cognome': data['cognome'],
        'dataNascita': data['dataNascita'],
        'email': data['email'],
        'corso': data['corso'],
        'dataRegistrazione': datetime.now().isoformat()
    }
    
    students.append(student)
    save_students(students)
    
    return jsonify({'success': True, 'student': student})

@app.route('/api/students/<email>', methods=['DELETE'])
def delete_student(email):
    students = get_students()
    original_count = len(students)
    
    students = [student for student in students if student['email'] != email]
    
    if len(students) < original_count:
        save_students(students)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Studente non trovato'}), 404

@app.route('/api/students/clear', methods=['DELETE'])
def clear_students():
    save_students([])
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)