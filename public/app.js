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

// Email Verification Modal
const emailVerificationModal = document.getElementById('email-verification-modal');
const emailVerificationForm = document.getElementById('email-verification-form');
const verificationCodeInput = document.getElementById('verification-code');
const verificationInfo = document.getElementById('verification-info');
const resendCodeBtn = document.getElementById('resend-code-btn');
let pendingVerificationEmail = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Sekme/pencere kapatıldığında token'ı sil
window.addEventListener('beforeunload', () => {
    localStorage.removeItem('token');
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
    document.getElementById('quiz-filter').addEventListener('change', loadLeaderboard);
    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
    
    // Profile event listeners
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    document.getElementById('username-edit-form').addEventListener('submit', handleUsernameUpdate);
    document.getElementById('email-change-form').addEventListener('submit', handleEmailChange);
    document.getElementById('email-verification-form').addEventListener('submit', handleEmailVerification);
    document.getElementById('photo-upload').addEventListener('change', handlePhotoUpload);
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
            if (data.user && data.user.isEmailVerified === false) {
                pendingVerificationEmail = data.user.email;
                showEmailVerificationModal();
            } else {
                localStorage.setItem('token', data.access_token);
                currentUser = data.user;
                showMainApp();
                loadQuizzes();
            }
        } else {
            alert(data.message || 'Kayıt başarısız');
        }
    } catch (error) {
        alert('Bağlantı hatası');
    }
}

function showEmailVerificationModal() {
    emailVerificationModal.style.display = 'flex';
    verificationInfo.textContent = 'Kod 10 dakika geçerlidir.';
    verificationCodeInput.value = '';
}

document.getElementById('email-verification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const codeInput = form.querySelector('#email-verification-code');
    const statusIndicator = form.querySelector('.verification-status');
    const messageDisplay = form.querySelector('.verification-message');
    const submitButton = form.querySelector('button[type="submit"]');
    
    const code = codeInput.value.trim();
    if (!code || !pendingVerificationEmail) return;

    // UI'ı yükleniyor durumuna getir
    submitButton.disabled = true;
    submitButton.textContent = 'Doğrulanıyor...';
    statusIndicator.className = 'verification-status loading';
    messageDisplay.textContent = '';
    messageDisplay.className = 'verification-message';

    try {
        // Eğer token varsa email değiştirme doğrulaması, yoksa ilk kayıt doğrulaması
        const token = localStorage.getItem('token');
        let endpoint = token ? 'verify-new-email' : 'verify-email';
        let headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(token ? 
                { code } : 
                { email: pendingVerificationEmail, code }
            ),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Başarılı durumu
            statusIndicator.className = 'verification-status success';
            submitButton.textContent = 'Başarılı!';
            submitButton.className = 'verify-button success';
            
            const successMessage = token ? 
                'Email adresiniz başarıyla değiştirildi!' : 
                'Email adresiniz doğrulandı!';
            
            messageDisplay.textContent = successMessage;
            messageDisplay.className = 'verification-message success';
            
            // 2 saniye bekle
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Modalı kapat ve her şeyi sıfırla
            emailVerificationModal.style.display = 'none';
            statusIndicator.className = 'verification-status';
            submitButton.textContent = 'Doğrula';
            submitButton.className = 'verify-button';
            submitButton.disabled = false;
            messageDisplay.textContent = '';
            messageDisplay.className = 'verification-message';
            codeInput.value = '';
            
            if (token) {
                // Email değiştirme sonrası profili güncelle
                await fetchUserProfile();
            } else {
                // İlk kayıt sonrası login tabına git
                showTab('login');
            }
        } else {
            // Hata durumu
            statusIndicator.className = 'verification-status error';
            submitButton.textContent = 'Tekrar Dene';
            submitButton.className = 'verify-button error';
            submitButton.disabled = false;
            
            messageDisplay.textContent = data.message || 'Doğrulama başarısız';
            messageDisplay.className = 'verification-message error';
            
            // Input'u temizle
            codeInput.value = '';
            codeInput.focus();
            
            // 2 saniye sonra butonu normale döndür
            await new Promise(resolve => setTimeout(resolve, 2000));
            submitButton.textContent = 'Doğrula';
            submitButton.className = 'verify-button';
        }
    } catch (error) {
        // Bağlantı hatası
        statusIndicator.className = 'verification-status error';
        submitButton.textContent = 'Tekrar Dene';
        submitButton.className = 'verify-button error';
        submitButton.disabled = false;
        
        messageDisplay.textContent = 'Bağlantı hatası! Lütfen tekrar deneyin.';
        messageDisplay.className = 'verification-message error';
        
        // 2 saniye sonra butonu normale döndür
        await new Promise(resolve => setTimeout(resolve, 2000));
        submitButton.textContent = 'Doğrula';
        submitButton.className = 'verify-button';
    }
});



// Fetch user profile
async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    console.log('fetchUserProfile - Token:', token);
    console.log('fetchUserProfile - Token length:', token?.length);
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        console.log('fetchUserProfile - Response status:', response.status);
        console.log('fetchUserProfile - Response ok:', response.ok);
        
        if (response.ok) {
            currentUser = await response.json();
            showMainApp();
            loadQuizzes();
        } else {
            console.log('fetchUserProfile - Unauthorized, removing token');
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.log('fetchUserProfile - Error:', error);
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
    
    // Set profile photo if exists
    if (currentUser.profilePhoto) {
        document.getElementById('profile-photo-img').src = currentUser.profilePhoto;
    }
    
    // Profil fotoğrafı placeholder kontrolü
    checkProfilePhotoPlaceholder();
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

// Profile Management Functions

// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const messageElement = document.getElementById('password-message');
    
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
            messageElement.textContent = 'Şifre başarıyla değiştirildi';
            messageElement.className = 'message success';
            document.getElementById('change-password-form').reset();
            // 3 saniye sonra mesajı temizle
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'message';
            }, 3000);
        } else {
            const data = await response.json();
            messageElement.textContent = data.message || 'Şifre değiştirilemedi';
            messageElement.className = 'message error';
        }
    } catch (error) {
        messageElement.textContent = 'Bağlantı hatası';
        messageElement.className = 'message error';
    }
}

// Username editing functions
function editUsername() {
    document.getElementById('username-edit-form').style.display = 'block';
    document.getElementById('new-username').value = currentUser.username;
}

function cancelUsernameEdit() {
    const form = document.getElementById('username-edit-form');
    const messageElement = document.getElementById('username-message');
    form.style.display = 'none';
    messageElement.textContent = '';
    messageElement.className = 'message';
    form.reset();
}

async function handleUsernameUpdate(e) {
    e.preventDefault();
    
    const newUsername = document.getElementById('new-username').value;
    const messageElement = document.getElementById('username-message');
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile/username`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ username: newUsername }),
        });
        
        if (response.ok) {
            messageElement.textContent = 'Kullanıcı adı başarıyla güncellendi';
            messageElement.className = 'message success';
            currentUser.username = newUsername;
            document.getElementById('profile-username').textContent = newUsername;
            document.getElementById('username-display').textContent = newUsername;
            
            // 2 saniye bekle, sonra formu kapat
            await new Promise(resolve => setTimeout(resolve, 2000));
            cancelUsernameEdit();
        } else {
            const data = await response.json();
            messageElement.textContent = data.message || 'Kullanıcı adı güncellenemedi';
            messageElement.className = 'message error';
        }
    } catch (error) {
        messageElement.textContent = 'Bağlantı hatası';
        messageElement.className = 'message error';
    }
}

// Email editing functions
function editEmail() {
    document.getElementById('email-change-form').style.display = 'block';
}

function cancelEmailEdit() {
    const form = document.getElementById('email-change-form');
    const messageElement = document.getElementById('email-message');
    form.style.display = 'none';
    messageElement.textContent = '';
    messageElement.className = 'message';
    form.reset();
}

async function handleEmailChange(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('new-email').value;
    const messageElement = document.getElementById('email-message');
    
    try {
        const response = await fetch(`${API_BASE}/auth/change-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ newEmail }),
        });
        
        if (response.ok) {
            messageElement.textContent = 'Doğrulama kodu email adresinize gönderildi';
            messageElement.className = 'message success';
            
            // 2 saniye bekle, sonra formu kapat ve modalı aç
            await new Promise(resolve => setTimeout(resolve, 2000));
            cancelEmailEdit();
            showEmailVerificationModal(newEmail);
        } else {
            const data = await response.json();
            messageElement.textContent = data.message || 'Email değiştirilemedi';
            messageElement.className = 'message error';
        }
    } catch (error) {
        messageElement.textContent = 'Bağlantı hatası';
        messageElement.className = 'message error';
    }
}

function showEmailVerificationModal(email) {
    const modal = document.getElementById('email-verification-modal');
    const modalContent = modal.querySelector('.modal-content p');
    
    modalContent.textContent = `${email} adresine kod gönderildi.`;
    modal.style.display = 'flex';
    document.getElementById('email-verification-code').value = '';
}

function closeEmailVerificationModal() {
    const modal = document.getElementById('email-verification-modal');
    const messageElement = document.getElementById('verification-message');
    modal.style.display = 'none';
    messageElement.textContent = '';
    messageElement.className = 'message';
    document.getElementById('email-verification-code').value = '';
}

async function handleEmailVerification(e) {
    e.preventDefault();
    
    const form = e.target;
    const codeInput = form.querySelector('#email-verification-code');
    const statusIndicator = form.querySelector('.verification-status');
    const messageDisplay = form.querySelector('.verification-message');
    const submitButton = form.querySelector('button[type="submit"]');
    
    const code = codeInput.value.trim();
    if (!code) return;

    // UI'ı yükleniyor durumuna getir
    submitButton.disabled = true;
    submitButton.textContent = 'Doğrulanıyor...';
    statusIndicator.className = 'verification-status loading';
    messageDisplay.textContent = '';
    messageDisplay.className = 'verification-message';

    try {
        const response = await fetch(`${API_BASE}/auth/verify-new-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ code }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Başarılı durumu
            statusIndicator.className = 'verification-status success';
            submitButton.textContent = 'Tamam';
            submitButton.className = 'verify-button success';
            messageDisplay.textContent = 'Email adresiniz başarıyla değiştirildi!';
            messageDisplay.className = 'verification-message success';
            
            // 3 saniye bekle
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Modalı kapat ve her şeyi sıfırla
            emailVerificationModal.style.display = 'none';
            statusIndicator.className = 'verification-status';
            submitButton.textContent = 'Doğrula';
            submitButton.className = 'verify-button';
            submitButton.disabled = false;
            messageDisplay.textContent = '';
            messageDisplay.className = 'verification-message';
            codeInput.value = '';
            
            // Profili güncelle
            await fetchUserProfile();
        } else {
            // Hata durumu
            statusIndicator.className = 'verification-status error';
            submitButton.textContent = 'Tekrar Dene';
            submitButton.className = 'verify-button error';
            submitButton.disabled = false;
            
            messageDisplay.textContent = data.message || 'Doğrulama başarısız';
            messageDisplay.className = 'verification-message error';
            
            // Input'u temizle ve fokusla
            codeInput.value = '';
            codeInput.focus();
            
            // 2 saniye sonra butonu normale döndür
            await new Promise(resolve => setTimeout(resolve, 2000));
            submitButton.textContent = 'Doğrula';
            submitButton.className = 'verify-button';
        }
    } catch (error) {
        // Bağlantı hatası
        statusIndicator.className = 'verification-status error';
        submitButton.textContent = 'Tekrar Dene';
        submitButton.className = 'verify-button error';
        submitButton.disabled = false;
        
        messageDisplay.textContent = 'Bağlantı hatası! Lütfen tekrar deneyin.';
        messageDisplay.className = 'verification-message error';
        
        // 2 saniye sonra butonu normale döndür
        await new Promise(resolve => setTimeout(resolve, 2000));
        submitButton.textContent = 'Doğrula';
        submitButton.className = 'verify-button';
    }
}

// Profile photo functions
function checkProfilePhotoPlaceholder() {
    const defaultPhotoBase64 = 'PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yNSA5NUMyNSA4NS4wNTc2IDMzLjA1NzYgNzcgNDMgNzdIMTA3QzExNi45NDIgNzcgMTI1IDg1LjA1NzYgMTI1IDk1VjEyNUMxMjUgMTM0Ljk0MiAxMTYuOTQyIDE0MyAxMDcgMTQzSDQzQzMzLjA1NzYgMTQzIDI1IDEzNC45NDIgMjUgMTI1Vjk1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';
    const profileImg = document.getElementById('profile-photo-img');
    const removeBtn = document.getElementById('remove-photo-btn');
    
    if (profileImg.src.includes(defaultPhotoBase64)) {
        removeBtn.style.display = 'none';
    } else {
        removeBtn.style.display = 'block';
    }
}

// Profil fotoğrafı değiştiğinde kontrol et
document.getElementById('profile-photo-img').addEventListener('load', checkProfilePhotoPlaceholder);

async function removeProfilePhoto() {
    const messageElement = document.getElementById('photo-message');
    const defaultPhotoUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yNSA5NUMyNSA4NS4wNTc2IDMzLjA1NzYgNzcgNDMgNzdIMTA3QzExNi45NDIgNzcgMTI1IDg1LjA1NzYgMTI1IDk1VjEyNUMxMjUgMTM0Ljk0MiAxMTYuOTQyIDE0MyAxMDcgMTQzSDQzQzMzLjA1NzYgMTQzIDI1IDEzNC45NDIgMjUgMTI1Vjk1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile/photo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ photoUrl: null }), // null göndererek fotoğrafı kaldır
        });
        
                    if (response.ok) {
                document.getElementById('profile-photo-img').src = defaultPhotoUrl;
                messageElement.textContent = 'Profil fotoğrafı kaldırıldı';
                messageElement.className = 'message success';
                document.getElementById('remove-photo-btn').style.display = 'none';
                
                // 3 saniye sonra mesajı temizle
                setTimeout(() => {
                    messageElement.textContent = '';
                    messageElement.className = 'message';
                }, 3000);
        } else {
            const data = await response.json();
            messageElement.textContent = data.message || 'Profil fotoğrafı kaldırılamadı';
            messageElement.className = 'message error';
        }
    } catch (error) {
        messageElement.textContent = 'Bağlantı hatası';
        messageElement.className = 'message error';
    }
}
async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const messageElement = document.getElementById('photo-message');
    const removeBtn = document.getElementById('remove-photo-btn');
    
    // For now, we'll use a placeholder URL
    // In a real app, you'd upload to a server and get the URL
    const photoUrl = URL.createObjectURL(file);
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile/photo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ photoUrl }),
        });
        
            if (response.ok) {
                document.getElementById('profile-photo-img').src = photoUrl;
                messageElement.textContent = 'Profil fotoğrafı başarıyla güncellendi';
                messageElement.className = 'message success';
                removeBtn.style.display = 'block';
            
            // 3 saniye sonra mesajı temizle
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'message';
            }, 3000);
        } else {
            const data = await response.json();
            messageElement.textContent = data.message || 'Profil fotoğrafı güncellenemedi';
            messageElement.className = 'message error';
        }
    } catch (error) {
        messageElement.textContent = 'Bağlantı hatası';
        messageElement.className = 'message error';
    }
}

 