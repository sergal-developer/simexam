import { AfterContentInit, Component, EventEmitter, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from "lucide";
import { MorphIconComponent } from 'src/app/shared/components/morph-icon/morph-icon.component';
import { SettingsDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
import { UiServices } from 'src/app/shared/services/ui.services';
import { v4 as uuidv4 } from 'uuid';


@Component({
  selector: 'register',
  templateUrl: './register.html',
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent implements OnInit, AfterContentInit {
  //#region INTERNAL
  @Output() onChange = new EventEmitter();
  @ViewChildren(MorphIconComponent) morphIcons!: QueryList<MorphIconComponent>;

  form: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    image: new FormControl('', Validators.required),
    legal: new FormControl(false, Validators.required),
  });

  formData = {
    name: null,
    image: null,
    legal: false
  }

  defaultAvatars = [
    { url: "/assets/avatar-1.svg", selected: false },
    { url: "/assets/avatar-2.svg", selected: false },
    { url: "/assets/avatar-3.svg", selected: false },
    { url: "/assets/avatar-4.svg", selected: false },
    { url: "/assets/avatar-5.svg", selected: false },
    { url: "/assets/avatar-6.svg", selected: false },
  ];

  translateLabels = {
    service_sucess_save: '',
    service_fail_save: '',
  };

  languages = []
  settings: SettingsDTO;

  uistate = 'init';
  uxView: '-view-1' | '-view-2' = '-view-1';
  uxFormView = [
    { name: 'language', show: false, class: '-view-1' },
    { name: 'user', show: false, class: '-view-2' },
    { name: 'avatar', show: false, class: '-view-3' },
  ];
  uxFormIndex = 0;

  uxUtils = new UxUtils();

  sections = {
    welcome: false,
    language: false,
    user: false,
    avatars: false,
  }

  _icon = {
    start: icons.GraduationCap, // icons.GraduationCap,
    end: icons.BookOpenText,
    label: 'Logo',
    strokeWidth: 1,
    size: 120
  }

  luIcon = {
    language: icons.Globe,
    user: icons.UserRound,
    userRound: icons.CircleUserRound,
    avatar: icons.SquareUserRound,
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    register: icons.UserPlus
  }

  currentLanguage = '';
  //#endregion INTERNAL

  constructor(private fb: FormBuilder,
    private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService,
    private databaseService: DatabaseService
  ) { }


  //#region LIFECYCLE
  async ngOnInit() {
    this.uistate = '';
    this.uxView = '-view-1';
    this.resetSections();
  }

  async ngAfterContentInit() {
    this._updateExternalSection('welcome');
    await this.uxUtils.wait(1000);
    this.showView('-view-1', async () => {
      await this.getInitialData(async (data) => {
        if (data) {
          this.showView('-view-2');
        }
      });
    });
  }
  //#endregion LIFECYCLE

  //#region DATA

  async getInitialData(after?: Function) {
    this.translate.get(['service_sucess_save', 'service_fail_save']).subscribe((res) => {
      this.translateLabels = res;
    });

    // validate if db is started 
    const db = await this.loadDatabaseStructure();
    if (db) {
      let settings = await this.commonServices.getCurrentSettings();

      if (!settings) {
        const defaultData = await this.commonServices.saveDefaultData();
        settings = await this.commonServices.getCurrentSettings();
      }

      this.settings = settings;
      this.languages = this.settings._languages;
      this.currentLanguage = this.languages.find(x => x.value == this.settings.language);

      // check if exist profile
      const profile = await this.commonServices.getCurrentUser();
      if (profile) {
        this.commonServices.navigate('dashboard');
      } else {
        await this.uxUtils.wait(2000);
        if (after) { after(this.settings) }
      }
    }

    if (after) { after(null) }
    return true;
  }

  async checkInitialSettings() {
    this.translate.get(['service_sucess_save', 'service_fail_save']).subscribe((res) => {
      this.translateLabels = res;
    });

    const existStructure = await this.loadDatabaseStructure();
    if (existStructure) {
      this.settings = await this.commonServices.saveDefaultData();
      if (this.settings) {
        this.languages = this.settings._languages;
      }

      this.currentLanguage = this.languages.find(x => x.value == this.settings.language);
      console.log('this.currentLanguage : ', this.currentLanguage);

      const profile = await this.commonServices.getCurrentUser()

      if (profile) {
        this.commonServices.navigate('dashboard');
      } else {
        await this.uxUtils.wait(2000);
        this.configLanguage();
      }
    } else {
      this.uiServices.notification("Error al establecer conexion SQL. reintentando", { type: 'error', closeTimer: 0 })
      await this.uxUtils.wait(2000);
      this.checkInitialSettings();
    }
  }

  async loadDatabaseStructure() {
    const structure = await this.databaseService.initialDatabase();
    if (!structure) {
      this.uiServices.notification("Error al establecer conexion SQL.", { type: 'error', closeTimer: 0 })
    }
    return structure ? true : false;
  }

  async register() {
    const { name, image } = this.form.value;
    const id = uuidv4();
    const data: UserDTO = {
      userId: null,
      uuid: id,
      userName: name,
      age: 0,
      avatarUrl: image,
      avatarBody: '',
      current: true,
    };

    await this.commonServices.saveUser(data);

    let user = await this.commonServices.getCurrentUser();
    if (user) {
      this.uiServices.notification(this.translateLabels.service_sucess_save, { type: 'success', closeTimer: 1500 });
      this.uistate = 'exit';
      setTimeout(() => {
        this.commonServices.navigate('dashboard');
      }, 1500);
    } else {
      this.uistate = '';
      this.uiServices.notification(this.translateLabels.service_fail_save, { type: 'error', closeTimer: 1500 });
    }
  }

  validateData() {
    const invalid = this.form.valid;
    const terms = this.form.get('legal').value;
    return invalid && (invalid == terms);
  }
  //#endregion DATA

  //#region EVENTS
  selectAvatar(item) {
    this.defaultAvatars.map(image => {
      image.selected = image.url == item.url ? true : false;
    });
    this.form.get('image').setValue(item.url);
  }

  async changeLanguage(language) {
    const languages = [];
    this.settings._languages.map((lan) => {
      languages.push(lan.value);
    })
    this.translate.addLangs(languages);
    this.settings.language = language;

    this.translate.setDefaultLang(this.settings.language);
    await this.commonServices.saveSettings({
      language: this.settings.language,
      permissions: this.settings.permissions,
      theme: this.settings.theme,
      settingId: this.settings.settingId
    });

    this.currentLanguage = this.languages.find(x => x.value == this.settings.language);
    console.log('this.currentLanguage : ', this.currentLanguage);
  }

  onChangeInput(event) {
    console.log('event: ', event, this.form.value);
    const { image, legal, name } = this.form.value;
    this.formData.name = name

    // this.formData.name = 
  }

  resetSections() {
    this.sections = {
      welcome: false,
      language: false,
      user: false,
      avatars: false,
    }
  }

  showView(name: '-view-1' | '-view-2', after?: Function) {
    this.uxView = name;

    const section = name == '-view-1' ? 'welcome' : 'language';
    this._updateExternalSection(section);
    if (after) { after() }
  }

  showFormView(name: 'language' | 'user' | 'avatar', after?: Function) {
    const newIndex = this.uxFormView.findIndex(form => form.name == name);
    this.uxFormIndex = newIndex;
    console.log('this.uxFormView: ', this.uxFormView[this.uxFormIndex]);
    if (after) { after() }
  }

  // this._updateExternalSection('welcome');

  getCurrentSection() {
    const item = this.uxFormView[this.uxFormIndex];
    this._updateExternalSection(item.name);
  }

  next() {
    if (this.uxFormIndex < this.uxFormView.length - 1) {
      this.uxFormIndex += 1;
    } else {
      this.uxFormIndex = 0;
    }
    this.getCurrentSection();
  }

  prev() {
    if (this.uxFormIndex > 0) {
      this.uxFormIndex -= 1;
    } else {
      this.uxFormIndex = this.uxFormView.length - 1;
    }
    this.getCurrentSection();
  }


  async configWelcome() {
    this._changeSection('welcome');
    await this.checkInitialSettings();
  }

  async configUser() {
    this._changeSection('user');
  }

  async configLanguage() {
    this._changeSection('language');
  }

  async configAvatar() {
    this._changeSection('avatars');
  }

  getCurrentNav(): { total: number, index: number } {
    const keys = Object.keys(this.sections);
    let _index = -1;
    keys.map((key, index) => {
      if (this.sections[key] == true) {
        _index = index;
        return;
      }
    });
    return { total: keys.length, index: _index };
  }


  prevs() {
    const nav = this.getCurrentNav();
    if (nav.index > 0) {
      const newIndex = nav.index - 1;
      const keys = Object.keys(this.sections);
      this._changeSection(keys[newIndex]);
    }
  }

  nexts() {
    const nav = this.getCurrentNav();
    if (nav.index < nav.total - 1) {
      const newIndex = nav.index + 1;
      const keys = Object.keys(this.sections);
      this._changeSection(keys[newIndex]);
    }
  }


  private async _changeSection(key: string) {
    this.changeMainBackground(key);
    this.resetSections();
    await this.uxUtils.wait(300);
    this.sections[key] = true;
    console.log('this.sections: ', this.sections);
  }

  private _updateExternalSection(section: string) {
    const sections = ['welcome', 'language', 'user', 'avatar'];
    if (sections.includes(section)) {
      this.changeMainBackground(section);
    }
  }

  changeMainBackground(value: string) {
    this.onChange.emit({ action: 'ui_update', value: value });
  }
  //#endregion EVENTS
}
