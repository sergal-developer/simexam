import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SettingsDTO, ThemeDTO, ThemePropertiesDTO, UserDTO } from 'src/app/shared/data/entities/dtos';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'settings',
  templateUrl: './settings.html',
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent implements OnInit {
  profile: UserDTO;
  settings: SettingsDTO;
  pendingChanges: {
    profile?: UserDTO,
    settings?: SettingsDTO;
  }
  profileUI = {
    avatarEdit: false,
    usernameEdit: false,
  };

  updating = false;

  defaultAvatars = [
    { url: "/assets/avatar-1.svg", selected: false },
    { url: "/assets/avatar-2.svg", selected: false },
    { url: "/assets/avatar-3.svg", selected: false },
    { url: "/assets/avatar-4.svg", selected: false },
    { url: "/assets/avatar-5.svg", selected: false },
    { url: "/assets/avatar-6.svg", selected: false },
    { url: "/assets/avatar-7.svg", selected: false },
    { url: "/assets/avatar-8.svg", selected: false },
  ];
  availableThemes = ['light', 'dark']
  form: FormGroup;
  themeProps: Array<{ name: string, value: string }> = null;
  customizeColorsMode = false;

  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private translate: TranslateService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.getSettings();
  }

  //#region DATA
  async getSettings() {
    this.settings = await this.commonServices.getSettingCompleteById();
    this.profile = await this.commonServices.getCurrentUser();

    this.form = this.fb.group({
      name: [this.profile.userName, Validators.required],
    });
    this.form.get('name').disable();

    try {
      const currentTheme = this.settings._themes.find(x => x.id == this.settings.theme);
      if (currentTheme) {
        this.themeProps = this.getKeysThemeProps(currentTheme.content as ThemePropertiesDTO);
      }
    } catch (error) {
      console.info('error: ', error);
    }
  }

  tooglePermission(id: 'ai' | 'create' | 'delete' | 'duplicate' | 'edit') {
    this.settings.permissions[id] = !this.settings.permissions[id];
    this.updatePermission();
  }

  async updatePermission() {
    if (this.updating) { return; }
    this.updating = true;

    await this.commonServices.saveSettings({
      language: this.settings.language,
      permissions: this.settings.permissions,
      theme: this.settings.theme,
      settingId: this.settings.settingId
    });
    this.settings = await this.commonServices.getCurrentSettings();
    this.uiServices.notification('Permisos actualizados');
    this.updating = false;

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

  async changeTheme(theme) {
    this.settings.theme = theme;
    if (this.settings._themes.length) {
      const theme = this.settings._themes.find(x => x.id == this.settings.theme);
      if (theme) {
        this.uiServices.applyTheme(theme);
        await this.commonServices.saveSettings({
          language: this.settings.language,
          permissions: this.settings.permissions,
          theme: this.settings.theme,
          settingId: this.settings.settingId
        });
        try {
          this.themeProps = this.getKeysThemeProps(theme.content as ThemePropertiesDTO);
        } catch (error) { }
      }
    }
    this.updatePermission();
  }
  //#endregion DATA

  //#region EVENTS
  selectAvatar(item) {
    this.defaultAvatars.map(image => {
      image.selected = image.url == item.url ? true : false;
    });
    this.profile.avatarUrl = item.url;
    // SAVE DATA 
  }

  editAvatar() {
    this.profileUI.avatarEdit = !this.profileUI.avatarEdit;
    if (this.profileUI.avatarEdit) {
      this.defaultAvatars.map((avatar) => {
        avatar.selected = avatar.url == this.profile.avatarUrl;
      });
    } else {
      this.saveDataProfile();
    }
  }

  editUsername() {
    this.profileUI.usernameEdit = !this.profileUI.usernameEdit;
    if (this.profileUI.usernameEdit) {
      this.form.get('name').enable();
    } else {
      this.form.get('name').disable();
    }
  }

  editUsernameConfirm() {
    this.profile.userName = this.form.get('name').value;
    this.editUsername();
    this.saveDataProfile();
  }

  editUsernameCancel() {
    this.form.get('name').setValue(this.profile.userName);
    this.editUsername();
  }

  customizeColors() {
    this.customizeColorsMode = !this.customizeColorsMode;
  }

  async updateColors(prop: any) {
    const changes = this.buildKeysThemeProps(this.themeProps);
    const theme = this.settings._themes.find(x => x.id == this.settings.theme);
    const themeContent: ThemePropertiesDTO = theme.content as ThemePropertiesDTO;
    if (theme) {
      if (theme.id != 'custom') {

        const themeRow: ThemeDTO = {
          id: 'custom',
          content: { ...themeContent, ...changes }
        }
      } else {
        theme.content = { ...themeContent, ...changes }
      }
      setTimeout(() => {
        this.uiServices.applyTheme(theme);
      }, 300);
    }
  }

  async saveDataProfile() {
    const user: UserDTO = {
      age: this.profile.age,
      avatarBody: this.profile.avatarBody,
      avatarUrl: this.profile.avatarUrl,
      current: this.profile.current,
      userName: this.profile.userName,
      uuid: this.profile.uuid,
      userId: this.profile.userId,
    };
    const result = await this.commonServices.saveUser(user);
    return result;
  }

  // #region IMPORT/EXPORTS
  export() {
    const exams = this.commonServices.getAllQuizs();
    this.copyClipboard(JSON.stringify(exams));
    this.downloadJSON(JSON.stringify(exams), 'collection-exam.json');
  }

  async import(evt: any) {
    var file = evt.target.files[0];
    const data = await this.readFile(file);

    try {
      const json = JSON.parse(data);
      // crear funcion que agrege el json de un solo paso
      // this.commonServices.saveQuiz(json);
      this.uiServices.notification('Plantilla importada exitosamente', { type: 'success', closeTimer: 5000 });
    } catch (error) {
      this.uiServices.notification('Error al importar plantilla', { type: 'warning', closeTimer: 5000 });
    }
  }

  downloadJSON(data: any, name: string) {
    try {
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      var downloadElement = document.createElement("a");
      downloadElement.href = url;
      downloadElement.download = name;

      document.body.appendChild(downloadElement);
      downloadElement.click();
      document.body.removeChild(downloadElement);
      URL.revokeObjectURL(url);
      this.uiServices.notification('Exportación exitosa', { type: 'info', closeTimer: 3000 });
    } catch (error: any) {
      this.uiServices.notification(error, { type: 'warning', closeTimer: 5000 });
    }
  }

  readFile(archivo: any): Promise<string> {
    return new Promise((resolve) => {
      var lector = new FileReader();

      lector.onload = (evento: any) => {
        var contenido = evento.target.result;
        resolve(contenido);
      };

      lector.onerror = (evento: any) => {
        console.warn("Error al leer el archivo:", evento.target.error);
        this.uiServices.notification('Error al leer el archivo', { type: 'warning', closeTimer: 5000 });
        resolve('');
      };

      lector.readAsText(archivo);
    });
  }

  copyClipboard(text: string) {
    var temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    var success = document.execCommand("copy");
    document.body.removeChild(temp);
    return success;
  }

  getKeysThemeProps(ThemeProps: ThemePropertiesDTO) {
    if (!ThemeProps) return null;
    const result = [];
    Object.keys(ThemeProps).map((key) => {
      if (!ThemeProps[key].includes('px')) {
        result.push({ name: key, value: ThemeProps[key], _style: `background: ${ThemeProps[key]};` });
      }
    });
    return result;
  }

  buildKeysThemeProps(props: Array<{ name: string, value: string }>) {
    const result = {};
    props.map((item) => {
      result[item.name] = item.value;
    });
    return result;
  }

  
  //#endregion

  
  //#endregion EVENTS

}
