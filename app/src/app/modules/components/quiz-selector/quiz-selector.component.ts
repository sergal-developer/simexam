import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { icons } from "lucide";
import { normalizeQuestionaryDTO, QuestionnaireFile, QuestionDTO, QuestionaryDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { QuizType } from 'src/app/shared/data/enumerables/enumerables';
import { Utils } from 'src/app/shared/data/utils/utils';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { AppStateStore } from 'src/app/shared/services/global.store.service';
import { UiServices } from 'src/app/shared/services/ui.services';


@Component({
  selector: 'quiz-selector',
  templateUrl: './quiz-selector.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizSelectorComponent implements OnInit, AfterViewInit {
  @Output() onChange = new EventEmitter();

  uistate = 'init';
  uxView: '-view-1' | '-view-2' = '-view-1';
  uxContentView = [
    { name: 'list', class: '-view-1' },
    { name: 'details', class: '-view-2' },
  ];
  uxContentIndex = 0;

  options: any = [];
  settings: SettingsDTO = null;
  quiz: QuestionaryDTO = null;
  currentAnswer: QuestionDTO = null;
  currentAnswerIndex = 0;

  translateLabels = {
    new_quiz: '',
    form_time: '',
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
  };

  durationFormShow = false;
  showIAForm = false;
  loadingDataAi = false;
  isEdit = false;
  _helper = new Utils();
  uxUtils = new UxUtils();

  luIcon = {
    back: icons.ArrowLeft,
    summary: icons.Summary,

    trivia: icons.ListTodo,
    simple: icons.PlayingCards,
    trueFalse: icons.Drama,
    popularity: icons.Vote,
    mathQuest: icons.Brain,
    reading: icons.BookOpenText,

    download: icons.ArrowDownToLine,
    left: icons.ChevronLeft,
    save: icons.SaveAll,
    random: icons.Dices,
    battle: icons.Swords,
    directions: icons.GamepadDirectional,
  }

  titleQuizSelection: string = 'Nuevo';
  listFilesAvailable: Array<any> = [];
  listFilesFiltered: Array<any> = [];
  currentFilter: string = null;
  //#endregion INTERNAL

  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService,
    public store: AppStateStore
  ) {
  }

  async ngOnInit() {
    this.uistate = '';
  }

  async ngAfterViewInit() {
    await this.uxUtils.wait(500);
    this.setupLanguage(() => {
      this.showView('list');
      this.setupComponent();
    });
  }

  async setupLanguage(next) {
    const store = await this.store.getAll();
    this.settings = store;

    this.translate.setDefaultLang(this.settings.language);
    const keys = Object.keys(this.translateLabels);
    this.translate.get(keys).subscribe((res) => {
      this.translateLabels = res;
      next();
    });
  }

  //#region DATA
  async setupComponent(injectData?: QuestionaryDTO) {
    await this.getManifestFiles();
    this.uiServices.showLoader(false);
  }

  async getManifestFiles() {
    this.uiServices.showLoader(true);
    const data = await this.commonServices.getManifetFiles();

    this.listFilesAvailable = data && data.files ? data.files : [];
    this.listFilesAvailable = this.listFilesAvailable.map(x => {
      x._name = x.name.replace('.json', '').replaceAll('-', ' ');
      return x;
    });
    this.listFilesAvailable = this.listFilesAvailable.filter(x => x.isEmpty == false);
    this.listFilesFiltered = JSON.parse(JSON.stringify(this.listFilesAvailable));

    this.uiServices.showLoader(false);
    return true;
  }

  async getExternalFile(path: string) {
    return await this.commonServices.getFileExternal(path);
  }
  //#region DATA

  //#region EVENTS
  gotoDashboard() {
    this.commonServices.navigate('dashboard');
    this.uiServices.closeNotification();
  }

  createNewBlank(type: string = 'quiz') {
    this.commonServices.navigate('quizcreate', 'create', null, { type: type });
  }

  async getFile(item: any) {
    const data = await this.getExternalFile(item.path);
    console.info('data: ', item, data);

    const _template = normalizeQuestionaryDTO((data as QuestionaryDTO));
    console.log('_template: ', _template);
    this.uiServices.notification(`¿Importar plantilla?`, {
      type: 'info', closeTimer: 0,
      actionText: 'IMPORTAR', actionEvent: () => { this.importTemplateFile(item, _template) }
    });
  }

  async importTemplateFile(file: QuestionnaireFile, template: QuestionaryDTO) {
    this.uiServices.closeNotification();

    template.type = QuizType[file.type];
    const _template = normalizeQuestionaryDTO((template as QuestionaryDTO));

    const _data = await this.commonServices.saveQuestionary(_template);

    this.uiServices.notification(`Plantilla importada con exito`, {
      type: 'success', closeTimer: 3500,
      actionText: 'IR A INICIO', actionEvent: () => { this.gotoDashboard() }
    });
  }

  filterBy(type: string) {
    this.currentFilter = type;
    const filtered = this.listFilesAvailable.filter(x => x.type == this.currentFilter);
    this.listFilesFiltered = filtered;
  }

  resetFilter() {
    this.currentFilter = null;
    this.listFilesFiltered = JSON.parse(JSON.stringify(this.listFilesAvailable));
  }

  valueChange(value: string) {
    this.onChange.emit({ action: 'ui_update', value: value });
  }

  viewSummary(item) {
    this._viewDetails();
  }
  //#endregion EVENTS

  //#region CONVERTERS
  _viewList() {
    this.showView('list');

    document.querySelector('#quiz-selector-screen-slider').scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  _viewDetails() {
    this.showView('details');

    document.querySelector('#quiz-selector-screen-slider').scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  showView(name: 'list' | 'details', after?: Function) {
    const newIndex = this.uxContentView.findIndex(form => form.name == name);
    this.uxView = this.uxContentView[newIndex].class as '-view-1' | '-view-2';
    this.uxContentIndex = newIndex;

    this.valueChange(this.uxContentView[newIndex].name);
    if (after) { after() }
  }
  //#endregion CONVERTERS
}
