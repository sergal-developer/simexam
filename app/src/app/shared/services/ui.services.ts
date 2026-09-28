import { Injectable } from '@angular/core';
import { Utils } from '../data/utils/utils';
import { ThemeDTO } from '../data/entities/dtos';

@Injectable()
export class UiServices {
  _helper = new Utils();

  activeTimer: any;
  public _notification: any = {
    type: 'info',
    text: '',
    show: false,
    icon: '',
    action: { text: 'action', event: null },
    closeAction: { closeTimer: 3000, show: true },
  };

  public _loader = {
    show: false,
  }

  constructor() { }

  ///#region NOTIFICATIONS
  public notification(text: string, 
    options?: { 
      type?: 'info' | 'success' | 'warning' | 'error' | 'full-IA' , 
      closeTimer?: number,
      closeShow?: boolean,
      actionText?: string,
      actionEvent?: Function
    }) {
    // Reset notification
    this._notification = {
      type: 'info',
      text: '',
      show: false,
      icon: '',
      action: { text: 'action', event: null },
      closeAction: { closeTimer: 3000, show: true }
    };

    this._notification.text = this._helper.formatText(text);
    if (options) {
      this._notification.type = options?.type || 'info';
      this._notification.closeAction.closeTimer = options?.closeTimer != undefined ? options?.closeTimer : 3000;
      this._notification.closeAction.show = options?.closeShow != undefined ? options?.closeShow : true;
      this._notification.action.text = options?.actionText != undefined ? options?.actionText : 'action';
      this._notification.action.event = options?.actionEvent != undefined ? options?.actionEvent : null;
    }

    this._notification.show = true;
    this.onCloseTimer();
  }

  onCloseTimer() {
    if ((this._notification.closeAction.closeTimer && this._notification.closeAction.closeTimer > 0) && this._notification.show) {
      this.activeTimer = setTimeout(() => {
        this._notification.show = false;
      }, this._notification.closeAction.closeTimer);
    } else {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  public closeNotification() {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    this._notification.show = false;
  }

  emitAction() {
    if(this._notification.action.event) {
      this._notification.action.event();
    }
  }

  applyTheme(theme: ThemeDTO) {
    let root = document.documentElement;
    if(root) {
      const keys = Object.keys(theme.content);
      keys.map((key) => {
        root.style.setProperty(`--${key}`, theme.content[key]);
      });
    }
  }

  applyThemeKey(key: string, value: any) {
    let root = document.documentElement;
    if(root) {
        root.style.setProperty(`--${key}`, value);
    }
  }

  getThemeKey(key: string): any {
    let root = document.documentElement;
    if(root) {
        return root.style.getPropertyValue(`--${key}`);
    }
    return null;
  }

  public showLoader(show: boolean) {
    this._loader.show = show;
  }
  //#endregion
}
