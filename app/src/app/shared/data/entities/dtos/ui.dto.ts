import { AttemptState } from "../../enumerables/enumerables";
import { AttemptDTO, QuestionaryDTO } from "./questionaries.dto";

export interface UITypeStatus {
  index: number;
  attempt?: AttemptDTO,
  questionary?: QuestionaryDTO,
  savedata: boolean;
}


export interface UIMainStates {
  action: string;
  state?: string;
  substate?: string;
  attemptStatus?: AttemptState;
}