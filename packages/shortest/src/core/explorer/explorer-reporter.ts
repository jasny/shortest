import pc from "picocolors";
import { TestPlan } from "@/core/test-planner";
import { getLogger, Log } from "@/log";

export class ExplorerReporter {
  private log: Log;

  constructor() {
    this.log = getLogger();
  }

  onFlow(flow: TestPlan): void {
    this.log.info(pc.green(`✓ discovered flow: ${flow.id}`));
  }

  onRunEnd(flows: TestPlan[]): void {
    this.log.info(pc.cyan(`Discovered ${flows.length} flow(s)`));
  }
}
