declare module 'react' {
  // Minimal stubs – actual types are provided at runtime via React 18.
  export type FC<P = Record<string, unknown>> = (props: P & { children?: React.ReactNode }) => JSX.Element | null;
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<unknown>): void;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<unknown>): T;
  export namespace React {
    type ReactNode = any;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface JSXElement {}
  const ReactExport: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useRef: typeof useRef;
    useCallback: typeof useCallback;
  } & { createElement: (...args: any[]) => any };
  export default ReactExport;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}