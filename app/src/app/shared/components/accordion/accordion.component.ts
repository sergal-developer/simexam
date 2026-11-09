import { AfterViewInit, Component, ElementRef, HostListener, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'accordion',
    template: `
        <div class="accordion-item">
            <button class="accordion-header" [attr.aria-expanded]="expand" (click)="toggle()">
                <ng-content select="accordion-title" />
                <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <ng-container *ngIf="expand">
                <div class="accordion-body">
                    <ng-content select="accordion-body" />
                </div>
            </ng-container>
        </div>
  `,
    styleUrls: ['./accordion.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AccordionItemComponent {
    @Input()
    className: string = '';

    @Input()
    expand: boolean = false;

    constructor(
    ) { }

    toggle() {
        this.expand = !this.expand;
    }
}
