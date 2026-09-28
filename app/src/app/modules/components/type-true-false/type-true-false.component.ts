import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';
 
@Component({
  selector: 'type-true-false',
  templateUrl: './type-true-false.html',
  encapsulation: ViewEncapsulation.None,
})
export class TypeTrueFalseComponent implements OnInit {
  luicons = [];

  constructor(private commonServices: CommonServices,
    public uiServices: UiServices) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
  }
}
