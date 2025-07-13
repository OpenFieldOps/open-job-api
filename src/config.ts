import toml_config from "../config.toml";

type Config = {
  server: {
    backend_port: number;
    frontend_port: number;
    jwt_secret: string;
  };
  database: {
    url: string;
  };
  storage: {
    s3_access_key_id: string;
    s3_secret_access_key: string;
    s3_bucket_name: string;
    s3_endpoint: string;
  };
  logging: {
    level: string;
  };
};

export const config: Config = toml_config;

export function validAppConfig() {
  if (!config.server.backend_port || !config.server.frontend_port) {
    console.error("Backend and frontend ports must be defined in the config.");
    process.exit(1);
  }
  if (!config.database.url) {
    console.error("Database URL must be defined in the config.");
    process.exit(1);
  }
  if (
    !config.storage.s3_access_key_id ||
    !config.storage.s3_secret_access_key
  ) {
    console.error(
      "S3 access key ID and secret access key must be defined in the config."
    );
    process.exit(1);
  }
}

validAppConfig();
