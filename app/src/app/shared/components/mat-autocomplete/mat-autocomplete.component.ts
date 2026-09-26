import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Self, ViewChild, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
    selector: 'mat-autocomplete',
    templateUrl: './mat-autocomplete.html',
    styleUrls: ['./mat-autocomplete.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class MatAutocompleteComponent<T = any> implements OnInit, ControlValueAccessor {
    //#region INPUT/OUTPUT

    @Input() options: T[] = [];
    @Input() displayProperty = 'name';
    @Input() placeholder = 'Buscar...';
    @Input() disabled = false;
    @Input() minChars = 0;
    @Input() showAllOnEmpty = true;
    @Output() selected = new EventEmitter<T>();
    @Output() searchChange = new EventEmitter<string>();
    //#endregion

    //#region INTERNAL-PROPERTIES
    @ViewChild('inputElement')
    inputElement!: ElementRef<HTMLInputElement>;
    isOpen = false;
    searchText = '';
    filteredOptions: any[] = [];
    highlightedIndex = -1;
    //#endregion

    //#region CONSTRUCTOR
    constructor(
        @Self() public ngControl: NgControl,
        private elementRef: ElementRef) {
        this.ngControl.valueAccessor = this;
    }

    ngOnInit(): void {
        this.filteredOptions = [...this.options];
    }

    ngOnChanges(): void {
        this.filterOptions();
    }

    // #region ControlValueAccessor functions interface
    writeValue(obj: any): void { }
    registerOnChange(fn: any): void { }
    registerOnTouched(fn: any): void { }
    // #endregion

    /**
     * Obtiene el texto que se mostrará para una opción.
     */
    getDisplayValue(option: T): string {
        if (option == null) {
            return '';
        }

        const value = (option as any)[this.displayProperty];

        return value != null ? String(value) : '';
    }

    /**
     * Se ejecuta cuando cambia el texto del input.
     */
    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;

        this.searchText = input.value;

        this.searchChange.emit(this.searchText);

        this.highlightedIndex = -1;

        this.filterOptions();

        if (!this.disabled) {
            this.isOpen = true;
        }
    }

    /**
     * Filtra las opciones.
     */
    private filterOptions(): void {
        const search = this.searchText
            .trim()
            .toLowerCase();

        if (
            search.length < this.minChars
        ) {
            this.filteredOptions = this.showAllOnEmpty
                ? [...this.options]
                : [];

            return;
        }

        if (!search && this.showAllOnEmpty) {
            this.filteredOptions = [...this.options];
            return;
        }

        this.filteredOptions = this.options.filter(option => {
            const text = this.getDisplayValue(option)
                .toLowerCase();

            return text.includes(search);
        });
    }

    /**
     * Abre el dropdown.
     */
    open(): void {
        if (this.disabled) {
            return;
        }

        this.filterOptions();

        this.isOpen = true;
    }

    /**
     * Selecciona una opción.
     */
    selectOption(option: T): void {
        if (this.disabled) {
            return;
        }

        this.searchText = this.getDisplayValue(option);

        this.isOpen = false;
        this.highlightedIndex = -1;

        this.selected.emit(option);
    }

    /**
     * Maneja teclado.
     */
    onKeyDown(event: KeyboardEvent): void {
        if (this.disabled) {
            return;
        }

        switch (event.key) {

            case 'ArrowDown':
                event.preventDefault();

                if (!this.isOpen) {
                    this.open();
                    return;
                }

                this.moveHighlight(1);
                break;

            case 'ArrowUp':
                event.preventDefault();

                if (!this.isOpen) {
                    this.open();
                    return;
                }

                this.moveHighlight(-1);
                break;

            case 'Enter':
                event.preventDefault();

                if (
                    this.isOpen &&
                    this.highlightedIndex >= 0 &&
                    this.highlightedIndex < this.filteredOptions.length
                ) {
                    this.selectOption(
                        this.filteredOptions[this.highlightedIndex]
                    );
                }

                break;

            case 'Escape':
                event.preventDefault();

                this.isOpen = false;
                this.highlightedIndex = -1;

                break;
        }
    }

    /**
     * Navega entre las opciones.
     */
    private moveHighlight(direction: number): void {
        if (!this.filteredOptions.length) {
            this.highlightedIndex = -1;
            return;
        }

        let newIndex = this.highlightedIndex + direction;

        if (newIndex < 0) {
            newIndex = this.filteredOptions.length - 1;
        }

        if (newIndex >= this.filteredOptions.length) {
            newIndex = 0;
        }

        this.highlightedIndex = newIndex;
    }

    /**
     * Abre el dropdown al hacer click en el input.
     */
    onFocus(): void {
        this.open();
    }

    /**
     * Cierra el dropdown cuando se hace click fuera.
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as Node;

        if (!this.elementRef.nativeElement.contains(target)) {
            this.isOpen = false;
            this.highlightedIndex = -1;
        }
    }
}
