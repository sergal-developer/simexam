export class Parser {
    constructor() { }

    parseFields(input: string): ParseResult {
        const fields: ParsedField[] = [];
        const invalidFields: InvalidField[] = [];

        // Quitar { } externos si existen
        let text = input.trim();

        if (text.startsWith('{') && text.endsWith('}')) {
            text = text.substring(1, text.length - 1);
        }

        const tokens = this.splitFields(text);

        for (const token of tokens) {
            const raw = token.trim();

            if (!raw) {
                continue;
            }

            const separatorIndex = this.findSeparator(raw);

            // No existe ":" => campo inválido
            if (separatorIndex === -1) {
                invalidFields.push({
                    name: null,
                    reason: 'El campo no contiene ":"',
                    raw
                });

                continue;
            }

            const rawName = raw.substring(0, separatorIndex).trim();
            const rawValue = raw.substring(separatorIndex + 1).trim();

            // ": 1"
            if (!rawName) {
                invalidFields.push({
                    name: null,
                    reason: 'El campo no tiene nombre',
                    raw
                });

                continue;
            }

            // "error:"
            if (!rawValue) {
                invalidFields.push({
                    name: this.cleanName(rawName),
                    reason: 'El campo no tiene un valor válido',
                    raw
                });

                continue;
            }

            const name = this.cleanName(rawName);

            if (!name) {
                invalidFields.push({
                    name: null,
                    reason: 'El nombre del campo no es válido',
                    raw
                });

                continue;
            }

            const parsed = this.parseValue(rawValue);

            if (!parsed.valid) {
                invalidFields.push({
                    name,
                    reason: parsed.reason,
                    raw
                });

                continue;
            }

            fields.push({
                name,
                type: this.getType(parsed.value),
                value: parsed.value
            });
        }

        const data: Record<string, unknown> = {};

        for (const field of fields) {
            data[field.name] = field.value;
        }

        return {
            json: JSON.stringify(data),
            fields,
            invalidFields
        };
    }

    splitFields(text: string): string[] {
        const result: string[] = [];

        let current = '';
        let quote: string | null = null;
        let squareDepth = 0;
        let curlyDepth = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const previous = text[i - 1];

            // Manejo de strings
            if (
                (char === "'" || char === '"' || char === '`') &&
                previous !== '\\'
            ) {
                if (quote === null) {
                    quote = char;
                } else if (quote === char) {
                    quote = null;
                }

                current += char;
                continue;
            }

            if (quote !== null) {
                current += char;
                continue;
            }

            if (char === '[') squareDepth++;
            if (char === ']') squareDepth--;

            if (char === '{') curlyDepth++;
            if (char === '}') curlyDepth--;

            // La coma solamente separa campos en el nivel principal
            if (
                char === ',' &&
                squareDepth === 0 &&
                curlyDepth === 0
            ) {
                result.push(current.trim());
                current = '';
                continue;
            }

            current += char;
        }

        if (current.trim()) {
            result.push(current.trim());
        }

        return result;
    }

    findSeparator(text: string): number {
        let quote: string | null = null;
        let squareDepth = 0;
        let curlyDepth = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const previous = text[i - 1];

            if (
                (char === "'" || char === '"' || char === '`') &&
                previous !== '\\'
            ) {
                if (quote === null) {
                    quote = char;
                } else if (quote === char) {
                    quote = null;
                }

                continue;
            }

            if (quote !== null) {
                continue;
            }

            if (char === '[') squareDepth++;
            if (char === ']') squareDepth--;

            if (char === '{') curlyDepth++;
            if (char === '}') curlyDepth--;

            if (
                char === ':' &&
                squareDepth === 0 &&
                curlyDepth === 0
            ) {
                return i;
            }
        }

        return -1;
    }

    cleanName(name: string): string {
        return name
            .trim()
            .replace(/^['"]|['"]$/g, '');
    }

    parseValue(value: string): { valid: boolean, value: any, reason: string } {

        const trimmed = value.trim();

        // null
        if (trimmed === 'null') {
            return {
                valid: true,
                value: null,
                reason: null
            };
        }

        // boolean
        if (trimmed === 'true') {
            return {
                valid: true,
                value: true,
                reason: null
            };
        }

        if (trimmed === 'false') {
            return {
                valid: true,
                value: false,
                reason: null
            };
        }

        // String con comillas simples
        if (
            trimmed.startsWith("'") &&
            trimmed.endsWith("'")
        ) {
            return {
                valid: true,
                value: trimmed
                    .substring(1, trimmed.length - 1)
                    .replace(/\\'/g, "'"),
                reason: null
            };
        }

        // String con comillas dobles
        if (
            trimmed.startsWith('"') &&
            trimmed.endsWith('"')
        ) {
            try {
                return {
                    valid: true,
                    value: JSON.parse(trimmed),
                    reason: null
                };
            } catch {
                return {
                    valid: false,
                    value: null,
                    reason: 'String inválido'
                };
            }
        }

        // Número
        if (
            /^-?\d+(\.\d+)?$/.test(trimmed)
        ) {
            return {
                valid: true,
                value: Number(trimmed),
                reason: null,
            };
        }

        // Array
        if (
            trimmed.startsWith('[') &&
            trimmed.endsWith(']')
        ) {
            try {
                const array = this.parseArray(trimmed);

                return {
                    valid: true,
                    value: array,
                    reason: null,
                };
            } catch {
                return {
                    valid: false,
                    value: null,
                    reason: 'Array inválido',
                };
            }
        }

        // Object
        if (
            trimmed.startsWith('{') &&
            trimmed.endsWith('}')
        ) {
            try {
                const object = this.parseObject(trimmed);

                return {
                    valid: true,
                    value: object,
                    reason: null,
                };
            } catch {
                return {
                    valid: false,
                    value: null,
                    reason: 'Objeto inválido'
                };
            }
        }

        return {
            valid: false,
            value: null,
            reason: `Tipo de valor no soportado: ${trimmed}`
        };
    }

    parseArray(value: string): unknown[] {
        const content = value.substring(1, value.length - 1).trim();

        if (!content) {
            return [];
        }

        return this.splitFields(content).map(item => {
            const parsed = this.parseValue(item);

            if (!parsed.valid) {
                throw new Error(parsed.reason);
            }

            return parsed.value;
        });
    }

    parseObject(value: string): Record<string, unknown> {
        const content = value.substring(1, value.length - 1).trim();

        if (!content) {
            return {};
        }

        const result: Record<string, unknown> = {};

        for (const field of this.splitFields(content)) {
            const separator = this.findSeparator(field);

            if (separator === -1) {
                throw new Error(`Campo inválido: ${field}`);
            }

            const name = this.cleanName(
                field.substring(0, separator)
            );

            const rawValue = field
                .substring(separator + 1)
                .trim();

            if (!name || !rawValue) {
                throw new Error(`Campo inválido: ${field}`);
            }

            const parsed = this.parseValue(rawValue);

            if (!parsed.valid) {
                throw new Error(parsed.reason);
            }

            result[name] = parsed.value;
        }

        return result;
    }

    getType(value: unknown): string {
        if (value === null) return 'null';

        if (Array.isArray(value)) {
            return 'array';
        }

        if (typeof value === 'object') {
            return 'object';
        }

        return typeof value;
    }

    parseNumber(value: string): any {
        const trimmed = value.trim();

        if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
            return null;
        }

        return Number(trimmed);
    }
}


export interface ParsedField {
    name: string;
    type: string;
    value: unknown;
}

export interface InvalidField {
    name: string | null;
    reason: string;
    raw: string;
}

export interface ParseResult {
    json: string;
    fields: ParsedField[];
    invalidFields: InvalidField[];
}
