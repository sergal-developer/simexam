import { Routes } from '@angular/router';

export interface ModulePackage {
  modules: any[];
  routes: Routes;
}

export interface EventData {
  name: string;
  value: any;
  data?: any;
  component?: any;
}
