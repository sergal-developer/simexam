import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { AttemptDTO } from 'src/app/shared/data/entities/dtos';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'type-reading',
  templateUrl: './type-reading.html',
  encapsulation: ViewEncapsulation.None,
})
export class TypetReadingComponent implements OnInit {
  //#region INPUTS / OUTPUTS
  @Input() attempt: AttemptDTO = null;
  @Output() onChange = new EventEmitter();
  //#endregion INPUTS / OUTPUTS

  luicons = [];

  constructor(private commonServices: CommonServices,
    public uiServices: UiServices) { }

  async ngOnInit() {
    this.uiServices.showLoader(true);
  }
}
