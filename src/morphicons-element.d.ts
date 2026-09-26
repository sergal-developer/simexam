declare module 'morphicons/element' {
  export function defineMorphIcon(tag?: string): void;

  export interface MorphIconElement extends HTMLElement {
    icon: unknown;
    from: unknown;
    to: unknown;
    progress: number;
    reducedMotion: 'never' | 'user' | 'always';
    morphTo(icon: unknown, spring?: string): void;
    set(icon: unknown): void;
    seek(icon: unknown, progress: number): void;
    destroy(): void;
  }
}


declare module 'morphicons/adapters' {
  export function svgToIcon(markup: string): IconInput;
}
