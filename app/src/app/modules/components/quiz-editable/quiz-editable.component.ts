import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from 'lucide';
import { getNewQuestionary, getQuestionaryDTO, normalizeQuestionaryDTO, QuestionaryDTO, QuestionDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { UIMainStates, UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { QuizType, ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { Utils } from 'src/app/shared/data/utils/utils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';
import { TypeGenericComponent } from '../type-generic/type-generic';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';

@Component({
  selector: 'quiz-editable',
  templateUrl: './quiz-editable.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizEditableComponent implements OnInit {
  @Input() quizId: number = null;
  @Input() typeQuiz: string = null;
  @Output() onChange = new EventEmitter();
  @ViewChild(TypeGenericComponent) typeGenericComponent: TypeGenericComponent;

  //#region INTERNAL
  formDescription: FormGroup = null;

  types = [
    { name: 'trivia', id: 'trivia', control: 'type' },
    { name: 'simple', id: 'simple', control: 'type' },
    { name: 'true-false', id: 'true-false', control: 'type' },
    { name: 'popularity', id: 'popularity', control: 'type' },
    { name: 'math-quest', id: 'math-quest', control: 'type' },
    { name: 'reading', id: 'reading', control: 'type' },
  ];

  questionary: QuestionaryDTO = null;
  currentAnswer: QuestionDTO = null;
  index = 0;
  redirect = { module: ScreenEnum.dashboard, action: '' };
  zoomlevel = '100%';
  zoomlevelLabel = '1.1x';
  progress = 0;
  progresStyle = '';
  onLoading = false;

  translateLabels = {
    new_quiz: '',
    form_time: '',
    form_type: '',
    service_fail_generate: '',
    service_fail_get: '',
    service_sucess_save: '',
    generation_questions: '',
    service_sucess_generation: '',
    service_fail_update: '',
    generation_questions_questions: '',
    ia_subtitle: '',
    answer_text_default: '',
    answer_option_text_default: '',
    answer_option_correct_text_default: '',
    quiz_default: '',
    quiz_type_trivia: '',
    quiz_type_simple: '',
    quiz_type_true_false: '',
    quiz_type_popularity: '',
    quiz_type_reading: '',
    quiz_type_math_quest: '',
    form_value_true: '',
    form_value_false: ''
  };

  settings: SettingsDTO = null;
  _utils = new Utils();
  _utilsUX = new UxUtils();

  luIcon = {
    language: icons.Globe,
    user: icons.UserRound,
    avatar: icons.SquareUserRound,
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    register: icons.UserPlus,
    back: icons.ArrowLeft,
    save: icons.SaveAll,

    answer: icons.MessageCircleReply,
    explanation: icons.MessageSquareWarning,
    hint: icons.Info,
    time: icons.Timer,
  }
  //#endregion INTERNAL

  //#region LIFECYCLE
  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
  }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.setupLanguage(() => {
      this.setupComponent();
    });
  }

  //#endregion LIFECYCLE

  //#region DATA
  async setupLanguage(next) {
    this.settings = await this.commonServices.getCurrentSettings();
    this.translate.setDefaultLang(this.settings.language);
    const keys = Object.keys(this.translateLabels);
    this.translate.get(keys).subscribe((res) => {
      this.translateLabels = res;
      next();
    });
  }

  async setupComponent(injectData?: QuestionaryDTO) {
    this.uiServices.showLoader(true);

    this.index = 0;
    const _type = this.typeQuiz ? QuizType[this.typeQuiz] : QuizType.trivia;
    let _questionary = getNewQuestionary('', '', {
      question: '', answer: '', hint: '', explanation: '', time: null, answerText: ''
    });
    _questionary.type = _type;

    if (this.quizId) {
      const questionary = await this.commonServices.getQuestionaryById(this.quizId);

      if (!questionary) {
        this.uiServices.notification(this.translateLabels.service_fail_get, { type: 'error', closeTimer: 3000 });
        this.uiServices.showLoader(false);
        return;
      }
      _questionary = normalizeQuestionaryDTO(questionary);

      this.formDescription = this.fb.group({
        title: [_questionary.title, Validators.required],
        tags: [_questionary.tags],
        type: [_questionary.type, Validators.required],
      });

    } else {
      let _defaultTitle = this.getDefaultQuestionaryTitle(this.translateLabels.quiz_default);

      this.formDescription = this.fb.group({
        title: [_defaultTitle, Validators.required],
        tags: [''],
        type: [_type, Validators.required],
      });

      _questionary.title = _defaultTitle;
      _questionary.type = _type;
    }


    // update type labels to current lenguage
    this.types.map(ty => {
      ty.name = ty.id == 'trivia' ? this.translateLabels.quiz_type_trivia :
        ty.id == 'simple' ? this.translateLabels.quiz_type_simple :
          ty.id == 'true-false' ? this.translateLabels.quiz_type_true_false :
            ty.id == 'popularity' ? this.translateLabels.quiz_type_popularity :
              ty.id == 'math-quest' ? this.translateLabels.quiz_type_math_quest :
                ty.id == 'reading' ? this.translateLabels.quiz_type_reading :
                  this.translateLabels.quiz_default
      return ty;
    });


    this.questionary = _questionary;
    await this._utilsUX.wait(300);
    console.log('this.questionary: ', this.questionary);
    this.setQuestionary(_questionary);
    // this.updateValue({});
    this.uiServices.showLoader(false);
  }

  private async saveQuestionary(questionary: QuestionaryDTO): Promise<QuestionaryDTO> {
    console.log('saveQuestionary: ');
    // unlink reference of object
    // const _questionary = JSON.parse(JSON.stringify(questionary));
    let response: QuestionaryDTO = await this.commonServices.saveQuestionary(questionary);
    if (!response) {
      this.uiServices.notification("Ocurrio un error al salvar los datos", { type: 'error', closeTimer: 0 })
    }
    return response || null;
  }
  //#endregion DATA

  //#region EVENTS
  gotoDashboard() {
    if (this.quizId) {
      this.commonServices.navigate('dashboard', this.questionary.questionaryId.toString());
    } else {
      this.commonServices.navigate('dashboard');
    }
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

  getProgress() {
    this.progress = (100 / (this.questionary.questions.length)) * (this.index + 1);
    this.progresStyle = `width: ${this.progress}%`;
  }

  async onChangeChildren(event: UITypeStatus | UIMainStates) {
    console.log('onChangeByParent: ', event);
    if ((event as UIMainStates).action) {
      const evt: UIMainStates = (event as UIMainStates);
      this.onChange.emit({ action: evt.action, value: evt.substate });
      return;
    }

    if ((event as UITypeStatus).questionary) {
      const evt: UITypeStatus = (event as UITypeStatus);

      if (this.onLoading) {
        return;
      }

      this.onLoading = true;
      this.index = evt.index;
      const _questionary = normalizeQuestionaryDTO(evt.questionary);

      if (evt.savedata) {
        const response = await this.saveQuestionary(_questionary);
        this.questionary = response;

        this.gotoDashboard();
      } else {
        this.questionary = _questionary;
      }
      this.typeGenericComponent.setQuestionary(this.questionary);

      this.onLoading = false;
      return;
    }
  }

  updateValue(evt) {
    const { title, type } = this.formDescription.value;

    let _defaultTitle = this.getDefaultQuestionaryTitle(this.translateLabels.quiz_default);

    // Set title 
    this.questionary.title = title ? title.trim() : _defaultTitle;
    this.formDescription.get('title').setValue(this.questionary.title);

    // update type
    if (this.typeQuiz != type) {
      this.typeQuiz = type;
      this.questionary.type = QuizType[this.typeQuiz];
      this.setQuestionary(this.questionary);
      // reset structure of questionary
      // this.typeGenericComponent.resetQuestionary();

      if (title && title.trim() == _defaultTitle) {
        const newTitle = this.getDefaultQuestionaryTitle(this.translateLabels.quiz_default);
        this.formDescription.get('title').setValue(newTitle);
        this.questionary.title = newTitle;
      }
    }
  }
  //#endregion EVENTS

  //#region CONVERTERS
  async setQuestionary(questionary?: QuestionaryDTO) {
    this.uiServices.showLoader(true);
    // const _questionary = JSON.stringify(questionary || this.questionary);
    // this.questionary = JSON.parse(_questionary);
    this.typeGenericComponent.questionary = questionary;
    console.log('questionary: ', questionary);
    this.typeGenericComponent.setQuestionary(questionary);
    this.uiServices.showLoader(false);
  }

  getZoomLevel(zoomLevel: string) {
    zoomLevel = zoomLevel || "100%";
    const num = parseInt(zoomLevel.replace('%', ''));
    return `${num / 100}x`;
  }

  getDefaultQuestionaryTitle(titleLabel: string) {
    const _type = this.typeQuiz ? QuizType[this.typeQuiz] : QuizType.trivia;
    const translateLabels = this.translateLabels;
    let typeLabel = '';
    if (_type == QuizType.trivia) {
      typeLabel = translateLabels.quiz_type_trivia;
    }
    if (_type == QuizType.simple) {
      typeLabel = translateLabels.quiz_type_simple;
    }
    if (_type == QuizType['true-false']) {
      typeLabel = translateLabels.quiz_type_true_false;
    }
    if (_type == QuizType.popularity) {
      typeLabel = translateLabels.quiz_type_popularity;
    }
    if (_type == QuizType.reading) {
      typeLabel = translateLabels.quiz_type_reading;
    }
    if (_type == QuizType['math-quest']) {
      typeLabel = translateLabels.quiz_type_math_quest;
    }
    return `${titleLabel} - ${typeLabel}`;
  }
  //#endregion CONVERTERS
}
