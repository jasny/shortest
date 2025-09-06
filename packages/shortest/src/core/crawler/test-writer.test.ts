import { describe, test, expect } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { writeCrawlerTests } from "./test-writer";

describe("writeCrawlerTests", () => {
  test("writes natural language tests from flows", async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), "crawler-"));
    const flows = [
      {
        id: "auth/login",
        steps: [
          "user can login with email and password",
          "user can view dashboard after login",
        ],
      },
    ];

    await writeCrawlerTests(flows, tempDir);

    const content = await fs.readFile(
      join(tempDir, "auth", "login.test.ts"),
      "utf8",
    );

    expect(content).toContain("shortest([");
    expect(content).toContain(
      "user can login with email and password",
    );
    expect(content).toContain(
      "user can view dashboard after login",
    );
  });
});

