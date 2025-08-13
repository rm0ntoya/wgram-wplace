// ==UserScript==
// @name         Wgram
// @namespace    https://github.com/rm0ntoya
// @version      1.1.1
// @description  Um script de usuário para aprimorar a experiência no Wplace.live com login e salvamento na nuvem.
// @author       rm0ntoya
// @license      MPL-2.0
// @homepageURL  https://github.com/rm0ntoya/wgram-wplace
// @supportURL   https://github.com/rm0ntoya/wgram-wplace/issues
// @icon         https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/icon.png

// @match        *://*.wplace.live/*

// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM.setValue
// @grant        GM_getValue

// @require      https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js
// @require      https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js
// @require      https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js

// @run-at       document-end

// @resource     WGRAM_CSS https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/style.css
// @updateURL    https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/Wgram.meta.js
// @downloadURL  https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/Wgram.user.js
// ==/UserScript==

(() => {
  'use strict';

  // --- Módulo: src/utils/constants.js ---
  const ENCODING_BASE = '!#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCERXiWRK8bmkAG-evSXBnwhSOjFWXyym8",
    authDomain: "wplace-a0f34.firebaseapp.com",
    projectId: "wplace-a0f34",
    storageBucket: "wplace-a0f34.appspot.com",
    messagingSenderId: "169855531458",
    appId: "1:169855531458:web:8e2e2a4b809fc4605b7e5b"
  };

  // --- Módulo: src/utils/helpers.js ---
  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  function numberToEncoded(number, encoding) {
    if (number === 0) return encoding[0];
    let result = '';
    const base = encoding.length;
    while (number > 0) {
      result = encoding[number % base] + result;
      number = Math.floor(number / base);
    }
    return result;
  }

  // --- Módulo: src/components/Overlay.js ---
  class Overlay {
    constructor() { this.overlay = null; this.currentParent = null; this.parentStack = []; }
    #createElement(tag, properties = {}, additionalProperties = {}) { const element = document.createElement(tag); if (!this.overlay) { this.overlay = element; this.currentParent = element; } else { this.currentParent?.appendChild(element); this.parentStack.push(this.currentParent); this.currentParent = element; } for (const [property, value] of Object.entries(properties)) { element[property] = value; } for (const [property, value] of Object.entries(additionalProperties)) { element[property] = value; } return element; }
    buildElement() { if (this.parentStack.length > 0) { this.currentParent = this.parentStack.pop(); } return this; }
    buildOverlay(parent) { if (this.overlay && parent) { parent.appendChild(this.overlay); } this.overlay = null; this.currentParent = null; this.parentStack = []; }
    addDiv(additionalProperties = {}, callback = () => {}) { const div = this.#createElement('div', {}, additionalProperties); callback(this, div); return this; }
    addP(additionalProperties = {}, callback = () => {}) { const p = this.#createElement('p', {}, additionalProperties); callback(this, p); return this; }
    addSmall(additionalProperties = {}, callback = () => {}) { const small = this.#createElement('small', {}, additionalProperties); callback(this, small); return this; }
    addImg(additionalProperties = {}, callback = () => {}) { const img = this.#createElement('img', {}, additionalProperties); callback(this, img); return this; }
    addHeader(level, additionalProperties = {}, callback = () => {}) { const header = this.#createElement(`h${level}`, {}, additionalProperties); callback(this, header); return this; }
    addHr(additionalProperties = {}, callback = () => {}) { const hr = this.#createElement('hr', {}, additionalProperties); callback(this, hr); return this; }
    addBr(additionalProperties = {}, callback = () => {}) { const br = this.#createElement('br', {}, additionalProperties); callback(this, br); return this; }
    addCheckbox(additionalProperties = {}, callback = () => {}) { const properties = { type: 'checkbox' }; const label = this.#createElement('label', { textContent: additionalProperties.textContent ?? '' }); delete additionalProperties.textContent; const checkbox = this.#createElement('input', properties, additionalProperties); label.insertBefore(checkbox, label.firstChild); this.buildElement(); callback(this, label, checkbox); return this; }
    addButton(additionalProperties = {}, callback = () => {}) { const button = this.#createElement('button', {}, additionalProperties); callback(this, button); return this; }
    addInput(additionalProperties = {}, callback = () => {}) { const input = this.#createElement('input', {}, additionalProperties); callback(this, input); return this; }
    addInputFile(additionalProperties = {}, callback = () => {}) { const properties = { type: 'file', style: 'display: none !important; visibility: hidden !important; position: absolute !important; left: -9999px !important; width: 0 !important; height: 0 !important; opacity: 0 !important;' }; const text = additionalProperties.textContent ?? ''; delete additionalProperties.textContent; const container = this.#createElement('div'); const input = this.#createElement('input', properties, additionalProperties); this.buildElement(); const button = this.#createElement('button', { textContent: text }); this.buildElement(); this.buildElement(); input.setAttribute('tabindex', '-1'); input.setAttribute('aria-hidden', 'true'); button.addEventListener('click', () => { input.click(); }); input.addEventListener('change', () => { button.style.maxWidth = `${button.offsetWidth}px`; if (input.files.length > 0) { button.textContent = input.files[0].name; } else { button.textContent = text; } }); callback(this, container, input, button); return this; }
    addTextarea(additionalProperties = {}, callback = () => {}) { const textarea = this.#createElement('textarea', {}, additionalProperties); callback(this, textarea); return this; }
  }

  // --- Módulo: src/core/Template.js ---
  class Template {
    constructor({ displayName = 'Meu Template', authorId = '', coords = [0,0,0,0], chunks = {} }) {
        this.id = crypto.randomUUID();
        this.displayName = displayName;
        this.authorId = authorId;
        this.coords = coords;
        this.pixelCount = 0;
        this.width = 0;
        this.height = 0;
        this.chunks = chunks; // Pode ser inicializado com chunks de base64
    }
    async processImage(file) {
        const TILE_SIZE = 1000;
        const RENDER_SCALE = 3;
        const mainBitmap = await createImageBitmap(file);
        this.width = mainBitmap.width;
        this.height = mainBitmap.height;
        this.pixelCount = this.width * this.height;
        const [startTileX, startTileY, startPixelX, startPixelY] = this.coords;
        const tempCanvas = new OffscreenCanvas(1, 1);
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const currentGlobalPixelX = startPixelX + x;
                const currentGlobalPixelY = startPixelY + y;
                const tileX = startTileX + Math.floor(currentGlobalPixelX / TILE_SIZE);
                const tileY = startTileY + Math.floor(currentGlobalPixelY / TILE_SIZE);
                const pixelXInTile = currentGlobalPixelX % TILE_SIZE;
                const pixelYInTile = currentGlobalPixelY % TILE_SIZE;
                const tileKey = `${tileX},${tileY}`;
                if (!this.chunks[tileKey]) {
                    const canvas = new OffscreenCanvas(TILE_SIZE * RENDER_SCALE, TILE_SIZE * RENDER_SCALE);
                    this.chunks[tileKey] = { canvas: canvas, ctx: canvas.getContext('2d') };
                    this.chunks[tileKey].ctx.imageSmoothingEnabled = false;
                }
                tempCtx.drawImage(mainBitmap, x, y, 1, 1, 0, 0, 1, 1);
                const pixelData = tempCtx.getImageData(0, 0, 1, 1).data;
                if (pixelData[3] === 0) continue;
                this.chunks[tileKey].ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
                this.chunks[tileKey].ctx.fillRect(pixelXInTile * RENDER_SCALE + 1, pixelYInTile * RENDER_SCALE + 1, 1, 1);
            }
        }
        for (const tileKey in this.chunks) {
            const chunk = this.chunks[tileKey];
            chunk.bitmap = await chunk.canvas.transferToImageBitmap();
            delete chunk.canvas;
            delete chunk.ctx;
        }
    }
    getChunkForTile(tileCoords) { const tileKey = `${tileCoords[0]},${tileCoords[1]}`; const chunk = this.chunks[tileKey]; if (chunk && chunk.bitmap) { return { bitmap: chunk.bitmap, drawX: 0, drawY: 0 }; } return null; }
    toJSON() {
        const serializableChunks = {};
        for (const key in this.chunks) {
            // Esta é uma simplificação. A serialização real de ImageBitmap para base64 é complexa.
            // Para o Firestore, seria melhor salvar a imagem original e reprocessá-la no carregamento.
            // Por enquanto, não salvaremos os chunks.
        }
        return { id: this.id, displayName: this.displayName, authorId: this.authorId, coords: this.coords, width: this.width, height: this.height, pixelCount: this.pixelCount, /* chunks: serializableChunks */ };
    }
    static async fromJSON(jsonData) { const template = new Template(jsonData); template.id = jsonData.id; template.width = jsonData.width; template.height = jsonData.height; template.pixelCount = jsonData.pixelCount; return template; }
  }

  // --- Módulo: src/components/UIManager.js ---
  class UIManager {
    constructor(name, version) { this.name = name; this.version = version; this.authManager = null; this.templateManager = null; this.overlayBuilder = new Overlay(); this.isMinimized = false; this.outputStatusId = 'wgram-output-status'; }
    updateElement(id, html, isSafe = false) { const element = document.getElementById(id.replace(/^#/, '')); if (!element) return; if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) { element.value = html; } else { element[isSafe ? 'textContent' : 'innerHTML'] = html; } }
    displayStatus(text) { console.info(`[${this.name}] Status: ${text}`); this.updateElement(this.outputStatusId, `Status: ${text}`, true); }
    displayError(text) { console.error(`[${this.name}] Erro: ${text}`); this.updateElement(this.outputStatusId, `Erro: ${text}`, true); }
    handleDrag(moveElementId, handleId) { const moveMe = document.getElementById(moveElementId); const iMoveThings = document.getElementById(handleId); if (!moveMe || !iMoveThings) { this.displayError(`Elemento de arrastar não encontrado: ${moveElementId} ou ${handleId}`); return; } let isDragging = false, offsetX = 0, offsetY = 0; const startDrag = (clientX, clientY) => { isDragging = true; const rect = moveMe.getBoundingClientRect(); offsetX = clientX - rect.left; offsetY = clientY - rect.top; iMoveThings.classList.add('dragging'); document.body.style.userSelect = 'none'; }; const doDrag = (clientX, clientY) => { if (!isDragging) return; moveMe.style.left = `${clientX - offsetX}px`; moveMe.style.top = `${clientY - offsetY}px`; }; const endDrag = () => { isDragging = false; iMoveThings.classList.remove('dragging'); document.body.style.userSelect = ''; }; iMoveThings.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY)); document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY)); document.addEventListener('mouseup', endDrag); }
    destroyOverlay(id) { const overlay = document.getElementById(id); if (overlay) { overlay.remove(); } }
    buildLoginOverlay() {
        this.destroyOverlay('wgram-overlay'); // Garante que a UI principal não está visível
        this.overlayBuilder.addDiv({ id: 'wgram-login-overlay' })
            .addHeader(2, { textContent: `Login - ${this.name}` }).buildElement()
            .addInput({ id: 'wgram-email', type: 'email', placeholder: 'Email' }).buildElement()
            .addInput({ id: 'wgram-password', type: 'password', placeholder: 'Senha' }).buildElement()
            .addDiv({ id: 'wgram-login-buttons' })
                .addButton({ textContent: 'Entrar' }, (_, btn) => btn.onclick = () => this.authManager.logIn(document.getElementById('wgram-email').value, document.getElementById('wgram-password').value))
                .buildElement()
                .addButton({ textContent: 'Registar' }, (_, btn) => btn.onclick = () => this.authManager.signUp(document.getElementById('wgram-email').value, document.getElementById('wgram-password').value))
                .buildElement()
            .buildElement()
            .addP({id: 'wgram-auth-status', textContent: 'Por favor, entre ou registe-se.'}).buildElement()
        .buildElement()
        .buildOverlay(document.body);
    }
    buildMainOverlay(user) {
        this.destroyOverlay('wgram-login-overlay');
        this.overlayBuilder.addDiv({ id: 'wgram-overlay' })
            .addDiv({ id: 'wgram-header' })
                .addDiv({ id: 'wgram-drag-handle' }).buildElement()
                .addImg({ alt: 'Ícone do Wgram', src: 'https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/icon.png', style: 'cursor: pointer;' }, (_, img) => img.addEventListener('click', () => this.#toggleMinimize())).buildElement()
                .addHeader(1, { textContent: this.name }).buildElement()
            .buildElement()
            .addHr().buildElement()
            .addDiv({ id: 'wgram-user-profile' })
                .addSmall({ textContent: user.email }).buildElement()
                .addButton({ textContent: 'Logout', id: 'wgram-logout-btn' }, (_, btn) => btn.onclick = () => this.authManager.logOut())
                .buildElement()
            .buildElement()
            .addHr().buildElement()
            .addDiv({ id: 'wgram-template-controls' })
                .addDiv({ id: 'wgram-coords-container' }).addInput({ type: 'number', id: 'wgram-input-tx', placeholder: 'Tl X' }).buildElement().addInput({ type: 'number', id: 'wgram-input-ty', placeholder: 'Tl Y' }).buildElement().addInput({ type: 'number', id: 'wgram-input-px', placeholder: 'Px X' }).buildElement().addInput({ type: 'number', id: 'wgram-input-py', placeholder: 'Px Y' }).buildElement().buildElement()
                .addInputFile({ id: 'wgram-input-file', textContent: 'Carregar Template' }).buildElement()
                .addDiv({ id: 'wgram-template-buttons' }).addButton({ id: 'wgram-btn-create', textContent: 'Criar' }, (_, btn) => { btn.onclick = () => this.#handleCreateTemplate(); }).buildElement().addButton({ id: 'wgram-btn-enable', textContent: 'Ativar' }, (_, btn) => { btn.onclick = () => this.templateManager.setTemplatesShouldBeDrawn(true); }).buildElement().addButton({ id: 'wgram-btn-disable', textContent: 'Desativar' }, (_, btn) => { btn.onclick = () => this.templateManager.setTemplatesShouldBeDrawn(false); }).buildElement().buildElement()
            .buildElement()
            .addTextarea({ id: this.outputStatusId, placeholder: `Status: Pronto...\nVersão: ${this.version}`, readOnly: true }).buildElement()
        .buildElement()
        .buildOverlay(document.body);
        this.handleDrag('wgram-overlay', 'wgram-drag-handle');
    }
    #handleCreateTemplate() { const fileInput = document.getElementById('wgram-input-file'); const tx = document.getElementById('wgram-input-tx').value; const ty = document.getElementById('wgram-input-ty').value; const px = document.getElementById('wgram-input-px').value; const py = document.getElementById('wgram-input-py').value; if (!fileInput.files || fileInput.files.length === 0) { return this.displayError('Nenhum arquivo de template selecionado.'); } if (!tx || !ty || !px || !py) { return this.displayError('Coordenadas incompletas. Clique na tela primeiro.'); } const file = fileInput.files[0]; const coords = [Number(tx), Number(ty), Number(px), Number(py)]; const name = file.name.replace(/\.[^/.]+$/, ''); this.templateManager.createTemplate(file, name, coords); }
    #toggleMinimize() { this.isMinimized = !this.isMinimized; const overlayElement = document.getElementById('wgram-overlay'); if (overlayElement) { overlayElement.classList.toggle('minimized', this.isMinimized); } this.displayStatus(this.isMinimized ? "Overlay minimizado." : "Overlay restaurado."); }
  }

  // --- Módulo: src/core/AuthManager.js (NOVO) ---
  class AuthManager {
      constructor(config, uiManager) {
          this.uiManager = uiManager;
          try {
              this.firebaseApp = firebase.initializeApp(config);
              this.auth = firebase.auth();
              this.db = firebase.firestore();
          } catch (e) {
              console.error("Erro ao inicializar o Firebase. Verifique as suas credenciais.", e);
              alert("Falha ao conectar com o Firebase. O script não pode continuar.");
          }
      }

      onAuthStateChanged(callback) {
          this.auth.onAuthStateChanged(callback);
      }

      async signUp(email, password) {
          try {
              await this.auth.createUserWithEmailAndPassword(email, password);
              this.uiManager.updateElement('wgram-auth-status', 'Registo bem-sucedido! A entrar...', true);
          } catch (error) {
              this.uiManager.updateElement('wgram-auth-status', `Erro no registo: ${error.message}`, true);
          }
      }

      async logIn(email, password) {
          try {
              await this.auth.signInWithEmailAndPassword(email, password);
          } catch (error) {
              this.uiManager.updateElement('wgram-auth-status', `Erro no login: ${error.message}`, true);
          }
      }

      async logOut() {
          await this.auth.signOut();
      }
  }

  // --- Módulo: src/core/TemplateManager.js (MODIFICADO) ---
  class TemplateManager {
    constructor(scriptName, scriptVersion, uiManager, authManager) {
        this.scriptName = scriptName;
        this.scriptVersion = scriptVersion;
        this.uiManager = uiManager;
        this.authManager = authManager;
        this.userId = null;
        this.templates = [];
        this.templatesShouldBeDrawn = true;
    }
    setUserId(id) { this.userId = id; }
    async loadTemplates() {
        if (!this.userId) {
            console.log("[Wgram] Nenhum utilizador logado, não é possível carregar templates.");
            return;
        }
        try {
            const docRef = this.authManager.db.collection('users').doc(this.userId).collection('templates').doc('userTemplate');
            const doc = await docRef.get();
            if (doc.exists) {
                const templateData = doc.data();
                // A lógica de recriar o template a partir dos dados do Firestore seria mais complexa
                // Por agora, apenas carregamos os metadados.
                this.templates = [new Template(templateData)];
                this.uiManager.displayStatus(`${this.templates.length} template(s) carregado(s) da nuvem.`);
            } else {
                this.templates = [];
                this.uiManager.displayStatus("Nenhum template encontrado na nuvem.");
            }
        } catch (error) {
            this.uiManager.displayError("Falha ao carregar templates da nuvem.");
            console.error(error);
        }
    }
    async #saveTemplates() {
        if (!this.userId || this.templates.length === 0) return;
        try {
            const templateData = this.templates[0].toJSON(); // Salva apenas o primeiro template
            const docRef = this.authManager.db.collection('users').doc(this.userId).collection('templates').doc('userTemplate');
            await docRef.set(templateData);
            this.uiManager.displayStatus("Template salvo na nuvem com sucesso!");
        } catch (error) {
            this.uiManager.displayError("Falha ao salvar o template na nuvem.");
            console.error(error);
        }
    }
    async createTemplate(file, name, coords) { this.uiManager.displayStatus(`Processando "${name}"...`); try { const authorId = this.userId; const template = new Template({ displayName: name, authorId: authorId, coords: coords }); await template.processImage(file); this.templates = [template]; await this.#saveTemplates(); } catch (error) { this.uiManager.displayError(`Falha ao criar template: ${error.message}`); console.error(error); } }
    async drawTemplateOnTile(tileBlob, tileCoords) { if (!this.templatesShouldBeDrawn || this.templates.length === 0) { return tileBlob; } const RENDER_SCALE = 3; const tileBitmap = await createImageBitmap(tileBlob); const scaledWidth = tileBitmap.width * RENDER_SCALE; const scaledHeight = tileBitmap.height * RENDER_SCALE; const canvas = new OffscreenCanvas(scaledWidth, scaledHeight); const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(tileBitmap, 0, 0, scaledWidth, scaledHeight); for (const template of this.templates) { const chunk = template.getChunkForTile(tileCoords); if (chunk) { ctx.drawImage(chunk.bitmap, 0, 0); } } return await canvas.convertToBlob({ type: 'image/png' }); }
    setTemplatesShouldBeDrawn(shouldDraw) { this.templatesShouldBeDrawn = shouldDraw; this.uiManager.displayStatus(`Templates ${shouldDraw ? 'ativados' : 'desativados'}.`); }
  }

  // --- Módulo: src/core/ApiManager.js ---
  class ApiManager {
    constructor(templateManager, uiManager) { this.templateManager = templateManager; this.uiManager = uiManager; this.disableAll = false; this.coordsTilePixel = []; }
    initializeApiListener() { window.addEventListener('message', async (event) => { const { data } = event; if (!data || !data.isWgramMessage || data.source !== 'wgram-spy') { return; } const endpoint = this.#parseEndpoint(data.endpoint); if (endpoint === 'tiles') { await this.#handleTileResponse(data); return; } if (data.jsonData) { this.#handleJsonResponse(endpoint, data.jsonData, data.endpoint); } }); }
    #parseEndpoint(url) { if (!url) return ''; return url.split('?')[0].split('/').filter(s => s && isNaN(Number(s)) && !s.includes('.')).pop() || ''; }
    #handleJsonResponse(endpoint, jsonData, fullUrl) { switch (endpoint) { case 'me': this.#processUserData(jsonData); break; case 'pixel': this.#processPixelCoords(fullUrl); break; case 'robots': this.disableAll = jsonData.userscript?.toString().toLowerCase() === 'false'; if (this.disableAll) { this.uiManager.displayError("O script foi desativado pelo proprietário do site."); } break; } }
    #processUserData(data) { /* Não é mais necessário, o perfil é mostrado na UI principal */ }
    #processPixelCoords(url) { const tileCoords = url.split('?')[0].split('/').filter(s => s && !isNaN(Number(s))); const payload = new URLSearchParams(url.split('?')[1]); const pixelCoords = [payload.get('x'), payload.get('y')]; if (tileCoords.length < 2 || !pixelCoords[0] || !pixelCoords[1]) { this.uiManager.displayError("Coordenadas recebidas são inválidas."); return; } this.coordsTilePixel = [...tileCoords, ...pixelCoords].map(Number); this.uiManager.updateElement('wgram-input-tx', this.coordsTilePixel[0]); this.uiManager.updateElement('wgram-input-ty', this.coordsTilePixel[1]); this.uiManager.updateElement('wgram-input-px', this.coordsTilePixel[2]); this.uiManager.updateElement('wgram-input-py', this.coordsTilePixel[3]); }
    async #handleTileResponse(data) { let tileCoords = data.endpoint.split('/'); tileCoords = [parseInt(tileCoords[tileCoords.length - 2], 10), parseInt(tileCoords[tileCoords.length - 1].replace('.png', ''), 10)]; const { blobID, blobData, blink } = data; const modifiedBlob = await this.templateManager.drawTemplateOnTile(blobData, tileCoords); window.postMessage({ isWgramMessage: true, source: 'wgram-main', blobID: blobID, blobData: modifiedBlob, blink: blink }, '*'); }
  }

  // --- Módulo: src/core/Injector.js ---
  class Injector {
    injectFetchSpy() {
        const spyFunction = function() {
            const SCRIPT_NAME = 'Wgram';
            const SPY_SOURCE = 'wgram-spy';
            const MAIN_SOURCE = 'wgram-main';
            const originalFetch = window.fetch;
            const fetchedBlobQueue = new Map();
            window.addEventListener('message', (event) => {
                const { data } = event;
                if (!data || !data.isWgramMessage || data.source !== MAIN_SOURCE) { return; }
                const resolveCallback = fetchedBlobQueue.get(data.blobID);
                if (typeof resolveCallback === 'function') {
                    resolveCallback(data.blobData);
                    fetchedBlobQueue.delete(data.blobID);
                }
            });
            window.fetch = async function(...args) {
                const response = await originalFetch.apply(this, args);
                const clonedResponse = response.clone();
                const url = (args[0] instanceof Request) ? args[0].url : (args[0] || '');
                const contentType = clonedResponse.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    clonedResponse.json().then(jsonData => { window.postMessage({ isWgramMessage: true, source: SPY_SOURCE, endpoint: url, jsonData: jsonData }, '*'); }).catch(err => { console.error(`[${SCRIPT_NAME}] Erro ao processar JSON:`, err); });
                } else if (contentType.includes('image/') && !url.includes('openfreemap') && !url.includes('maps')) {
                    const blob = await clonedResponse.blob();
                    return new Promise((resolve) => {
                        const blobUUID = crypto.randomUUID();
                        fetchedBlobQueue.set(blobUUID, (processedBlob) => { resolve(new Response(processedBlob, { headers: clonedResponse.headers, status: clonedResponse.status, statusText: clonedResponse.statusText })); });
                        window.postMessage({ isWgramMessage: true, source: SPY_SOURCE, endpoint: url, blobID: blobUUID, blobData: blob, blink: Date.now() }, '*');
                    });
                }
                return response;
            };
        };
        const script = document.createElement('script');
        script.textContent = `(${spyFunction.toString()})();`;
        document.documentElement.appendChild(script);
        script.remove();
    }
  }

  // --- Módulo: src/main.js (MODIFICADO) ---
  class WgramScript {
    constructor() {
        this.info = { name: GM_info.script.name, version: GM_info.script.version };
        this.uiManager = new UIManager(this.info.name, this.info.version);
        this.authManager = new AuthManager(FIREBASE_CONFIG, this.uiManager);
        this.templateManager = new TemplateManager(this.info.name, this.info.version, this.uiManager, this.authManager);
        this.apiManager = new ApiManager(this.templateManager, this.uiManager);
        this.injector = new Injector();
        this.uiManager.authManager = this.authManager;
        this.uiManager.templateManager = this.templateManager;
    }
    async start() {
        console.log(`[${this.info.name}] v${this.info.version} a iniciar...`);
        this.injectCSS();
        this.authManager.onAuthStateChanged(async (user) => {
            if (user) {
                // Utilizador está logado
                console.log("Utilizador logado:", user.email);
                this.uiManager.buildMainOverlay(user);
                this.templateManager.setUserId(user.uid);
                await this.templateManager.loadTemplates();
                this.injector.injectFetchSpy();
                this.apiManager.initializeApiListener();
            } else {
                // Utilizador não está logado
                console.log("Nenhum utilizador logado.");
                this.uiManager.destroyOverlay('wgram-overlay');
                this.uiManager.buildLoginOverlay();
            }
        });
    }
    injectCSS() { try { const css = GM_getResourceText('WGRAM_CSS'); if (css) { GM_addStyle(css); } else { console.warn(`[${this.info.name}] Recurso CSS 'WGRAM_CSS' não encontrado.`); } } catch (error) { console.error(`[${this.info.name}] Falha ao injetar CSS:`, error); } }
  }

  const wgram = new WgramScript();
  wgram.start();

})();