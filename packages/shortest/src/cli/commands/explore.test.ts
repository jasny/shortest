import { Command } from "commander";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { exploreCommand } from "./explore";
import { executeCommand } from "@/cli/utils/command-builder";
import { initializeConfig } from "@/index";

const { mockGetConfig } = vi.hoisted(() => ({
  mockGetConfig: vi.fn().mockReturnValue({}),
}));

vi.mock("@/cli/utils/command-builder", () => ({
  executeCommand: vi.fn(),
}));

vi.mock("@/index", () => ({
  initializeConfig: vi.fn(),
  getConfig: mockGetConfig,
}));

const { mockDiscoverFlows } = vi.hoisted(() => ({
  mockDiscoverFlows: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/core/explorer", () => ({
  ExplorerRunner: vi.fn().mockImplementation(() => ({
    discoverFlows: mockDiscoverFlows,
  })),
}));

vi.mock("@/log", () => ({
  getLogger: vi.fn().mockReturnValue({
    trace: vi.fn(),
    error: vi.fn(),
    config: {},
  }),
}));

describe("explore command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("exploreCommand is a Command instance", () => {
    expect(exploreCommand).toBeInstanceOf(Command);
    expect(exploreCommand.name()).toBe("explore");
  });

  test("exploreCommand has correct options", () => {
    expect(
      exploreCommand.options.find((opt) => opt.long === "--log-level"),
    ).toBeDefined();
    expect(
      exploreCommand.options.find((opt) => opt.long === "--headless"),
    ).toBeDefined();
    expect(
      exploreCommand.options.find((opt) => opt.long === "--target"),
    ).toBeDefined();
    expect(
      exploreCommand.options.find((opt) => opt.long === "--no-cache"),
    ).toBeDefined();
  });

  test("executeExploreCommand runs explorer", async () => {
    await exploreCommand.parseAsync(["--headless"], { from: "user" });

    const callback = vi.mocked(executeCommand).mock.calls[0][2];
    await callback({});

    expect(initializeConfig).toHaveBeenCalled();
    expect(mockDiscoverFlows).toHaveBeenCalled();
  });
});
