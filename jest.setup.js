import '@testing-library/jest-dom'

// Three.jsのグローバル変数をモック
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0)
}

global.cancelAnimationFrame = (id) => {
  clearTimeout(id)
}

// WebGLのモック
global.WebGLRenderingContext = {
  prototype: {}
}

global.WebGL2RenderingContext = {
  prototype: {}
}

// HTMLCanvasElementのモック
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: (contextId) => {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
      return {
        canvas: {},
        getShaderPrecisionFormat: () => ({ precision: 1, rangeMin: 1, rangeMax: 1 }),
        getParameter: () => 'WebGL',
        getExtension: () => null,
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        getShaderParameter: () => true,
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        getProgramParameter: () => true,
        useProgram: () => {},
        getAttribLocation: () => 0,
        getUniformLocation: () => {},
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        uniform1f: () => {},
        uniform1i: () => {},
        uniformMatrix4fv: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        createTexture: () => ({}),
        bindTexture: () => {},
        texImage2D: () => {},
        texParameteri: () => {},
        generateMipmap: () => {},
        createFramebuffer: () => ({}),
        bindFramebuffer: () => {},
        framebufferTexture2D: () => {},
        viewport: () => {},
        clear: () => {},
        clearColor: () => {},
        drawArrays: () => {},
        drawElements: () => {},
      }
    }
    return null
  }
})

// ResizeObserver のモック
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// IntersectionObserver のモック
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Web Audio API のモック
global.AudioContext = class MockAudioContext {
  constructor() {
    this.destination = {}
    this.currentTime = 0
    this.state = 'running'
  }
  
  createOscillator() {
    return {
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { value: 0, setValueAtTime: () => {} },
      type: 'sine'
    }
  }
  
  createGain() {
    return {
      connect: () => {},
      disconnect: () => {},
      gain: { value: 0, setValueAtTime: () => {} }
    }
  }
  
  createBufferSource() {
    return {
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      buffer: null
    }
  }
  
  close() {
    return Promise.resolve()
  }
}

global.webkitAudioContext = global.AudioContext