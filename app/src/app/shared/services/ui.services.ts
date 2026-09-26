import { Injectable } from '@angular/core';
import { Utils } from '../data/utils/utils';
import { ThemeDTO } from '../data/entities/dtos';

@Injectable()
export class UiServices {
  _helper = new Utils();

  activeTimer: any;
  public _notification: any = {
    type: 'info',
    closeTimer: 3000,
    text: '',
    show: false,
    icon: ''
  };

  public _loader = {
    show: false,
  }

  constructor() { }

  ///#region NOTIFICATIONS
  public notification(text: string, options?: { type?: 'info' | 'success' | 'warning' | 'error' | 'full-IA' , closeTimer?: number }) {

    // Reset notification
    this._notification = {
      type: 'info',
      closeTimer: 3000,
      text: '',
      show: false,
      icon: ''
    };

    this._notification.text = this._helper.formatText(text);
    if (options) {
      this._notification.type = options?.type || 'info';
      this._notification.closeTimer = options?.closeTimer != undefined ? options?.closeTimer : 3000;
    }
    this._notification.show = true;
    this.onCloseTimer();
  }

  onCloseTimer() {
    if ((this._notification.closeTimer && this._notification.closeTimer > 0) && this._notification.show) {
      this.activeTimer = setTimeout(() => {
        this._notification.show = false;
      }, this._notification.closeTimer);
    } else {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  closeNotification() {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    this._notification.show = false;
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
