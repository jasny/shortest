import { SYSTEM_PROMPT_TEMPLATE } from "./index";
import { buildSystemPrompt } from "./utils/build-system-prompt";

export const CRAWLER_PROMPT = buildSystemPrompt(SYSTEM_PROMPT_TEMPLATE, {
  TASK_BLOCK: [
    "You are a test automation expert exploring a web application in a Chromium browser.",
    "Use the provided tools (`click`, `type`, `scroll`, `screenshot`, `get_dom`, `set_viewport`) to act like a human visitor.",
    "Only navigate through visible UI elements; never directly open URLs unless instructed.",
    "Avoid destructive actions (no logout, delete, or irreversible data changes) unless explicitly told.",
    "",
    "Your task:",
    "- Explore the application from the starting URL.",
    "- Identify high-value user flows (e.g., “login”, “send invoice”, “view invoices”).",
    "- Summarize each flow as natural language steps describing what the user accomplished.",
    "- Detect repeating generic steps (such as login) and mark them as reusable sub-flows.",
  ].join("\n"),
  OUTPUT_BLOCK: [
    "Output format:",
    "```json",
    "{",
    "  \"flows\": [",
    "    {",
    "      \"id\": \"auth/login\",",
    "      \"steps\": [\"user can login with email and password\"],",
    "      \"reusable\": true",
    "    },",
    "    {",
    "      \"id\": \"invoice/send\",",
    "      \"steps\": [",
    "        \"user can send an invoice to a company\",",
    "        \"user can view invoices\"",
    "      ]",
    "    }",
    "  ]",
    "}",
    "```",
    "",
    'If no flows were discovered, return { "flows": [] }.',
  ].join("\n"),
});

export const buildCrawlerPrompt = () => CRAWLER_PROMPT;
