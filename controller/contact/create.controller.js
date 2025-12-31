import { Contact } from '../../models/contact.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Submit contact form
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contactData = {
      name,
      email: email.toLowerCase().trim(),
      message,
    };

    // Add optional fields if provided
    if (phone) contactData.phone = phone.trim();
    if (subject) contactData.subject = subject.trim();

    const contact = await Contact.create(contactData);

    return sendSuccess(
      res,
      {
        data: {
          contactId: contact._id,
          submittedAt: contact.createdAt,
        },
        message: "Thank you for contacting us! We'll get back to you soon.",
      },
      201
    );
  } catch (error) {
    console.error('Contact submission error:', error);
    return sendError(res, 500, 'Failed to submit contact form', error.message);
  }
};




