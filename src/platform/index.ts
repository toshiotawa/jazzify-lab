/**
 * プラットフォーム抽象化レイヤー
 * window.オブジェクトやDOM操作を抽象化し、テスト可能にする
 */

// 基本的な型定義
export interface PlatformElement {
  nativeElement: HTMLElement;
  id?: string;
  className?: string;
  textContent?: string;
  innerHTML?: string;
  style: CSSStyleDeclaration;
  appendChild(child: PlatformElement): void;
  removeChild(child: PlatformElement): void;
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  querySelector(selector: string): PlatformElement | null;
  querySelectorAll(selector: string): PlatformElement[];
}

export interface PlatformWindow {
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(id: number): void;
  setTimeout(handler: Function, timeout: number): number;
  clearTimeout(id: number): void;
  setInterval(handler: Function, timeout: number): number;
  clearInterval(id: number): void;
  location: Location;
  navigator: Navigator;
}

export interface PlatformDocument {
  body: PlatformElement;
  createElement(tagName: string): PlatformElement;
  getElementById(id: string): PlatformElement | null;
  querySelector(selector: string): PlatformElement | null;
  querySelectorAll(selector: string): PlatformElement[];
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
}

// ブラウザ実装
class BrowserElement implements PlatformElement {
  constructor(public nativeElement: HTMLElement) {}

  get id(): string | undefined {
    return this.nativeElement.id || undefined;
  }

  set id(value: string | undefined) {
    if (value !== undefined) {
      this.nativeElement.id = value;
    }
  }

  get className(): string | undefined {
    return this.nativeElement.className || undefined;
  }

  set className(value: string | undefined) {
    if (value !== undefined) {
      this.nativeElement.className = value;
    }
  }

  get textContent(): string | undefined {
    return this.nativeElement.textContent || undefined;
  }

  set textContent(value: string | undefined) {
    if (value !== undefined) {
      this.nativeElement.textContent = value;
    }
  }

  get innerHTML(): string | undefined {
    return this.nativeElement.innerHTML || undefined;
  }

  set innerHTML(value: string | undefined) {
    if (value !== undefined) {
      this.nativeElement.innerHTML = value;
    }
  }

  get style(): CSSStyleDeclaration {
    return this.nativeElement.style;
  }

  appendChild(child: PlatformElement): void {
    this.nativeElement.appendChild(child.nativeElement);
  }

  removeChild(child: PlatformElement): void {
    this.nativeElement.removeChild(child.nativeElement);
  }

  addEventListener(event: string, handler: Function): void {
    this.nativeElement.addEventListener(event, handler as EventListener);
  }

  removeEventListener(event: string, handler: Function): void {
    this.nativeElement.removeEventListener(event, handler as EventListener);
  }

  getAttribute(name: string): string | null {
    return this.nativeElement.getAttribute(name);
  }

  setAttribute(name: string, value: string): void {
    this.nativeElement.setAttribute(name, value);
  }

  querySelector(selector: string): PlatformElement | null {
    const element = this.nativeElement.querySelector(selector);
    return element ? new BrowserElement(element as HTMLElement) : null;
  }

  querySelectorAll(selector: string): PlatformElement[] {
    const elements = this.nativeElement.querySelectorAll(selector);
    return Array.from(elements).map(el => new BrowserElement(el as HTMLElement));
  }
}

class BrowserWindow implements PlatformWindow {
  get innerWidth(): number {
    return window.innerWidth;
  }

  get innerHeight(): number {
    return window.innerHeight;
  }

  get devicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  get location(): Location {
    return window.location;
  }

  get navigator(): Navigator {
    return window.navigator;
  }

  addEventListener(event: string, handler: Function): void {
    window.addEventListener(event, handler as EventListener);
  }

  removeEventListener(event: string, handler: Function): void {
    window.removeEventListener(event, handler as EventListener);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    return window.requestAnimationFrame(callback);
  }

  cancelAnimationFrame(id: number): void {
    window.cancelAnimationFrame(id);
  }

  setTimeout(handler: Function, timeout: number): number {
    return window.setTimeout(handler as TimerHandler, timeout);
  }

  clearTimeout(id: number): void {
    window.clearTimeout(id);
  }

  setInterval(handler: Function, timeout: number): number {
    return window.setInterval(handler as TimerHandler, timeout);
  }

  clearInterval(id: number): void {
    window.clearInterval(id);
  }
}

class BrowserDocument implements PlatformDocument {
  get body(): PlatformElement {
    return new BrowserElement(document.body);
  }

  createElement(tagName: string): PlatformElement {
    return new BrowserElement(document.createElement(tagName));
  }

  getElementById(id: string): PlatformElement | null {
    const element = document.getElementById(id);
    return element ? new BrowserElement(element) : null;
  }

  querySelector(selector: string): PlatformElement | null {
    const element = document.querySelector(selector);
    return element ? new BrowserElement(element as HTMLElement) : null;
  }

  querySelectorAll(selector: string): PlatformElement[] {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(el => new BrowserElement(el as HTMLElement));
  }

  addEventListener(event: string, handler: Function): void {
    document.addEventListener(event, handler as EventListener);
  }

  removeEventListener(event: string, handler: Function): void {
    document.removeEventListener(event, handler as EventListener);
  }
}

// プラットフォーム実装の管理
class Platform {
  private _window: PlatformWindow;
  private _document: PlatformDocument;
  private _globalProperties: Map<string, any> = new Map();

  constructor() {
    // ブラウザ環境の検出
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this._window = new BrowserWindow();
      this._document = new BrowserDocument();
    } else {
      throw new Error('Unsupported platform: only browser environment is supported');
    }
  }

  // Window操作
  getWindow(): PlatformWindow {
    return this._window;
  }

  // Document操作
  getDocument(): PlatformDocument {
    return this._document;
  }

  // 要素作成・取得
  createElement(tagName: string): PlatformElement {
    return this._document.createElement(tagName);
  }

  getElementById(id: string): PlatformElement | null {
    return this._document.getElementById(id);
  }

  querySelector(selector: string): PlatformElement | null {
    return this._document.querySelector(selector);
  }

  querySelectorAll(selector: string): PlatformElement[] {
    return this._document.querySelectorAll(selector);
  }

  // イベント処理
  addEventListener(element: PlatformElement | PlatformWindow | PlatformDocument, event: string, handler: Function): void {
    element.addEventListener(event, handler);
  }

  removeEventListener(element: PlatformElement | PlatformWindow | PlatformDocument, event: string, handler: Function): void {
    element.removeEventListener(event, handler);
  }

  // グローバルプロパティ管理（テスト用）
  setGlobalProperty(key: string, value: any): void {
    this._globalProperties.set(key, value);
  }

  getGlobalProperty(key: string): any {
    return this._globalProperties.get(key);
  }

  clearGlobalProperties(): void {
    this._globalProperties.clear();
  }

  // アニメーション制御
  requestAnimationFrame(callback: FrameRequestCallback): number {
    return this._window.requestAnimationFrame(callback);
  }

  cancelAnimationFrame(id: number): void {
    this._window.cancelAnimationFrame(id);
  }

  // タイマー制御
  setTimeout(handler: Function, timeout: number): number {
    return this._window.setTimeout(handler, timeout);
  }

  clearTimeout(id: number): void {
    this._window.clearTimeout(id);
  }

  setInterval(handler: Function, timeout: number): number {
    return this._window.setInterval(handler, timeout);
  }

  clearInterval(id: number): void {
    this._window.clearInterval(id);
  }
}

// シングルトンインスタンス
let platformInstance: Platform | null = null;

export function getPlatform(): Platform {
  if (!platformInstance) {
    platformInstance = new Platform();
  }
  return platformInstance;
}

// 便利な関数エクスポート（既存コード互換性のため）
export const platform = getPlatform();

// 個別エクスポート（既存コード互換性のため）
export const getWindow = (): PlatformWindow => platform.getWindow();
export const getDocument = (): PlatformDocument => platform.getDocument();
export const createElement = (tagName: string): PlatformElement => platform.createElement(tagName);
export const getElementById = (id: string): PlatformElement | null => platform.getElementById(id);
export const querySelector = (selector: string): PlatformElement | null => platform.querySelector(selector);
export const querySelectorAll = (selector: string): PlatformElement[] => platform.querySelectorAll(selector);
export const addEventListener = (element: any, event: string, handler: Function): void => platform.addEventListener(element, event, handler);
export const removeEventListener = (element: any, event: string, handler: Function): void => platform.removeEventListener(element, event, handler);
export const setGlobalProperty = (key: string, value: any): void => platform.setGlobalProperty(key, value);
export const getGlobalProperty = (key: string): any => platform.getGlobalProperty(key);

export default platform; 