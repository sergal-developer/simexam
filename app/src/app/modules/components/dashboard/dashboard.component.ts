import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BookCheck, icons } from 'lucide';
import { AttemptDTO, AttemptState, PermissionsDTO, QuizAnswerDTO, QuizDTO, SettingsDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
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

  listQuiz: QuizDTO[] = [];
  showListQuiz = true;
  currentQuiz: QuizDTO = null;
  currentSection = '_one';
  listAttempts: AttemptDTO[] = [];
  uistate = 'init';

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
    language: icons.Globe,
    empty: icons.SquareDashedKanban,
    avatar: icons.SquareUserRound,
    return: icons.ChevronLeft,
    add: icons.CirclePlus,
    settings: icons.Settings,
    attempts: icons.ChevronRight,

    exam: icons.NotebookText,
    examOpen: icons.BookOpenText,
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
    const list = await this.commonServices.getAllQuizs();
    if (list) {
      this.listQuiz = this.normalizeQuiz(list);
      console.log('this.listQuiz: ', this.listQuiz);
      this.currentSection = this.listQuiz.length ? '_two' : '_one';
    }

    if (this.selected) {
      const quiz = this.listQuiz.find((quiz) => quiz.quizId == this.selected);
      if (this.listQuiz.length && quiz) {
        this.showDetails(quiz);
      }
    }

    const examcomplete = await this.commonServices.getQuizCompleteById(1);
    console.log('examcomplete: ', examcomplete);
    console.log('examcomplete JSON: ', JSON.stringify(examcomplete, null, 2));

    this.uiServices.showLoader(false);
  }

  async getAttempts(quiz: QuizDTO) {
    const attempts = await this.commonServices.getAttemptByQuizId(quiz.quizId);
    this.listAttempts = attempts && attempts.length ? this.normalizeAttempt(attempts) : [];
    console.log('this.listAttempts: ', this.listAttempts);
    // this.showListQuiz = this.listQuiz.length ? true : false;
  }

  async createattempt() {
    const attempt = await this.commonServices.createAttempt(this.currentQuiz.quizId);
    if (attempt) {
      this.uiServices.notification(`Examen Duplicado correctamente`, { type: 'info', closeTimer: 3000 });
      this.goToCompleteAttempt(attempt);
    } else {
      this.uiServices.notification(this.translateLabels.attempt_error_generation, { type: 'error' })
    }

    const data: AttemptDTO = {
      attemptId: null,
      quizId: this.currentQuiz.quizId,
      userId: this.user.userId,
      title: this.currentQuiz.title,
      updatedDate: new Date().getTime(),
      startDate: null,
      score: 0,
      state: AttemptState.new,
      time: 0,
      answersLinked: this.currentQuiz.answers ? JSON.stringify(this.currentQuiz.answers) : '',
    }

    // SHUFFLE ANSWERS
    // data.questions = this.transform.shuffleArray(data.questions);

    // SAVE DATA
    // const attempt = await this.commonServices.saveAllQuizAttempt(data);

    // if (attempt) {
    //   this.goToCompleteAttempt(attempt);
    // } else {
    //   // GLOBAL.service_error_attempt
    //   this.uiServices.notification('Ocurrio un error al generar la evaluacion, intente nuvamente', { type: 'error' })
    // }
  }

  async resetAttemps(quiz: QuizDTO) {
    await Promise.all(
      this.listAttempts.map(async (attemp) => {
        await this.commonServices.deleteQuizAttempt(attemp.attemptId);
      })
    );

    this.returnMain();
  }
  //#endregion DATA

  //#region EVENTS
  createQuiz() {
    this.commonServices.navigate('quizcreate');
  }

  selectQuiz() {
    console.log('selectQuiz: ');
    this.commonServices.navigate('quizselection');
  }

  editQuiz(quiz: QuizDTO) {
    this.commonServices.navigate('quizedit', quiz.quizId.toString());
  }

  async duplicateQuiz(quiz: QuizDTO) {
    const quizData = await this.commonServices.duplicateQuiz(quiz.quizId);
    if (quizData) {
      this.uiServices.notification(`Examen Duplicado correctamente`, { type: 'info', closeTimer: 3000 });
      this.commonServices.navigate('quizedit', `${quizData.quizId}`);
    }
  }

  async deleteQuiz(quiz: QuizDTO) {
    const _quiz = await this.commonServices.deleteQuiz(quiz.quizId);
    if (_quiz) {
      this.uiServices.notification(`Examen Eliminado correctamente`, { type: 'success', closeTimer: 3000 });
      this.init();
      this.returnMain();
    }
  }


  goToCompleteAttempt(attempt: AttemptDTO) {
    this.commonServices.navigate('attemptevalue', attempt.attemptId.toString());
  }

  goToReviewAttempt(attempt: AttemptDTO) {
    this.commonServices.navigate('attemptreview', attempt.attemptId.toString());
  }

  async showDetails(quiz: QuizDTO) {
    this.listQuiz.map((item) => {
      item._current = quiz.quizId == item.quizId;
    });
    this.currentSection = '_three';
    this.currentQuiz = quiz;
    this.getAttempts(this.currentQuiz);

    document.querySelector('.wrapper ').scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    this.valueChange('secondary');
    this.commonServices.navigate('dashboard', this.currentQuiz.quizId.toString());
    setTimeout(() => {
      // this.showListQuiz = false;
    }, 1000);
  }

  returnMain() {
    this.currentSection = '_two';
    setTimeout(() => {
      this.listQuiz.map((item) => {
        item._current = false;
      });
      this.currentQuiz = null;
      this.valueChange('primary');

      this.commonServices.navigate('dashboard');
      this.showListQuiz = true;
    }, 500);
  }

  valueChange(value: string) {
    this.onChange.emit({ action: 'ui_update', value: value });
  }

  onAction(evt: { event: string, value: any }) {
    if (evt.event == 'create' && evt.value == "quiz") {
      // this.selectQuiz();
      this.createQuiz();
    }

  }
  //#endregion EVENTS

  //#region CONVERTERS
  normalizeAttempt(list: AttemptDTO[]) {
    list.map((item) => {
      item._startDate = this.transform.toDate(new Date(item.startDate), 'MMM/d/yy h:mm');
      item._updatedDate = this.transform.toDate(new Date(item.updatedDate), 'MMM/d/yy h:mm');
      item._score = `${item.score}%`;
    })
    return list;
  }

  normalizeQuiz(list: QuizDTO[]) {
    list.map((item) => {
      item._creationDate = this.transform.toDate(new Date(item.creationDate), 'MMM/d/yy h:mm');
      item._startDate = this.transform.toDate(new Date(item.startDate), 'MMM/d/yy h:mm');
      item._updatedDate = this.transform.toDate(new Date(item.updatedDate), 'MMM/d/yy h:mm');
    })
    return list;
  }

  validateQuestions(list: QuizAnswerDTO[]) {
    const validAnswers = [];
    list.map((answer) => {
      if (answer.title != '' && answer._selectedAnswer != null) {
        validAnswers.push(answer);
      }
    });
    return validAnswers;
  }
  //#endregion CONVERTERS
}
