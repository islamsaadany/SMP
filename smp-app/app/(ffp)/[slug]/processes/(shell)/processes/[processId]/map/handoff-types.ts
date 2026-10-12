/** A hand-over between a step here and a step in another process, resolved for display. */
export type HandoffT = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label: string | null;
  /** The step at the OTHER end (not this process's own). */
  otherStepLabel: string;
  otherStepNumber: number;
  otherProcessId: string;
  otherProcessCode: string;
};

/** A step of another process, offered as a predecessor. */
export type HandoffStepOption = {
  id: string;
  label: string;
  number: number;
  processId: string;
  processCode: string;
};
