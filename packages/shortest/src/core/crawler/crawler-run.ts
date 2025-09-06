import { FlowStep, UserFlow } from "./user-flow";

export class CrawlerRun {
  public flows: UserFlow[] = [];
  private currentSteps: FlowStep[] = [];

  addStep(step: FlowStep): void {
    this.currentSteps.push(step);
  }

  finalizeFlow(id: string, reusable: boolean = false): void {
    this.flows.push({ id, steps: [...this.currentSteps], reusable });
    this.currentSteps = [];
  }
}
