import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client();

export async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error('Google sign-in is not configured on the server.');
    error.status = 503;
    throw error;
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch {
    const error = new Error('Google sign-in could not be verified. Please try again.');
    error.status = 401;
    throw error;
  }
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    const error = new Error('Google did not provide a verified email address.');
    error.status = 401;
    throw error;
  }
  return {
    subject: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: String(payload.name || '').trim().slice(0, 60),
    emailIsAuthoritative: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd),
  };
}
