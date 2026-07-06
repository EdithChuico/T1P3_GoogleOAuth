function sanitize(obj: any): any {
  if (!obj) return obj;
  const cloned = { ...obj };
  if (cloned.password) cloned.password = '********';
  if (cloned.token) cloned.token = `${cloned.token.substring(0, 10)}...`;
  if (cloned.secret) cloned.secret = '********';
  return cloned;
}

const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, meta ? JSON.stringify(sanitize(meta)) : '');
  }
};
export = logger;