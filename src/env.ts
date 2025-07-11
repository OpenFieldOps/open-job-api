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
  const environment_in_test = ["APP_PORT", "DATABASE_URL", "JWT_SECRET"];
  if (Bun.env.NODE_ENV === "test") {
    environment_in_test.forEach((key) => {
      if (!Bun.env[key]) {
        process.exit(1);
      }
    });
  } else {
    environment_needed.forEach((key) => {
      if (!Bun.env[key]) {
        console.error(`please set env: ${key} (follow: ".env.example")`);
        process.exit(1);
      }
    });
  }
}
