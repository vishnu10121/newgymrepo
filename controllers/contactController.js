// ============================================================
// RAJGym — controllers/contactController.js
// Handles contact form submissions
// ============================================================

const Contact = require('../models/Contact');
const sendEmail = require("../config/email");

// ──────────────────────────────────────────────────────────────
// @route   POST /api/contact
// @desc    Save a new contact form submission + send email
// @access  Public
// ──────────────────────────────────────────────────────────────
const submitContact = async (req, res) => {

  try {

    const { name, email, phone, subject, message } = req.body;

    // validation
    if (!name || !email || !message) {

      return res.status(400).json({

        success: false,
        message: "Name, email and message are required"

      });

    }

    if (message.trim().length < 5) {

      return res.status(400).json({

        success: false,
        message: "Message must be at least 5 characters"

      });

    }

    // save in mongodb
    const contact = await Contact.create({

      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      subject: subject || "General enquiry",
      message: message.trim()

    });


    // send email notification
    await sendEmail(

      "New Message from RAJGym Contact Form",

      `
New Contact Message:

Name: ${name}

Email: ${email}

Phone: ${phone}

Subject: ${subject}

Message:
${message}
      `

    );


    res.status(201).json({

      success: true,
      message: "Message sent successfully",
      data: contact

    });


  } catch (error) {

    console.log("Contact error:", error.message);

    res.status(500).json({

      success: false,
      message: "Server error"

    });

  }

};



// ──────────────────────────────────────────────────────────────
// @route   GET /api/contact
// @desc    Get all contact messages
// ──────────────────────────────────────────────────────────────
const getContacts = async (req, res) => {

  try {

    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({

      success: true,
      total: contacts.length,
      contacts

    });

  } catch (error) {

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