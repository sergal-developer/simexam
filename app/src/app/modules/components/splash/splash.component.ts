import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { icons } from "lucide";
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { CommonServices } from 'src/app/shared/services/common.services';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
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
    public uiServices: UiServices) { }

  async ngOnInit() {
    // this.uiServices.showLoader(true);

    // before logo finish animation send event and analyze the structure of database and init app
  }

  async loadDatabaseStructure() {
    const structure = await this.databaseService.initialDatabase();
    if (!structure) {
      this.uiServices.notification("Error al establecer conexion SQL.", { type: 'error', closeTimer: 0 })
    }
    return structure ? true : false;
  }

  async checkInit(existDatabaseStructure = false) {
    let module = ScreenEnum.register;
    if (existDatabaseStructure) {
      const profile = await this.commonServices.getCurrentUser();
      module = !profile ? ScreenEnum.register : ScreenEnum.dashboard;
    }
    this.uiServices.showLoader(false);


    this.commonServices.navigate(module);
  }

  async onChange(evt: { event: string }) {
    const existStructure = await this.loadDatabaseStructure();
    this.checkInit(existStructure);
  }
}
