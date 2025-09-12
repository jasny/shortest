export interface UserFlow {
  id: string;
  /**
   * Natural language descriptions of the flow's steps. These should describe
   * user intentions rather than low-level browser actions.
   */
  steps: string[];
  reusable?: boolean;
}

import { TestPlan } from "@/core/test-planner";

export const userFlowToTestPlan = (flow: UserFlow): TestPlan => ({
  id: flow.id,
  steps: flow.steps,
  reusable: flow.reusable,
  options: {},
});
