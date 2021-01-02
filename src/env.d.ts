declare namespace NodeJS {
  export interface ProcessEnv {
    NODEMAILER_EMAIL: string;
    NODEMAILER_PASSWORD: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
  }
}
