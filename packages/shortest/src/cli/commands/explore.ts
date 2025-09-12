import { Command, Option } from "commander";
import { executeCommand } from "@/cli/utils/command-builder";
import { ExplorerRunner } from "@/core/explorer";
import { getConfig, initializeConfig } from "@/index";
import { getLogger } from "@/log";
import { LOG_LEVELS } from "@/log/config";
import { CLIOptions, cliOptionsSchema } from "@/types/config";

export const exploreCommand = new Command("explore").description(
  "Discover user flows and generate tests",
);

exploreCommand
  .addOption(
    new Option("--log-level <level>", "Set logging level").choices(LOG_LEVELS),
  )
  .option("--headless", "Run tests in headless browser mode")
  .option(
    "--target <url>",
    "Set target URL for tests",
    cliOptionsSchema.shape.baseUrl._def.defaultValue(),
  )
  .option("--no-cache", "Disable test action caching")
  .action(async function () {
    await executeCommand(
      this.name(),
      this.optsWithGlobals(),
      async () => await executeExploreCommand(this.opts()),
    );
  })
  .showHelpAfterError("(add --help for additional information)");

const executeExploreCommand = async (options: any) => {
  const log = getLogger();

  const cliOptions: CLIOptions = {
    headless: options.headless,
    baseUrl: options.target,
    noCache: !options.cache,
    testPattern: undefined as any,
  };

  log.trace("Initializing config for explorer", { cliOptions });
  await initializeConfig({ cliOptions });
  const config = getConfig();

  log.trace("Running explorer");
  const runner = new ExplorerRunner(config);
  await runner.discoverFlows();
};
