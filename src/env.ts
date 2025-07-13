export function validAppEnv() {
  const environment_needed = [
    { key: "APP_PORT", defaultValue: "8080" },
    {
      key: "DATABASE_URL",
      defaultValue: "postgresql://devuser:devpass@localhost:5433/devdb",
    },
    { key: "JWT_SECRET", defaultValue: "MySuperSecret" },
    { key: "S3_ACCESS_KEY_ID", defaultValue: "minioadmin" },
    { key: "S3_SECRET_ACCESS_KEY", defaultValue: "minioadminpass" },
    { key: "S3_BUCKET", defaultValue: "dev-bucket" },
    { key: "S3_ENDPOINT", defaultValue: "http://localhost:9000" },
  ];
  environment_needed.forEach((key) => {
    if (!Bun.env[key.key]) {
      console.error(`please set env: ${key.key} (follow: ".env.example")`);
      Bun.env[key.key] = key.defaultValue;
    }
  });
}
