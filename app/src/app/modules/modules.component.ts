import { AfterViewInit, Component, HostListener, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IconNode, icons } from 'lucide';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { MorphIconComponent } from '../shared/components/morph-icon/morph-icon.component';
import { PermissionsDTO, SettingsDTO, ThemeDTO } from '../shared/data/entities/dtos';
import { CommonServices } from '../shared/services/common.services';
import { DatabaseService } from '../shared/services/database/sql.database.service';
import { UiServices } from '../shared/services/ui.services';
import { AppStateStore } from '../shared/services/global.store.service';
import { UxUtils } from '../shared/data/utils/uxUtils';

@Component({
  selector: 'modules',
  templateUrl: './modules.html',
  encapsulation: ViewEncapsulation.None,
})
export class ModuleComponent implements OnInit, AfterViewInit {
  browserLangs: string[] = [];
  currentLang = '';

  _screen = ScreenEnum;
  screen: ScreenEnum;

  module: string;
  submodule: string;
  type: string;
  uistate = '';
  uisubstate = '';
  screenwidth = 0;
  screenheight = 0;

  luIcon = {
    badge: icons.Badge
  }
  uxUtils = new UxUtils();
  loadingGlobalData = false;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    public uiServices: UiServices,
    private commonServices: CommonServices,
    private translate: TranslateService,
    private services: DatabaseService,
    public store: AppStateStore) {

    this._router.events.subscribe(async (event) => {
      if (event instanceof NavigationEnd) {
        this.module = this._activatedRoute.snapshot.paramMap.get('module');
        if (this.module) {
          this.screen = this._screen[this.module];
        }

        this.type = this._activatedRoute.snapshot.queryParamMap.get('type');
        this.submodule = this._activatedRoute.snapshot.queryParamMap.get('action');

        await this.uxUtils.wait(500);
        this.uistate = `__${this.screen}`;
        this.uisubstate = '';
      }
    });
  }

  async ngOnInit() {
    const existStructure = await this.loadDatabaseStructure();
    this.getGlobalSettings(existStructure);
  }

  async ngAfterViewInit() {
    this.getPropsDevice();
  }

  async loadDatabaseStructure() {
    const structure = await this.services.initialDatabase();
    if (!structure) {
      this.uiServices.notification("Error al establecer conexion SQL.", { type: 'error', closeTimer: 0 })
    }
    return structure ? true : false;
  }

  async getGlobalSettings(existDatabaseStructure = false) {
    this.loadingGlobalData = false;
    this.uiServices.showLoader(true);

    let state = await this.store.getAll();
    if (!state.permissions) {
      let settings: SettingsDTO;
      settings = await this.commonServices.setupDefaultData(existDatabaseStructure);
      const profile = await this.commonServices.getCurrentUser();

      this.store.setLanguage(settings.language);
      this.store.setTheme(settings.theme);
      this.store.setPermissions((settings.permissions as PermissionsDTO));
      this.store.setLanguagesAvailable(settings._languages);
      this.store.setThemes(settings._themes);
      this.store.setColors(settings._colors);
      this.store.setUser(profile);

      state = await this.store.getAll();
    }

    const availableLangs = state.languagesAvailable.map(lang => {
      return lang.value;
    });
    this.translate.addLangs(availableLangs);
    this.translate.setDefaultLang(state.language);

    this.loadingGlobalData = true;
    this.uiServices.showLoader(false);
  }

  onChangeUI(event) {
    this.uisubstate = event.value;
  }

  applyCurrentTheme(setting: SettingsDTO) {
    setting._themes.map((x: ThemeDTO) => x.content['zoomLevel'] = '100%');
    const theme = setting._themes.find(x => x.id == setting.theme);
    if (theme) {
      this.uiServices.applyTheme(theme);
    }
  }

  private getPropsDevice() {
    const props = this.commonServices.getDeviceProperties();
    console.log('props: ', props);
  }

  @HostListener('window:resize', ['\$event'])
  onResize() {
    this.getPropsDevice();
  }

  showSQL() {
    this.commonServices.navigate('dbclient');
  }
}
