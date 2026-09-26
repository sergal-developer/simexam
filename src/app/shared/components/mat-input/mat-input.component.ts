import { Component, EventEmitter, Input, OnInit, Output, Self, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
    selector: 'mat-input',
    templateUrl: './mat-input.html',
    styleUrls: ['./mat-input.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class MatInputComponent implements OnInit, ControlValueAccessor {
    //#region INPUT/OUTPUT
    @Input() formName: string = '';
    @Input() title: string = '';
    @Input() mesageError: string = '';
    @Input() type: string = 'text';
    @Input() maxlength: number = -1;
    @Input() multiline: boolean = false;
    @Output() onChange = new EventEmitter();
    //#endregion

    //#region INTERNAL-PROPERTIES
    //#endregion

    //#region CONSTRUCTOR
    constructor(@Self() public ngControl: NgControl) {
        this.ngControl.valueAccessor = this;
    }
    //#endregion

    //#region LIFECICLE
    ngOnInit(): void {
    }

    // #region ControlValueAccessor functions interface
    writeValue(obj: any): void { }
    registerOnChange(fn: any): void { }
    registerOnTouched(fn: any): void { }
    // #endregion

    //#endregion

    //#region EVENTS
    valueChange(event) {
        this.onChange.emit({ control: this.formName || this.title, value: this.ngControl.value });
    }

    valueChangeTextarea(event) {
        this.valueChange(event);

        // const textarea = event.target as HTMLTextAreaElement;
        // textarea.style.height = 'auto';
        // textarea.style.height = `${textarea.scrollHeight}px`;
    }

    onClickInput(event) {
        const input = event.currentTarget as HTMLInputElement;
        input.select();
    }
    //#endregion
}
