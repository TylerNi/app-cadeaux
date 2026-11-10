const env = process.env;

export const port = Number(env.PORT ?? 8080);
export const dataDir = env.DATA_DIR ?? '/data';
export const isProduction = env.NODE_ENV === 'production';
