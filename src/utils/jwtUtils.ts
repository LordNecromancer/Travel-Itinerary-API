import { sign } from 'hono/jwt';
// Generate a JWT that is later used to get an access token from google.
export async function createJWT(key: any) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const payload = {
    iss: key.client_email,
    sub: key.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
    scope: 'https://www.googleapis.com/auth/datastore',
  };
  return await sign(payload, key.private_key, 'RS256');
}
