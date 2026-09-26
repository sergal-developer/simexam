export class UxUtils {
    waitForAnimation(element: HTMLElement): Promise<void> {
        return new Promise(resolve => {
            console.log('start event: ');
            element.addEventListener(
                'transitionend',
                () => {        
                    console.log('end: ');
                    resolve()
                },
                { once: true }
            );
        });
    }

    async wait(ms: number): Promise<void> {
        return new Promise((resolve) => { setTimeout(resolve, ms); });
    }
}
