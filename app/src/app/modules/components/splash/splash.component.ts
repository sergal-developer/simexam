import { Component, HostListener, OnInit, ViewEncapsulation, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PermissionsDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { CommonServices } from 'src/app/shared/services/common.services';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
import { AppStateStore } from 'src/app/shared/services/global.store.service';
import { UiServices } from 'src/app/shared/services/ui.services';


@Component({
  selector: 'splash',
  templateUrl: './splash.html',
  encapsulation: ViewEncapsulation.None,
})
export class SplashComponent implements OnInit {
  timeDelay = 6000;
  state = 'enter'

  isMenuOpen = false;
  luicons = [];

  constructor(private commonServices: CommonServices,
    private databaseService: DatabaseService,
    public uiServices: UiServices,
    private translate: TranslateService,
    public store: AppStateStore) { }

  async ngOnInit() {
    // before logo finish animation send event and analyze the structure of database and init app
    this.getPropsDevice();
  }

  async loadDatabaseStructure() {
    const structure = await this.databaseService.initialDatabase();
    if (!structure) {
      this.uiServices.notification("Error al establecer conexion SQL.", { type: 'error', closeTimer: 0 })
    }
    return structure ? true : false;
  }

  async getGlobalSettings(existDatabaseStructure = false) {
    let state = await this.store.getAll();

    if (!state.permissions) {
      let settings: SettingsDTO;
      settings = await this.commonServices.setupDefaultData(existDatabaseStructure);

      this.store.setLanguage(settings.language);
      this.store.setTheme(settings.theme);
      this.store.setPermissions((settings.permissions as PermissionsDTO));
      this.store.setLanguagesAvailable(settings._languages);
      this.store.setThemes(settings._themes);
      this.store.setColors(settings._colors);

      state = await this.store.getAll();
    }

    const availableLangs = state.languagesAvailable.map(lang => {
      return lang.value;
    });
    this.translate.addLangs(availableLangs);
    this.translate.setDefaultLang(state.language);
  }

  async checkInit(existDatabaseStructure = false) {
    let module = ScreenEnum.register;
    if (existDatabaseStructure) {
      let state = await this.store.getAll();
      if (!state.user) {
        const profile = await this.commonServices.getCurrentUser();
        state.user = profile;
        state = await this.store.getAll();
        console.log('state: ', state);
      }
      module = !state.user ? ScreenEnum.register : ScreenEnum.dashboard;
    }

    this.uiServices.showLoader(false);
    this.commonServices.navigate(module);
  }

  async onChange(evt: { event: string }) {
    const existStructure = await this.loadDatabaseStructure();
    this.getGlobalSettings(existStructure);
    this.checkInit(existStructure);
  }

  @HostListener('window:resize', ['\$event'])
  onResize() {
    this.getPropsDevice();
  }

  private getPropsDevice() {
    const props = this.commonServices.getDeviceProperties();
    const styles = this.commonServices.getRootVariableStyles();
    console.log('props: ', { styles, props });
  }
}
