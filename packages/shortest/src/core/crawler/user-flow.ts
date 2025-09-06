export interface FlowStep {
  action: string;
  selector?: string;
  value?: string;
  [key: string]: any;
}

export interface UserFlow {
  id: string;
  steps: FlowStep[];
  reusable?: boolean;
}
