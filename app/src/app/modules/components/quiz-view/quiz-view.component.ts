import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AttemptDTO, normalizeAttemptDTO, QuestionaryDTO } from 'src/app/shared/data/entities/dtos';
import { UIMainStates, UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { AttemptState, ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'quiz-view',
  templateUrl: './quiz-view.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizViewComponent implements OnInit {
  @Input() id: number = null;
  @Input() review: boolean = false;
  @Output() onChange = new EventEmitter();

  //#region INTERNAL
  attempt: AttemptDTO = null;
  readonly = false;
  index = 0;
  progress = 0;
  progresStyle = '';
  onLoading = false;

  timerStart = null;
  timerEnd = null;
  zoomlevel = '100%';
  zoomlevelLabel = '1.1x';
  settings = null;
  redirect = { module: ScreenEnum.dashboard, action: '' };
  isAttemptCompleted = false;
  isAttemptReview = false;

  luIcon = {
    back: icons.ArrowLeft,
  }
  //#endregion INTERNAL

  //#region LIFECYCLE
  constructor(private commonServices: CommonServices,
    private uiServices: UiServices
  ) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.settings = await this.commonServices.getSettingCompleteById(0);

    await this.getData();

    setTimeout(() => {
      this.zoomlevel = this.uiServices.getThemeKey('zoomLevel');
      this.zoomlevelLabel = this.getZoomLevel(this.zoomlevel);
      this.uiServices.showLoader(false);
    }, 500);
  }
  //#endregion LIFECYCLE

  //#region DATA
  async getData() {
    if (this.id) {
      this.id = JSON.parse(JSON.stringify(this.id));
      const attempt = await this.getAttemptData(this.id);

      if (!attempt) {
        return false;
      }

      this.attempt = attempt;

      this.isAttemptCompleted = this.attempt.state == AttemptState.completed;
      console.log('this.isAttemptCompleted: ', this.isAttemptCompleted);
      this.isAttemptReview = false;

      this.redirect.module = ScreenEnum.dashboard;
      this.redirect.action = `${this.attempt.questionaryId}`;
      this.updateProgressBar();
    }
    return true;
  }

  private async getAttemptData(id: number): Promise<AttemptDTO> {
    let attempt: AttemptDTO = await this.commonServices.getAttemptById(id);
    if (!attempt) {
      this.uiServices.notification("Ocurrio un error al obterner la prueba", { type: 'error', closeTimer: 0 })
    }
    return attempt || null;
  }

  private async saveAttempt(attempt: AttemptDTO): Promise<AttemptDTO> {
    // unlink reference of object
    const _attempt = JSON.parse(JSON.stringify(attempt));
    let response: AttemptDTO = await this.commonServices.saveAttempt(_attempt);
    if (!response) {
      this.uiServices.notification("Ocurrio un error al salvar los datos", { type: 'error', closeTimer: 0 })
    }
    return response || null;
  }
  //#endregion DATA

  //#region EVENTS
  gotoDashboard() {
    // this.commonServices.navigate('dashboard');
    this.commonServices.navigate('dashboard', this.attempt.questionaryId.toString());
  }

  updateZoom() {
    const currentLevel = parseInt(this.zoomlevel.replace('%', ''));
    const increment = 10;
    let lavel = currentLevel <= 160 ? currentLevel + increment :
      currentLevel >= 160 ? 70 + increment : 100;

    this.zoomlevel = `${lavel}%`;
    this.uiServices.applyThemeKey('zoomLevel', this.zoomlevel);
    this.zoomlevelLabel = this.getZoomLevel(this.zoomlevel);

    // this.uiServices.applyTheme(this.settings.themeProps[this.settings.theme.toLowerCase()])
  }

  setZoom() {
    this.uiServices.applyThemeKey('zoomLevel', this.zoomlevel);
  }

  updateProgressBar() {
    this.progress = (100 / (this.attempt.questions.length)) * (this.index + 1);
    this.progresStyle = `width: ${this.progress}%`;
  }

  async onChangeChildren(event: UITypeStatus | UIMainStates) {
    console.log('event: ', event);
    if ((event as UIMainStates).action) {
      const evt: UIMainStates = (event as UIMainStates);
      this.onChange.emit({ action: evt.action, value: evt.substate });

      this.isAttemptCompleted = evt.substate == 'secondary' && (evt.attemptStatus && evt.attemptStatus == AttemptState.completed);
      this.isAttemptReview = evt.substate == 'primary' && (evt.attemptStatus && evt.attemptStatus == AttemptState.completed);

      return;
    }

    if ((event as UITypeStatus).attempt) {
      const evt: UITypeStatus = (event as UITypeStatus);

      if (this.onLoading) {
        return;
      }

      this.onLoading = true;
      this.index = evt.index;

      if (evt.savedata) {
        const response = await this.saveAttempt(evt.attempt);
        console.log('attempt.saved: ', response);
        this.attempt = response;
      } else {
        this.attempt = evt.attempt;
      }

      this.onLoading = false;
      this.updateProgressBar();
      return;
    }

    this.updateProgressBar();
  }
  //#endregion EVENTS

  //#region CONVERTERS
  getZoomLevel(zoomLevel: string) {
    zoomLevel = zoomLevel || "100%";
    const num = parseInt(zoomLevel.replace('%', ''));
    return `${num / 100}x`;
  }
  //#endregion CONVERTERS
}
