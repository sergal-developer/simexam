import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { IconNode, icons } from "lucide";
import { MorphIconComponent } from '../morph-icon/morph-icon.component';
import { svgToIcon } from 'morphicons/adapters';
import { UxUtils } from '../../data/utils/uxUtils';

@Component({
    selector: 'logo',
    templateUrl: './logo.html',
    styleUrls: ['./logo.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class LogoComponent implements AfterViewInit {
    // #region INPUT/OUTPUT
    @Output() onChange = new EventEmitter();
    @ViewChildren(MorphIconComponent) morphIcons!: QueryList<MorphIconComponent>;
    // #endregion

    //#region PROOPERTIES
    isMenuOpen = false;
    listIcons: IconNode[] = [
        icons.GraduationCap,
        icons.BookA,
        icons.NotebookPen,
        icons.BookOpenCheck,
    ]
    morphIconsComponent: MorphIconComponent;
    _icon = {
        start: icons.GraduationCap, // icons.GraduationCap,
        end: icons.BookOpenText,
        label: 'Logo',
        strokeWidth: 1,
        size: 120
    }

    logoState = 'hidden';
    elementLogo;
    uxUtils = new UxUtils();
    luIcon = {
        logo: icons.GraduationCap,
    }
    //#endregion PROPERTIES

    constructor() {
    }

    ngOnInit(): void {

    }

    async ngAfterViewInit() {
        this.animationSplash();
    }

    async animationSplash() {
        this.logoState = 'hidden';

        await this.uxUtils.wait(1500);
        this.logoState = 'start';

        await this.uxUtils.wait(1500);
        this.logoState = 'focus';

        await this.uxUtils.wait(1500);
        this.logoState = 'end';

        await this.uxUtils.wait(1000);
        this.onRedirectApp();
    }


    async animateLog() {
        this.elementLogo = document.querySelector('#logoApp');
        this.elementLogo.classList.add('init');
        await this.uxUtils.waitForAnimation(this.elementLogo);

        this.elementLogo.classList.add('transitionend');
        await this.uxUtils.waitForAnimation(this.elementLogo);
    }

    currentIndex = 0;
    gotThroughIcons(next?: Function) {
        if (this.currentIndex <= this.listIcons.length - 2) {
            const start: IconNode = this.listIcons[this.currentIndex];
            const end: IconNode = this.listIcons[this.currentIndex + 1];

            this.morphIconsComponent.icon = start;
            this.morphIconsComponent.icon = end;
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
            this.logoState = '';
            this.onRedirectApp();
        }

        if (this.logoState != '') {
            setTimeout(() => {
                this.morphIconsComponent.morphTo(this.listIcons[this.currentIndex]);
                this.gotThroughIcons();
            }, 1000);
        }
    }

    onRedirectApp() {
        this.onChange.emit({ event: 'finishLoad' });
    }
}
