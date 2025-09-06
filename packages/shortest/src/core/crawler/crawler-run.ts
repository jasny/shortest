export class CrawlerRun {
  public steps: any[] = [];

  addStep(step: any): void {
    this.steps.push(step);
  }
}
