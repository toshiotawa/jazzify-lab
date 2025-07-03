declare module 'vconsole' {
  export default class VConsole {
    constructor(options?: {
      defaultPlugins?: string[];
      onReady?: () => void;
      maxLogNumber?: number;
      theme?: 'light' | 'dark';
    });
    
    destroy(): void;
    show(): void;
    hide(): void;
    showTab(tabName: string): void;
    hideTab(tabName: string): void;
  }
}