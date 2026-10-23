import { AfterContentInit, Component, EventEmitter, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from "lucide";
import { MorphIconComponent } from 'src/app/shared/components/morph-icon/morph-icon.component';
import { SettingsDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
import { AppStateStore } from 'src/app/shared/services/global.store.service';
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
    { url: "/assets/avatar-7.svg", selected: false },
    { url: "/assets/avatar-8.svg", selected: false },
    { url: "/assets/avatar-9.svg", selected: false },
    { url: "/assets/avatar-10.svg", selected: false },
    { url: "/assets/avatar-11.svg", selected: false },
    { url: "/assets/avatar-12.svg", selected: false },
    { url: "/assets/avatar-13.svg", selected: false },
    { url: "/assets/avatar-14.svg", selected: false }
  ];
  animateAvatar = '';
  listAvatarAnimation = '';

  translateLabels = {
    service_sucess_save: '',
    service_fail_save: '',
  };

  languages = []
  settings: SettingsDTO;

  uistate = 'init';
  uxView: '-view-1' | '-view-2' = '-view-1';
  uxFormView = [
    { name: 'language', class: '-view-1' },
    { name: 'user', class: '-view-2' },
    { name: 'avatar', class: '-view-3' },
  ];
  uxFormIndex = 0;

  uxUtils = new UxUtils();

  luIcon = {
    language: icons.Globe,
    username: icons.CircleUserRound,
    avatar: icons.Crown,
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    login: icons.LogIn
  }
  currentLanguage = '';


  _icon = {
    start: icons.GraduationCap, // icons.GraduationCap,
    end: icons.BookOpenText,
    label: 'Logo',
    strokeWidth: 1,
    size: 120
  }
  //#endregion INTERNAL

  constructor(
    private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService,
    public store: AppStateStore
  ) { }


  //#region LIFECYCLE
  async ngOnInit() {
    this.uistate = '';
    this.uxView = '-view-1';
  }

  async ngAfterContentInit() {
    this.init();
  }
  //#endregion LIFECYCLE

  //#region DATA

  async init() {
    this.showView('-view-1');
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

  async getInitialData(after?: Function) {
    this.translate.get(['service_sucess_save', 'service_fail_save']).subscribe((res) => {
      this.translateLabels = res;
    });

    // validate if db is started 
    let state = await this.store.getAll();
    console.log('register.state: ', state);

    this.settings = state;
    this.languages = state.languagesAvailable;
    this.currentLanguage = this.languages.find(x => x.value == this.settings.language);
    if (state.user) {
      this.commonServices.navigate('dashboard');
    } else {
      await this.uxUtils.wait(2000);
      if (after) { after(this.settings) }
    }

    return true;
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
      this.store.setUser(user);
      const response = await this.store.getAll();
      // this.uiServices.notification(this.translateLabels.service_sucess_save, { type: 'success', closeTimer: 1500 });
      this.uistate = 'exit';
      setTimeout(() => {
        this.commonServices.navigate('dashboard');
      }, 1000);
    } else {
      this.uistate = '';
      this.uiServices.notification(this.translateLabels.service_fail_save, { type: 'error', closeTimer: 1500 });
    }
  }

  validateUserLegal() {
    return this.formData.name && this.formData.legal
  }

  validateForm() {
    const invalid = this.form.valid;
    const terms = this.form.get('legal').value;
    return invalid && terms;
  }
  //#endregion DATA

  //#region EVENTS
  async selectAvatar(item) {
    this.animateAvatar = '';
    this.defaultAvatars.map(image => {
      image.selected = image.url == item.url ? true : false;
    });
    this.form.get('image').setValue(item.url);

    this.formData.image = item.url;
    this.onChangeInput({});

    this.animateAvatar = 'animate';
    await this.uxUtils.wait(500);
    this.animateAvatar = '';
  }

  async changeLanguage(language) {
    const languages = [];
    this.settings._languages.map((lan) => {
      languages.push(lan.value);
    })
    this.translate.addLangs(languages);
    this.settings.language = language;

    this.translate.setDefaultLang(this.settings.language);
    await this.commonServices.saveSettings(this.settings);

    this.currentLanguage = this.languages.find(x => x.value == this.settings.language);
  }

  onChangeInput(event) {
    const { image, legal, name } = this.form.value;
    this.formData.name = name;
    this.formData.legal = legal || false;
    this.formData.image = image;
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
    if (after) { after() }
  }

  async getCurrentSection() {
    this.listAvatarAnimation = '';

    const item = this.uxFormView[this.uxFormIndex];
    this._updateExternalSection(item.name);

    if (this.uxFormIndex == 2) {
      await this.uxUtils.wait(300);
      this.listAvatarAnimation = 'list-reveal';
    }
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
    this.listAvatarAnimation = '';
    this.getCurrentSection();
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
