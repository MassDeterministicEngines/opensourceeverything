function need(key: string): string {
  const v = import.meta.env[key];
  if (!v || typeof v !== 'string') {
    throw new Error(
      `Missing env var ${key}. Copy .env.example to .env and fill it in (or set it in Vercel project settings).`
    );
  }
  return v;
}

export const env = {
  SUPABASE_URL: need('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: need('VITE_SUPABASE_ANON_KEY'),
  MAPBOX_TOKEN: need('VITE_MAPBOX_TOKEN'),
  MAPBOX_STYLE_URL: need('VITE_MAPBOX_STYLE_URL'),
};
