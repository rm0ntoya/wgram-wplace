import Overlay from './Overlay.js';

/**
 * Gerencia toda a interface do usuário, incluindo a construção, eventos e atualizações.
 * @class UIManager
 */
export default class UIManager {
    constructor(name, version) {
        this.name = name;
        this.version = version;
        this.authManager = null;
        this.templateManager = null;
        this.overlayBuilder = new Overlay();
        this.isMinimized = false;
        this.outputStatusId = 'wgram-output-status';
    }

    updateElement(id, html, isSafe = false) {
        const element = document.getElementById(id.replace(/^#/, ''));
        if (!element) return;
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = html;
        } else {
            element[isSafe ? 'textContent' : 'innerHTML'] = html;
        }
    }

    displayStatus(text) {
        console.info(`[${this.name}] Status: ${text}`);
        this.updateElement(this.outputStatusId, `Status: ${text}`, true);
    }

    displayError(text) {
        console.error(`[${this.name}] Erro: ${text}`);
        this.updateElement(this.outputStatusId, `Erro: ${text}`, true);
    }

    handleDrag(moveElementId, handleId) {
        const moveMe = document.getElementById(moveElementId);
        const iMoveThings = document.getElementById(handleId);
        if (!moveMe || !iMoveThings) {
            this.displayError(`Elemento de arrastar não encontrado: ${moveElementId} ou ${handleId}`);
            return;
        }
        let isDragging = false,
            offsetX = 0,
            offsetY = 0;
        const startDrag = (clientX, clientY) => {
            isDragging = true;
            const rect = moveMe.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
            iMoveThings.classList.add('dragging');
            document.body.style.userSelect = 'none';
        };
        const doDrag = (clientX, clientY) => {
            if (!isDragging) return;
            moveMe.style.left = `${clientX - offsetX}px`;
            moveMe.style.top = `${clientY - offsetY}px`;
        };
        const endDrag = () => {
            isDragging = false;
            iMoveThings.classList.remove('dragging');
            document.body.style.userSelect = '';
        };
        iMoveThings.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', endDrag);
    }

    destroyOverlay(id) {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.remove();
        }
    }

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
                .addImg({ alt: 'Ícone do Wgram', src: 'https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/refs/heads/main/src/assets/icon.png', style: 'cursor: pointer;' }, (_, img) => img.addEventListener('click', () => this.#toggleMinimize())).buildElement()
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
                .addInput({ id: 'wgram-project-id', type: 'text', placeholder: 'Cole o ID do Projeto aqui' }).buildElement()
                .addDiv({ id: 'wgram-coords-container', style: 'display: none;' }) // Começa escondido
                    .addInput({ type: 'number', id: 'wgram-input-tx', placeholder: 'Tl X' }).buildElement()
                    .addInput({ type: 'number', id: 'wgram-input-ty', placeholder: 'Tl Y' }).buildElement()
                    .addInput({ type: 'number', id: 'wgram-input-px', placeholder: 'Px X' }).buildElement()
                    .addInput({ type: 'number', id: 'wgram-input-py', placeholder: 'Px Y' }).buildElement()
                .buildElement()
                .addDiv({ id: 'wgram-template-buttons' })
                    .addButton({ id: 'wgram-btn-load', textContent: 'Carregar por ID' }, (_, btn) => { btn.onclick = () => this.#handleLoadProject(); })
                    .buildElement()
                .buildElement()
                // --- ALTERAÇÃO INÍCIO ---
                // Adiciona um contêiner para a lista de filtros de cor, que começa escondido.
                .addDiv({
                    id: 'wgram-color-filter-container',
                    style: 'display: none; max-height: 140px; overflow-y: auto; margin-top: 10px; border: 1px solid #555; border-radius: 5px; padding: 8px;'
                })
                .buildElement()
                // --- ALTERAÇÃO FIM ---
            .buildElement()
            .addTextarea({ id: this.outputStatusId, placeholder: `Status: Pronto...\nVersão: ${this.version}`, readOnly: true }).buildElement()
        .buildElement()
        .buildOverlay(document.body);
        this.handleDrag('wgram-overlay', 'wgram-drag-handle');
    }

    // --- ALTERAÇÃO INÍCIO ---
    // Este é o novo método que cria a lista de filtros de cor na UI.
    /**
     * Constrói e exibe a lista de filtros de cor para um determinado template.
     * @param {Template} template - O template ativo que contém a colorPalette.
     */
    buildColorFilterList(template) {
        const container = document.getElementById('wgram-color-filter-container');
        if (!container || !template || !template.colorPalette) {
            if (container) container.style.display = 'none';
            return;
        }

        container.innerHTML = ''; // Limpa a lista anterior
        container.style.display = 'block';

        // Ordena as cores pela quantidade de píxeis (da mais comum para a menos comum)
        const sortedColors = Object.entries(template.colorPalette)
            .sort(([, a], [, b]) => b.count - a.count);

        if (sortedColors.length === 0) {
            container.innerHTML = '<small>Nenhuma cor encontrada no template.</small>';
            return;
        }
        
        // Adiciona um cabeçalho para a secção de filtros
        const header = document.createElement('p');
        header.innerHTML = '<strong>Filtro de Cores:</strong>';
        header.style.marginBottom = '8px';
        header.style.marginTop = '0';
        container.appendChild(header);

        sortedColors.forEach(([colorKey, colorData]) => {
            const [r, g, b] = colorKey.split(',');

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.marginBottom = '5px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = colorData.enabled;
            checkbox.style.marginRight = '8px';
            checkbox.onchange = () => {
                colorData.enabled = checkbox.checked;
                this.displayStatus(`Filtro de cor atualizado. Mova o mapa para ver a alteração.`);
            };

            const colorSwatch = document.createElement('div');
            colorSwatch.style.width = '16px';
            colorSwatch.style.height = '16px';
            colorSwatch.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            colorSwatch.style.border = '1px solid #888';
            colorSwatch.style.marginRight = '8px';

            const label = document.createElement('span');
            label.textContent = `${colorData.count.toLocaleString('pt-BR')} píxeis`;
            label.style.fontSize = '0.9em';

            wrapper.appendChild(checkbox);
            wrapper.appendChild(colorSwatch);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }

    /**
     * Exibe a UI relacionada a um template carregado (infos, filtros de cor, etc.).
     * Este método deve ser chamado pelo TemplateManager após o template ser processado.
     * @param {object} project - O objeto do projeto com informações a serem exibidas.
     * @param {Template} template - O objeto do template processado.
     */
    displayProjectInfo(project, template) {
        // Esta parte é um exemplo, você pode precisar de um contêiner para as informações do projeto
        const infoContainer = document.getElementById('wgram-project-info'); // Crie este div se não existir
        if (infoContainer) {
            infoContainer.style.display = 'block';
            this.updateElement('wgram-info-name', `<strong>Nome:</strong> ${project.name}`);
            // Adicione mais informações se desejar
        }
        
        // Constrói e exibe a lista de filtros de cor para o template carregado
        this.buildColorFilterList(template);
    }
    // --- ALTERAÇÃO FIM ---

    #handleLoadProject() {
        const projectId = document.getElementById('wgram-project-id').value.trim();
        if (!projectId) {
            return this.displayError("Por favor, insira um ID de projeto.");
        }
        this.templateManager.loadProjectFromFirestore(projectId);
    }

    toggleCoordsFields(show) {
        const coordsContainer = document.getElementById('wgram-coords-container');
        if (coordsContainer) {
            coordsContainer.style.display = show ? 'grid' : 'none';
        }
    }

    #toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const overlayElement = document.getElementById('wgram-overlay');
        if (overlayElement) {
            overlayElement.classList.toggle('minimized', this.isMinimized);
        }
        this.displayStatus(this.isMinimized ? "Overlay minimizado." : "Overlay restaurado.");
    }
}
