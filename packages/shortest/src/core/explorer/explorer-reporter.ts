import pc from "picocolors";
import { UserFlow } from "./user-flow";
import { getLogger, Log } from "@/log";

export class ExplorerReporter {
  private log: Log;

  constructor() {
    this.log = getLogger();
  }

  onFlow(flow: UserFlow): void {
    this.log.info(pc.green(`✓ discovered flow: ${flow.id}`));
  }

  onRunEnd(flows: UserFlow[]): void {
    this.log.info(pc.cyan(`Discovered ${flows.length} flow(s)`));
  }
}
