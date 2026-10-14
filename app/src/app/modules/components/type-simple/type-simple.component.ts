import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AnswerDTO, AttemptDTO, normalizeAttemptDTO, QuestionDTO } from 'src/app/shared/data/entities/dtos';
import { UIMainStates, UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { AttemptState, GradeState } from 'src/app/shared/data/enumerables/enumerables';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'type-simple',
  templateUrl: './type-simple.html',
  encapsulation: ViewEncapsulation.None,
})
export class TypeSimpleComponent implements OnInit {
  //#region INPUTS / OUTPUTS
  @Input() attempt: AttemptDTO = null;
  @Output() onChange = new EventEmitter();
  //#endregion INPUTS / OUTPUTS

  //#region INTERNAL
  index = 0;
  numrows = '_1';
  onLoading = false;
  readonly = false;
  currentSection: 'quiz' | 'results' = 'quiz';
  _gradeState = GradeState;

  luIcon = {
    language: icons.Globe,
    user: icons.UserRound,
    avatar: icons.SquareUserRound,
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    register: icons.UserPlus,
    back: icons.ArrowLeft,
    save: icons.SaveAll,


    perfect: icons.BadgeCheck,

    unselected: icons.CircleDashed,
    selected: icons.CircleDot,
    correct: icons.CircleCheck,
    incorrect: icons.CircleSlash2,
  };

  _utilsUX = new UxUtils();

  indexFliped = false;
  //#endregion INTERNAL

  //#region LIFECICLE
  constructor(private commonServices: CommonServices,
    public uiServices: UiServices) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.setupComponent();
    await this._utilsUX.wait(500);
    this.uiServices.showLoader(false);
  }
  //#endregion LIFECICLE

  //#region DATA
  async setupComponent() {
    console.log('this.attempt: ', this.attempt);
    this.readonly = this.attempt.state == AttemptState.completed;
    this.index = 0;
    this.resetFlipValidation();

    if (this.readonly) {
      this.attempt = normalizeAttemptDTO(this.attempt);
      console.log('this.attempt.initial: ', this.attempt);
      this.attempt._score = this.attempt.score.toFixed(2);
      this.showFinishPage();
    }

    if (this.attempt.state == AttemptState.progress) {
      let idxLastResponse = (this.attempt._questionsSolved);
      if (idxLastResponse != null && idxLastResponse != -1) {
        idxLastResponse = idxLastResponse == 0 ? 0 : idxLastResponse - 1;
      } else {
        idxLastResponse = this.attempt.questions.length - 1;
      }

      await this._utilsUX.wait(500);
      this.gotoQuestion(idxLastResponse);
    }

    this.setCurrentStartEditQuestion();
  }

  async evalueAttemptById(id: number): Promise<AttemptDTO> {
    let attempt: AttemptDTO = await this.commonServices.evalueAttemptById(id);
    return attempt;
  }

  private async updateResults(options: { updateData: boolean, finish: boolean }) {
    if (this.attempt.state == AttemptState.completed) {
      options.updateData = false;
      this.updateAttempt(options.updateData);
      return;
    }

    if (this.attempt.state == AttemptState.new) {
      this.attempt.state = AttemptState.progress;
    }

    if (this.attempt.state == AttemptState.progress) {
      this.attempt = normalizeAttemptDTO(this.attempt);
    }

    if (options.finish) {
      this.attempt = normalizeAttemptDTO(this.attempt);
      // this.attempt.state = AttemptState.completed;
      this.attempt = await this.evalueAttemptById(this.attempt.attemptId);
      console.log('this.attempt: ', this.attempt);
      // this.attempt._score = this.attempt.score.toFixed(2);
    }

    this.attempt.updatedDate = new Date().getTime();
    this.updateAttempt(options.updateData);
  }

  private updateAttempt(savedata: boolean) {
    const event: UITypeStatus = {
      index: this.index,
      attempt: normalizeAttemptDTO(JSON.parse(JSON.stringify(this.attempt))),
      savedata: savedata,
    }
    this.onChange.emit(event);
  }
  //#endregion DATA

  //#region EVENTS
  flipCurrentCard() {
    const listCards = (this.attempt.questions as QuestionDTO[]);
    const current = listCards[this.index];
    const isLastCard = this.index == listCards.length - 1;

    if (current._flip && !isLastCard) {
      this.nextQuestion();
      return;
    }

    current._flip = !current._flip;
    current._hasFlipped = true;
    this.indexFliped = true;

    if (current._hasFlipped) {
      this.setCurrentEndEditQuestion();
    }


    this.attempt = normalizeAttemptDTO(this.attempt);
    console.log('this.attempt: ', this.attempt.questions[this.index]);
  }

  async prevQuestion() {
    if (this.index <= 0) {
      this.resetFlipValidation();
      return;
    }

    this.setCurrentEndEditQuestion();
    this.resetFlipValidation();
    await this._utilsUX.wait(300);
    this.index = this.index <= 0 ? 0 : this.index - 1;
    this.updateResults({ finish: false, updateData: false });
  }

  async nextQuestion() {
    if (this.index >= this.attempt.questions.length - 1) {
      this.resetFlipValidation();
      return;
    }

    this.setCurrentEndEditQuestion();
    this.resetFlipValidation();
    await this._utilsUX.wait(300);
    this.index = this.index >= this.attempt.questions.length - 1 ? this.attempt.questions.length - 1 : this.index + 1;
    this.setCurrentStartEditQuestion();
    this.updateResults({ finish: false, updateData: true });
  }

  finishQuiz() {
    this.setCurrentEndEditQuestion();
    this.updateResults({ finish: true, updateData: true });
    this.showFinishPage();
  }

  showFinishPage() {
    this.currentSection = 'results';
    this.valueChange('secondary');
  }

  showQuiz() {
    // this.setupComponent();
    this.currentSection = 'quiz';
    this.valueChange('primary');
    this.gotoQuestion(0);
  }

  gotoQuestion(index) {
    this.index = index;
    this.currentSection = 'quiz';
    this.valueChange('primary');
    this.updateAttempt(false);
  }

  valueChange(value: string) {
    const states: UIMainStates = { action: 'ui_update', substate: value, attemptStatus: this.attempt.state }
    this.onChange.emit(states);
  }
  //#endregion EVENTS

  //#region CONVERTERS
  highlightAnswers() {
    this.readonly = this.attempt.state == AttemptState.completed;
  }

  async getAssessment() {
    const reponse = await this.commonServices.saveAttempt(this.attempt)
    const attempt = await this.commonServices.evalueAttemptById(reponse.attemptId);
    this.attempt = attempt;
    return this.attempt;
  }

  private resetFlipValidation() {
    const current = (this.attempt.questions[this.index] as QuestionDTO);
    current['flip'] = false;
    this.indexFliped = false;
  }

  private setCurrentStartEditQuestion() {
    if (this.attempt.state == AttemptState.new || this.attempt.state == AttemptState.progress) {
      const current = (this.attempt.questions[this.index] as QuestionDTO);
      current._startEditTime = current._startEditTime || new Date().getTime();
      console.log('current._startEditTime: ', current._startEditTime);
    }
  }

  private setCurrentEndEditQuestion() {
    if (this.attempt.state == AttemptState.new || this.attempt.state == AttemptState.progress) {
      const current = (this.attempt.questions[this.index] as QuestionDTO);
      // current._endEditTime = current._endEditTime || new Date().getTime();
      current._endEditTime = new Date().getTime();
      console.log('current._endEditTime: ', current._endEditTime);
    }
  }
  //#endregion CONVERTERS
}
