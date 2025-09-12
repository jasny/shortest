import { BrowserManager } from "@/browser/manager";
import { BrowserTool } from "@/browser/core/browser-tool";
import { AIClient } from "@/ai/client";
import { ExplorerRun } from "./explorer-run";
import { UserFlow, userFlowToTestPlan } from "./user-flow";
import { ExplorerReporter } from "./explorer-reporter";
import { FlowRepository } from "./flow-repository";
import { TestPlan } from "@/core/test-planner";
import { getLogger, Log } from "@/log";
import { ShortestStrictConfig, TestContext } from "@/types";

export class ExplorerRunner {
  private config: ShortestStrictConfig;
  private browserManager: BrowserManager;
  private reporter: ExplorerReporter;
  private repository: FlowRepository;
  private log: Log;

  constructor(config: ShortestStrictConfig) {
    this.config = config;
    this.browserManager = new BrowserManager(config);
    this.reporter = new ExplorerReporter();
    this.repository = new FlowRepository();
    this.log = getLogger();
  }

  async discoverFlows(): Promise<TestPlan[]> {
    const context = await this.browserManager.launch();
    const page = context.pages()[0];

    const testContext = { page } as unknown as TestContext;
    const browserTool = new BrowserTool(page, this.browserManager, {
      width: 1920,
      height: 1080,
      testContext,
    });

    const run = new ExplorerRun();
    const aiClient = new AIClient({ browserTool, explorerRun: run });

    let flows: UserFlow[] = [];
    try {
      const { response } = await aiClient.runAction("Explore the application");
      flows = Array.isArray((response as any).flows)
        ? ((response as any).flows as UserFlow[])
        : [];
    } catch (error) {
      this.log.error("Explorer exploration failed", error as any);
    }

    await this.browserManager.close();
    const testPlans = flows.map(userFlowToTestPlan);
    for (const plan of testPlans) {
      this.reporter.onFlow(plan);
    }
    await this.repository.save(testPlans);
    this.reporter.onRunEnd(testPlans);
    return testPlans;
  }
}
