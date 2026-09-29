import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AnswerDTO, AttemptDTO, normalizeAttemptDTO, QuestionDTO } from 'src/app/shared/data/entities/dtos';
import { UIMainStates, UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { AttemptState, GradeState, ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
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
  // currentQuestion: QuestionDTO = null;
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

    unchecked: icons.CircleDashed,
    checked: icons.CircleDashedCheck,
    selected: icons.CircleDot,
    correct: icons.CircleCheckBig,
    incorrect: icons.CircleX,
    results: icons.ListChecks,
  }
  //#endregion INTERNAL

  constructor(private commonServices: CommonServices,
    public uiServices: UiServices) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.setupComponent();
    setTimeout(() => {
      this.uiServices.showLoader(false);
    }, 500);
  }

  //#region DATA
  async getData() {
    if (this.attempt.questionaryId) {
      this.attempt.questionaryId = JSON.parse(JSON.stringify(this.attempt.questionaryId));
      const attempt = await this.getAttemptData(this.attempt.questionaryId);
      if (!attempt) {
        return false;
      }
      this.attempt = attempt;

      if (this.attempt.state == AttemptState.new) {
        this.attempt.updatedDate = new Date().getTime();
        this.attempt.state = AttemptState.progress;
      }

      if (this.attempt.state == AttemptState.progress) {
        let idxLastResponse = (this.attempt.questions as QuestionDTO[]).findIndex((item) => !item._answerSelected);
        if (idxLastResponse != -1) {
          idxLastResponse = idxLastResponse == 0 ? 0 : idxLastResponse - 1;
        } else {
          idxLastResponse = this.attempt.questions.length - 1;
        }

        setTimeout(() => {
          this.gotoQuestion(idxLastResponse);
        }, 500);
      }

      if (this.attempt.state == 'completed') {
        if (this.attempt._grade == GradeState.not_submitted) {
          this.attempt = await this.evalueAttemptById(this.attempt.attemptId);
        }

        this.attempt._score = this.attempt.score.toFixed(2);
        this.showFinishPage();
      }

      this.readonly = this.attempt.state == AttemptState.completed;

      if (!this.attempt) {
        this.uiServices.notification('Ocurrio un error al recuperar los datos', { type: 'error', closeTimer: 3000 });
        return false;
      }
    }
    return true;
  }

  async setupComponent() {
    if (!this.attempt) {
      return;
    }

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
      let idxLastResponse = (this.attempt.questions as QuestionDTO[]).findIndex((item) => !item._answerSelected);
      if (idxLastResponse != -1) {
        idxLastResponse = idxLastResponse == 0 ? 0 : idxLastResponse - 1;
      } else {
        idxLastResponse = this.attempt.questions.length - 1;
      }

      setTimeout(() => {
        this.gotoQuestion(idxLastResponse);
      }, 500);
    }
  }

  async getAttemptData(id: number): Promise<AttemptDTO> {
    let attempt: AttemptDTO = await this.commonServices.getAttemptById(id);
    if (!attempt) {
      this.uiServices.notification("Ocurrio un error al obterner la prueba", { type: 'error', closeTimer: 0 })
    }
    return attempt || null;
  }

  async evalueAttemptById(id: number): Promise<AttemptDTO> {
    let attempt: AttemptDTO = await this.commonServices.evalueAttemptById(id);
    return attempt;
  }

  async updateResults(options: { updateData: boolean, finish: boolean }) {
    if (this.attempt.state == AttemptState.completed) {
      return;
    }

    console.log('options: ', options);
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

  async _updateResultss(isFinish = false) {
    if (this.onLoading) {
      return;
    }

    if (this.attempt.state == AttemptState.completed) {
      return;
    }

    this.onLoading = true;

    if (this.readonly) { return; }

    if (isFinish) {
      this.attempt.state = AttemptState.completed;
      this.attempt = await this.getAssessment();
    } else {
      this.attempt.state = AttemptState.progress;
    }

    this.attempt.updatedDate = new Date().getTime();
    this.readonly = this.attempt.state == AttemptState.completed;

    const reponse = await this.commonServices.saveAttempt(this.attempt);
    console.log('reponse: ', reponse);
    this.attempt = reponse;

    if (this.attempt.state == AttemptState.completed) {
      this.showFinishPage();
    }

    this.onLoading = false;
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
    question._answerSelected = option.answerId;
    this.setCurrentQuestion(question);
    this.updateResults({ finish: false, updateData: true });
  }

  prevQuestion() {
    if (this.index == 0) {
      return;
    }

    this.index = this.index - 1;
    this.calculateAnswerWidth();
    this.updateResults({ finish: false, updateData: false });
  }

  nextQuestion() {
    if (this.index >= this.attempt.questions.length - 1) {
      return;
    }

    this.index = this.index + 1;
    this.calculateAnswerWidth();
    this.updateResults({ finish: false, updateData: false });
  }

  finishQuiz() {

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

  gotoDashboard() {
    this.commonServices.navigate('dashboard', this.attempt.questionaryId.toString());
  }

  valueChange(value: string) {
    const states: UIMainStates = { action: 'ui_update', substate: value }
    this.onChange.emit(states);
  }
  //#endregion EVENTS

  //#region CONVERTERS
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
    // ask if field questiosn is string to assign data 
    if (typeof this.attempt.questions == 'string') {
      this.attempt.questions = JSON.parse(this.attempt.questions);
    }

    return (this.attempt.questions[this.index] as QuestionDTO);
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
