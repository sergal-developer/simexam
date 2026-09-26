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
    this.uiServices.showLoader(true);

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

  loadLuIcons() {
    this.luicons = [
       icons.AArrowDown,
       icons.AArrowUp,
       icons.Activity,
       icons.ALargeSmall,
       icons.Asterisk,
       icons.Astroid,
       icons.Atom,
       icons.AtSign,
       icons.Award,
       icons.BadgeInfo,
       icons.BadgeQuestionMark,
       icons.BetweenHorizonalEnd,
       icons.BetweenHorizonalStart,
       icons.Brain,
       icons.Calendar,
       icons.CalendarCog,
       icons.ChartNetwork,
       icons.ChevronLeft,
       icons.ChevronRight,
       icons.CircleAlert,
       icons.CircleCheckBig,
       icons.Clock,
       icons.Cog,
       icons.Component,
       icons.DatabaseSearch,
       icons.DatabaseX,
       icons.Flame,
       icons.Globe,
       icons.GraduationCap,
       icons.Hash,
       icons.HatGlasses,
       icons.Heading1,
       icons.Heading6,
       icons.Heart,
       icons.Highlighter,
       icons.Info,
       icons.KeySquare,
       icons.Link,
       icons.ListChecks,
       icons.Medal,
       icons.Moon,
       icons.NotebookPen,
       icons.PencilLine,
       icons.PencilSparkles,
       icons.Podium,
       icons.Presentation,
       icons.Quote,
       icons.RectangleEllipsis,
       icons.Save,
       icons.SaveAll,
       icons.Search,
       icons.SearchAlert,
       icons.Server,
       icons.ServerCog,
       icons.ServerCrash,
       icons.ServerOff,
       icons.ServerPlus,
       icons.Settings,
       icons.Settings2,
       icons.Shield,
       icons.Snail,
       icons.Sparkles,
       icons.SquareAsterisk,
       icons.Sun,
       icons.SunMoon,
       icons.Swords,
       icons.Tag,
       icons.TagPlus,
       icons.ToggleLeft,
       icons.ToggleRight,
       icons.Trash,
       icons.Trash2,
       icons.TriangleAlert,
       icons.Unlink,
       icons.UserKey,
       icons.Zap,
    ];
  }
}
