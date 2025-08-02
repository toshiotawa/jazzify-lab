// Mock PIXI.js for tests
const PIXI = {
  Application: class MockApplication {
    constructor() {
      this.view = document.createElement('canvas');
      this.stage = new PIXI.Container();
      this.renderer = {
        generateTexture: () => ({ texture: 'mock-texture' })
      };
    }
    destroy() {}
    render() {}
  },
  Container: class MockContainer {
    constructor() {
      this.children = [];
      this.sortableChildren = false;
    }
    addChild(child) {
      this.children.push(child);
    }
    removeChildren() {
      this.children = [];
    }
    destroy() {}
  },
  Graphics: class MockGraphics {
    beginFill() { return this; }
    drawRect() { return this; }
    endFill() { return this; }
  },
  Sprite: class MockSprite {
    constructor() {
      this.anchor = { set: () => {} };
      this.x = 0;
      this.y = 0;
      this.visible = true;
      this.zIndex = 0;
    }
  }
};

module.exports = PIXI;