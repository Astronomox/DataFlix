// This is a Vercel Serverless Function that runs in a Node.js environment.
// It is NOT part of the Angular application and does not have access to Angular's context.

// Vercel automatically handles the dependencies for serverless functions,
// so we don't need a package.json here. `fetch` is globally available.

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Added logging to help debug issues in the Vercel console.
  console.log('Received contact form submission with body:', request.body);

  const { name, email, subject, message } = request.body;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  // Hardcoded the TO_EMAIL to ensure it's always set correctly, avoiding Vercel config issues.
  const TO_EMAIL = 'abdullahioriola02@gmail.com';

  if (!RESEND_API_KEY) {
    console.error('Missing environment variable: RESEND_API_KEY');
    response.status(500).json({ error: 'Server configuration error. API key is missing.' });
    return;
  }

  const payload = {
    from: 'onboarding@resend.dev', // Required for free tier without a custom domain
    to: TO_EMAIL,
    subject: `DataFlix Contact Form: ${subject}`,
    html: `
      <h1>New Message from DataFlix Portal</h1>
      <p>You have received a new message from the contact form.</p>
      <hr>
      <h2>Message Details:</h2>
      <ul>
        <li><strong>From:</strong> ${name}</li>
        <li><strong>User's Email:</strong> ${email}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <h2>Message:</h2>
      <p style="white-space: pre-wrap;">${message}</p>
      <hr>
      <p><em>This email was sent from the DataFlix student portal contact form.</em></p>
    `,
  };

  try {
    const apiResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      // If Resend gives an error, log it and forward a generic error.
      console.error('Resend API Error:', data);
      throw new Error(data.message || 'Failed to send email.');
    }

    response.status(200).json({ message: 'Email sent successfully!', data });
  } catch (error) {
    console.error('Error in send-email function:', error);
    response.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
}
