import { describe, expect, it, spyOn } from "bun:test";
import { validAppEnv } from "../env";

describe("Tools Tests", () => {
  it("Should exit with error code 1 in test mode", () => {
    const exitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code: ${code}`);
    });
    Bun.env.APP_PORT = "";

    try {
      validAppEnv();
    } catch (error) {
      expect((error as Error).message).toBe("process.exit called with code: 1");
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("Should exit with error code 1 in normale mode", () => {
    const exitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code: ${code}`);
    });
    Bun.env.NODE_ENV = "production";
    Bun.env.APP_PORT = "";

    try {
      validAppEnv();
    } catch (error) {
      expect((error as Error).message).toBe("process.exit called with code: 1");
    } finally {
      exitSpy.mockRestore();
    }
  });
});
