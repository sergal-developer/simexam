import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { IconNode } from 'lucide';

@Component({
    selector: 'morph-i',
    template: `
        <div>
            <morph-icon
                #icon
                [attr.icon]="icon"
                [attr.label]="label"
                [attr.size]="size"
                [attr.color]="color"
                [attr.strokeWidth]="strokeWidth"
                [attr.reducedMotion]="reducedMotion">
            </morph-icon>
        </div>`,
    styleUrls: ['./morph-icon.scss']
})
export class MorphIconComponent implements OnInit, OnChanges {
    @ViewChild('icon', { static: true }) iconRef!: ElementRef<HTMLElement>;

    @Input() icon: IconNode | string = 'M4 6h16M4 12h16M4 18h16';   // default / "closed" state
    @Input() altIcon: IconNode | string = 'M18 6L6 18M6 6l12 12';    // "open" state
    @Input() label = 'Menu';
    @Input() size = 24;
    @Input() color = 'currentColor';
    @Input() strokeWidth = 2;
    @Input() spring = 'snappy';
    @Input() reducedMotion: 'never' | 'user' | 'always' = 'never';

    ngOnInit(): void {
        (this.iconRef.nativeElement as any).morphTo(this.icon, this.spring);
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('changes: ', changes);
        // if (changes['open']) {
        // (this.iconRef.nativeElement as any).morphTo(this.open ? this.altIcon : this.icon, this.spring);
        // }
    }

    change() {
        console.log('this.Icon: ', this.icon);
        console.log('this.altIcon: ', this.altIcon);
        (this.iconRef.nativeElement as any).morphTo(this.altIcon, this.spring);
    }

    morphTo(icon: IconNode | string) {
        (this.iconRef.nativeElement as any).morphTo(icon, this.spring);
    }
}
