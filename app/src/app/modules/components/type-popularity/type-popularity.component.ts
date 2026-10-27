import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AnswerDTO, AttemptDTO, normalizeAttemptDTO, QuestionDTO } from 'src/app/shared/data/entities/dtos';
import { UIMainStates, UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { AttemptState, GradeState } from 'src/app/shared/data/enumerables/enumerables';
import { Utils } from 'src/app/shared/data/utils/utils';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'type-popularity',
  templateUrl: './type-popularity.html',
  encapsulation: ViewEncapsulation.None,
})
export class TypePopularityComponent implements OnInit {
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
  optionsSelected = [];
  revealedQuiz = false;
  calculatedQuiz = false;
  statusScore: string = null;

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
    incorrect: icons.CircleX,
  };

  _utilsUX = new UxUtils();
  _utils = new Utils();
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
    this.attempt = normalizeAttemptDTO(this.attempt);

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
      let idxLastResponse = (this.attempt.questions as QuestionDTO[]).findIndex((item) => !item.answersSelected);
      if (idxLastResponse != -1) {
        idxLastResponse = idxLastResponse == 0 ? 0 : idxLastResponse - 1;
      } else {
        idxLastResponse = this.attempt.questions.length - 1;
      }

      await this._utilsUX.wait(500);
      this.gotoQuestion(idxLastResponse);

    }

    this.resetScoreboardQuiz();
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
      this.attempt.state = AttemptState.completed;
      this.attempt = normalizeAttemptDTO(this.attempt);
      // this.attempt = await this.evalueAttemptById(this.attempt.attemptId);
      // this.attempt._score = this.attempt.score.toFixed(2);
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
  resetScoreboardQuiz() {
    this.optionsSelected = [];
    this.revealedQuiz = false;
    this.calculatedQuiz = false;
    this.statusScore = null;
  }

  selectOption(option: AnswerDTO) {
    if (this.onLoading || this.revealedQuiz || this.readonly) {
      return;
    }

    option._selected = !option._selected;
    this.optionsSelected = (this.attempt.questions[this.index] as QuestionDTO).answers.filter(ans => ans._selected);
  }

  async revealQuiz() {
    this.statusScore = 'Revelando Puntos ...'
    await this._utilsUX.wait(500);

    this.revealedQuiz = true;
    this.statusScore = 'Puntos Revelados';
    this.calculateQuiz();
  }

  async calculateQuiz() {
    const question = (this.attempt.questions[this.index] as QuestionDTO);
    const _answersSelected = question.answers.filter(ans => ans._selected);

    let actualScore = 0;
    const answersSelected = [];
    _answersSelected.map(ans => {
      actualScore = actualScore + this._utils.convertToNumber(ans.popular);
      answersSelected.push(ans.answerId);
    });

    // setValues in attempt
    (this.attempt.questions[this.index] as QuestionDTO).isCorrect = true;
    (this.attempt.questions[this.index] as QuestionDTO).answersSelected = answersSelected;
    this.attempt.score = this.getAttemptScore();

    await this._utilsUX.wait(1000);

    this.statusScore = 'Calculando...'
    await this._utilsUX.wait(1000);

    // show current points
    this.statusScore = `Puntos Ganados: ${actualScore}`;
    console.log('this.attempt.score: ', this.attempt);
    this.calculatedQuiz = true;

    // update attempt
    this.updateResults({ finish: false, updateData: true });
  }

  private getAttemptScore(): number {
    let totalScore = 0;
    const questions = (this.attempt.questions as QuestionDTO[]);

    questions.forEach(question => {
      question.score = question.answers.reduce((score, ans) => {
        if (ans._selected) {
          const popular = this._utils.convertToNumber(ans.popular);
          totalScore += popular;
          return score + popular;
        }
        return score;
      }, 0);
    });
    return totalScore;
  }

  prevQuestion() {
    if (this.index <= 0) {
      return;
    }

    this.resetScoreboardQuiz();
    this.index = this.index <= 0 ? 0 : this.index - 1;
    this.calculateAnswerWidth();
    this.setCurrentQuestionView();
    this.updateResults({ finish: false, updateData: false });
  }

  nextQuestion() {
    if (this.index >= this.attempt.questions.length - 1) {
      return;
    }

    this.resetScoreboardQuiz();
    this.index = this.index >= this.attempt.questions.length - 1 ? this.attempt.questions.length - 1 : this.index + 1;
    this.calculateAnswerWidth();
    this.setCurrentQuestionView();
    this.updateResults({ finish: false, updateData: true });
  }

  finishQuiz() {
    this.resetScoreboardQuiz();
    this.setCurrentQuestionView();
    this.updateResults({ finish: true, updateData: true });
    this.showFinishPage();
  }

  showFinishPage() {

    const questionHighScore = this.getHighestScore();
    this.attempt['highestScore'] = questionHighScore ? questionHighScore.score : 0;
    this.attempt['highestScoreId'] = questionHighScore ? questionHighScore.questionId : 0;
    this.currentSection = 'results';
    this.valueChange('secondary');
  }

  private getHighestScore(): QuestionDTO {
    const questions = JSON.parse(JSON.stringify(this.attempt.questions as QuestionDTO[]));
    const questionsByScore = questions.sort(this._utils.dynamicSort('-score'));
    console.log('questionsByScore: ', questionsByScore);
    return questionsByScore.length ? questionsByScore[0] : null;
  }

  showQuiz() {
    this.resetScoreboardQuiz();
    this.currentSection = 'quiz';
    this.valueChange('primary');
    this.gotoQuestion(0);
  }

  gotoQuestion(index) {
    this.resetScoreboardQuiz();
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

  private getCurrentQuestion(): QuestionDTO {
    return (this.attempt.questions[this.index] as QuestionDTO);
  }

  private setCurrentQuestionView() {
    this.uxView = `-view-${this.index + 1}`;
  }

  private setCurrentQuestion(question: QuestionDTO): QuestionDTO {
    (this.attempt.questions[this.index] as QuestionDTO) = question;
    return this.getCurrentQuestion();
  }
  //#endregion CONVERTERS
}
