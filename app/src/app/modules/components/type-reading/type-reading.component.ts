import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { icons } from 'lucide';
import { AttemptDTO, normalizeAttemptDTO } from 'src/app/shared/data/entities/dtos';
import { UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
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
  
    //#region INTERNAL
    index = 0;
    luIcon = {
      language: icons.Globe,
      user: icons.UserRound,
      avatar: icons.SquareUserRound,
      left: icons.ChevronLeft,
      right: icons.ChevronRight,
      register: icons.UserPlus,
      back: icons.ArrowLeft,
      save: icons.SaveAll,
    };
    //#endregion INTERNAL
  
    //#region LIFECICLE
    constructor(private commonServices: CommonServices,
      public uiServices: UiServices) { }
  
    async ngOnInit() {
      this.uiServices.showLoader(true);
    }
    //#endregion LIFECICLE
  
    //#region DATA
    private async updateAttemptPosition(options: { updateData: boolean, finish: boolean }) {
      console.log('idx: ', this.index);
      this.attempt.updatedDate = new Date().getTime();
      this.updateAttempt(options.updateData);
    }
  
    private updateAttempt(savedata: boolean) {
      const event: UITypeStatus = {
        index: this.index,
        attempt: normalizeAttemptDTO(JSON.parse(JSON.stringify(this.attempt))),
        savedata: savedata,
      }
      this.onChange.emit(event);
    }
    //#endregion DATA
  
    //#region EVENTS
    prev() {
      this.index--;
      this.updateAttemptPosition({ finish: false, updateData: false });
    }
    next() {
      this.index++;
      this.updateAttemptPosition({ finish: false, updateData: false });
    }
    finish() {
      this.updateAttemptPosition({ finish: true, updateData: true });
    }
    //#endregion EVENTS
  
    //#region CONVERTERS
    //#endregion CONVERTERS
  
}
