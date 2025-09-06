export interface UserFlow {
  id: string;
  /**
   * Natural language descriptions of the flow's steps. These should describe
   * user intentions rather than low-level browser actions.
   */
  steps: string[];
  reusable?: boolean;
}
