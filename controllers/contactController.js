// ============================================================
// RAJGym — controllers/contactController.js
// Handles contact form submissions
// ============================================================

const Contact = require('../models/Contact');
const sendEmail = require("../config/email");

const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    console.log('📝 Contact form submission from:', email);

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters"
      });
    }

    // Save in MongoDB
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      subject: subject || "General Enquiry",
      message: message.trim()
    });

    console.log('✅ Contact saved to MongoDB, ID:', contact._id);

    // Send email notification (don't await)
    try {
      await sendEmail(
        "New Message from RAJGym Contact Form",
        `
========================================
NEW CONTACT FORM SUBMISSION
========================================

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subject || 'General Enquiry'}

Message:
${message}

----------------------------------------
Submitted on: ${new Date().toLocaleString()}
Contact ID: ${contact._id}
========================================
        `
      );
      console.log('✅ Email sent successfully');
    } catch (emailErr) {
      console.error('⚠️ Email send failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully! We'll get back to you within 24 hours.",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject
      }
    });

  } catch (error) {
    console.error('❌ Contact error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    console.log(`📋 Retrieved ${contacts.length} contact messages`);
    
    res.status(200).json({
      success: true,
      total: contacts.length,
      contacts
    });
    
  } catch (error) {
    console.error('❌ Get contacts error:', error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  submitContact,
  getContacts
};