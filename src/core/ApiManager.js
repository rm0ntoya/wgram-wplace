import { escapeHTML } from '../utils/helpers.js';

/**
 * Gerencia as interações com a API do site, ouvindo e processando
 * as respostas de rede capturadas.
 * @class ApiManager
 */
export default class ApiManager {
  /**
   * Construtor da classe ApiManager.
   * @param {TemplateManager} templateManager - A instância do TemplateManager.
   * @param {UIManager} uiManager - A instância do UIManager.
   */
  constructor(templateManager, uiManager) {
    this.templateManager = templateManager;
    this.uiManager = uiManager;
    this.disableAll = false; // Flag para desativar o script se o site solicitar
    this.coordsTilePixel = []; // Últimas coordenadas [tileX, tileY, pixelX, pixelY]
  }

  /**
   * Inicia o listener de eventos para capturar as mensagens da API.
   */
  initializeApiListener() {
    window.addEventListener('message', async (event) => {
      const { data } = event;

      // Ignora mensagens que não são do nosso script
      if (!data || data.source !== 'wgram-script') {
        return;
      }

      const endpoint = this.#parseEndpoint(data.endpoint);

      // Lida com a resposta de imagem (template)
      if (endpoint === 'tiles') {
        await this.#handleTileResponse(data);
        return;
      }

      // Lida com outras respostas (JSON)
      if (data.jsonData) {
        this.#handleJsonResponse(endpoint, data.jsonData, data.endpoint);
      }
    });
  }

  /**
   * Extrai o nome do endpoint de uma URL.
   * Ex: "wplace.live/api/pixel/0/0" -> "pixel"
   * @private
   * @param {string} url - A URL da requisição.
   * @returns {string} O nome do endpoint.
   */
  #parseEndpoint(url) {
    if (!url) return '';
    return url.split('?')[0].split('/').filter(s => s && isNaN(Number(s)) && !s.includes('.')).pop() || '';
  }

  /**
   * Direciona as respostas JSON para o método de processamento correto.
   * @private
   */
  #handleJsonResponse(endpoint, jsonData, fullUrl) {
    switch (endpoint) {
      case 'me':
        this.#processUserData(jsonData);
        break;
      case 'pixel':
        this.#processPixelCoords(fullUrl);
        break;
      case 'robots':
        this.disableAll = jsonData.userscript?.toString().toLowerCase() === 'false';
        if (this.disableAll) {
          this.uiManager.displayError("O script foi desativado pelo proprietário do site.");
        }
        break;
    }
  }

  /**
   * Processa os dados do usuário e atualiza a UI.
   * @private
   */
  #processUserData(data) {
    if (data.status && String(data.status).startsWith('2') === false) {
      this.uiManager.displayError("Falha ao buscar dados do usuário. Verifique se está logado.");
      return;
    }

    this.templateManager.setUserId(data.id); // Informa o ID do usuário ao TemplateManager

    // Atualiza a interface através do UIManager
    this.uiManager.updateElement('wgram-user-name', `Usuário: <b>${escapeHTML(data.name)}</b>`);
    this.uiManager.updateElement('wgram-user-droplets', `Gotas: <b>${new Intl.NumberFormat().format(data.droplets)}</b>`);
  }

  /**
   * Processa as coordenadas de um pixel e atualiza a UI.
   * @private
   */
  #processPixelCoords(url) {
    const tileCoords = url.split('?')[0].split('/').filter(s => s && !isNaN(Number(s)));
    const payload = new URLSearchParams(url.split('?')[1]);
    const pixelCoords = [payload.get('x'), payload.get('y')];

    if (tileCoords.length < 2 || !pixelCoords[0] || !pixelCoords[1]) {
      this.uiManager.displayError("Coordenadas recebidas são inválidas.");
      return;
    }

    this.coordsTilePixel = [...tileCoords, ...pixelCoords].map(Number);

    // Atualiza os campos de input na UI através do UIManager
    this.uiManager.updateElement('wgram-input-tx', this.coordsTilePixel[0]);
    this.uiManager.updateElement('wgram-input-ty', this.coordsTilePixel[1]);
    this.uiManager.updateElement('wgram-input-px', this.coordsTilePixel[2]);
    this.uiManager.updateElement('wgram-input-py', this.coordsTilePixel[3]);
  }

  /**
   * Processa a imagem de um tile, aplica o template e envia de volta.
   * @private
   */
  async #handleTileResponse(data) {
    let tileCoords = data.endpoint.split('/');
    tileCoords = [
      parseInt(tileCoords[tileCoords.length - 2], 10),
      parseInt(tileCoords[tileCoords.length - 1].replace('.png', ''), 10)
    ];

    const { blobID, blobData, blink } = data;

    // Pede ao TemplateManager para desenhar o template sobre o tile
    const modifiedBlob = await this.templateManager.drawTemplateOnTile(blobData, tileCoords);

    // Envia o blob modificado de volta para o script injetado
    window.postMessage({
      source: 'wgram-script',
      blobID: blobID,
      blobData: modifiedBlob,
      blink: blink
    }, '*');
  }
}
