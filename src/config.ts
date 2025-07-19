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

export const config: Config = {
	server: {
		backend_port: parseInt(process.env.BACKEND_PORT || "3000", 10),
		frontend_port: parseInt(process.env.FRONTEND_PORT || "3001", 10),
		jwt_secret: process.env.JWT_SECRET || "default_secret",
	},
	database: {
		url:
			process.env.DATABASE_URL ||
			"postgres://user:password@localhost:5432/dbname",
	},
	storage: {
		s3_access_key_id: process.env.S3_ACCESS_KEY_ID || "your_access_key_id",
		s3_secret_access_key:
			process.env.S3_SECRET_ACCESS_KEY || "your_secret_access_key",
		s3_bucket_name: process.env.S3_BUCKET_NAME || "your_bucket_name",
		s3_endpoint: process.env.S3_ENDPOINT || "https://s3.amazonaws.com",
	},
	logging: {
		level: process.env.LOGGING_LEVEL || "info",
	},
};

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
			"S3 access key ID and secret access key must be defined in the config.",
		);
		process.exit(1);
	}
}

validAppConfig();
