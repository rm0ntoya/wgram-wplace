// ==UserScript==
// @name         Wgram
// @namespace    https://github.com/rm0ntoya
// @version      1.6.1
// @description  Um script de usuário para carregar templates e partilhar coordenadas do WGram.
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
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js

// @run-at       document-end

// @resource     WGRAM_CSS https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/style.css
// @updateURL    https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/Wgram.meta.js
// @downloadURL  https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/Wgram.user.js
// ==/UserScript==

(() => {
  'use strict';

  // --- Módulo: src/utils/constants.js ---
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCERXiWRK8bmkAG-evSXBnwhSOjFWXyym8",
    authDomain: "wplace-a0f34.firebaseapp.com",
    projectId: "wplace-a0f34",
    storageBucket: "wplace-a0f34.appspot.com",
    messagingSenderId: "169855531458",
    appId: "1:169855531458:web:8e2e2a4b809fc4605b7e5b"
  };

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
    addButton(additionalProperties = {}, callback = () => {}) { const button = this.#createElement('button', {}, additionalProperties); callback(this, button); return this; }
    addInput(additionalProperties = {}, callback = () => {}) { const input = this.#createElement('input', {}, additionalProperties); callback(this, input); return this; }
    addTextarea(additionalProperties = {}, callback = () => {}) { const textarea = this.#createElement('textarea', {}, additionalProperties); callback(this, textarea); return this; }
  }

  // --- Módulo: src/core/Template.js ---
  class Template {
    constructor({ displayName = 'Template Carregado', authorId = '', coords = [0,0,0,0], chunks = {} }) { this.id = crypto.randomUUID(); this.displayName = displayName; this.authorId = authorId; this.coords = coords; this.pixelCount = 0; this.width = 0; this.height = 0; this.chunks = chunks; }
    async processImage(dataSource) { const TILE_SIZE = 1000; const RENDER_SCALE = 3; let imageSource = dataSource; if (typeof dataSource === 'string') { const img = new Image(); img.src = dataSource; await new Promise(resolve => img.onload = resolve); imageSource = img; } const mainBitmap = await createImageBitmap(imageSource); this.width = mainBitmap.width; this.height = mainBitmap.height; this.pixelCount = this.width * this.height; const [startTileX, startTileY, startPixelX, startPixelY] = this.coords; const tempCanvas = new OffscreenCanvas(1, 1); const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true }); for (let y = 0; y < this.height; y++) { for (let x = 0; x < this.width; x++) { const currentGlobalPixelX = startPixelX + x; const currentGlobalPixelY = startPixelY + y; const tileX = startTileX + Math.floor(currentGlobalPixelX / TILE_SIZE); const tileY = startTileY + Math.floor(currentGlobalPixelY / TILE_SIZE); const pixelXInTile = currentGlobalPixelX % TILE_SIZE; const pixelYInTile = currentGlobalPixelY % TILE_SIZE; const tileKey = `${tileX},${tileY}`; if (!this.chunks[tileKey]) { const canvas = new OffscreenCanvas(TILE_SIZE * RENDER_SCALE, TILE_SIZE * RENDER_SCALE); this.chunks[tileKey] = { canvas: canvas, ctx: canvas.getContext('2d') }; this.chunks[tileKey].ctx.imageSmoothingEnabled = false; } tempCtx.drawImage(mainBitmap, x, y, 1, 1, 0, 0, 1, 1); const pixelData = tempCtx.getImageData(0, 0, 1, 1).data; if (pixelData[3] === 0) continue; this.chunks[tileKey].ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`; this.chunks[tileKey].ctx.fillRect(pixelXInTile * RENDER_SCALE + 1, pixelYInTile * RENDER_SCALE + 1, 1, 1); } } for (const tileKey in this.chunks) { const chunk = this.chunks[tileKey]; chunk.bitmap = await chunk.canvas.transferToImageBitmap(); delete chunk.canvas; delete chunk.ctx; } }
    getChunkForTile(tileCoords) { const tileKey = `${tileCoords[0]},${tileCoords[1]}`; const chunk = this.chunks[tileKey]; if (chunk && chunk.bitmap) { return { bitmap: chunk.bitmap, drawX: 0, drawY: 0 }; } return null; }
  }

  // --- Módulo: src/components/UIManager.js ---
  class UIManager {
    constructor(name, version) { this.name = name; this.version = version; this.authManager = null; this.apiManager = null; this.templateManager = null; this.overlayBuilder = new Overlay(); this.isMinimized = false; this.outputStatusId = 'wgram-output-status'; }
    updateElement(id, html, isSafe = false) { const element = document.getElementById(id.replace(/^#/, '')); if (!element) return; if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) { element.value = html; } else { element[isSafe ? 'textContent' : 'innerHTML'] = html; } }
    displayStatus(text) { console.info(`[${this.name}] Status: ${text}`); this.updateElement(this.outputStatusId, `Status: ${text}`, true); }
    displayError(text) { console.error(`[${this.name}] Erro: ${text}`); this.updateElement(this.outputStatusId, `Erro: ${text}`, true); }
    handleDrag(moveElementId, handleId) { const moveMe = document.getElementById(moveElementId); const iMoveThings = document.getElementById(handleId); if (!moveMe || !iMoveThings) { this.displayError(`Elemento de arrastar não encontrado: ${moveElementId} ou ${handleId}`); return; } let isDragging = false, offsetX = 0, offsetY = 0; const startDrag = (clientX, clientY) => { isDragging = true; const rect = moveMe.getBoundingClientRect(); offsetX = clientX - rect.left; offsetY = clientY - rect.top; iMoveThings.classList.add('dragging'); document.body.style.userSelect = 'none'; }; const doDrag = (clientX, clientY) => { if (!isDragging) return; moveMe.style.left = `${clientX - offsetX}px`; moveMe.style.top = `${clientY - offsetY}px`; }; const endDrag = () => { isDragging = false; iMoveThings.classList.remove('dragging'); document.body.style.userSelect = ''; }; iMoveThings.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY)); document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY)); document.addEventListener('mouseup', endDrag); }
    destroyOverlay(id) { const overlay = document.getElementById(id); if (overlay) { overlay.remove(); } }
    buildLoginOverlay() {
        this.destroyOverlay('wgram-overlay');
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
                .addInput({ id: 'wgram-project-id', type: 'text', placeholder: 'Cole o ID do Projeto/Coordenadas' }).buildElement()
                .addDiv({ id: 'wgram-project-info' })
                    .addP({ id: 'wgram-info-name' }).buildElement()
                    .addP({ id: 'wgram-info-creator' }).buildElement()
                    .addP({ id: 'wgram-info-pixels' }).buildElement()
                    .addP({ id: 'wgram-info-coords' }).buildElement()
                .buildElement()
                .addDiv({ id: 'wgram-coords-container', style: 'display: none;' })
                    .addInput({ type: 'number', id: 'wgram-input-tx', placeholder: 'Tl X' }).buildElement()
                    .addInput({ type: 'number', id: 'wgram-input-ty', placeholder: 'Tl Y' }).buildElement()
                    .addInput({ type: 'number', id: 'wgram-input-px', placeholder: 'Px X' }).buildElement()
                    .addInput({ type: 'number', id: 'wgram-input-py', placeholder: 'Px Y' }).buildElement()
                .buildElement()
                .addDiv({ id: 'wgram-template-buttons' })
                    .addButton({ id: 'wgram-btn-load', innerHTML: '<i class="fas fa-cloud-download-alt"></i> Carregar por ID' }, (_, btn) => { btn.onclick = () => this.#handleLoadProject(); })
                    .buildElement()
                    .addButton({ id: 'wgram-btn-copy-coords', innerHTML: '<i class="fas fa-map-pin"></i> Copiar ID das Coordenadas' }, (_, btn) => { btn.onclick = () => this.#handleCopyCoordsId(); })
                    .buildElement()
                .buildElement()
                .addSmall({
                    id: 'wgram-site-promo',
                    innerHTML: 'Não tem um ID? Visite <a href="https://wgram.discloud.app" target="_blank">wgram.discloud.app</a>'
                }).buildElement()
            .buildElement()
            .addTextarea({ id: this.outputStatusId, placeholder: `Status: Pronto...\nVersão: ${this.version}`, readOnly: true }).buildElement()
            .addDiv({ id: 'wgram-credits' })
                .addSmall({ innerHTML: 'Criado por <strong>Ruan Pablo</strong> (@rp.xyz)' })
                .buildElement()
        .buildElement()
        .buildOverlay(document.body);
        this.handleDrag('wgram-overlay', 'wgram-drag-handle');
    }
    #handleLoadProject() {
        const projectId = document.getElementById('wgram-project-id').value.trim();
        if (!projectId) { return this.displayError("Por favor, insira um ID."); }
        this.templateManager.loadItemFromFirestore(projectId);
    }
    #handleCopyCoordsId() {
        const coords = this.apiManager.getCurrentCoords();
        if (!coords || coords.length < 4) {
            return this.displayError("Clique no mapa primeiro para definir as coordenadas.");
        }
        this.authManager.saveAndCopyCoordsId(coords);
    }
    toggleCoordsFields(show) { const coordsContainer = document.getElementById('wgram-coords-container'); if (coordsContainer) { coordsContainer.style.display = show ? 'grid' : 'none'; } }
    displayProjectInfo(project) {
        const infoContainer = document.getElementById('wgram-project-info');
        const coordsContainer = document.getElementById('wgram-info-coords');
        if (infoContainer) {
            this.updateElement('wgram-info-name', `<i class="fa-solid fa-file-signature fa-fw"></i> <strong>Nome:</strong> <span>${project.name}</span>`);
            this.updateElement('wgram-info-creator', `<i class="fa-solid fa-user fa-fw"></i> <strong>Criador:</strong> <span>${project.owner}</span>`);
            this.updateElement('wgram-info-pixels', `<i class="fa-solid fa-th fa-fw"></i> <strong>Píxeis:</strong> <span>${project.pixels.toLocaleString('pt-BR')}</span>`);
            if (project.coords) {
                this.updateElement('wgram-info-coords', `<i class="fa-solid fa-map-marker-alt fa-fw"></i> <strong>Coords:</strong> <span>${project.coords.join(', ')}</span>`);
                coordsContainer.style.display = 'flex';
            } else {
                coordsContainer.style.display = 'none';
            }
            infoContainer.classList.add('visible');
        }
    }
    hideInfoAndCoords() {
        const infoContainer = document.getElementById('wgram-project-info');
        if (infoContainer) infoContainer.classList.remove('visible');
        this.toggleCoordsFields(false);
    }
    #toggleMinimize() { this.isMinimized = !this.isMinimized; const overlayElement = document.getElementById('wgram-overlay'); if (overlayElement) { overlayElement.classList.toggle('minimized', this.isMinimized); } this.displayStatus(this.isMinimized ? "Overlay minimizado." : "Overlay restaurado."); }
  }

  // --- Módulo: src/core/AuthManager.js (CORRIGIDO) ---
  class AuthManager {
      constructor(config, uiManager) { this.uiManager = uiManager; try { this.firebaseApp = firebase.initializeApp(config); this.auth = firebase.auth(); this.db = firebase.firestore(); } catch (e) { console.error("Erro ao inicializar o Firebase.", e); alert("Falha ao conectar com o Firebase."); } }
      onAuthStateChanged(callback) { this.auth.onAuthStateChanged(callback); }
      async signUp(email, password) { try { await this.auth.createUserWithEmailAndPassword(email, password); this.uiManager.updateElement('wgram-auth-status', 'Registo bem-sucedido! A entrar...', true); } catch (error) { this.uiManager.updateElement('wgram-auth-status', `Erro no registo: ${error.message}`, true); } }
      async logIn(email, password) { try { await this.auth.signInWithEmailAndPassword(email, password); } catch (error) { this.uiManager.updateElement('wgram-auth-status', `Erro no login: ${error.message}`, true); } }
      async logOut() { await this.auth.signOut(); }
async saveAndCopyCoordsId(coords) {
        const user = this.auth.currentUser;
        if (!user) { return this.uiManager.displayError("Precisa de estar logado para partilhar coordenadas."); }

        // --- INÍCIO DAS MODIFICAÇÕES ---

        // 1. Inicializar as variáveis de localização como nulas.
        //    Isso garante que, se algo falhar, salvaremos um valor nulo em vez de dar erro.
        let locationLat = null;
        let locationLng = null;
        let locationZoom = null;
        let locationUrl = null;

        try {
            // 2. Ler a string JSON do localStorage.
            const locationString = localStorage.getItem('location');
            if (locationString) {
                // 3. Analisar (parse) a string JSON para um objeto.
                const locationData = JSON.parse(locationString);
                
                // 4. Atribuir os valores às nossas variáveis.
                locationLat = locationData.lat || null;
                locationLng = locationData.lng || null;
                locationZoom = locationData.zoom || null;

                // 5. Construir a URL com os dados obtidos.
                if (locationLat && locationLng && locationZoom) {
                    locationUrl = `https://wplace.live/?lat=${locationLat}&lng=${locationLng}&zoom=${locationZoom}`;
                }
            }
        } catch (e) {
            console.error("Wgram: Erro ao ler ou analisar 'location' do localStorage.", e);
            // As variáveis permanecerão nulas, então o processo continua sem falhar.
        }

        // --- FIM DAS MODIFICAÇÕES ---

        const hexId = Math.random().toString(16).substr(2, 8);
        const userDocRef = this.db.collection('users').doc(user.uid);
        
        try {
            const userDoc = await userDocRef.get();
            const wplaceUsername = userDoc.exists ? userDoc.data().wplaceUsername : 'Desconhecido';

            const coordsData = {
                coords: {
                    tl_x: coords[0], tl_y: coords[1],
                    px_x: coords[2], px_y: coords[3],
                },
                
                // --- ADIÇÃO DOS NOVOS CAMPOS ---
                location: {
                    lat: locationLat,
                    lng: locationLng,
                    zoom: locationZoom
                },
                locationUrl: locationUrl, // O link completo
                // ---------------------------------

                creatorId: user.uid,
                creatorEmail: user.email,
                creatorWplaceUser: wplaceUsername,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('sharedCoords').doc(hexId).set(coordsData);
            
            navigator.clipboard.writeText(hexId);
            this.uiManager.displayStatus(`ID de Coordenadas "${hexId}" copiado!`);

        } catch (error) {
            this.uiManager.displayError("Falha ao salvar coordenadas.");
            console.error(error);
        }
    }
  }

  // --- Módulo: src/core/TemplateManager.js (CORRIGIDO) ---
  class TemplateManager {
    constructor(scriptName, scriptVersion, uiManager, authManager) { this.scriptName = scriptName; this.scriptVersion = scriptVersion; this.uiManager = uiManager; this.authManager = authManager; this.userId = null; this.templates = []; this.templatesShouldBeDrawn = true; }
    setUserId(id) { this.userId = id; }
// Wgram.user.js - VERSÃO FINAL CORRIGIDA
// Wgram.user.js - VERSÃO FINAL COM A SINTAXE CORRIGIDA
async loadItemFromFirestore(id) {
    this.uiManager.displayStatus(`A procurar ID ${id}...`);
    this.uiManager.hideInfoAndCoords();

    const projectDocRef = this.authManager.db.collection('publicProjects').doc(id);
    let docSnap = await projectDocRef.get();

    // CORREÇÃO 1: Removido os parênteses de .exists()
    if (!docSnap.exists) {
        const coordsDocRef = this.authManager.db.collection('sharedCoords').doc(id);
        docSnap = await coordsDocRef.get();
    }

    // CORREÇÃO 2: Removido os parênteses de .exists()
    if (!docSnap.exists) {
        return this.uiManager.displayError("Nenhum projeto ou coordenadas encontrados com este ID.");
    }

    const data = docSnap.data();

    const redirectUrl = data.coordinates ? data.coordinates.url : null;

    if (redirectUrl && redirectUrl !== window.location.href.split('#')[0]) {
        this.uiManager.displayStatus(`Redirecionando para a localização do projeto...`);
        
        sessionStorage.setItem('wgram_pending_load', id);
        
        window.location.href = redirectUrl;
        
        return; 
    }

    if (data.processedImageBase64) {
        await this.loadProject(docSnap);
    } 
    else if (data.coords) {
        await this.loadCoords(docSnap);
    }
}
    async loadProject(doc) {
        const projectData = doc.data();
        const { processedImageBase64, name, coordinates, ownerName, calculations } = projectData;
        if (!processedImageBase64) { return this.uiManager.displayError("O projeto encontrado não contém uma imagem de template."); }
        const coordsArray = coordinates ? [coordinates.tl_x, coordinates.tl_y, coordinates.px_x, coordinates.px_y].map(Number) : null;
        this.uiManager.displayProjectInfo({ name: name, owner: ownerName, pixels: calculations.totalPixels, coords: coordsArray });
        await doc.ref.update({ loads: firebase.firestore.FieldValue.increment(1) });
        if (coordsArray) {
            this.uiManager.toggleCoordsFields(false);
            await this.createTemplateFromBase64(processedImageBase64, name, coordsArray);
        } else {
            this.uiManager.displayError("Projeto não tem coordenadas. Por favor, insira-as.");
            this.uiManager.toggleCoordsFields(true);
            const loadBtn = document.getElementById('wgram-btn-load');
            const tempListener = async () => {
                const tx = document.getElementById('wgram-input-tx').value; const ty = document.getElementById('wgram-input-ty').value;
                const px = document.getElementById('wgram-input-px').value; const py = document.getElementById('wgram-input-py').value;
                if (!tx || !ty || !px || !py) { return this.uiManager.displayError('Coordenadas incompletas.'); }
                const manualCoordsArray = [tx, ty, px, py].map(Number);
                await this.createTemplateFromBase64(processedImageBase64, name, manualCoordsArray);
                loadBtn.removeEventListener('click', tempListener);
            };
            loadBtn.addEventListener('click', tempListener);
        }
    }
    async loadCoords(doc) {
        const data = doc.data();
        const { coords } = data;
        const url = `https://wplace.live/#/${coords.tl_x}/${coords.tl_y}/${coords.px_x}/${coords.px_y}`;
        window.open(url, '_self');
        this.uiManager.displayStatus(`A navegar para as coordenadas partilhadas por ${data.creatorWplaceUser}.`);
    }
    async createTemplateFromBase64(base64, name, coords) { this.uiManager.displayStatus(`A processar o template "${name}"...`); try { const template = new Template({ displayName: name, coords: coords }); await template.processImage(base64); this.templates = [template]; this.uiManager.displayStatus(`Template "${name}" carregado com sucesso!`); this.setTemplatesShouldBeDrawn(true); } catch (error) { this.uiManager.displayError(`Falha ao processar o template: ${error.message}`); console.error(error); } }
    async drawTemplateOnTile(tileBlob, tileCoords) { if (!this.templatesShouldBeDrawn || this.templates.length === 0) { return tileBlob; } const RENDER_SCALE = 3; const tileBitmap = await createImageBitmap(tileBlob); const scaledWidth = tileBitmap.width * RENDER_SCALE; const scaledHeight = tileBitmap.height * RENDER_SCALE; const canvas = new OffscreenCanvas(scaledWidth, scaledHeight); const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(tileBitmap, 0, 0, scaledWidth, scaledHeight); for (const template of this.templates) { const chunk = template.getChunkForTile(tileCoords); if (chunk) { ctx.drawImage(chunk.bitmap, 0, 0); } } return await canvas.convertToBlob({ type: 'image/png' }); }
    setTemplatesShouldBeDrawn(shouldDraw) { this.templatesShouldBeDrawn = shouldDraw; this.uiManager.displayStatus(`Templates ${shouldDraw ? 'ativados' : 'desativados'}.`); }
  }

  // --- Módulo: src/core/ApiManager.js ---
  class ApiManager {
    constructor(templateManager, uiManager) { this.templateManager = templateManager; this.uiManager = uiManager; this.disableAll = false; this.coordsTilePixel = []; }
    initializeApiListener() { window.addEventListener('message', async (event) => { const { data } = event; if (!data || !data.isWgramMessage || data.source !== 'wgram-spy') { return; } const endpoint = this.#parseEndpoint(data.endpoint); if (endpoint === 'tiles') { await this.#handleTileResponse(data); return; } if (data.jsonData) { this.#handleJsonResponse(endpoint, data.jsonData, data.endpoint); } }); }
    #parseEndpoint(url) { if (!url) return ''; return url.split('?')[0].split('/').filter(s => s && isNaN(Number(s)) && !s.includes('.')).pop() || ''; }
    #handleJsonResponse(endpoint, jsonData, fullUrl) { switch (endpoint) { case 'pixel': this.#processPixelCoords(fullUrl); break; } }
    #processPixelCoords(url) { const tileCoords = url.split('?')[0].split('/').filter(s => s && !isNaN(Number(s))); const payload = new URLSearchParams(url.split('?')[1]); const pixelCoords = [payload.get('x'), payload.get('y')]; if (tileCoords.length < 2 || !pixelCoords[0] || !pixelCoords[1]) { return; } this.coordsTilePixel = [...tileCoords, ...pixelCoords].map(Number); }
    getCurrentCoords() { return this.coordsTilePixel; }
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

  // --- Módulo: src/main.js ---
  class WgramScript {
    constructor() { this.info = { name: GM_info.script.name, version: GM_info.script.version }; this.uiManager = new UIManager(this.info.name, this.info.version); this.authManager = new AuthManager(FIREBASE_CONFIG, this.uiManager); this.templateManager = new TemplateManager(this.info.name, this.info.version, this.uiManager, this.authManager); this.apiManager = new ApiManager(this.templateManager, this.uiManager); this.injector = new Injector(); this.uiManager.authManager = this.authManager; this.uiManager.templateManager = this.templateManager; this.uiManager.apiManager = this.apiManager; }
    async start() {
        console.log(`[${this.info.name}] v${this.info.version} a iniciar...`);
        this.injectCSS();
        this.authManager.onAuthStateChanged(async (user) => {
            if (user) {
                console.log("Utilizador logado:", user.email);
                this.uiManager.buildMainOverlay(user);
                this.templateManager.setUserId(user.uid);
                this.injector.injectFetchSpy();
                this.apiManager.initializeApiListener();

                // --- LÓGICA DE CARREGAMENTO PENDENTE ---
                // 1. Verifica se há uma "intenção" salva no sessionStorage.
                const pendingLoadId = sessionStorage.getItem('wgram_pending_load');
                
                if (pendingLoadId) {
                    console.log(`[${this.info.name}] Encontrado carregamento pendente para o ID: ${pendingLoadId}`);
                    
                    // 2. Limpa o sessionStorage IMEDIATAMENTE para evitar re-execução.
                    sessionStorage.removeItem('wgram_pending_load');
                    
                    // 3. Executa o carregamento.
                    // Usamos um pequeno timeout para garantir que a UI esteja pronta.
                    setTimeout(() => this.templateManager.loadItemFromFirestore(pendingLoadId), 100);
                }

            } else {
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
