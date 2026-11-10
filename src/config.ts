const env = process.env;

function required(name: string): string {
  const value = env[name];
  if (!value) {
    process.stderr.write(`Variable d'environnement manquante : ${name}\n`);
    process.exit(1);
  }
  return value;
}

export const port = Number(env.PORT ?? 8080);
export const dataDir = env.DATA_DIR ?? '/data';
export const adminPassword = required('ADMIN_PASSWORD');
export const sessionSecret = required('SESSION_SECRET');
export const isProduction = env.NODE_ENV === 'production';
