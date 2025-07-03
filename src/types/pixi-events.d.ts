import 'pixi.js';

declare module 'pixi.js' {
  // PixiJS v7 consolidates pointer and touch events into FederatedPointerEvent.
  // Provide an alias so code can refer to FederatedTouchEvent explicitly.
  export interface FederatedTouchEvent extends FederatedPointerEvent {}
}