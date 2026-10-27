import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AnswerDTO, AttemptDTO, normalizeAttemptDTO, QuestionDTO } from 'src/app/shared/data/entities/dtos';
import { UIMainStates, UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { AttemptState, GradeState } from 'src/app/shared/data/enumerables/enumerables';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'type-trivia',
  templateUrl: './type-trivia.html',
  encapsulation: ViewEncapsulation.None,
})
export class TypetTriviaComponent implements OnInit {
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
    results: icons.ListX,

    perfect: icons.BadgeCheck,

    unselected: icons.CircleDashed,
    selected: icons.CircleDot,
    correct: icons.CircleCheck,
    incorrect: icons.CircleSlash2,
  };

  _utilsUX = new UxUtils();
  uxView: string = '-view-1';
  uxCountScreen: string = '-count-1';

  //#endregion INTERNAL

  //#region LIFECICLE
  constructor(private commonServices: CommonServices,
    public uiServices: UiServices) { }

  async ngOnInit() {
    const total = (this.attempt.questions as QuestionDTO[]).length;
    this.uxCountScreen = `-count-${total}`;
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
    this.calculateAnswerWidth();

    if (this.readonly) {
      if (this.attempt._grade == GradeState.not_submitted) {
        this.attempt = await this.evalueAttemptById(this.attempt.attemptId);
      }

      this.attempt._score = this.attempt.score.toFixed(2);
      this.showFinishPage();
    }

    if (this.attempt.state == AttemptState.progress) {
      let idxLastResponse = (this.attempt.questions as QuestionDTO[]).findIndex((item) => !item.answerSelected);
      if (idxLastResponse != -1) {
        idxLastResponse = idxLastResponse == 0 ? 0 : idxLastResponse - 1;
      } else {
        idxLastResponse = this.attempt.questions.length - 1;
      }

      await this._utilsUX.wait(500);
      this.gotoQuestion(idxLastResponse);
    }
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

    if (options.finish) {
      this.attempt = normalizeAttemptDTO(this.attempt);
      this.attempt.state = AttemptState.completed;
      this.attempt = await this.evalueAttemptById(this.attempt.attemptId);
      this.attempt._score = this.attempt.score.toFixed(2);
    }

    this.attempt.updatedDate = new Date().getTime();
    this.updateAttempt(options.updateData);
  }

  private updateAttempt(savedata: boolean) {
    this.highlightAnswers();
    const event: UITypeStatus = {
      index: this.index,
      attempt: normalizeAttemptDTO(JSON.parse(JSON.stringify(this.attempt))),
      savedata: savedata,
    }
    this.onChange.emit(event);
  }
  //#endregion DATA

  //#region EVENTS
  selectOption(option: AnswerDTO) {
    if (this.onLoading) {
      return;
    }

    if (this.readonly) { return; }

    if (option._selected) {
      this.nextQuestion();
      return;
    } else {
      // reset all selections
      this.getCurrentQuestion().answers.map(opt => {
        opt._selected = opt.answerId == option.answerId ? true : false;
      });
    }

    const question = this.getCurrentQuestion();
    question.answerSelected = option.answerId;
    this.setCurrentQuestion(question);
    this.updateResults({ finish: false, updateData: true });
  }

  prevQuestion() {
    if (this.index <= 0) {
      return;
    }

    this.index = this.index <= 0 ? 0 : this.index - 1;
    this.calculateAnswerWidth();
    this.setCurrentQuestionView();
    this.updateResults({ finish: false, updateData: false });
  }

  nextQuestion() {
    if (this.index >= this.attempt.questions.length - 1) {
      return;
    }

    this.index = this.index >= this.attempt.questions.length - 1 ? this.attempt.questions.length - 1 : this.index + 1;
    this.calculateAnswerWidth();
    this.setCurrentQuestionView();
    this.updateResults({ finish: false, updateData: false });
  }

  finishQuiz() {
    this.updateResults({ finish: true, updateData: true });
    this.setCurrentQuestionView();
    this.showFinishPage();
  }

  validateCurrentResponse() {
    const selected = (this.attempt.questions[this.index] as QuestionDTO).answerSelected;
    console.log('selected: ', selected);
    return selected;
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

  private calculateAnswerWidth() {
    // ask if field questiosn is string to assign data 
    if (typeof this.attempt.questions == 'string') {
      this.attempt.questions = JSON.parse(this.attempt.questions);
    }

    const lengths = this.getCurrentQuestion().answers.map(x => { return x.answer.length });
    const maxLength = lengths.sort((a, b) => a - b);
    this.numrows = maxLength[maxLength.length - 1] > 14 ? '_1' : '_2';
  }

  private getCurrentQuestion() {
    // ask if field questiosn is string to assign data x
    if (typeof this.attempt.questions == 'string') {
      this.attempt.questions = JSON.parse(this.attempt.questions);
    }

    return (this.attempt.questions[this.index] as QuestionDTO);
  }

  private setCurrentQuestionView() {
    this.uxView = `-view-${this.index + 1}`;
  }

  private setCurrentQuestion(question: QuestionDTO): QuestionDTO {
    // ask if field questiosn is string to assign data 
    if (typeof this.attempt.questions == 'string') {
      this.attempt.questions = JSON.parse(this.attempt.questions);
    }

    (this.attempt.questions[this.index] as QuestionDTO) = question;
    return this.getCurrentQuestion();
  }
  //#endregion CONVERTERS
}
