const localDevelopmentOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];

export function allowedClientOrigins() {
  const configured = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN;
  const origins = configured ? configured.split(',') : localDevelopmentOrigins;
  if (process.env.RENDER_EXTERNAL_URL) origins.push(process.env.RENDER_EXTERNAL_URL);
  return new Set(
    origins.map((origin) => origin.trim())
      .filter(Boolean),
  );
}
