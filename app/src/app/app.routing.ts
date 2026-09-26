import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { modulePackage } from './modules/modules.module';
import { NotFoundComponent } from './pages/notFound/notFound.component';


const appRoutes: Routes = [
  // ...MainPackage.routes,
  ...modulePackage.routes,
  //Wild Card Route for 404 request
  { path: '**', pathMatch: 'full', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutes { }
