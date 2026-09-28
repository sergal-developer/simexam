import { Component, EventEmitter, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SettingsDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
import { UxUtils } from 'src/app/shared/data/utils/uxUtils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';
import { v4 as uuidv4 } from 'uuid';
import { IconNode, icons } from "lucide";
import { MorphIconComponent } from 'src/app/shared/components/morph-icon/morph-icon.component';


@Component({
  selector: 'register',
  templateUrl: './register.html',
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent implements OnInit {
  //#region INTERNAL
  @Output() onChange = new EventEmitter();
  @ViewChildren(MorphIconComponent) morphIcons!: QueryList<MorphIconComponent>;

  form: FormGroup;
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
  uxUtils = new UxUtils();

  sections = {
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
    avatar: icons.SquareUserRound,
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    register: icons.UserPlus
  }
  //#endregion INTERNAL

  constructor(private fb: FormBuilder,
    private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService
  ) { }


  //#region LIFECYCLE
  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.form = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      legal: [false, Validators.required],
    });

    await this.uxUtils.wait(800);
    this.checkInitialSettings();
    this.uistate = '';

    this.translate.get(['service_sucess_save', 'service_fail_save']).subscribe((res) => {
      this.translateLabels = res;
    });

    this.uiServices.showLoader(false);
    this.configLanguage();
  }
  //#endregion LIFECYCLE

  //#region DATA
  async checkInitialSettings() {
    this.settings = await this.commonServices.saveDefaultData();
    if (this.settings) {
      this.languages = this.settings._languages;
    }
    const profile = await this.commonServices.getCurrentUser()
    if (profile) {
      this.commonServices.navigate('dashboard');
    }
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
  }

  resetSections() {
    this.sections = {
      language: false,
      user: false,
      avatars: false,
    }
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

  prev() {
    const nav = this.getCurrentNav();
    if (nav.index > 0) {
      const newIndex = nav.index - 1;
      const keys = Object.keys(this.sections);
      this._changeSection(keys[newIndex]);
    }
  }
  next() {
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
  }

  changeMainBackground(value: string) {
    this.onChange.emit({ action: 'ui_update', value: value });
  }
  //#endregion EVENTS
}
