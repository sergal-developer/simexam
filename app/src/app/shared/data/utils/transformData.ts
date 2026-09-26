import { CurrencyPipe, DatePipe } from '@angular/common';

export class TransformData {
    private _currencyPipe: CurrencyPipe;
    private _datePipe: DatePipe;

    constructor(region = 'en-US') {
        this._currencyPipe = new CurrencyPipe(region);
        this._datePipe = new DatePipe(region);
    }

    toDate(value: Date, format = 'MM/d/yyyy') {
        const result = this._datePipe.transform(value, format);
        return result;
    }

    toDateUTC(value: Date, format = 'MM/d/yyyy') {
        const result = this._datePipe.transform(value, format, 'UTC');
        return result;
    }

    toMoney(value: number | string) {
        const result = this._currencyPipe.transform(value);
        return result;
    }

    milisecondsToDate(miliseconds: number) {
        try {
            const result = new Date(miliseconds);
            return result;
        } catch (error) {
            return null;
        }
    }

    encode(str: string) {
        return btoa(str);
    }

    decode(str: string) {
        return atob(str);
    }

    shuffleArray(array: Array<any>) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    _isNumeric(value: any) {
        return /^-?\d+$/.test(value);
    }

    randomIntegerInRange(min: number, max: number, noRepeat?: number) {
        let result = Math.floor(Math.random() * (max - min + 1)) + min;
        if (noRepeat && result === noRepeat) {
            result = this.randomIntegerInRange(min, max, noRepeat);
        }
        return result;
    }

    uniqByKeepLast(data: Array<any>, key: Function) {
        return [
            ... new Map(
                data.map(x => [key(x), x])
            ).values()
        ];
    }
}