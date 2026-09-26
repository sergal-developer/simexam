import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { UserDTO } from 'src/app/shared/data/entities/dtos';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { CommonServices } from 'src/app/shared/services/common.services';

@Component({
  selector: 'header',
  templateUrl: './header.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  @Input() mode: 'dashboard' | 'settings' | 'quiz' | 'text' | 'quizeditable' = 'dashboard';
  @Input() title: string = '';
  @Input() redirect: { 
    module: ScreenEnum, 
    action: string,
    id?: string,
    props?: object
  } = null;

  profile: UserDTO = {
    userId: null,
    current: false,
    userName: '',
    uuid: '',
    age: null,
    avatarUrl: null,
    avatarBody: null,
  };

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
    if(this.redirect) {
      this.commonServices.navigate(this.redirect.module, this.redirect.action, this.redirect.id, this.redirect.props );
      return;
    }
      
    this.commonServices.navigate('dashboard');
    return;
  }
}
