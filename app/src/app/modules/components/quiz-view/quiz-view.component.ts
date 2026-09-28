import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AnswerDTO, AttemptDTO, QuestionDTO } from 'src/app/shared/data/entities/dtos';
import { AttemptState, GradeState, ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'quiz-view',
  templateUrl: './quiz-view.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizViewComponent implements OnInit {
  @Input() id: number = null;
  @Input() review: boolean = false;
  @Output() onChange = new EventEmitter();

  //#region INTERNAL
  attempt: AttemptDTO = null;
  currentQuestionIndex = 0;
  currentQuestion: QuestionDTO = null;
  numrows = '_1';

  readonly = false;
  progress = 0;
  progresStyle = '';
  savingData = false;
  currentSection: 'quiz' | 'results' = 'quiz';

  _gradeState = GradeState;
  gradePassedScore = 75;

  timerStart = null;
  timerEnd = null;
  zoomlevel = '100%';
  zoomlevelLabel = '1.1x';
  settings = null
  
  redirect = { module: ScreenEnum.dashboard, action: '' };

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
    private uiServices: UiServices
  ) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.settings = await this.commonServices.getSettingCompleteById(0);

    await this.getData();
    this.setupComponent();

    setTimeout(() => {
      this.zoomlevel = this.uiServices.getThemeKey('zoomLevel');
      this.zoomlevelLabel = this.getZoomLevel(this.zoomlevel);
      this.uiServices.showLoader(false);
    }, 500);
  }

  //#region DATA
  async getData() {
    if (this.id) {
      this.id = JSON.parse(JSON.stringify(this.id));
      console.log('this.id: ', this.id);
      const attempt = await this.getAttemptData(this.id);
      if(!attempt) {
        return false;
      }
      console.log('attempt: ', attempt);
      this.attempt = attempt;

      if (this.attempt.state == AttemptState.new) {
        this.attempt.updatedDate = new Date().getTime();
        this.attempt.state = AttemptState.progress;
      }

      if (this.attempt.state == AttemptState.progress) {
    
        console.log('this.attempt.questions : ', this.attempt.questions );
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
        if(this.attempt._grade == GradeState.not_submitted) {
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

      this.redirect.module = ScreenEnum.dashboard;
      this.redirect.action = `${ this.attempt.questionaryId }`;
    }
    return true;
  }

  async setupComponent() {
    if (!this.attempt) {
      return;
    }

    // this.readonly = this.attempt.state == AttemptState.completed;
    this.currentQuestionIndex = 0;
    this.assigCurrentAnswer();

    this.getProgress();
    if (this.readonly) {
      this.showFinishPage();
    }
  }

  async getAttemptData(id: number): Promise<AttemptDTO> {
    let attempt: AttemptDTO = await this.commonServices.getAttemptById(id);
    if(!attempt) {
      this.uiServices.notification("Ocurrio un error al obterner la prueba", { type: 'error', closeTimer: 0})
    }
    return attempt || null;
  }

  async evalueAttemptById(id: number): Promise<AttemptDTO> {
    let attempt: AttemptDTO = await this.commonServices.evalueAttemptById(id);
    return attempt;
  }

  async updateResults(isFinish = false) {
    if (this.savingData) {
      return;
    }

    if( this.attempt.state == AttemptState.completed) {
      return;
    }

    this.savingData = true;

    this.getProgress();
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
    this.attempt = reponse;

    if (this.attempt.state == AttemptState.completed) {
      this.showFinishPage();
    }

    this.savingData = false;
  }
  //#endregion DATA

  //#region EVENTS
  selectOption(option: AnswerDTO) {
    if (this.readonly) { return; }

    if (option._selected) {
      this.nextQuestion();
    } else {
      // reset all selections
      this.currentQuestion.answers.map(opt => {
        opt._selected = opt.answerId == option.answerId ? true : false;
      });
    }

    this.currentQuestion._answerSelected = option.answerId;
  }

  prevQuestion() {
    if (this.currentQuestionIndex == 0) {
      return;
    }

    this.currentQuestionIndex = this.currentQuestionIndex - 1;
    this.assigCurrentAnswer();
  }

  nextQuestion() {
    if (this.currentQuestionIndex >= this.attempt.questions.length - 1) {
      return;
    }

    this.currentQuestionIndex = this.currentQuestionIndex + 1;
    this.assigCurrentAnswer();
    this.updateResults();
  }

  finishQuiz() {
    if (this.attempt.state == AttemptState.completed) {
      this.showFinishPage();
    }

    this.updateResults(true);
  }

  viewResultsAction() {
    this.finishQuiz();
  }

  getProgress() {
    this.progress = (100 / (this.attempt.questions.length)) * (this.currentQuestionIndex + 1);
    this.progresStyle = `width: ${this.progress}%`;
  }

  showFinishPage() {
    this.currentSection = 'results';
    this.valueChange('secondary');
  }

  showQuiz() {
    this.setupComponent();
    this.currentSection = 'quiz';
    this.valueChange('primary');
    this.gotoQuestion(0);
  }

  closeResults() {
    this.currentSection = 'quiz';
    this.valueChange('primary');
  }

  gotoQuestion(index) {
    this.currentQuestionIndex = index;
    this.getProgress();
    this.currentSection = 'quiz';
    this.valueChange('primary');
    this.assigCurrentAnswer();
  }

  gotoDashboard() {
    this.commonServices.navigate('dashboard');
  }

  valueChange(value: string) {
    this.onChange.emit({ action: 'ui_update', value: value });
  }

  updateZoom() {
    const currentLevel = parseInt(this.zoomlevel.replace('%', ''));
    const increment = 10;
    let lavel = currentLevel <= 160 ? currentLevel + increment :
      currentLevel >= 160 ? 70 + increment : 100;

    this.zoomlevel = `${lavel}%`;
    this.uiServices.applyThemeKey('zoomLevel', this.zoomlevel);
    this.zoomlevelLabel = this.getZoomLevel(this.zoomlevel);

    // this.uiServices.applyTheme(this.settings.themeProps[this.settings.theme.toLowerCase()])
  }

  setZoom() {
    this.uiServices.applyThemeKey('zoomLevel', this.zoomlevel);
  }
  //#endregion EVENTS

  //#region CONVERTERS
  async getAssessment() {
    const reponse = await this.commonServices.saveAttempt(this.attempt)
    const attempt = await this.commonServices.evalueAttemptById(reponse.attemptId);
    this.attempt = attempt;
    return this.attempt;
  }

  getZoomLevel(zoomLevel: string) {
    zoomLevel = zoomLevel || "100%";
    const num = parseInt(zoomLevel.replace('%', ''));
    return `${num / 100}x`;
  }

  assigCurrentAnswer() {
    this.currentQuestion = (this.attempt.questions[this.currentQuestionIndex] as QuestionDTO);
    const lengths = this.currentQuestion.answers.map(x => { return x.answer.length });
    const maxLength = lengths.sort((a, b) => a - b);
    this.numrows = maxLength[maxLength.length - 1] > 14 ? '_1' : '_2';
  }
  //#endregion CONVERTERS
}
