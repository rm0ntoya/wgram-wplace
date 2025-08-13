import Overlay from './Overlay.js';

/**
 * Gerencia toda a interface do usuário, incluindo a construção, eventos e atualizações.
 * @class UIManager
 */
export default class UIManager {
  /**
   * Construtor da classe UIManager.
   * @param {string} name - O nome do script.
   * @param {string} version - A versão do script.
   * @param {ApiManager} apiManager - A instância do ApiManager.
   * @param {TemplateManager} templateManager - A instância do TemplateManager.
   */
  constructor(name, version, apiManager, templateManager) {
    this.name = name;
    this.version = version;
    this.apiManager = apiManager;
    this.templateManager = templateManager;
    this.overlayBuilder = new Overlay(); // Usa o construtor de overlay para criar elementos
    this.isMinimized = false; // Estado da janela
    this.outputStatusId = 'wgram-output-status'; // ID do elemento de status
  }

  /**
   * Atualiza o conteúdo de um elemento na UI.
   * @param {string} id - O ID do elemento a ser atualizado.
   * @param {string} html - O conteúdo HTML ou texto para inserir.
   * @param {boolean} [isSafe=false] - Se true, usa `textContent` para evitar XSS.
   */
  updateElement(id, html, isSafe = false) {
    const element = document.getElementById(id.replace(/^#/, ''));
    if (!element) return;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = html;
    } else {
      element[isSafe ? 'textContent' : 'innerHTML'] = html;
    }
  }

  /**
   * Exibe uma mensagem de status na UI e no console.
   * @param {string} text - O texto do status a ser exibido.
   */
  displayStatus(text) {
    console.info(`[${this.name}] Status: ${text}`);
    this.updateElement(this.outputStatusId, `Status: ${text}`, true);
  }

  /**
   * Exibe uma mensagem de erro na UI e no console.
   * @param {string} text - O texto do erro a ser exibido.
   */
  displayError(text) {
    console.error(`[${this.name}] Erro: ${text}`);
    this.updateElement(this.outputStatusId, `Erro: ${text}`, true);
  }

  /**
   * Habilita a funcionalidade de arrastar para um elemento.
   * @param {string} moveElementId - O ID do elemento a ser movido.
   * @param {string} handleId - O ID do elemento que serve como alça para arrastar.
   */
  handleDrag(moveElementId, handleId) {
    const moveMe = document.getElementById(moveElementId);
    const iMoveThings = document.getElementById(handleId);

    if (!moveMe || !iMoveThings) {
      this.displayError(`Elemento de arrastar não encontrado: ${moveElementId} ou ${handleId}`);
      return;
    }

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

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

  /**
   * Constrói e exibe o overlay principal na página.
   */
  buildMainOverlay() {
    this.overlayBuilder
      .addDiv({ id: 'wgram-overlay' })
        .addDiv({ id: 'wgram-header' })
          .addDiv({ id: 'wgram-drag-handle' }).buildElement()
          .addImg({
            alt: 'Ícone do Wgram - Clique para minimizar/maximizar',
            src: 'https://raw.githubusercontent.com/SeuUsuario/Wgram/main/assets/icon.png', // TODO: Mudar para o seu URL de ícone
            style: 'cursor: pointer;',
          }, (overlay, img) => {
            img.addEventListener('click', () => this.#toggleMinimize());
          }).buildElement()
          .addHeader(1, { textContent: this.name }).buildElement()
        .buildElement() // Fim de wgram-header

        .addHr().buildElement()

        .addDiv({ id: 'wgram-user-info' })
          .addP({ id: 'wgram-user-name', innerHTML: 'Usuário: <b>Carregando...</b>' }).buildElement()
          .addP({ id: 'wgram-user-droplets', innerHTML: 'Gotas: <b>Carregando...</b>' }).buildElement()
        .buildElement() // Fim de wgram-user-info

        .addHr().buildElement()

        .addDiv({ id: 'wgram-template-controls' })
          .addDiv({ id: 'wgram-coords-container' })
            .addInput({ type: 'number', id: 'wgram-input-tx', placeholder: 'Tl X' }).buildElement()
            .addInput({ type: 'number', id: 'wgram-input-ty', placeholder: 'Tl Y' }).buildElement()
            .addInput({ type: 'number', id: 'wgram-input-px', placeholder: 'Px X' }).buildElement()
            .addInput({ type: 'number', id: 'wgram-input-py', placeholder: 'Px Y' }).buildElement()
          .buildElement() // Fim de wgram-coords-container
          
          .addInputFile({ id: 'wgram-input-file', textContent: 'Carregar Template' })
            .buildElement()

          .addDiv({ id: 'wgram-template-buttons' })
            .addButton({ id: 'wgram-btn-create', textContent: 'Criar' }, (overlay, btn) => {
              btn.onclick = () => this.#handleCreateTemplate();
            }).buildElement()
            .addButton({ id: 'wgram-btn-enable', textContent: 'Ativar' }, (overlay, btn) => {
              btn.onclick = () => this.templateManager.setTemplatesShouldBeDrawn(true);
            }).buildElement()
            .addButton({ id: 'wgram-btn-disable', textContent: 'Desativar' }, (overlay, btn) => {
              btn.onclick = () => this.templateManager.setTemplatesShouldBeDrawn(false);
            }).buildElement()
          .buildElement() // Fim de wgram-template-buttons
        .buildElement() // Fim de wgram-template-controls
        
        .addTextarea({ id: this.outputStatusId, placeholder: `Status: Pronto...\nVersão: ${this.version}`, readOnly: true }).buildElement()

      .buildElement() // Fim de wgram-overlay
      .buildOverlay(document.body);

    this.handleDrag('wgram-overlay', 'wgram-drag-handle');
  }

  /**
   * Lógica para o clique do botão "Criar Template".
   * @private
   */
  #handleCreateTemplate() {
    const fileInput = document.getElementById('wgram-input-file');
    const tx = document.getElementById('wgram-input-tx').value;
    const ty = document.getElementById('wgram-input-ty').value;
    const px = document.getElementById('wgram-input-px').value;
    const py = document.getElementById('wgram-input-py').value;

    if (!fileInput.files || fileInput.files.length === 0) {
      return this.displayError('Nenhum arquivo de template selecionado.');
    }
    if (!tx || !ty || !px || !py) {
      return this.displayError('Coordenadas incompletas. Clique na tela primeiro.');
    }

    const file = fileInput.files[0];
    const coords = [Number(tx), Number(ty), Number(px), Number(py)];
    const name = file.name.replace(/\.[^/.]+$/, '');

    this.templateManager.createTemplate(file, name, coords);
  }

  /**
   * Alterna o estado minimizado/maximizado do overlay.
   * @private
   */
  #toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    const overlayElement = document.getElementById('wgram-overlay');
    if (overlayElement) {
      overlayElement.classList.toggle('minimized', this.isMinimized);
    }
    if(this.isMinimized) {
        this.displayStatus("Overlay minimizado.");
    } else {
        this.displayStatus("Overlay restaurado.");
    }
  }
}
