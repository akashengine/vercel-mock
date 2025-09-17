export const VAPI_BASE_URL = 'https://api.vapi.ai';
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
