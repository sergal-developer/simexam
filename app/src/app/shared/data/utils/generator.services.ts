import { Utils } from "./utils";

export type MathOperators = {
  plus: boolean;
  minus: boolean;
  divide: boolean;
  multiplication: boolean;
};

export type DigitRange = {
  min: number;
  max: number;
};

export type MathQuestion = {
  operation: string;
  result: MathResultsOptions[];
  estimatedTime: number;
};

export type MathResultsOptions = {
  value: number;
  isCorrect: boolean;
}

export class Generator {
  _helper = new Utils();
  private minNumber: number;
  private maxNumber: number;

  constructor() { }

  // #region GENERATOR
  generateMathQuest(operators: MathOperators, digits: DigitRange, quantity: number): MathQuestion[] {

    // VALIDATORS
    if (
      !Number.isInteger(digits.min) ||
      !Number.isInteger(digits.max) ||
      digits.min < 1 ||
      digits.max < digits.min
    ) {
      throw new Error("El rango de dígitos no es válido.");
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("La cantidad debe ser un entero no negativo.");
    }

    const enabledOperators = Object.entries(operators)
      .filter(([, enabled]) => enabled)
      .map(([operator]) => operator as keyof MathOperators);

    if (quantity > 0 && enabledOperators.length === 0) {
      throw new Error("Debes habilitar al menos un operador.");
    }

    this.minNumber = 10 ** (digits.min - 1);
    this.maxNumber = 10 ** digits.max - 1;

    if (!Number.isSafeInteger(this.maxNumber)) {
      throw new Error("El rango de dígitos es demasiado grande.");
    }

    const questions: MathQuestion[] = [];

    for (let i = 0; i < quantity; i++) {
      const operator = enabledOperators[this.randomInt(0, enabledOperators.length - 1)];
      questions.push(this.generateOperation(operator));
    }

    return questions;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomNumber(): number {
    return this.randomInt(this.minNumber, this.maxNumber);
  }

  generateOperation(operator: keyof MathOperators): MathQuestion {
    let a: number;
    let b: number;
    let result: number;
    let symbol: string;

    switch (operator) {
      case "plus":
        a = this.randomNumber();
        b = this.randomNumber();
        result = a + b;
        symbol = "+";
        break;

      case "minus":
        a = this.randomNumber();
        b = this.randomNumber();

        // prevent negative results
        if (a < b) [a, b] = [b, a];

        result = a - b;
        symbol = "-";
        break;

      case "multiplication":
        a = this.randomNumber();
        b = this.randomNumber();
        result = a * b;
        symbol = "x";
        break;

      case "divide": {
        // Buscar una división exacta con operandos
        // dentro del rango de dígitos solicitado.
        const pairs: [number, number][] = [];

        for (let divisor = this.minNumber; divisor <= this.maxNumber; divisor++) {
          const firstMultiple = Math.ceil(this.minNumber / divisor) * divisor;

          if (firstMultiple > this.maxNumber) continue;

          // Elegir un múltiplo aleatorio del divisor.
          const minMultiplier = Math.ceil(this.minNumber / divisor);
          const maxMultiplier = Math.floor(this.maxNumber / divisor);

          if (minMultiplier > maxMultiplier) continue;

          const multiplier = this.randomInt(minMultiplier, maxMultiplier);
          const dividend = divisor * multiplier;

          if (dividend >= this.minNumber && dividend <= this.maxNumber) {
            pairs.push([dividend, divisor]);
          }

          // Limitar el costo de búsqueda.
          if (pairs.length >= 100) break;
        }

        if (pairs.length === 0) {
          throw new Error(
            "No se encontró una división exacta para este rango de dígitos."
          );
        }

        [a, b] = pairs[this.randomInt(0, pairs.length - 1)];
        result = a / b;
        symbol = "/";
        break;
      }
    }

    return {
      operation: `${a} ${symbol} ${b}`,
      result: this.generateFalseResults(result, 4),
      estimatedTime: 10
    };
  };

  generateFalseResults(trueResult: number, options: number): { value: number; isCorrect: boolean }[] {
    const results: { value: number; isCorrect: boolean }[] = [];

    // Agregar el resultado correcto
    results.push({
      value: trueResult,
      isCorrect: true,
    });

    // Generar resultados incorrectos únicos
    const falseResults = new Set<number>();

    while (falseResults.size < options - 1) {
      const offset = Math.floor(Math.random() * 20) + 1;
      const sign = Math.random() < 0.5 ? -1 : 1;
      const value = trueResult + offset * sign;

      if (value !== trueResult) {
        falseResults.add(value);
      }
    }

    // Agregar los resultados incorrectos
    falseResults.forEach((value) => {
      results.push({
        value,
        isCorrect: false,
      });
    });

    // Mezclar las opciones aleatoriamente
    return results.sort(() => Math.random() - 0.5);
  }
  // #endregion GENERATOR
}
