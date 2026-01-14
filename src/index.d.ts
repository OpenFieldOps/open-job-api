export {};

declare global {
  namespace Bun {
    interface Env {
      APP_PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;

      S3_ACCESS_KEY_ID: string;
      S3_SECRET_ACCESS_KEY: string;
      S3_BUCKET: string;
      S3_ENDPOINT: string;
      S3_USER_ENDPOINT: string;

      RESEND_KEY: string;
    }
  }
}
