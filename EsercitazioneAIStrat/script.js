// Funzioni per la gestione del localStorage
const studentsStorage = {
    getStudents: function() {
        const students = localStorage.getItem('students');
        return students ? JSON.parse(students) : [];
    },
    
    saveStudent: function(student) {
        const students = this.getStudents();
        students.push(student);
        localStorage.setItem('students', JSON.stringify(students));
    },
    
    clearStudents: function() {
        localStorage.removeItem('students');
    },
    
    deleteStudent: function(email) {
        let students = this.getStudents();
        students = students.filter(student => student.email !== email);
        localStorage.setItem('students', JSON.stringify(students));
    }
};

// Validazione del form
const validators = {
    // Valida che il campo non sia vuoto
    required: function(value) {
        return value.trim() !== '';
    },
    
    // Valida il formato dell'email
    email: function(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    
    // Valida che la data di nascita sia nel passato e che lo studente abbia almeno 16 anni
    dataNascita: function(value) {
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

// Gestione della pagina di registrazione
function setupRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    
    const successMessage = document.getElementById('successMessage');
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Ottieni i valori dal form
        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const dataNascita = document.getElementById('dataNascita').value;
        const email = document.getElementById('email').value;
        const corso = document.getElementById('corso').value;
        
        // Reset errori precedenti
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        // Validazione
        let isValid = true;
        
        // Nome
        if (!validators.required(nome)) {
            document.getElementById('nomeError').textContent = 'Il nome è obbligatorio';
            isValid = false;
        }
        
        // Cognome
        if (!validators.required(cognome)) {
            document.getElementById('cognomeError').textContent = 'Il cognome è obbligatorio';
            isValid = false;
        }
        
        // Data di nascita
        if (!validators.required(dataNascita)) {
            document.getElementById('dataNascitaError').textContent = 'La data di nascita è obbligatoria';
            isValid = false;
        } else if (!validators.dataNascita(dataNascita)) {
            document.getElementById('dataNascitaError').textContent = 'La data di nascita deve essere nel passato e lo studente deve avere almeno 16 anni';
            isValid = false;
        }
        
        // Email
        if (!validators.required(email)) {
            document.getElementById('emailError').textContent = 'L\'email è obbligatoria';
            isValid = false;
        } else if (!validators.email(email)) {
            document.getElementById('emailError').textContent = 'Inserisci un indirizzo email valido';
            isValid = false;
        } else {
            // Verifica che l'email non sia già registrata
            const students = studentsStorage.getStudents();
            if (students.some(student => student.email === email)) {
                document.getElementById('emailError').textContent = 'Questa email è già registrata';
                isValid = false;
            }
        }
        
        // Corso
        if (!validators.required(corso)) {
            document.getElementById('corsoError').textContent = 'Seleziona un corso';
            isValid = false;
        }
        
        // Se tutti i dati sono validi, salva lo studente
        if (isValid) {
            const student = {
                nome,
                cognome,
                dataNascita,
                email,
                corso,
                dataRegistrazione: new Date().toISOString()
            };
            
            studentsStorage.saveStudent(student);
            
            // Mostra il messaggio di successo
            successMessage.style.display = 'block';
            
            // Reset del form
            form.reset();
            
            // Nascondi il messaggio di successo dopo 3 secondi
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
    });
}

// Gestione della pagina home
function setupHomePage() {
    const studentsList = document.getElementById('studentsList');
    if (!studentsList) return;
    
    const studentsTableBody = document.getElementById('studentsTableBody');
    const noStudentsMessage = document.getElementById('noStudents');
    const searchInput = document.getElementById('searchStudent');
    const clearButton = document.getElementById('clearStudents');
    
    // Funzione per aggiornare la lista degli studenti
    function updateStudentsList(filterText = '') {
        const students = studentsStorage.getStudents();
        
        studentsTableBody.innerHTML = '';
        
        if (students.length === 0) {
            noStudentsMessage.style.display = 'block';
            document.getElementById('studentsTable').style.display = 'none';
            return;
        }
        
        noStudentsMessage.style.display = 'none';
        document.getElementById('studentsTable').style.display = 'table';
        
        // Filtra gli studenti in base al testo di ricerca
        const filteredStudents = filterText 
            ? students.filter(student => 
                student.nome.toLowerCase().includes(filterText.toLowerCase()) || 
                student.cognome.toLowerCase().includes(filterText.toLowerCase()) ||
                student.email.toLowerCase().includes(filterText.toLowerCase()) ||
                student.corso.toLowerCase().includes(filterText.toLowerCase())
            )
            : students;
        
        if (filteredStudents.length === 0) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data-message">Nessun risultato trovato</td>
                </tr>
            `;
            return;
        }
        
        // Aggiungi gli studenti alla tabella
        filteredStudents.forEach(student => {
            const row = document.createElement('tr');
            
            // Formattazione della data di nascita
            const birthDate = new Date(student.dataNascita);
            const formattedBirthDate = `${birthDate.getDate().toString().padStart(2, '0')}/${(birthDate.getMonth() + 1).toString().padStart(2, '0')}/${birthDate.getFullYear()}`;
            
            row.innerHTML = `
                <td>${student.nome}</td>
                <td>${student.cognome}</td>
                <td>${formattedBirthDate}</td>
                <td>${student.email}</td>
                <td>${student.corso}</td>
                <td class="student-actions">
                    <button class="danger-btn delete-student" data-email="${student.email}">Elimina</button>
                </td>
            `;
            
            studentsTableBody.appendChild(row);
        });
        
        // Aggiungi event listener per i pulsanti di eliminazione
        document.querySelectorAll('.delete-student').forEach(button => {
            button.addEventListener('click', function() {
                const email = this.getAttribute('data-email');
                if (confirm('Sei sicuro di voler eliminare questo studente?')) {
                    studentsStorage.deleteStudent(email);
                    updateStudentsList(searchInput.value);
                }
            });
        });
    }
    
    // Aggiorna la lista all'avvio
    updateStudentsList();
    
    // Aggiorna la lista quando l'utente cerca
    searchInput.addEventListener('input', function() {
        updateStudentsList(this.value);
    });
    
    // Cancella tutti gli studenti
    clearButton.addEventListener('click', function() {
        if (confirm('Sei sicuro di voler eliminare tutti gli studenti? Questa azione non può essere annullata.')) {
            studentsStorage.clearStudents();
            updateStudentsList();
        }
    });
}

// Inizializza la pagina corrente
document.addEventListener('DOMContentLoaded', function() {
    setupRegistrationForm();
    setupHomePage();
});