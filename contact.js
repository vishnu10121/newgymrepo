/* ============================================================
   RAJGym — contact.js
   Handles: Subject chips, Character counter, Form validation,
            API submission, Success/Error states
   ============================================================ */

const API_BASE = 'https://rajgym-11si.onrender.com';

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

      if (res.ok) {
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
      // Demo mode — no backend connected
      console.warn('Demo mode (no backend):', err.message);
      showSuccess();
      contactForm.reset();
      if (charCount) charCount.textContent = '0';
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
    if (typeof showToast === 'function') {
      showToast('Message sent! We\'ll reply within 24 hours. 📩', 'success');
    }
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
// ============================================================
// RAJGym — models/Contact.js
// MongoDB Contact Schema & Model
// ============================================================

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2, 'Name must be at least 2 characters'],
    },

    email: {
      type:     String,
      required: [true, 'Email is required'],
      trim:     true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },

    phone: {
      type:    String,
      trim:    true,
      default: '',
    },

    subject: {
      type:    String,
      default: 'General Enquiry',
      trim:    true,
    },

    message: {
      type:      String,
      required:  [true, 'Message is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim:      true,
    },

    // Track if admin has read / replied to this message
    isRead: {
      type:    Boolean,
      default: false,
    },

    date: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contact', contactSchema);
// ============================================================
// RAJGym — routes/contact.js
// Contact form routes
// ============================================================

const express = require('express');
const router  = express.Router();

const { submitContact, getContacts } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Submit a contact form message
// @access  Public
router.post('/', submitContact);

// @route   GET /api/contact
// @desc    Get all contact submissions (admin)
// @access  Private
router.get('/', protect, getContacts);

module.exports = router;