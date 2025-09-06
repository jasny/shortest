import { promises as fs } from "fs";
import { join } from "path";
import { UserFlow } from "./user-flow";

const buildTestContent = (flow: UserFlow): string => {
  if (flow.steps.length === 1) {
    return (
      `import { shortest } from "@antiwork/shortest";\n\n` +
      `shortest(${JSON.stringify(flow.steps[0])});\n`
    );
  }

  const steps = flow.steps
    .map((text) => `  ${JSON.stringify(text)}`)
    .join(",\n");
  return (
    `import { shortest } from "@antiwork/shortest";\n\n` +
    `shortest([\n${steps}\n]);\n`
  );
};

export const writeCrawlerTests = async (
  flows: UserFlow[],
  baseDir: string,
): Promise<void> => {
  for (const flow of flows) {
    const parts = flow.id.split("/");
    const fileName = parts.pop()!;
    const dir = join(baseDir, ...parts);
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${fileName}.test.ts`);
    const content = buildTestContent(flow);
    await fs.writeFile(filePath, content);
  }
};

