import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIClient } from "./client";
import { buildExplorerPrompt } from "./prompts/explorer-prompt-builder";
import { buildTestPrompt } from "./prompts/test-prompt-builder";
import { BrowserTool } from "@/browser/core/browser-tool";
import { createTestCase } from "@/core/runner/test-case";
import { TestRun } from "@/core/runner/test-run";
import { ExplorerRun } from "@/core/explorer/explorer-run";
import { ActionInput, ToolResult } from "@/types/browser";
import { AIError } from "@/utils/errors";

vi.mock("ai", () => ({
  generateText: vi.fn(),
  NoSuchToolError: {
    isInstance: (e: unknown) =>
      e instanceof Error && e.name === "NoSuchToolError",
  },
  InvalidToolArgumentsError: {
    isInstance: (e: unknown) =>
      e instanceof Error && e.name === "InvalidToolArgumentsError",
  },
}));

vi.mock("@/utils/sleep", () => ({
  sleep: () => Promise.resolve(),
}));

vi.mock("@/index", () => ({
  getConfig: () => ({
    ai: {
      provider: "anthropic",
      apiKey: "test-key",
      model: "claude-3-5-sonnet-latest",
    },
  }),
}));

vi.mock("@/ai/provider", () => ({
  createProvider: () => ({
    name: "test-provider",
  }),
}));

vi.mock("@/ai/utils/json", () => ({
  extractJsonPayload: vi.fn().mockImplementation((text) => {
    if (
      text.includes('"status": "passed"') ||
      text.includes('"status":"passed"')
    ) {
      return { status: "passed", reason: "test passed" };
    }
    throw new Error("Invalid JSON");
  }),
}));

vi.mock("@/core/runner/test-run-repository", () => ({
  TestRunRepository: {
    VERSION: 2,
    getRepositoryForTestCase: () => ({
      saveRun: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe("AIClient", () => {
  let client: AIClient;
  let browserTool: BrowserTool;
  let testRun: TestRun;

  beforeEach(() => {
    vi.clearAllMocks();

    browserTool = {
      execute: vi.fn<[ActionInput], Promise<ToolResult>>(),
      getNormalizedComponentStringByCoords: vi.fn<
        [number, number],
        Promise<string>
      >(),
    } as Pick<
      BrowserTool,
      "execute" | "getNormalizedComponentStringByCoords"
    > as BrowserTool;

    const testCase = createTestCase({
      name: "test case",
      filePath: "/test.ts",
    });
    testRun = TestRun.create(testCase);

    vi.spyOn(testRun, "addStep");

    vi.spyOn(AIClient.prototype as any, "tools", "get").mockReturnValue({
      test_tool: {
        description: "Test tool",
        execute: vi.fn(),
      },
    });

    // Spy on the isNonRetryableError method to control its behavior
    vi.spyOn(
      AIClient.prototype as any,
      "isNonRetryableError",
    ).mockImplementation(
      (error: unknown) =>
        error instanceof AIError ||
        (error instanceof Error &&
          (error as { status?: number }).status === 401),
    );

    client = new AIClient({
      browserTool,
      testRun,
    });
  });

  describe("runAction", () => {
    it("successfully processes an action with valid response", async () => {
      const mockResponse = {
        response: { status: "passed", reason: "test passed" },
        metadata: {
          usage: {
            completionTokens: 10,
            promptTokens: 20,
            totalTokens: 30,
          },
        },
      };

      vi.spyOn(client as any, "runConversation").mockResolvedValue(
        mockResponse,
      );

      const result = await client.runAction("test prompt");

      expect(result).toEqual(mockResponse);
    });

    it("handles tool calls and continues conversation", async () => {
      const mockResponse = {
        response: { status: "passed", reason: "test completed" },
        metadata: {
          usage: {
            completionTokens: 10,
            promptTokens: 20,
            totalTokens: 30,
          },
        },
      };

      vi.spyOn(client as any, "runConversation").mockResolvedValue(
        mockResponse,
      );

      const result = await client.runAction("test prompt");

      expect(result).toEqual(mockResponse);
    });

    it("records steps in explorer runs", async () => {
      const mockGenerateText = (await import("ai")).generateText as any;
      const explorerRun = new ExplorerRun();
      const addStepSpy = vi.spyOn(explorerRun, "addStep");

      mockGenerateText.mockImplementation(async (opts: any) => {
        await opts.onStepFinish({
          stepType: "tool",
          text: "clicked",
          toolCalls: [],
          toolResults: [
            { args: { action: "click", selector: "#btn" }, result: { output: "ok" } },
          ],
          finishReason: "tool-calls",
          isContinued: false,
          usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
        });
        return {
          text: '{"status":"passed","reason":"ok"}',
          finishReason: "stop",
          warnings: [],
          usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
          response: { messages: [] },
        };
      });

      const exploreClient = new AIClient({ browserTool, explorerRun });
      await exploreClient.runAction("explore prompt");

      expect(addStepSpy).toHaveBeenCalledWith({
        action: "click",
        selector: "#btn",
        result: "ok",
      });
    });

    describe("error handling", () => {
      it("retries on retryable errors", async () => {
        const error = new Error("Network error");
        const mockResponse = {
          response: { status: "passed", reason: "test passed" },
          metadata: {
            usage: {
              completionTokens: 10,
              promptTokens: 20,
              totalTokens: 30,
            },
          },
        };

        vi.spyOn(client as any, "runConversation")
          .mockRejectedValueOnce(error)
          .mockResolvedValue(mockResponse);

        const result = await client.runAction("test prompt");

        expect(result).toEqual(mockResponse);
      });

      it.each([
        {
          name: "non-retryable error",
          error: Object.assign(new Error("Unauthorized"), { status: 401 }),
          expectedMessage: "Unauthorized",
          expectedInstance: Error,
        },
        {
          name: "max retries",
          error: new Error("Network error"),
          expectedMessage: "Max retries reached",
          expectedInstance: AIError,
        },
      ])(
        "handles $name",
        async ({ error, expectedMessage, expectedInstance }) => {
          vi.spyOn(client as any, "runConversation").mockRejectedValue(error);

          await expect(async () => {
            await client.runAction("test prompt");
          }).rejects.toSatisfy((value: unknown) => {
            const e = value as Error;
            expect(e).toBeInstanceOf(expectedInstance);
            expect(e.message).toBe(expectedMessage);
            return true;
          });
        },
      );

      it.each([
        {
          name: "content filter violation",
          finishReason: "content-filter",
          expectedMessage: "Content filter violation: generation aborted.",
          expectedType: "unsafe-content-detected",
        },
        {
          name: "token limit exceeded",
          finishReason: "length",
          expectedMessage:
            "Generation stopped because the maximum token length was reached.",
          expectedType: "token-limit-exceeded",
        },
        {
          name: "unknown error",
          finishReason: "error",
          expectedMessage: "An error occurred during generation.",
          expectedType: "unknown",
        },
      ])(
        "handles $name",
        async ({ finishReason, expectedMessage, expectedType }) => {
          vi.spyOn(client as any, "runConversation").mockImplementation(() => {
            (client as any).throwOnErrorFinishReason(finishReason);
            return {};
          });

          await expect(client.runAction("test prompt")).rejects.toMatchObject({
            message: expectedMessage,
            name: "ShortestError", // AIError gets converted to ShortestError by asShortestError
            type: expectedType,
          });
        },
      );

      it("handles max retries", async () => {
        const error = new Error("Network error");
        vi.spyOn(client as any, "runConversation")
          .mockRejectedValueOnce(error)
          .mockRejectedValueOnce(error)
          .mockRejectedValueOnce(error);

        await expect(client.runAction("test prompt")).rejects.toMatchObject({
          message: "Max retries reached",
          name: "AIError", // This one isn't converted because it's thrown directly in runAction
          type: "max-retries-reached",
        });
      });
    });
  });

  describe("system prompt selection", () => {
    it("uses test prompt when testRun is provided", async () => {
      const mockGenerateText = (await import("ai")).generateText as any;
      mockGenerateText.mockResolvedValueOnce({
        text: '{"status":"passed","reason":"ok"}',
        finishReason: "stop",
        warnings: [],
        usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
        response: { messages: [] },
      });

      await client.runAction("test prompt");

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({ system: buildTestPrompt() }),
      );
    });

    it("uses explorer prompt when explorerRun is provided", async () => {
      const mockGenerateText = (await import("ai")).generateText as any;
      mockGenerateText.mockResolvedValueOnce({
        text: '{"status":"passed","reason":"ok"}',
        finishReason: "stop",
        warnings: [],
        usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
        response: { messages: [] },
      });

      const exploreClient = new AIClient({ browserTool, explorerRun: new ExplorerRun() });
      await exploreClient.runAction("explore prompt");

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({ system: buildExplorerPrompt() }),
      );
    });
  });
});
