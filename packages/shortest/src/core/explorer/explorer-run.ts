export class ExplorerRun {
  public steps: any[] = [];

  addStep(step: any): void {
    this.steps.push(step);
  }
}
