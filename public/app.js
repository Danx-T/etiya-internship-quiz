// API Base URL
const API_BASE = 'http://localhost:3001';

// Global state
let currentUser = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizTimer = null;
let timeSpent = 0;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetchUserProfile();
    }
}

// Setup event listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    document.getElementById('quiz-filter').addEventListener('change', loadLeaderboard);
    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
}

// Show tab function
function showTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('login-form').style.display = 'flex';
        document.getElementById('register-form').style.display = 'none';
    } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'flex';
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            currentUser = data.user;
            showMainApp();
            loadQuizzes();
        } else {
            alert(data.message || 'Giriş başarısız');
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            currentUser = data.user;
            showMainApp();
            loadQuizzes();
        } else {
            alert(data.message || 'Kayıt başarısız');
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showMainApp();
            loadQuizzes();
        } else {
            localStorage.removeItem('token');
        }
    } catch (error) {
        localStorage.removeItem('token');
    }
}

// Show main app
function showMainApp() {
    authContainer.style.display = 'none';
    mainApp.style.display = 'flex';
    document.getElementById('username-display').textContent = currentUser.username;
    document.getElementById('profile-username').textContent = currentUser.username;
    document.getElementById('profile-email').textContent = currentUser.email;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    authContainer.style.display = 'flex';
    mainApp.style.display = 'none';
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
}

// Forgot Password Functions
function showForgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'flex';
}

function closeForgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'none';
    document.getElementById('forgot-email').value = '';
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Şifre sıfırlama linki email adresinize gönderildi!');
            closeForgotPassword();
        } else {
            alert(data.message || 'Bir hata oluştu');
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
}

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    document.getElementById(`${section}-section`).style.display = 'block';
    event.target.classList.add('active');
    
    // Load section data
    switch (section) {
        case 'quizzes':
            loadQuizzes();
            break;
        case 'my-results':
            loadMyResults();
            break;
        case 'leaderboard':
            loadLeaderboard();
            break;
    }
}

// Load quizzes
async function loadQuizzes() {
    try {
        const response = await fetch(`${API_BASE}/quiz`);
        const quizzes = await response.json();
        
        const quizzesList = document.getElementById('quizzes-list');
        quizzesList.innerHTML = '';
        
        quizzes.forEach(quiz => {
            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-card';
            quizCard.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.description}</p>
                <div class="quiz-meta">
                    <span>${quiz.questions.length} soru</span>
                    <span>${quiz.timePerQuestion} saniye/soru</span>
                </div>
            `;
            quizCard.onclick = () => startQuiz(quiz);
            quizzesList.appendChild(quizCard);
        });
    } catch (error) {
        console.error('Quizler yüklenemedi:', error);
    }
}

// Start quiz
async function startQuiz(quiz) {
    try {
        const response = await fetch(`${API_BASE}/quiz/${quiz.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        
        if (response.ok) {
            currentQuiz = await response.json();
            currentQuestionIndex = 0;
            userAnswers = new Array(currentQuiz.questions.length).fill(-1);
            timeSpent = 0;
            
            showQuizSection();
            displayQuestion();
            startTimer();
        }
    } catch (error) {
        alert('Quiz yüklenemedi');
    }
}

// Show quiz section
function showQuizSection() {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById('quiz-taking-section').style.display = 'block';
    document.getElementById('quiz-title').textContent = currentQuiz.title;
}

// Display question
function displayQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const quizContent = document.getElementById('quiz-content');
    
    quizContent.innerHTML = `
        <div class="question">
            <h3>${question.questionText}</h3>
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
                         onclick="selectOption(${index})">
                        ${option}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    updateQuestionCounter();
    updateNavigationButtons();
}

// Select option
function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Update UI
    document.querySelectorAll('.option').forEach((option, index) => {
        option.classList.toggle('selected', index === optionIndex);
    });
}

// Update question counter
function updateQuestionCounter() {
    document.getElementById('question-counter').textContent = 
        `Soru ${currentQuestionIndex + 1} / ${currentQuiz.questions.length}`;
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.style.display = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'none' : 'inline-block';
    submitBtn.style.display = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'inline-block' : 'none';
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// Next question
function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

// Start timer
function startTimer() {
    const totalTime = currentQuiz.questions.length * currentQuiz.timePerQuestion;
    let timeLeft = totalTime;
    
    quizTimer = setInterval(() => {
        timeLeft--;
        timeSpent++;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
    }, 1000);
}

// Submit quiz
async function submitQuiz() {
    clearInterval(quizTimer);
    
    try {
        const response = await fetch(`${API_BASE}/quiz/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                quizId: currentQuiz.id,
                answers: userAnswers,
                timeSpent: timeSpent,
            }),
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`Quiz tamamlandı! Skorunuz: ${result.score}/${result.totalQuestions}`);
            showSection('quizzes');
        }
    } catch (error) {
        alert('Quiz gönderilemedi');
    }
}

// Load my results
async function loadMyResults() {
    try {
        const response = await fetch(`${API_BASE}/results/my-results`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        
        if (response.ok) {
            const results = await response.json();
            const resultsList = document.getElementById('results-list');
            resultsList.innerHTML = '';
            
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <h4>${result.quiz.title}</h4>
                    <div class="result-stats">
                        <span>Skor: ${result.score}/${result.totalQuestions}</span>
                        <span>Süre: ${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}</span>
                        <span>Tarih: ${new Date(result.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                `;
                resultsList.appendChild(resultItem);
            });
        }
    } catch (error) {
        console.error('Sonuçlar yüklenemedi:', error);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const quizFilter = document.getElementById('quiz-filter').value;
        const url = quizFilter ? `${API_BASE}/results/leaderboard?quizId=${quizFilter}` : `${API_BASE}/results/leaderboard`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        
        if (response.ok) {
            const leaderboard = await response.json();
            const leaderboardList = document.getElementById('leaderboard-list');
            leaderboardList.innerHTML = '';
            
            leaderboard.forEach((entry, index) => {
                const leaderboardItem = document.createElement('div');
                leaderboardItem.className = 'leaderboard-item';
                leaderboardItem.innerHTML = `
                    <div>
                        <strong>${index + 1}. ${entry.user_username}</strong>
                        <br>
                        <small>${entry.quiz_title}</small>
                    </div>
                    <div>
                        <strong>${entry.result_score}/${entry.result_totalQuestions}</strong>
                        <br>
                        <small>${Math.floor(entry.result_timeSpent / 60)}:${(entry.result_timeSpent % 60).toString().padStart(2, '0')}</small>
                    </div>
                `;
                leaderboardList.appendChild(leaderboardItem);
            });
        }
    } catch (error) {
        console.error('Liderlik tablosu yüklenemedi:', error);
    }
}

// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        
        if (response.ok) {
            alert('Şifre başarıyla değiştirildi');
            document.getElementById('change-password-form').reset();
        } else {
            const data = await response.json();
            alert(data.message || 'Şifre değiştirilemedi');
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
} 