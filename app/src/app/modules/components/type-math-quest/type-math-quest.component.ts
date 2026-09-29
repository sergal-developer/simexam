import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { AttemptDTO } from 'src/app/shared/data/entities/dtos';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'type-math-quest',
  templateUrl: './type-math-quest.html',
  encapsulation: ViewEncapsulation.None,
})
export class TypeMathQuestComponent implements OnInit {
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
