import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { UserDTO } from 'src/app/shared/data/entities/dtos';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { CommonServices } from 'src/app/shared/services/common.services';

@Component({
  selector: 'navbar-component',
  templateUrl: './navbar.html',
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit {
  @Input() mode: 'dashboard' | 'settings' | 'quiz' | 'result' | 'quizeditable' = 'dashboard';
  @Input() title: string = '';
  @Input() redirect: {
    module: ScreenEnum,
    action: string,
    id?: string,
    props?: object
  } = null;
  @Output() onAction = new EventEmitter();

  profile: UserDTO = {
    userId: null,
    current: false,
    userName: '',
    uuid: '',
    age: null,
    avatarUrl: null,
    avatarBody: null,
  };

  luIcon = {
    language: icons.Globe,
    empty: icons.SquareDashedKanban,
    avatar: icons.SquareUserRound,
    return: icons.ChevronLeft,
    add: icons.CirclePlus,
    settings: icons.Settings
  }

  constructor(private commonServices: CommonServices) { }

  ngOnInit() {
    this.getCurrentProfile();
  }

  async getCurrentProfile() {
    this.profile = await this.commonServices.getCurrentUser();
  }

  gotoSettings() {
    this.commonServices.navigate('settings');
  }

  gotoDashboard() {
    if (this.redirect) {
      this.commonServices.navigate(this.redirect.module, this.redirect.action, this.redirect.id, this.redirect.props);
      return;
    }

    this.commonServices.navigate('dashboard');
    return;
  }


  onNewQuiz() {
    this.valueChange('create', 'quiz');
  }

  valueChange(event, value) {
        this.onAction.emit({ event: event, value: value });
  }



}
