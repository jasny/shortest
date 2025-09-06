import { SYSTEM_PROMPT_TEMPLATE } from "./index";
import { buildSystemPrompt } from "./utils/build-system-prompt";

export const TEST_PROMPT = buildSystemPrompt(SYSTEM_PROMPT_TEMPLATE, {
  TASK_BLOCK: [
    "Your task is to:",
    "1. Execute browser actions to validate test cases",
    "2. Use provided browser tools to interact with the page",
  ].join("\n"),
  OUTPUT_BLOCK: [
    'Return test execution results in strict JSON format: { status: "passed" | "failed", reason: string }.',
    "For failures, provide a maximum 1-sentence reason.",
    "IMPORTANT:",
    "- DO NOT include anything else in your response, only the result and reason.",
    "- DO NOT include any other JSON-like object in your response except the required structure.",
    "- If there's need to do that, remove braces {} to ensure it's not interpreted as JSON.",
    "For click actions, provide x,y coordinates of the element to click.",
  ].join("\n"),
});

export const buildTestPrompt = () => TEST_PROMPT;
