const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'students.json');

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Funzioni di validazione
const validators = {
    required: (value) => {
        return value && value.trim() !== '';
    },
    
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    
    dataNascita: (value) => {
        const today = new Date();
        const birthDate = new Date(value);
        
        if (birthDate > today) {
            return false;
        }
        
        // Calcola l'età
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 16;
    }
};

// Funzioni per gestire i dati
async function getStudents() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Se il file non esiste o c'è un errore, restituisci un array vuoto
        return [];
    }
}

async function