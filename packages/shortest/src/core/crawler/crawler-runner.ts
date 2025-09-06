import { BrowserManager } from "@/browser/manager";
import { BrowserTool } from "@/browser/core/browser-tool";
import { AIClient } from "@/ai/client";
import { CrawlerRun } from "./crawler-run";
import { UserFlow } from "./user-flow";
import { CrawlerReporter } from "./crawler-reporter";
import { getLogger, Log } from "@/log";
import { ShortestStrictConfig, TestContext } from "@/types";

export class CrawlerRunner {
  private config: ShortestStrictConfig;
  private browserManager: BrowserManager;
  private reporter: CrawlerReporter;
  private log: Log;

  constructor(config: ShortestStrictConfig) {
    this.config = config;
    this.browserManager = new BrowserManager(config);
    this.reporter = new CrawlerReporter();
    this.log = getLogger();
  }

  async discoverFlows(): Promise<UserFlow[]> {
    const context = await this.browserManager.launch();
    const page = context.pages()[0];

    const testContext = { page } as unknown as TestContext;
    const browserTool = new BrowserTool(page, this.browserManager, {
      width: 1920,
      height: 1080,
      testContext,
    });

    const run = new CrawlerRun();
    const aiClient = new AIClient({ browserTool, crawlerRun: run });

    let flows: UserFlow[] = [];
    try {
      const { response } = await aiClient.runAction("Explore the application");
      flows = Array.isArray((response as any).flows)
        ? ((response as any).flows as UserFlow[])
        : [];
      for (const flow of flows) {
        this.reporter.onFlow(flow);
      }
    } catch (error) {
      this.log.error("Crawler exploration failed", error as any);
    }

    await this.browserManager.close();
    this.reporter.onRunEnd(flows);
    return flows;
  }
}
