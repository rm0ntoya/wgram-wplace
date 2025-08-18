// ==UserScript==
// @name         Wgram
// @namespace    https://github.com/rm0ntoya
// @version      2.0.5
// @description  Um script de usuário para carregar templates, partilhar coordenadas e gerenciar o localStorage no WGram.
// @author       rm0ntoya
// @license      MPL-2.0
// @homepageURL  https://github.com/rm0ntoya/wgram-wplace
// @supportURL   https://github.com/rm0ntoya/wgram-wplace/issues
// @icon         https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/refs/heads/main/src/assets/icon.png

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
    
    #createElement(tag, isContainer, properties = {}, additionalProperties = {}) {
        const element = document.createElement(tag);
        for (const [property, value] of Object.entries(properties)) { element[property] = value; }
        for (const [property, value] of Object.entries(additionalProperties)) { element[property] = value; }

        if (!this.overlay) {
            this.overlay = element;
            this.currentParent = element;
        } else {
            this.currentParent?.appendChild(element);
            if (isContainer) {
                this.parentStack.push(this.currentParent);
                this.currentParent = element;
            }
        }
        return element;
    }

    buildElement() { if (this.parentStack.length > 0) { this.currentParent = this.parentStack.pop(); } return this; }
    buildOverlay(parent) { if (this.overlay && parent) { parent.appendChild(this.overlay); } this.overlay = null; this.currentParent = null; this.parentStack = []; }
    
    addDiv(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('div', true, {}, additionalProperties); callback(this, el); return this; }
    addP(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('p', true, {}, additionalProperties); callback(this, el); return this; }
    addSmall(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('small', true, {}, additionalProperties); callback(this, el); return this; }
    addHeader(level, additionalProperties = {}, callback = () => {}) { const el = this.#createElement(`h${level}`, true, {}, additionalProperties); callback(this, el); return this; }
    addSelect(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('select', true, {}, additionalProperties); callback(this, el); return this; }
    addLabel(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('label', true, {}, additionalProperties); callback(this, el); return this; }
    
    addImg(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('img', false, {}, additionalProperties); callback(this, el); return this; }
    addHr(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('hr', false, {}, additionalProperties); callback(this, el); return this; }
    addButton(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('button', false, {}, additionalProperties); callback(this, el); return this; }
    addInput(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('input', false, {}, additionalProperties); callback(this, el); return this; }
    addOption(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('option', false, {}, additionalProperties); callback(this, el); return this; }
    addTextarea(additionalProperties = {}, callback = () => {}) { const el = this.#createElement('textarea', false, {}, additionalProperties); callback(this, el); return this; }
  }

  // --- Módulo: src/core/Template.js ---
  class Template {
    constructor({ displayName = 'Template Carregado', authorId = '', coords = [0,0,0,0], chunks = {} }) { this.id = crypto.randomUUID(); this.displayName = displayName; this.authorId = authorId; this.coords = coords; this.pixelCount = 0; this.width = 0; this.height = 0; this.chunks = chunks; }
    async processImage(dataSource) { const TILE_SIZE = 1000; const RENDER_SCALE = 3; let imageSource = dataSource; if (typeof dataSource === 'string') { const img = new Image(); img.src = dataSource; await new Promise(resolve => img.onload = resolve); imageSource = img; } const mainBitmap = await createImageBitmap(imageSource); this.width = mainBitmap.width; this.height = mainBitmap.height; this.pixelCount = this.width * this.height; const [startTileX, startTileY, startPixelX, startPixelY] = this.coords; const tempCanvas = new OffscreenCanvas(1, 1); const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true }); for (let y = 0; y < this.height; y++) { for (let x = 0; x < this.width; x++) { const currentGlobalPixelX = startPixelX + x; const currentGlobalPixelY = startPixelY + y; const tileX = startTileX + Math.floor(currentGlobalPixelX / TILE_SIZE); const tileY = startTileY + Math.floor(currentGlobalPixelY / TILE_SIZE); const pixelXInTile = currentGlobalPixelX % TILE_SIZE; const pixelYInTile = currentGlobalPixelY % TILE_SIZE; const tileKey = `${tileX},${tileY}`; if (!this.chunks[tileKey]) { const canvas = new OffscreenCanvas(TILE_SIZE * RENDER_SCALE, TILE_SIZE * RENDER_SCALE); this.chunks[tileKey] = { canvas: canvas, ctx: canvas.getContext('2d') }; this.chunks[tileKey].ctx.imageSmoothingEnabled = false; } tempCtx.drawImage(mainBitmap, x, y, 1, 1, 0, 0, 1, 1); const pixelData = tempCtx.getImageData(0, 0, 1, 1).data; if (pixelData[3] === 0) continue; this.chunks[tileKey].ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`; this.chunks[tileKey].ctx.fillRect(pixelXInTile * RENDER_SCALE + 1, pixelYInTile * RENDER_SCALE + 1, 1, 1); } } for (const tileKey in this.chunks) { const chunk = this.chunks[tileKey]; chunk.bitmap = await chunk.canvas.transferToImageBitmap(); delete chunk.canvas; delete chunk.ctx; } }
    getChunkForTile(tileCoords) { const tileKey = `${tileCoords[0]},${tileCoords[1]}`; const chunk = this.chunks[tileKey]; if (chunk && chunk.bitmap) { return { bitmap: chunk.bitmap, drawX: 0, drawY: 0 }; } return null; }
  }

  // --- Módulo: src/components/UIManager.js ---
  class UIManager {
    constructor(name, version) {
        this.name = name;
        this.version = version;
        this.authManager = null;
        this.apiManager = null;
        this.templateManager = null;
        this.overlayBuilder = new Overlay();
        this.isMinimized = false;
        this.outputStatusId = 'wgram-output-status';
        this.isWaitingForCoords = false;
        this.coordCheckInterval = null;
        this.userProjects = [];
    }
    updateElement(id, html, isSafe = false) { const element = document.getElementById(id.replace(/^#/, '')); if (!element) return; if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) { element.value = html; } else { element[isSafe ? 'textContent' : 'innerHTML'] = html; } }
    displayStatus(text) { console.info(`[${this.name}] Status: ${text}`); this.updateElement(this.outputStatusId, `Status: ${text}`, true); }
    displayError(text) { console.error(`[${this.name}] Erro: ${text}`); this.updateElement(this.outputStatusId, `Erro: ${text}`, true); }
    handleDrag(moveElementId, handleId) { const moveMe = document.getElementById(moveElementId); const iMoveThings = document.getElementById(handleId); if (!moveMe || !iMoveThings) { this.displayError(`Elemento de arrastar não encontrado: ${moveElementId} ou ${handleId}`); return; } let isDragging = false, offsetX = 0, offsetY = 0; const startDrag = (clientX, clientY) => { isDragging = true; const rect = moveMe.getBoundingClientRect(); offsetX = clientX - rect.left; offsetY = clientY - rect.top; iMoveThings.classList.add('dragging'); document.body.style.userSelect = 'none'; }; const doDrag = (clientX, clientY) => { if (!isDragging) return; moveMe.style.left = `${clientX - offsetX}px`; moveMe.style.top = `${clientY - offsetY}px`; }; const endDrag = () => { isDragging = false; iMoveThings.classList.remove('dragging'); document.body.style.userSelect = ''; }; iMoveThings.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY)); document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY)); document.addEventListener('mouseup', endDrag); }
    destroyOverlay(id) { const overlay = document.getElementById(id); if (overlay) { overlay.remove(); } }
    buildMaintenanceOverlay(message) {
        this.destroyOverlay('wgram-overlay');
        this.destroyOverlay('wgram-login-overlay');
        this.overlayBuilder.addDiv({ 
            id: 'wgram-maintenance-overlay',
            style: `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #1f2937; color: #d1d5db; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); z-index: 9999; max-width: 400px; width: 90%; border: 1px solid #374151;`
        })
            .addDiv({ style: 'text-align: center;' })
                .addHeader(2, { innerHTML: '<i class="fas fa-tools" style="margin-right: 10px; color: #f59e0b;"></i> Em Manutenção' }).buildElement()
                .addP({ textContent: message, style: 'margin-top: 15px; font-size: 1.1em; color: #e5e7eb;' }).buildElement()
                .addSmall({ textContent: 'Por favor, tente novamente mais tarde.', style: 'margin-top: 20px; color: #9ca3af; display: block;' }).buildElement()
            .buildElement()
        .buildOverlay(document.body);
    }
    buildLoginOverlay() {
        this.destroyOverlay('wgram-overlay');
        this.overlayBuilder.addDiv({ id: 'wgram-login-overlay' })
            .addHeader(2, { textContent: `Login - ${this.name}` }).buildElement()
            .addInput({ id: 'wgram-email', type: 'email', placeholder: 'Email' })
            .addInput({ id: 'wgram-password', type: 'password', placeholder: 'Senha' })
            .addDiv({ id: 'wgram-login-buttons' })
                .addButton({ textContent: 'Entrar' }, (_, btn) => btn.onclick = () => this.authManager.logIn(document.getElementById('wgram-email').value, document.getElementById('wgram-password').value))
                .addButton({ textContent: 'Registar' }, (_, btn) => btn.onclick = () => this.authManager.signUp(document.getElementById('wgram-email').value, document.getElementById('wgram-password').value))
            .buildElement()
            .addP({id: 'wgram-auth-status', textContent: 'Por favor, entre ou registe-se.'}).buildElement()
        .buildElement()
        .buildOverlay(document.body);
    }
    buildMainOverlay(user, userData) {
        this.destroyOverlay('wgram-login-overlay');
        const wplaceUsername = userData.wplaceUsername || 'Não definido';

        this.overlayBuilder.addDiv({ id: 'wgram-overlay' })
            .addDiv({ id: 'wgram-header' })
                .addDiv({ id: 'wgram-drag-handle' }).buildElement()
                .addImg({ alt: 'Ícone do Wgram', src: 'https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/refs/heads/main/src/assets/icon.png', style: 'cursor: pointer;' }, (_, img) => img.addEventListener('click', () => this.#toggleMinimize()))
                .addHeader(1, { textContent: this.name }).buildElement()
            .buildElement()
            .addHr()
            .addDiv({ id: 'wgram-user-profile' })
                .addDiv({ id: 'wgram-user-info' })
                    .addSmall({ id: 'wgram-wplace-username', textContent: wplaceUsername, style: 'font-weight: bold; font-size: 1.1em;' }).buildElement()
                    .addSmall({ id: 'wgram-user-email', textContent: user.email, style: 'font-size: 0.8em; color: #9ca3af;' }).buildElement()
                .buildElement()
                .addButton({ textContent: 'Logout', id: 'wgram-logout-btn' }, (_, btn) => btn.onclick = () => this.authManager.logOut())
            .buildElement()
            .addHr()
            .addDiv({ id: 'wgram-template-controls' })
                .addHeader(4, { textContent: 'Meus Projetos' }).buildElement()
                .addSelect({ id: 'wgram-project-selector' })
                    .addOption({ value: '', textContent: 'Carregando projetos...' })
                .buildElement()
                .addButton({ id: 'wgram-btn-load-selected', innerHTML: '<i class="fas fa-check"></i> Carregar Selecionado' }, (_, btn) => { btn.onclick = () => this.#handleLoad(); })
                .addHr({ style: 'margin: 15px 0;' })
                .addHeader(4, { textContent: 'Carregar por ID Público' }).buildElement()
                .addInput({ id: 'wgram-project-id', type: 'text', placeholder: 'Cole o ID do Projeto/Coordenadas' })
                .addDiv({ id: 'wgram-template-buttons' })
                    .addButton({ id: 'wgram-btn-load-id', innerHTML: '<i class="fas fa-cloud-download-alt"></i> Carregar por ID' }, (_, btn) => { btn.onclick = () => this.#handleLoad(true); })
                    .addButton({ id: 'wgram-btn-copy-coords', innerHTML: '<i class="fas fa-map-pin"></i> Copiar ID das Coordenadas' }, (_, btn) => { btn.onclick = () => this.#handleCopyCoordsId(); })
                .buildElement()
                .addSmall({ id: 'wgram-site-promo', innerHTML: 'Crie seus projetos em <a href="https://wgram.discloud.app" target="_blank">wgram.discloud.app</a>' }).buildElement()
            .buildElement()
            .addHr()
            .addDiv({ id: 'wgram-settings' })
                .addHeader(4, { textContent: 'Configurações' }).buildElement()
                .addDiv({ className: 'wgram-setting-item' })
                    .addSmall({ textContent: "Limpar contas ao iniciar" }).buildElement()
                    .addLabel({ className: 'wgram-toggle-switch' })
                        .addInput({ type: 'checkbox', id: 'wgram-toggle-clear-lp' })
                        .addDiv({ className: 'wgram-toggle-slider' }).buildElement()
                    .buildElement()
                .buildElement()
            .buildElement()
            .addTextarea({ id: this.outputStatusId, placeholder: `Status: Pronto...\nVersão: ${this.version}`, readOnly: true })
            .addDiv({ id: 'wgram-credits' })
                .addSmall({ innerHTML: 'Criado por <strong>Ruan Pablo</strong> (@rp.xyz)' }).buildElement()
            .buildElement()
        .buildElement()
        .buildOverlay(document.body);

        this.handleDrag('wgram-overlay', 'wgram-drag-handle');
        this.#setupSettingsListeners();
    }
    
    populateProjectSelector(projects) {
        this.userProjects = projects;
        const selector = document.getElementById('wgram-project-selector');
        if (!selector) return;
        selector.innerHTML = '';
        if (projects.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum projeto encontrado';
            option.disabled = true;
            selector.appendChild(option);
            return;
        }
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecione um de seus projetos...';
        selector.appendChild(defaultOption);
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            const pixelCount = project.calculations?.totalPixels?.toLocaleString('pt-BR') || 'N/A';
            option.textContent = `${project.name} (${pixelCount} pixels)`;
            selector.appendChild(option);
        });
    }

    #setupSettingsListeners() {
        const clearLpToggle = document.getElementById('wgram-toggle-clear-lp');
        if (clearLpToggle) {
            this.authManager.getUserSettings().then(settings => {
                if (settings && settings.autoClearLp) {
                    clearLpToggle.checked = true;
                }
            });
            clearLpToggle.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                this.authManager.updateUserSetting('autoClearLp', isEnabled);
                this.displayStatus(`Limpeza automática de 'lp' ${isEnabled ? 'ativada' : 'desativada'}.`);
            });
        }
    }
    
    #handleLoad(forceIdLoad = false) {
        const selector = document.getElementById('wgram-project-selector');
        const projectIdFromInput = document.getElementById('wgram-project-id').value.trim();
        const selectedProjectId = selector.value;
        if (forceIdLoad) {
            if (!projectIdFromInput) return this.displayError("Por favor, insira um ID para carregar.");
            this.templateManager.loadItemFromFirestore(projectIdFromInput);
            return;
        }
        if (selectedProjectId) {
            const selectedProject = this.userProjects.find(p => p.id === selectedProjectId);
            if (selectedProject) this.templateManager.loadProjectFromData(selectedProject);
            else this.displayError("Projeto selecionado não encontrado. Tente recarregar.");
        } else if (projectIdFromInput) {
             this.displayStatus("Usando ID do campo de texto, pois nenhum projeto foi selecionado.");
             this.templateManager.loadItemFromFirestore(projectIdFromInput);
        } else {
            return this.displayError("Selecione um projeto da lista ou insira um ID.");
        }
    }

    #handleCopyCoordsId() {
        if (this.isWaitingForCoords) {
            clearInterval(this.coordCheckInterval);
            this.isWaitingForCoords = false;
            this.displayStatus("Captura de coordenadas cancelada.");
            const copyBtn = document.getElementById('wgram-btn-copy-coords');
            if (copyBtn) copyBtn.innerHTML = '<i class="fas fa-map-pin"></i> Copiar ID das Coordenadas';
            return;
        }
        const initialCoords = this.apiManager.getCurrentCoords();
        if (initialCoords && initialCoords.length >= 4) {
            this.authManager.saveAndCopyCoordsId(initialCoords);
            return;
        }
        this.isWaitingForCoords = true;
        this.displayStatus("Aguardando clique no mapa... Clique no botão novamente para cancelar.");
        const copyBtn = document.getElementById('wgram-btn-copy-coords');
        if (copyBtn) copyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturando...';
        let attempts = 0;
        const maxAttempts = 60; 
        this.coordCheckInterval = setInterval(() => {
            const polledCoords = this.apiManager.getCurrentCoords();
            attempts++;
            if (polledCoords && polledCoords.length >= 4) {
                clearInterval(this.coordCheckInterval);
                this.isWaitingForCoords = false;
                if (copyBtn) copyBtn.innerHTML = '<i class="fas fa-map-pin"></i> Copiar ID das Coordenadas';
                this.authManager.saveAndCopyCoordsId(polledCoords);
            } else if (attempts >= maxAttempts) {
                clearInterval(this.coordCheckInterval);
                this.isWaitingForCoords = false;
                this.displayError("Tempo esgotado. Tente clicar no mapa e depois no botão.");
                if (copyBtn) copyBtn.innerHTML = '<i class="fas fa-map-pin"></i> Copiar ID das Coordenadas';
            }
        }, 500);
    }
    #toggleMinimize() { this.isMinimized = !this.isMinimized; const overlayElement = document.getElementById('wgram-overlay'); if (overlayElement) { overlayElement.classList.toggle('minimized', this.isMinimized); } this.displayStatus(this.isMinimized ? "Overlay minimizado." : "Overlay restaurado."); }
  }

  // --- Módulo: src/core/AuthManager.js ---
  class AuthManager {
      constructor(config, uiManager) { this.uiManager = uiManager; try { this.firebaseApp = firebase.initializeApp(config); this.auth = firebase.auth(); this.db = firebase.firestore(); } catch (e) { console.error("Erro ao inicializar o Firebase.", e); alert("Falha ao conectar com o Firebase."); } }
      onAuthStateChanged(callback) { this.auth.onAuthStateChanged(callback); }
      async signUp(email, password) { try { await this.auth.createUserWithEmailAndPassword(email, password); this.uiManager.updateElement('wgram-auth-status', 'Registo bem-sucedido! A entrar...', true); } catch (error) { this.uiManager.updateElement('wgram-auth-status', `Erro no registo: ${error.message}`, true); } }
      async logIn(email, password) { try { await this.auth.signInWithEmailAndPassword(email, password); } catch (error) { this.uiManager.updateElement('wgram-auth-status', `Erro no login: ${error.message}`, true); } }
      async logOut() { await this.auth.signOut(); }
      async checkMaintenanceMode() {
        try {
            const docRef = this.db.collection('config').doc('maintenance');
            const docSnap = await docRef.get();
            if (docSnap.exists && docSnap.data().isActive) {
                return { isActive: true, message: docSnap.data().message || 'O script está temporariamente indisponível.' };
            }
            return { isActive: false };
        } catch (error) {
            console.error("Wgram: Erro ao verificar modo manutenção.", error);
            return { isActive: false };
        }
      }
      async updateUserSetting(key, value) {
        const user = this.auth.currentUser;
        if (!user) return;
        const userDocRef = this.db.collection('users').doc(user.uid);
        try {
            await userDocRef.set({ settings: { [key]: value } }, { merge: true });
        } catch (error) {
            console.error("Wgram: Erro ao salvar configuração do usuário:", error);
        }
      }
      async getUserSettings() {
        const user = this.auth.currentUser;
        if (!user) return {};
        const userDocRef = this.db.collection('users').doc(user.uid);
        try {
            const docSnap = await userDocRef.get();
            if (docSnap.exists && docSnap.data()) {
                return docSnap.data().settings || {};
            }
            return {};
        } catch (error) {
            console.error("Wgram: Erro ao buscar configurações do usuário:", error);
            return {};
        }
      }
      async getUserData() {
        const user = this.auth.currentUser;
        if (!user) return null;
        const userDocRef = this.db.collection('users').doc(user.uid);
        try {
            const docSnap = await userDocRef.get();
            if (docSnap.exists) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error("Wgram: Erro ao buscar dados do usuário:", error);
            return null;
        }
      }
    
      async getUserProjects() {
        const user = this.auth.currentUser;
        if (!user) {
            this.uiManager.displayError("Usuário não está logado para buscar projetos.");
            return [];
        }
        try {
            const projectsRef = this.db.collection('users').doc(user.uid).collection('projects');
            const snapshot = await projectsRef.get();
            if (snapshot.empty) {
                console.log("Nenhum projeto encontrado para este usuário.");
                return [];
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.uiManager.displayError("Falha ao buscar projetos do usuário.");
            console.error("Erro ao buscar projetos:", error);
            return [];
        }
      }
      
      async getUserProjectById(projectId) {
        const user = this.auth.currentUser;
        if (!user) return null;
        try {
            const projectRef = this.db.collection('users').doc(user.uid).collection('projects').doc(projectId);
            const docSnap = await projectRef.get();
            if (docSnap.exists) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            console.warn(`Projeto privado com ID ${projectId} não encontrado.`);
            return null;
        } catch (error) {
            this.uiManager.displayError("Falha ao buscar projeto privado por ID.");
            console.error("Erro ao buscar projeto privado:", error);
            return null;
        }
    }

    async saveAndCopyCoordsId(coords) {
        const user = this.auth.currentUser;
        if (!user) { return this.uiManager.displayError("Precisa de estar logado para partilhar coordenadas."); }
        let locationLat = null, locationLng = null, locationZoom = null, locationUrl = null;
        try {
            const locationString = localStorage.getItem('location');
            if (locationString) {
                const locationData = JSON.parse(locationString);
                locationLat = locationData.lat || null;
                locationLng = locationData.lng || null;
                locationZoom = locationData.zoom || null;
                if (locationLat && locationLng && locationZoom) {
                    locationUrl = `https://wplace.live/?lat=${locationLat}&lng=${locationLng}&zoom=${locationZoom}`;
                }
            }
        } catch (e) {
            console.error("Wgram: Erro ao ler ou analisar 'location' do localStorage.", e);
        }
        const hexId = Math.random().toString(16).substr(2, 8);
        const userDocRef = this.db.collection('users').doc(user.uid);
        try {
            const userDoc = await userDocRef.get();
            const wplaceUsername = userDoc.exists ? userDoc.data().wplaceUsername : 'Desconhecido';
            const coordsData = {
                coords: { tl_x: coords[0], tl_y: coords[1], px_x: coords[2], px_y: coords[3] },
                location: { lat: locationLat, lng: locationLng, zoom: locationZoom },
                locationUrl: locationUrl,
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

  // --- Módulo: src/core/TemplateManager.js ---
  class TemplateManager {
    constructor(scriptName, scriptVersion, uiManager, authManager) { this.scriptName = scriptName; this.scriptVersion = scriptVersion; this.uiManager = uiManager; this.authManager = authManager; this.userId = null; this.templates = []; this.templatesShouldBeDrawn = true; }
    setUserId(id) { this.userId = id; }
    
    async loadProjectFromData(projectData) {
        this.uiManager.displayStatus(`Carregando seu projeto "${projectData.name}"...`);
        const coords = projectData.coordinates;
        let redirectUrl = null;
        if (coords && coords.lat && coords.lng && coords.zoom) {
             redirectUrl = `https://wplace.live/?lat=${coords.lat}&lng=${coords.lng}&zoom=${coords.zoom}`;
        } else {
            this.uiManager.displayError("Este projeto não tem coordenadas geográficas salvas. Não é possível redirecionar.");
        }
        if (redirectUrl && redirectUrl !== window.location.href.split('#')[0]) {
            this.uiManager.displayStatus(`Redirecionando para a localização do projeto...`);
            sessionStorage.setItem('wgram_pending_load', projectData.id);
            sessionStorage.setItem('wgram_pending_load_type', 'private');
            window.location.href = redirectUrl;
            return;
        }
        await this.loadProject(projectData, false); // false = não é público
    }

    async loadItemFromFirestore(id) {
        this.uiManager.displayStatus(`A procurar ID público ${id}...`);
        
        const projectDocRef = this.authManager.db.collection('publicProjects').doc(id);
        let docSnap = await projectDocRef.get();

        if (docSnap.exists) {
            const projectData = { id: docSnap.id, ...docSnap.data() };
            const coords = projectData.coordinates;
            let redirectUrl = null;
            if (coords && coords.lat && coords.lng && coords.zoom) {
                redirectUrl = `https://wplace.live/?lat=${coords.lat}&lng=${coords.lng}&zoom=${coords.zoom}`;
            }
            if (redirectUrl && redirectUrl !== window.location.href.split('#')[0]) {
                this.uiManager.displayStatus(`Redirecionando para a localização do projeto...`);
                sessionStorage.setItem('wgram_pending_load', id);
                sessionStorage.setItem('wgram_pending_load_type', 'public');
                window.location.href = redirectUrl;
                return;
            }
            await this.loadProject(projectData, true); // true = é público
            return;
        }

        const coordsDocRef = this.authManager.db.collection('sharedCoords').doc(id);
        docSnap = await coordsDocRef.get();
        if (docSnap.exists) {
            const data = docSnap.data();
            const { tl_x, tl_y, px_x, py_y } = data.coords;
            const url = `https://wplace.live/#/${tl_x}/${tl_y}/${px_x}/${py_y}`;
            window.open(url, '_self');
            this.uiManager.displayStatus(`A navegar para as coordenadas partilhadas por ${data.creatorWplaceUser}.`);
            return;
        }

        this.uiManager.displayError("Nenhum projeto público ou coordenadas encontrados com este ID.");
    }

    // CORREÇÃO: Função centralizada que recebe um booleano para tratar o contador de loads.
    async loadProject(projectData, isPublic) {
        const { processedImageBase64, name, coordinates } = projectData;
        if (!processedImageBase64) return this.uiManager.displayError("O projeto encontrado não contém uma imagem de template.");
        if (!coordinates || coordinates.tl_x === undefined) return this.uiManager.displayError("Projeto não tem coordenadas de pixel salvas. Não é possível carregar o template.");
        
        const coordsArray = [coordinates.tl_x, coordinates.tl_y, coordinates.px_x, coordinates.py_y].map(Number);
        
        if (isPublic) {
            const projectRef = this.authManager.db.collection('publicProjects').doc(projectData.id);
            projectRef.update({ loads: firebase.firestore.FieldValue.increment(1) }).catch(e => console.error("Falha ao incrementar loads:", e));
        }
        
        await this.createTemplateFromBase64(processedImageBase64, name, coordsArray);
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
        
        const maintenanceStatus = await this.authManager.checkMaintenanceMode();

        if (maintenanceStatus.isActive) {
            this.uiManager.buildMaintenanceOverlay(maintenanceStatus.message);
        } else {
            this.authManager.onAuthStateChanged(async (user) => {
                if (user) {
                    console.log("Utilizador logado:", user.email);
                    
                    const userData = await this.authManager.getUserData();
                    const userSettings = userData ? userData.settings : {};
                    
                    if (userSettings && userSettings.autoClearLp) {
                        if (localStorage.getItem('lp')) {
                            localStorage.removeItem('lp');
                            this.uiManager.displayStatus("Chave 'lp' removida automaticamente.");
                        }
                    }

                    this.uiManager.buildMainOverlay(user, userData || {});
                    this.templateManager.setUserId(user.uid);
                    this.injector.injectFetchSpy();
                    this.apiManager.initializeApiListener();
                    
                    const userProjects = await this.authManager.getUserProjects();
                    this.uiManager.populateProjectSelector(userProjects);

                    const pendingLoadId = sessionStorage.getItem('wgram_pending_load');
                    const pendingLoadType = sessionStorage.getItem('wgram_pending_load_type');
                    
                    if (pendingLoadId && pendingLoadType) {
                        console.log(`[${this.info.name}] Encontrado carregamento pendente (${pendingLoadType}) para o ID: ${pendingLoadId}`);
                        sessionStorage.removeItem('wgram_pending_load');
                        sessionStorage.removeItem('wgram_pending_load_type');

                        setTimeout(async () => {
                            if (pendingLoadType === 'private') {
                                const projectToLoad = await this.authManager.getUserProjectById(pendingLoadId);
                                if (projectToLoad) {
                                    this.templateManager.loadProject(projectToLoad, false); // false = não é público
                                } else {
                                    this.uiManager.displayError("Não foi possível carregar o projeto privado pendente. Ele pode ter sido excluído.");
                                }
                            } else { // public
                                this.templateManager.loadItemFromFirestore(pendingLoadId);
                            }
                        }, 500);
                    }

                } else {
                    console.log("Nenhum utilizador logado.");
                    this.uiManager.destroyOverlay('wgram-overlay');
                    this.uiManager.buildLoginOverlay();
                }
            });
        }
    }
    injectCSS() { 
        const customCSS = `
            #wgram-user-profile { display: flex; justify-content: space-between; align-items: center; }
            #wgram-user-info { display: flex; flex-direction: column; }
            .wgram-setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .wgram-toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; }
            .wgram-toggle-switch input { opacity: 0; width: 0; height: 0; }
            .wgram-toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4b5563; transition: .4s; border-radius: 22px; }
            .wgram-toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .wgram-toggle-slider { background-color: #3b82f6; }
            input:checked + .wgram-toggle-slider:before { transform: translateX(18px); }
            #wgram-project-selector { width: 100%; margin-bottom: 10px; }
        `;
        GM_addStyle(customCSS);
        try { 
            const css = GM_getResourceText('WGRAM_CSS'); 
            if (css) { 
                GM_addStyle(css); 
            } else { 
                console.warn(`[${this.info.name}] Recurso CSS 'WGRAM_CSS' não encontrado.`); 
            } 
        } catch (error) { 
            console.error(`[${this.info.name}] Falha ao injetar CSS:`, error); 
        } 
    }
  }

  const wgram = new WgramScript();
  wgram.start();

})();
