import * as fs from "fs/promises";
import path from "path";
import { CACHE_DIR_PATH } from "@/cache";
import { UserFlow } from "./user-flow";
import { getLogger, Log } from "@/log";

export class FlowRepository {
  private filePath: string;
  private log: Log;

  constructor(fileName: string = "flows.json") {
    this.filePath = path.join(CACHE_DIR_PATH, fileName);
    this.log = getLogger();
  }

  async save(flows: UserFlow[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify({ flows }, null, 2), "utf-8");
  }

  async load(): Promise<UserFlow[]> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const data = JSON.parse(content);
      return Array.isArray(data.flows) ? data.flows : [];
    } catch (error) {
      this.log.debug("No existing flow cache", { error });
      return [];
    }
  }
}
