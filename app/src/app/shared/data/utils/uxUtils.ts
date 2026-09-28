export class UxUtils {
    waitForAnimation(element: HTMLElement): Promise<void> {
        return new Promise(resolve => {
            console.info('start.animation');
            element.addEventListener(
                'transitionend',
                () => {        
                    console.info('end.animation');
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
