/* ============================================================
   RAJGym — auth.js
   Handles: Login form, Registration form, API communication,
            Client-side validation, Password show/hide
   ============================================================ */

// ── API base URL (add /api to endpoint) ──────────────────
// API base URL - Auto-detect environment
// auth.js - Update API_BASE to your deployed URL
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'  // Local development
  : 'https://rajgym-1.onrender.com/api';  // ✅ Your deployed backend
// ── Wait for DOM ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Add spinner CSS if not exists
  if (!document.querySelector('#spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0,0,0,0.2);
        border-top-color: #000;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .toast-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
      }
      .toast-success {
        background: #10b981;
      }
      .toast-error {
        background: #ef4444;
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ── SHARED: Show/Hide Password Toggles ───────────────────────
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target') || 'password';
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      icon.className = isHidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  });

  // ──────────────────────────────────────────────────────────────
  //  LOGIN FORM
  // ──────────────────────────────────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      let valid = true;

      // Validate email
      if (!isValidEmail(email)) {
        showFieldError('email', 'emailErr');
        valid = false;
      } else {
        clearFieldError('email', 'emailErr');
      }

      // Validate password
      if (password.length < 6) {
        showFieldError('password', 'pwErr');
        valid = false;
      } else {
        clearFieldError('password', 'pwErr');
      }

      if (!valid) return;

      // Show loading
      const btn = document.getElementById('loginBtn');
      setLoading(btn, true, 'Signing in...');

      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          // Save token and user info
          localStorage.setItem('rajgym_token', data.token);
          localStorage.setItem('rajgym_user', JSON.stringify(data.user));
          showToast('Welcome back, ' + data.user.name + '! 💪', 'success');
          setTimeout(() => window.location.href = 'dashboard.html', 1200);
        } else {
          showToast(data.message || 'Invalid credentials. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Network error. Please check your connection.', 'error');
      } finally {
        setLoading(btn, false, '<i class="fa-solid fa-arrow-right-to-bracket"></i> Login');
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  REGISTER FORM
  // ──────────────────────────────────────────────────────────────
  const regForm = document.getElementById('regForm');
  if (regForm) {

    // Gender toggle buttons - FIXED: Changed data-val to data-gender
    let selectedGender = '';
    const genderBtns = document.querySelectorAll('.gender-btn');
    const genderInput = document.getElementById('gender');
    
    genderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        genderBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGender = btn.getAttribute('data-gender'); // FIXED: Changed from data-val
        if (genderInput) genderInput.value = selectedGender;
        clearFieldError('gender', 'genderErr');
      });
    });

    // Plan selection
    const planOptions = document.querySelectorAll('.plan-option');
    planOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        if (e.target.type === 'radio') return;
        
        planOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        const radio = option.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        
        const planErr = document.getElementById('planErr');
        if (planErr) planErr.classList.remove('show');
      });
    });

    // Password strength meter
    const pwInput = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (pwInput) {
      pwInput.addEventListener('input', () => {
        const val = pwInput.value;
        let score = 0;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        const colors = ['', '#ff4d4d', '#ff9900', '#f0c040', '#95C11E'];
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const widths = ['0%', '25%', '50%', '75%', '100%'];

        if (strengthFill) {
          strengthFill.style.width = val ? widths[score] : '0%';
          strengthFill.style.background = val ? colors[score] : '';
        }
        if (strengthText) {
          strengthText.textContent = val ? `Strength: ${labels[score]}` : 'Enter password';
          strengthText.style.color = val ? colors[score] : '';
        }
      });
    }

    // SUBMIT
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const firstName = document.getElementById('firstName')?.value.trim() || '';
      const lastName = document.getElementById('lastName')?.value.trim() || '';
      const email = document.getElementById('email')?.value.trim() || '';
      const phone = document.getElementById('phone')?.value.trim() || '';
      const age = parseInt(document.getElementById('age')?.value);
      const gender = document.getElementById('gender')?.value || selectedGender;
      const password = document.getElementById('password')?.value || '';
      const confirmPw = document.getElementById('confirmPw')?.value || '';
      const termsOk = document.getElementById('terms')?.checked || false;
      const plan = document.querySelector('input[name="plan"]:checked')?.value;

      // Validation
      if (!firstName) { showFieldError('firstName', 'firstNameErr'); valid = false; }
      else clearFieldError('firstName', 'firstNameErr');

      if (!lastName) { showFieldError('lastName', 'lastNameErr'); valid = false; }
      else clearFieldError('lastName', 'lastNameErr');

      if (!isValidEmail(email)) { showFieldError('email', 'emailErr'); valid = false; }
      else clearFieldError('email', 'emailErr');

      if (!phone || !/^[\d\s\+\-]{7,15}$/.test(phone)) { showFieldError('phone', 'phoneErr'); valid = false; }
      else clearFieldError('phone', 'phoneErr');

      if (isNaN(age) || age < 14 || age > 99) { showFieldError('age', 'ageErr'); valid = false; }
      else clearFieldError('age', 'ageErr');

      if (!gender) { 
        const genderErr = document.getElementById('genderErr');
        if (genderErr) genderErr.classList.add('show'); 
        valid = false; 
      } else {
        const genderErr = document.getElementById('genderErr');
        if (genderErr) genderErr.classList.remove('show');
      }

      if (password.length < 8) { showFieldError('password', 'pwErr'); valid = false; }
      else clearFieldError('password', 'pwErr');

      if (password !== confirmPw || !confirmPw) { showFieldError('confirmPw', 'confirmPwErr'); valid = false; }
      else clearFieldError('confirmPw', 'confirmPwErr');

      if (!plan) { 
        const planErr = document.getElementById('planErr');
        if (planErr) planErr.classList.add('show'); 
        valid = false; 
      } else {
        const planErr = document.getElementById('planErr');
        if (planErr) planErr.classList.remove('show');
      }

      if (!termsOk) { 
        const termsErr = document.getElementById('termsErr');
        if (termsErr) termsErr.classList.add('show'); 
        valid = false; 
      } else {
        const termsErr = document.getElementById('termsErr');
        if (termsErr) termsErr.classList.remove('show');
      }

      if (!valid) {
        // Scroll to first error
        const firstError = document.querySelector('.error-msg.show');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const btn = document.getElementById('regBtn');
      setLoading(btn, true, 'Creating account...');

      const payload = {
        name: `${firstName} ${lastName}`,
        email,
        phone,
        age,
        gender,
        password,
        membership: plan,
        goal: document.getElementById('goal')?.value || '',
        experience: document.getElementById('experience')?.value || '',
      };

      try {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('rajgym_token', data.token);
          localStorage.setItem('rajgym_user', JSON.stringify(data.user));
          showToast(data.message || 'Account created! Welcome to RAJGym 🎉', 'success');
          setTimeout(() => window.location.href = 'dashboard.html', 1300);
        } else {
          showToast(data.message || 'Registration failed. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showToast('Network error. Please check your connection.', 'error');
      } finally {
        setLoading(btn, false, '<i class="fa-solid fa-bolt"></i> Create My Account');
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  CHECK EXISTING AUTH (redirect if already logged in)
  // ──────────────────────────────────────────────────────────────
  const token = localStorage.getItem('rajgym_token');
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('login.html') || currentPath.includes('login');
  const isRegisterPage = currentPath.includes('register.html') || currentPath.includes('register');
  
  if (token && (isLoginPage || isRegisterPage)) {
    window.location.href = 'dashboard.html';
  }

});

// ── TOAST NOTIFICATION FUNCTION ────────────────────────────────
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span style="margin-left: 8px;">${message}</span>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── HELPER: Field error show/clear ────────────────────────────
function showFieldError(inputId, errId) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.add('input-error');
  if (err) err.classList.add('show');
}

function clearFieldError(inputId, errId) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.remove('input-error');
  if (err) err.classList.remove('show');
}

// ── HELPER: Email validation ──────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── HELPER: Button loading state ─────────────────────────────
function setLoading(btn, isLoading, label) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? `<span class="spinner"></span> ${label}`
    : label;
}

// ── Live validation: clear errors on input ────────────────────
document.addEventListener('input', (e) => {
  const id = e.target.id;
  const map = {
    email: 'emailErr',
    password: 'pwErr',
    confirmPw: 'confirmPwErr',
    firstName: 'firstNameErr',
    lastName: 'lastNameErr',
    phone: 'phoneErr',
    age: 'ageErr',
  };
  if (map[id]) clearFieldError(id, map[id]);
});