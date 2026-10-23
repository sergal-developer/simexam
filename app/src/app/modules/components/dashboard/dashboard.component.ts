import { AfterContentInit, AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { icons } from 'lucide';
import { AttemptDTO, PermissionsDTO, QuestionaryDTO, SettingsDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
import { TransformData } from 'src/app/shared/data/utils/transformData';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { AppStateStore } from 'src/app/shared/services/global.store.service';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.html',
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @Output() onChange = new EventEmitter();
  @Input() selected: number = null;

  settings: SettingsDTO = null;
  profile: UserDTO = {
    userId: null,
    current: false,
    userName: '',
    uuid: '',
    age: null,
    avatarUrl: null,
    avatarBody: null,
  };

  permissions = {
    create: false,
    duplicate: false,
    edit: false,
    delete: false,
    ai: false
  }

  listQuestionnaire: QuestionaryDTO[] = [];
  currentQuestionnaire: QuestionaryDTO = null;
  listAttempts: AttemptDTO[] = [];
  uxView: '-view-1' | '-view-2' | '-view-3' = '-view-1';
  uxContentView = [
    { name: 'empty', class: '-view-1' },
    { name: 'dashboard', class: '-view-2' },
    { name: 'details', class: '-view-3' },
  ];
  uxContentIndex = 0;

  actionsAttempts = false;

  transform = new TransformData();



  translateLabels = {
    attempt_error_generation: '',
  };

  luIcon = {
    empty: icons.Ghost,
    new: icons.CirclePlus,
    search: icons.Search,
    chevronRight: icons.ChevronRight,
    add: icons.CirclePlus,
    settings: icons.Settings,
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
    mathQuest: icons.Brain,
    reading: icons.BookOpenText,

    gradeFailed: icons.CircleX,
    gradeBarely: icons.CircleDashedCheck,
    gradePassed: icons.CircleCheckBig,
    gradePerfect: icons.Sparkles,
  }
  uxUtils = new UxUtils();

  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService,
    public store: AppStateStore) { }

  async ngOnInit() {
  }

  async ngAfterViewInit() {
    this.showView('empty');
    await this.setupLanguage();
    this.init();
  }

  //#region DATA
  async setupLanguage(next?: Function) {
    this.showView('empty');
    let state = await this.store.getAll();
    console.log('dashboard.state: ', state);

    this.settings = state;
    this.profile = state.user;

    if (this.settings) {
      this.permissions = this.settings.permissions as PermissionsDTO;
      this.translate.setDefaultLang(this.settings.language);
      const keys = Object.keys(this.translateLabels);
      this.translate.get(keys).subscribe((res) => {
        this.translateLabels = res;
      });
      if (next) { next(); }
      return true;
    }
    return false;
  }

  async init() {
    this.uiServices.showLoader(true);

    const list = await this.commonServices.getAllQuestionary();
    if (list) {
      this.listQuestionnaire = list;
      console.log('this.listQuestionnaire: ', this.listQuestionnaire);

      if (this.listQuestionnaire.length) {
        this.showView('dashboard');
      } else {
        this.showView('empty');
      }
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
      const attempt = await this.commonServices.createNewAttempt(this.currentQuestionnaire.questionaryId, this.profile.userId, true);
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
  async returnMain() {
    this.showView('dashboard');
    this.commonServices.navigate('dashboard');

    return;
    setTimeout(() => {
      this.listQuestionnaire.map((item) => {
        item._current = false;
      });
      this.currentQuestionnaire = null;
      this.commonServices.navigate('dashboard');
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
    this.showView('details');
    this.currentQuestionnaire = quiz;
    this.getAttempts(this.currentQuestionnaire);

    document.querySelector('#quiz-list-screen-slider').scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    this.commonServices.navigate('dashboard', this.currentQuestionnaire.questionaryId.toString());
    // setTimeout(() => { this.valueChange('secondary'); }, 500);
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

  showSearch() {
    console.log('showSearch: ');
  }
  //#endregion EVENTS

  //#region CONVERTERS

  onNewQuiz() {
    this.onAction({ event: 'create', value: 'quiz' });
  }

  gotoSettings() {
    this.commonServices.navigate('settings');
  }

  _viewEmpty() {
    this.showView('empty');
  }

  _viewDashboard() {
    this.showView('dashboard');
  }

  _viewDetails() {
    this.showView('details');
  }

  async showView(name: 'empty' | 'dashboard' | 'details', after?: Function) {
    const newIndex = this.uxContentView.findIndex(form => form.name == name);
    this.uxView = this.uxContentView[newIndex].class as '-view-1' | '-view-2' | '-view-3';
    this.uxContentIndex = newIndex;

    await this.uxUtils.wait(500);
    this.valueChange(this.uxContentView[newIndex].name);
    if (after) { after() }
  }
  //#endregion CONVERTERS
}
