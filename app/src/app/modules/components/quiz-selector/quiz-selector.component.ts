import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { icons } from "lucide";
import { normalizeQuestionaryDTO, QuestionnaireFile, QuestionDTO, QuestionaryDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { QuizType } from 'src/app/shared/data/enumerables/enumerables';
import { Utils } from 'src/app/shared/data/utils/utils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';


@Component({
  selector: 'quiz-selector',
  templateUrl: './quiz-selector.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizSelectorComponent implements OnInit {

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

  luIcon = {
    back: icons.ArrowLeft,
    
    trivia: icons.ListTodo,
    simple: icons.PlayingCards,
    trueFalse: icons.Drama,
    popularity: icons.Vote,
    martQuest: icons.Brain,
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
    private translate: TranslateService
  ) {
  }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.setupLanguage(() => {
      this.setupComponent();
    });
  }

  async setupLanguage(next) {
    this.settings = await this.commonServices.getCurrentSettings();
    this.translate.setDefaultLang(this.settings.language);
    const keys = Object.keys(this.translateLabels);
    this.translate.get(keys).subscribe((res) => {
      this.translateLabels = res;
      next();
    });
  }

  //#region DATA
  async setupComponent(injectData?: QuestionaryDTO) {
    this.getManifestFiles();
    this.uiServices.showLoader(false);
  }

  async getManifestFiles() {
    const data = await this.commonServices.getManifetFiles();

    this.listFilesAvailable = data && data.files ? data.files : [];
    this.listFilesAvailable = this.listFilesAvailable.map(x => {
      x._name = x.name.replace('.json', '').replaceAll('-', ' ');
      return x;
    });
    this.listFilesAvailable = this.listFilesAvailable.filter(x => x.isEmpty == false);
    this.listFilesFiltered = JSON.parse(JSON.stringify(this.listFilesAvailable));
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
    this.commonServices.navigate('quizcreate', type);
  }

  async getFile(item: any) {
    const data = await this.getExternalFile(item.path);
    console.info('data: ', item, data);
    
    const _template = normalizeQuestionaryDTO((data as QuestionaryDTO));
    console.log('_template: ', _template);
    
    
    this.uiServices.notification(`¿Importar plantilla?`, { 
      type: 'info', closeTimer: 0,
      actionText: 'IMPORTAR', actionEvent: () => { this.importTemplateFile(item, _template) } });
  }

  async importTemplateFile(file: QuestionnaireFile, template: QuestionaryDTO) {
    this.uiServices.closeNotification();
    
    template.type = QuizType[file.type];
    const _template = normalizeQuestionaryDTO((template as QuestionaryDTO));

    const _data = await this.commonServices.saveQuestionnaire(_template);
    
    this.uiServices.notification(`Plantilla importada con exito`, { 
      type: 'success', closeTimer: 3500,
      actionText: 'IR A INICIO', actionEvent: () => { this.gotoDashboard() } });
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

  //#endregion EVENTS
}
