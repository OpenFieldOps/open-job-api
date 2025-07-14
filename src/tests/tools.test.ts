import { describe, expect, it, spyOn } from "bun:test";
import { config, validAppConfig } from "../config";

function withoutLog(fn: () => void) {
	const logSpy = spyOn(console, "error").mockImplementation(() => {});
	try {
		fn();
	} finally {
		logSpy.mockRestore();
	}
}

describe("Tools Tests", () => {
	it("Should exit with error code 1 in test mode", () => {
		const exitSpy = spyOn(process, "exit").mockImplementation((code) => {
			throw new Error(`process.exit called with code: ${code}`);
		});
		config.server.backend_port = 0; // Simulate invalid port

		try {
			withoutLog(() => {
				validAppConfig();
			});
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called with code: 1");
		} finally {
			exitSpy.mockRestore();
		}
	});

	it("Should log error and exit with code 1 in normal mode", () => {
		const exitSpy = spyOn(process, "exit").mockImplementation((code) => {
			throw new Error(`process.exit called with code: ${code}`);
		});
		Bun.env.NODE_ENV = "production";
		config.server.backend_port = 0; // Simulate invalid port

		try {
			withoutLog(() => {
				validAppConfig();
			});
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called with code: 1");
		} finally {
			exitSpy.mockRestore();
		}
	});
});
