import * as fs from "fs/promises";
import path from "path";
import { CACHE_DIR_PATH } from "@/cache";
import { TestPlan } from "@/core/test-planner";
import { getLogger, Log } from "@/log";

export class FlowRepository {
  private filePath: string;
  private log: Log;

  constructor(fileName: string = "flows.json") {
    this.filePath = path.join(CACHE_DIR_PATH, fileName);
    this.log = getLogger();
  }

  async save(flows: TestPlan[]): Promise<void> {
    await fs.writeFile(
      this.filePath,
      JSON.stringify({ testPlans: flows }, null, 2),
      "utf-8",
    );
  }

  async load(): Promise<TestPlan[]> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const data = JSON.parse(content);
      return Array.isArray(data.testPlans) ? data.testPlans : [];
    } catch (error) {
      this.log.debug("No existing flow cache", { error });
      return [];
    }
  }
}
