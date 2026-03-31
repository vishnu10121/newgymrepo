/* ============================================================
   RAJGym — contact.js
   Handles: Subject chips, Character counter, Form validation,
            API submission, Success/Error states
   ============================================================ */

// API Base URL - Auto-detect environment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {

  // ── Subject Chips ─────────────────────────────────────────────
  const subjectInput   = document.getElementById('subject');
  const subjectDisplay = document.getElementById('subjectDisplay');

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = chip.getAttribute('data-val');
      if (subjectInput)   subjectInput.value   = val;
      if (subjectDisplay) subjectDisplay.value = val;
    });
  });

  // ── Character Counter ─────────────────────────────────────────
  const messageArea = document.getElementById('message');
  const charCount   = document.getElementById('charCount');

  if (messageArea && charCount) {
    messageArea.addEventListener('input', () => {
      const len = messageArea.value.length;
      charCount.textContent = len;
      charCount.style.color = len > 450 ? '#ff9900' : '';
    });
  }

  // ── Toast Function ───────────────────────────────────────────
  function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span style="margin-left: 8px;">${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Contact Form Submit ───────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('ctEmail').value.trim();
    const message = document.getElementById('message').value.trim();
    let valid     = true;

    // Validate name
    if (name.length < 2) {
      showErr('name', 'nameErr'); valid = false;
    } else {
      clearErr('name', 'nameErr');
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErr('ctEmail', 'ctEmailErr'); valid = false;
    } else {
      clearErr('ctEmail', 'ctEmailErr');
    }

    // Validate message
    if (message.length < 20) {
      showErr('message', 'messageErr'); valid = false;
    } else {
      clearErr('message', 'messageErr');
    }

    if (!valid) return;

    const btn = document.getElementById('contactBtn');
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span> Sending...';

    const payload = {
      name,
      email,
      phone:   document.getElementById('ctPhone')?.value.trim() || '',
      subject: subjectInput?.value || 'General Enquiry',
      message,
      date:    new Date().toISOString()
    };

    try {
      const res  = await fetch(`${API_BASE}/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showSuccess();
        contactForm.reset();
        if (charCount) charCount.textContent = '0';
        // Reset subject chip
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.chip')?.classList.add('active');
        if (subjectInput) subjectInput.value = 'General Enquiry';
        if (subjectDisplay) subjectDisplay.value = 'General Enquiry';
      } else {
        showToast(data.message || 'Failed to send. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Contact error:', err);
      showToast('Network error. Please try again later.', 'error');
    } finally {
      btn.disabled  = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
    }
  });

  function showSuccess() {
    const banner = document.getElementById('successBanner');
    if (banner) {
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 7000);
    }
    showToast('Message sent! We\'ll reply within 24 hours. 📩', 'success');
  }

  function showErr(inputId, errId) {
    document.getElementById(inputId)?.classList.add('input-error');
    document.getElementById(errId)?.classList.add('show');
  }
  function clearErr(inputId, errId) {
    document.getElementById(inputId)?.classList.remove('input-error');
    document.getElementById(errId)?.classList.remove('show');
  }

  // Live clear errors
  ['name', 'ctEmail', 'message'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const errMap = { name:'nameErr', ctEmail:'ctEmailErr', message:'messageErr' };
      clearErr(id, errMap[id]);
    });
  });

});