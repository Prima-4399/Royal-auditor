export const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL as string;
  if (envUrl) return envUrl;
  
  // For Vercel production - use correct Render URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel')) {
    return 'https://royalguard-ai.onrender.com';
  }
  
  // Default for local development
  return 'http://localhost:8000';
};
