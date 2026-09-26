import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DBLocal } from '../../services/storage/db-storage';

@Component({
    selector: 'log-component',
    templateUrl: './log.html',
    styleUrls: ['./log.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class LogComponent implements OnChanges {
    // #region INPUT/OUTPUT
    @Input() show: boolean = false;

    storage: DBLocal = new DBLocal('logs');
    // myLogger = new SafeConsoleLogger();
    private logs: LogEntry[] = [];
    private originalMethods: Record<string, Function> = {};

    // 🚨 EL CANDADO SALVAVIDAS 🚨
    // Evita la recursión si otro script (o el nuestro) llama a console dentro de esta ejecución
    private isProcessing: boolean = false;
    // #endregion

    logsHistory: LogEntry[] = [];


    constructor() {
        this.initInterceptor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Verificamos si el Input 'show' fue el que cambió
        if (changes['show']) {
        const cambio = changes['show'];

        if (cambio.currentValue) {
            // Ejecutar acción cuando 'show' pase a true
            this.getLogHistory();
        }
        }
    }

    private initInterceptor(): void {
        const methods: LogMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

        methods.forEach((method) => {
            // 1. Respaldamos el método original, asegurando su contexto
            this.originalMethods[method] = console[method].bind(console);

            // 2. Sobrescribimos el método en el objeto global
            console[method] = (...args: any[]) => {

                // Si el candado está cerrado, significa que estamos en un bucle.
                // Llamamos al original directamente y abortamos nuestra captura.
                if (this.isProcessing) {
                    this.originalMethods[method](...args);
                    return;
                }

                // Cerramos el candado
                this.isProcessing = true;

                try {
                    // Guardamos el registro de forma segura
                    this.logs.push({
                        type: method,
                        timestamp: new Date().toISOString(),
                        // Evitamos JSON.stringify aquí porque objetos complejos del DOM 
                        // causarán un error de "Circular Reference"
                        payload: args
                    });

                    // Ejecutamos el comportamiento real de la consola
                    this.originalMethods[method](...args);

                } catch (err) {
                    // Fallback en caso de fallo interno crítico
                    this.originalMethods['error']("Error interno en interceptor de consola:", err);
                } finally {
                    // SIEMPRE abrimos el candado al terminar, incluso si hubo errores
                    this.isProcessing = false;
                }
            };
        });
    }

    /**
     * Retorna todo el historial capturado
     */
    public getLogs(): LogEntry[] {
        return this.logs;
    }

    /**
     * Limpia la memoria
     */
    public clearLogs(): void {
        this.logs = [];
    }

    /**
     * Devuelve la consola a su estado natural para evitar memory leaks si apagas tu script
     */
    public destroy(): void {
        Object.keys(this.originalMethods).forEach((method) => {
            (console as any)[method] = this.originalMethods[method];
        });
    }

    async getLogHistory() {
        const data = this.getLogs();
        this.logsHistory = data.map((log) => {
            try {
                log._message = JSON.stringify(log.payload)
            } catch (error) {
                log._message = log.payload.join(', ');
            }
            return log;
        })
    }
}

type LogMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    type: LogMethod;
    timestamp: string;
    payload: any[];
    _message?: string
}
