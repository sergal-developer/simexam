import { AttemptDTO } from "./questionaries.dto";

export interface UITypeStatus {
  index: number;
  attempt: AttemptDTO,
  savedata: boolean;
}


export interface UIMainStates {
  action: string;
  state?: string;
  substate?: string;
}