/**
 * Construtor de interface para o script Wgram.
 * @description Esta classe manipula a criação de elementos da interface do usuário de forma encadeada.
 * @class Overlay
 */
export default class Overlay {
  /**
   * Construtor da classe Overlay.
   */
  constructor() {
    this.overlay = null; // O elemento raiz do overlay
    this.currentParent = null; // O elemento pai atual na árvore do overlay
    this.parentStack = []; // Pilha para rastrear os elementos pais para aninhamento
  }

  /**
   * Cria um elemento HTML.
   * Para uso interno da classe Overlay.
   * @private
   * @param {string} tag - O nome da tag como uma string.
   * @param {Object.<string, any>} [properties={}] - As propriedades DOM do elemento.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades adicionais para o elemento.
   * @returns {HTMLElement} O elemento HTML criado.
   */
  #createElement(tag, properties = {}, additionalProperties = {}) {
    const element = document.createElement(tag);

    // Se este é o primeiro elemento criado...
    if (!this.overlay) {
      this.overlay = element; // Declara-o como o elemento de nível mais alto
      this.currentParent = element;
    } else {
      // ...senão, anexa-o ao pai atual
      this.currentParent?.appendChild(element);
      this.parentStack.push(this.currentParent);
      this.currentParent = element;
    }

    // Aplica as propriedades compartilhadas
    for (const [property, value] of Object.entries(properties)) {
      element[property] = value;
    }

    // Aplica as propriedades adicionais/específicas
    for (const [property, value] of Object.entries(additionalProperties)) {
      element[property] = value;
    }

    return element;
  }

  /**
   * Finaliza a construção de um elemento, permitindo voltar ao elemento pai.
   * Chame isso depois de terminar de adicionar filhos a um elemento.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  buildElement() {
    if (this.parentStack.length > 0) {
      this.currentParent = this.parentStack.pop();
    }
    return this;
  }

  /**
   * Finaliza a construção do overlay e o anexa a um elemento pai na página.
   * Chame isso quando terminar de encadear todos os métodos de criação.
   * @param {HTMLElement} parent - O elemento pai onde o overlay será adicionado.
   */
  buildOverlay(parent) {
    if (this.overlay && parent) {
        parent.appendChild(this.overlay);
    }

    // Reseta as variáveis da classe para que um novo overlay possa ser construído
    this.overlay = null;
    this.currentParent = null;
    this.parentStack = [];
  }

  /**
   * Adiciona um `div` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `div`.
   * @param {function(Overlay, HTMLDivElement):void} [callback=()=>{}] - Função de callback para modificações extras.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addDiv(additionalProperties = {}, callback = () => {}) {
    const div = this.#createElement('div', {}, additionalProperties);
    callback(this, div);
    return this;
  }

  /**
   * Adiciona um parágrafo `<p>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `<p>`.
   * @param {function(Overlay, HTMLParagraphElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addP(additionalProperties = {}, callback = () => {}) {
    const p = this.#createElement('p', {}, additionalProperties);
    callback(this, p);
    return this;
  }

  /**
   * Adiciona um elemento `<small>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `<small>`.
   * @param {function(Overlay, HTMLElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addSmall(additionalProperties = {}, callback = () => {}) {
    const small = this.#createElement('small', {}, additionalProperties);
    callback(this, small);
    return this;
  }

  /**
   * Adiciona uma imagem `<img>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para esta `<img>`.
   * @param {function(Overlay, HTMLImageElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addImg(additionalProperties = {}, callback = () => {}) {
    const img = this.#createElement('img', {}, additionalProperties);
    callback(this, img);
    return this;
  }

  /**
   * Adiciona um cabeçalho (`<h1>`, `<h2>`, etc.) ao overlay.
   * @param {number} level - O nível do cabeçalho (1 a 6).
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este cabeçalho.
   * @param {function(Overlay, HTMLHeadingElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addHeader(level, additionalProperties = {}, callback = () => {}) {
    const header = this.#createElement(`h${level}`, {}, additionalProperties);
    callback(this, header);
    return this;
  }

  /**
   * Adiciona uma linha horizontal `<hr>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `<hr>`.
   * @param {function(Overlay, HTMLHRElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addHr(additionalProperties = {}, callback = () => {}) {
    const hr = this.#createElement('hr', {}, additionalProperties);
    callback(this, hr);
    return this;
  }

  /**
   * Adiciona uma quebra de linha `<br>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `<br>`.
   * @param {function(Overlay, HTMLBRElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addBr(additionalProperties = {}, callback = () => {}) {
    const br = this.#createElement('br', {}, additionalProperties);
    callback(this, br);
    return this;
  }

  /**
   * Adiciona um checkbox com um label ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades para o input, incluindo `textContent` para o label.
   * @param {function(Overlay, HTMLLabelElement, HTMLInputElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addCheckbox(additionalProperties = {}, callback = () => {}) {
    const properties = { type: 'checkbox' };
    const label = this.#createElement('label', { textContent: additionalProperties.textContent ?? '' });
    delete additionalProperties.textContent; // Remove para não ser aplicado ao input
    const checkbox = this.#createElement('input', properties, additionalProperties);
    label.insertBefore(checkbox, label.firstChild);
    this.buildElement(); // Finaliza o input
    callback(this, label, checkbox);
    return this;
  }

  /**
   * Adiciona um botão `<button>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `<button>`.
   * @param {function(Overlay, HTMLButtonElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addButton(additionalProperties = {}, callback = () => {}) {
    const button = this.#createElement('button', {}, additionalProperties);
    callback(this, button);
    return this;
  }

  /**
   * Adiciona um input `<input>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para este `<input>`.
   * @param {function(Overlay, HTMLInputElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addInput(additionalProperties = {}, callback = () => {}) {
    const input = this.#createElement('input', {}, additionalProperties);
    callback(this, input);
    return this;
  }

  /**
   * Adiciona um input de arquivo (`type="file"`) estilizado ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades para o input, incluindo `textContent` para o botão.
   * @param {function(Overlay, HTMLDivElement, HTMLInputElement, HTMLButtonElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addInputFile(additionalProperties = {}, callback = () => {}) {
    const properties = {
      type: 'file',
      style: 'display: none !important; visibility: hidden !important; position: absolute !important; left: -9999px !important; width: 0 !important; height: 0 !important; opacity: 0 !important;'
    };
    const text = additionalProperties.textContent ?? '';
    delete additionalProperties.textContent;

    const container = this.#createElement('div');
    const input = this.#createElement('input', properties, additionalProperties);
    this.buildElement(); // Finaliza o input
    const button = this.#createElement('button', { textContent: text });
    this.buildElement(); // Finaliza o botão
    this.buildElement(); // Finaliza o container

    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');

    button.addEventListener('click', () => {
      input.click();
    });

    input.addEventListener('change', () => {
      button.style.maxWidth = `${button.offsetWidth}px`;
      if (input.files.length > 0) {
        button.textContent = input.files[0].name;
      } else {
        button.textContent = text;
      }
    });

    callback(this, container, input, button);
    return this;
  }

  /**
   * Adiciona uma área de texto `<textarea>` ao overlay.
   * @param {Object.<string, any>} [additionalProperties={}] - Propriedades específicas para esta `<textarea>`.
   * @param {function(Overlay, HTMLTextAreaElement):void} [callback=()=>{}] - Função de callback.
   * @returns {Overlay} A instância da classe Overlay (this).
   */
  addTextarea(additionalProperties = {}, callback = () => {}) {
    const textarea = this.#createElement('textarea', {}, additionalProperties);
    callback(this, textarea);
    return this;
  }
}
