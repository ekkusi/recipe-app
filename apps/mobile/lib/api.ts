/**
 * Typed fetch wrapper that hits the Next.js web app API routes.
 *
 * Usage:
 *   const { getToken } = useAuth();
 *   const recipes = await apiFetch('/api/recipes', getToken);
 *
 * In production, set API_BASE_URL to your deployed web app URL.
 * For local dev, both apps must be running simultaneously.
 */

// Set this in your .env file: EXPO_PUBLIC_API_BASE_URL=https://your-app.vercel.app
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type GetToken = () => Promise<string | null>;

export async function apiFetch<T>(
  path: string,
  getToken: GetToken,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}
