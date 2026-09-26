import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'modal',
  templateUrl: './modal.html',
  styleUrls: ['./modal.scss'],
  encapsulation : ViewEncapsulation.None,
})
export class ModalComponent implements OnInit {
  //#region INPUT/OUTPUT
  @Input() id: String = 'modal';
  @Input() title: string = 'modal';
  @Input() size = 'medium';
  @Input() direction = 'center';
  @Input() closeOnClickOverlap = true;
  @Input() canClose = true;
  @Input() customClass = '';
  @Output() afterChange: EventEmitter<any> = new EventEmitter();
  //#endregion

  //#region INTERNAL-PROPERTIES
  protected _open: any;
  @Input()
  get open(): any {
      return this._open;
  }
  @Output() openChange = new EventEmitter();
  set open(v: any) {
      if (v !== this._open) {
          this._open = v;
          this.openChange.emit(this._open);
      }
  }

  //#region LIFECYCLE
  constructor() { }

  ngOnInit() {
  }

  //#endregion

  //#region EVENTS
  close(evt?: any) { 
    evt?.preventDefault();

    if(!this.canClose) {
      return;
    }

    this.open = false;
    // this.afterChange.emit( new EmitResponse('PANEL', { action: 'close' }));
  }

  closeInOverlap() {
    if ( this.closeOnClickOverlap ) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(evt: KeyboardEvent) {
      this.close();
    }
  //#endregion
}
