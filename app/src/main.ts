import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';

enableProdMode();

if (Capacitor.getPlatform() === 'web') {
  jeepSqlite(window);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
