import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { icons } from 'lucide';
import { AttemptDTO, PermissionsDTO, QuestionaryDTO, SettingsDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
import { TransformData } from 'src/app/shared/data/utils/transformData';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.html',
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnInit {
  @Output() onChange = new EventEmitter();
  @Input() selected: number = null;

  listQuestionnaire: QuestionaryDTO[] = [];
  currentQuestionnaire: QuestionaryDTO = null;
  currentSection: '_one' | '_two' | '_three' = '_one';
  listAttempts: AttemptDTO[] = [];
  uistate = 'init';
  actionsAttempts = false;

  transform = new TransformData();
  user: UserDTO = null;
  settings: SettingsDTO = null;
  permissions = {
    create: false,
    duplicate: false,
    edit: false,
    delete: false,
    ai: false
  }

  translateLabels = {
    attempt_error_generation: '',
  };

  luIcon = {
    empty: icons.SquareDashedKanban,
    attempts: icons.ChevronRight,
    open: icons.SquareArrowOutUpRight,
    review: icons.ListChecks,
    resolve: icons.ArrowRightFromLine,
    

    back: icons.ArrowLeft,
    actions: icons.EllipsisVertical,
    asterisk: icons.Asterisk,
    help: icons.MessageCircleQuestionMark,
    delete: icons.Trash,
    edit: icons.PencilRuler,
    clone: icons.Copy,

    trivia: icons.ListTodo,
    simple: icons.PlayingCards,
    trueFalse: icons.Drama,
    popularity: icons.Vote,
    martQuest: icons.Brain,
    reading: icons.BookOpenText,

    gradeFailed: icons.CircleX,
    gradeBarely: icons.CircleDashedCheck,
    gradePassed: icons.CircleCheckBig,
    gradePerfect: icons.Sparkles,
  }

  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.setupLanguage(async () => {
      setTimeout(() => {
        this.uistate = '';
        this.init();
      }, 800);
    });
  }

  async setupLanguage(next) {
    this.settings = await this.commonServices.getCurrentSettings();
    this.user = await this.commonServices.getCurrentUser();
    this.permissions = this.settings.permissions as PermissionsDTO;

    this.translate.setDefaultLang(this.settings.language);
    const keys = Object.keys(this.translateLabels);
    this.translate.get(keys).subscribe((res) => {
      this.translateLabels = res;
      next();
    });
  }

  //#region DATA
  async init() {
    this.uiServices.showLoader(true);
    const list = await this.commonServices.getAllQuestionary();
    console.log('list: ', list);
    if (list) {
      this.listQuestionnaire = list;
      this.currentSection = this.listQuestionnaire.length ? '_two' : '_one';
    }

    if (this.selected) {
      const quiz = this.listQuestionnaire.find((quiz) => quiz.questionaryId == this.selected);
      if (this.listQuestionnaire.length && quiz) {
        this.showAttemptsScreen(quiz);
      }
    }

    this.uiServices.showLoader(false);
  }

  async getAttempts(quiz: QuestionaryDTO) {
    const attempts = await this.commonServices.getAttemptByQuestionaryId(quiz.questionaryId);
    this.listAttempts = attempts && attempts.length ? attempts : [];
  }

  async createattempt() {
    try {
      const attempt = await this.commonServices.createNewAttempt(this.currentQuestionnaire.questionaryId, this.user.userId, true);
      ;
      if (!attempt) {
        this.uiServices.notification(this.translateLabels.attempt_error_generation, { type: 'error' })
        return;
      } else if (attempt) {
        this.goToCompleteAttempt(attempt);
      }
    } catch (error) {
      console.log('error: ', error);
      this.uiServices.notification(`Ocurrio un erroro interno `, { type: 'error', closeTimer: 3000 });
    }
  }

  async resetAttempts(quiz: QuestionaryDTO) {
    await Promise.all(
      this.listAttempts.map(async (attemp) => {
        await this.commonServices.deleteAttempt(attemp.attemptId);
      })
    );

    this.returnMain();
  }
  //#endregion DATA

  //#region EVENTS
  returnMain() {
    this.currentSection = '_two';
    setTimeout(() => {
      this.listQuestionnaire.map((item) => {
        item._current = false;
      });
      this.currentQuestionnaire = null;
      this.commonServices.navigate('dashboard');

      setTimeout(() => { this.valueChange('primary'); }, 500);
    }, 500);
  }

  createQuiz() {
    this.commonServices.navigate('quizcreate');
  }

  selectQuiz() {
    this.commonServices.navigate('quizselection');
  }

  editQuiz(quiz: QuestionaryDTO) {
    this.commonServices.navigate('quizedit', quiz.questionaryId.toString());
  }

  goToCompleteAttempt(attempt: AttemptDTO) {
    this.commonServices.navigate('attemptevalue', attempt.attemptId.toString());
  }

  goToReviewAttempt(attempt: AttemptDTO) {
    this.commonServices.navigate('attemptreview', attempt.attemptId.toString());
  }

  showActions() {
    this.actionsAttempts = !this.actionsAttempts;
  }
  
  valueChange(value: string) {
    this.onChange.emit({ action: 'ui_update', value: value });
  }

  onAction(evt: { event: string, value: any }) {
    if (evt.event == 'create' && evt.value == "quiz") {
      this.selectQuiz();
      // this.createQuiz();
    }
  }

  async showAttemptsScreen(quiz: QuestionaryDTO) {
    this.actionsAttempts = false;
    this.listQuestionnaire.map((item) => {
      item._current = quiz.questionaryId == item.questionaryId;
    });
    this.currentSection = '_three';
    this.currentQuestionnaire = quiz;
    this.getAttempts(this.currentQuestionnaire);

    document.querySelector('.screen-content-section').scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    this.commonServices.navigate('dashboard', this.currentQuestionnaire.questionaryId.toString());
    setTimeout(() => { this.valueChange('secondary'); }, 500);
  }

  async duplicateQuiz(quiz: QuestionaryDTO) {
    const quizData = await this.commonServices.duplicateQuestionary(quiz.questionaryId);
    if (quizData) {
      this.uiServices.notification(`Examen Duplicado correctamente`, { type: 'info', closeTimer: 3000 });
      this.commonServices.navigate('quizedit', `${quizData.questionaryId}`);
    }
  }

  async deleteQuiz(quiz: QuestionaryDTO) {
    const _quiz = await this.commonServices.deleteQuestionary(quiz.questionaryId);
    if (_quiz) {
      this.uiServices.notification(`Examen Eliminado correctamente`, { type: 'success', closeTimer: 3000 });
      this.init();
      this.returnMain();
    }
  }
  //#endregion EVENTS

  //#region CONVERTERS
  //#endregion CONVERTERS
}
