import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Self, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
    selector: 'mat-select',
    templateUrl: './mat-select.html',
    styleUrls: ['./mat-select.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class MatSelectComponent<T = any> implements OnInit, ControlValueAccessor {
    //#region INPUT/OUTPUT
    @Input() formName: string = '';
    @Input() title: string = '';
    @Input() mesageError: string = '';
    @Input() options: T[] = [];
    @Input() displayProperty = 'name';
    @Input() valueProperty = '';
    @Input() placeholder = '';
    @Input() disabled = false;
    @Input() notFoundText = 'No se encontraron resultados';
    @Output() onChange = new EventEmitter();
    @Output() selectionChange = new EventEmitter<T>();
    //#endregion

    //#region INTERNAL-PROPERTIES
    isOpen = false;
    highlightedIndex = -1;
    value: any = null;
    private propagateChange: (value: any) => void = () => { };
    private propagateTouched: () => void = () => { };
    //#endregion

    //#region CONSTRUCTOR
    constructor(
        @Self() public ngControl: NgControl,
        private elementRef: ElementRef) {
        this.ngControl.valueAccessor = this;
    }
    //#endregion

    //#region LIFECICLE
    ngOnInit(): void {
    }

    // #region ControlValueAccessor functions interface
    writeValue(obj: any): void {
        this.value = obj;
        this.highlightedIndex = -1;
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.propagateTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
    // #endregion

    //#endregion

    //#region GETTERS
    get control() {
        return this.ngControl.control;
    }

    get isDisabled(): boolean {
        return this.disabled || !!this.control?.disabled;
    }

    get isEmpty(): boolean {
        return this.value == null || this.value === '';
    }

    get selectedOption(): T | null {
        if (this.value == null) {
            return null;
        }

        for (const option of this.options) {
            if (this.getOptionValue(option) === this.value) {
                return option;
            }
        }

        return null;
    }

    get triggerText(): string {
        const option = this.selectedOption;

        return option != null ? this.getDisplayValue(option) : (this.placeholder || '');
    }
    //#endregion

    //#region METHODS
    /**
     * Obtiene el texto que se mostrará para una opción.
     */
    getDisplayValue(option: T): string {
        if (option == null) {
            return '';
        }

        if (typeof option !== 'object') {
            return String(option);
        }

        const value = (option as any)[this.displayProperty];

        return value != null ? String(value) : '';
    }

    /**
     * Obtiene el valor de una opción.
     */
    getOptionValue(option: T): any {
        if (option == null) {
            return option;
        }

        if (this.valueProperty && typeof option === 'object') {
            return (option as any)[this.valueProperty];
        }

        return option;
    }

    isSelected(option: T): boolean {
        return this.getOptionValue(option) === this.value;
    }

    /**
     * Abre el dropdown.
     */
    open(): void {
        if (this.isDisabled || this.isOpen) {
            return;
        }

        this.isOpen = true;
        this.highlightedIndex = -1;
    }

    /**
     * Cierra el dropdown.
     */
    close(): void {
        this.isOpen = false;
        this.highlightedIndex = -1;
    }

    /**
     * Alterna el dropdown.
     */
    toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Selecciona una opción.
     */
    selectOption(option: T): void {
        if (this.isDisabled || option == null) {
            return;
        }

        this.value = this.getOptionValue(option);
        this.propagateChange(this.value);
        this.propagateTouched();
        this.close();

        this.onChange.emit({ control: this.formName || this.title, value: this.value });
        this.selectionChange.emit(option);
    }

    /**
     * Maneja teclado.
     */
    onKeyDown(event: KeyboardEvent): void {
        if (this.isDisabled) {
            return;
        }

        switch (event.key) {

            case 'ArrowDown':
                event.preventDefault();

                if (!this.isOpen) {
                    this.open();
                    this.highlightedIndex = 0;
                } else {
                    this.moveHighlight(1);
                }
                break;

            case 'ArrowUp':
                event.preventDefault();

                if (!this.isOpen) {
                    this.open();
                    this.highlightedIndex = this.options.length - 1;
                } else {
                    this.moveHighlight(-1);
                }
                break;

            case 'Enter':
                event.preventDefault();

                if (this.isOpen) {
                    if (
                        this.highlightedIndex >= 0 &&
                        this.highlightedIndex < this.options.length
                    ) {
                        this.selectOption(this.options[this.highlightedIndex]);
                    }
                } else {
                    this.open();
                }
                break;

            case 'Escape':
                event.preventDefault();

                this.close();
                break;

            case 'Tab':
                this.close();
                break;
        }
    }

    /**
     * Se ejecuta al perder el foco.
     */
    onBlur(): void {
        this.close();
        this.propagateTouched();
    }

    /**
     * Navega entre las opciones.
     */
    private moveHighlight(direction: number): void {
        if (!this.options.length) {
            this.highlightedIndex = -1;
            return;
        }

        let newIndex = this.highlightedIndex + direction;

        if (newIndex < 0) {
            newIndex = this.options.length - 1;
        }

        if (newIndex >= this.options.length) {
            newIndex = 0;
        }

        this.highlightedIndex = newIndex;
    }
    //#endregion

    //#region EVENTS
    /**
     * Cierra el dropdown cuando se hace click fuera.
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as Node;

        if (!this.elementRef.nativeElement.contains(target)) {
            this.close();
        }
    }
    //#endregion
}
