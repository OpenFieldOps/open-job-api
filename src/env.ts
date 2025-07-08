export function validAppEnv() {
  const environment_needed = [
    "APP_PORT",
    "DATABASE_URL",
    "JWT_SECRET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "S3_ENDPOINT",
    "RESEND_KEY",
  ];
  environment_needed.forEach((key) => {
    if (!Bun.env[key]) {
      console.error(`please set env: ${key} (follow: ".env.example")`);
      process.exit();
    }
  });
}
