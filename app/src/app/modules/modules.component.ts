import { AfterViewInit, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { SettingsDTO, ThemeDTO } from '../shared/data/entities/dtos';
import { CommonServices } from '../shared/services/common.services';
import { DatabaseService } from '../shared/services/database/sql.database.service';
import { UiServices } from '../shared/services/ui.services';

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
  uistate = '';
  uisubstate = '';
  screenwidth = 0;
  screenheight = 0;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    public uiServices: UiServices,
    private commonServices: CommonServices,
    private translate: TranslateService,
    private services: DatabaseService) {

    this._router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.module = this._activatedRoute.snapshot.paramMap.get('module');
        if (this.module) {
          this.screen = this._screen[this.module];
        }

        this.submodule = this._activatedRoute.snapshot.queryParamMap.get('action');

        setTimeout(() => {
          this.uistate = `__${this.screen}`;
          this.uisubstate = '';
        }, 500);
      }
    });
  }

  async ngOnInit() {
    this.getPropsScreen();
    const existStructure = await this.loadDatabaseStructure();
    this.setupDefaultData(existStructure);
  }

  async ngAfterViewInit() {
  }

  async loadDatabaseStructure() {
    const structure = await this.services.initialDatabase();
    if (!structure) {
      this.uiServices.notification("Error al establecer conexion SQL.", { type: 'error', closeTimer: 0 })
    }
    return structure ? true : false;
  }

  async setupDefaultData(existDatabaseStructure = false) {
    let settings: SettingsDTO;
    settings = await this.commonServices.setupDefaultData(existDatabaseStructure);

    const availableLangs = settings._languages.map(lang => {
      return lang.value;
    });

    this.translate.addLangs(availableLangs);
    this.translate.setDefaultLang(settings.language);
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

  getPropsScreen() {
    this.screenwidth = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

    this.screenheight = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;
  }

  showSQL() {
      this.commonServices.navigate('dbclient');
  }
}
