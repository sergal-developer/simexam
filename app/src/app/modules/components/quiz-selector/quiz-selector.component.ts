import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from "lucide";
import { getQuizAnswerDTO, getQuizAnswerOptionDTO, getQuizDTO, QuizAnswerDTO, QuizDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { Utils } from 'src/app/shared/data/utils/utils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
import { UiServices } from 'src/app/shared/services/ui.services';


@Component({
  selector: 'quiz-selector',
  templateUrl: './quiz-selector.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizSelectorComponent implements OnInit {

  options: any = [];
  settings: SettingsDTO = null;
  quiz: QuizDTO = null;
  currentAnswer: QuizAnswerDTO = null;
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
    list: icons.ListTodo,
    cards: icons.PlayingCards,
    drama: icons.Drama,
    gFalse: icons.FaceSlightlyFrowning,
    poll: icons.Vote,
    aritmetic: icons.Brain,
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
  async setupComponent(injectData?: QuizDTO) {
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
    console.log('data: ', data);
  }

  async getExternalFile(path: string) {
    const data = await this.commonServices.getFileExternal(path);
    console.log('data: ', data);
  }
  //#region DATA

  //#region EVENTS
  gotoDashboard() {
    this.commonServices.navigate('dashboard');
  }

  createNewBlank(type: string = 'questionaries') {
    this.commonServices.navigate('quizcreate', type);
  }

  async getFile(item: any) {
    this.getExternalFile(item.path)
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
