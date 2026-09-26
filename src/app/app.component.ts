import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Fullscreen } from '@boengli/capacitor-fullscreen';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Platform } from '@ionic/angular';

@Component({
  selector : 'exam-app',
  template : `<router-outlet></router-outlet>`,
  encapsulation : ViewEncapsulation.None
})
export class AppComponent implements OnInit{
  constructor(public platform: Platform
   ) {}

  async ngOnInit() {
    this.activeFullscreen();
    this.platform.ready().then(async () => {
      if (this.platform.is('capacitor')) {
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
        } catch (error) {
          console.error('Error al bloquear la orientación:', error);
        }
      }
    });
  }

  async activeFullscreen() {
    try {
      await Fullscreen?.activateImmersiveMode();
    } catch (error) {
      // console.error('Error activando fullscreen:', error);
    }
  }

  _showLogComponent = false;
  showLogs() {
    this._showLogComponent = !this._showLogComponent;
  }
}

