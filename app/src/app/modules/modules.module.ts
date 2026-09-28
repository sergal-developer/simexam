import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonServices } from 'src/app/shared/services/common.services';
import { ComponentsModule } from '../shared/components/components.module';
import { LogComponent } from '../shared/components/log/log.component';
import { ModulePackage } from '../shared/data/interfaces/interfaces';
import { EventBusService } from '../shared/data/utils/event.services';
import { UiServices } from '../shared/services/ui.services';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DbClientComponent } from './components/dbclient/dbclient.component';
import { HeaderComponent } from './components/header/header.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { QuizEditableComponent } from './components/quiz-editable/quiz-editable.component';
import { QuizSelectorComponent } from './components/quiz-selector/quiz-selector.component';
import { QuizViewComponent } from './components/quiz-view/quiz-view.component';
import { RegisterComponent } from './components/register/register.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SplashComponent } from './components/splash/splash.component';
import { ModuleComponent } from './modules.component';
import { TypeMathQuestComponent } from './components/type-math-quest/type-math-quest.component';
import { TypePopularityComponent } from './components/type-popularity/type-popularity.component';
import { TypetReadingComponent } from './components/type-reading/type-reading.component';
import { TypeSimpleComponent } from './components/type-simple/type-simple.component';
import { TypetTriviaComponent } from './components/type-trivia/type-trivia.component';
import { TypeTrueFalseComponent } from './components/type-true-false/type-true-false.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ComponentsModule,

    RouterModule.forChild([
      {
        path: '',
        component: ModuleComponent,
      },
    ]),
  ],
  declarations: [
    ModuleComponent,
    DashboardComponent,
    HeaderComponent,
    NavbarComponent,
    QuizViewComponent,
    TypeMathQuestComponent,
    TypePopularityComponent,
    TypetReadingComponent,
    TypeSimpleComponent,
    TypetTriviaComponent,
    TypeTrueFalseComponent,
    QuizEditableComponent,
    QuizSelectorComponent,
    RegisterComponent,
    SettingsComponent,
    SplashComponent,
    LogComponent,
    DbClientComponent,
  ],
  exports: [
    ModuleComponent,
    DashboardComponent,
    HeaderComponent,
    NavbarComponent,
    QuizViewComponent,
    TypeMathQuestComponent,
    TypePopularityComponent,
    TypetReadingComponent,
    TypeSimpleComponent,
    TypetTriviaComponent,
    TypeTrueFalseComponent,
    QuizEditableComponent,
    QuizSelectorComponent,
    RegisterComponent,
    SettingsComponent,
    SplashComponent,
    LogComponent,
    DbClientComponent,
    
  ],
  providers: [EventBusService, CommonServices, UiServices],
})
export class MainModule {}

export let modulePackage: ModulePackage = {
  modules: [ MainModule ],
  routes: [
    { path: '', component: SplashComponent },
    { path: ':module', component: ModuleComponent },
    { path: ':module/:submodule', component: ModuleComponent }
  ]
};
