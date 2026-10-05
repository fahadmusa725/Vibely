const sendResetEmail = async ({ to, name, resetUrl }) => {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        name,
        reset_link: resetUrl,
        to_email: to,
      },
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`EmailJS responded with ${res.status}: ${details}`);
  }
};

module.exports = { sendResetEmail };
