import Template from './Template.js';
import { numberToEncoded, base64ToUint8 } from '../utils/helpers.js';
import { ENCODING_BASE } from '../utils/constants.js';

/**
 * Gerencia todo o sistema de templates, incluindo criação, armazenamento e renderização.
 * @class TemplateManager
 */
export default class TemplateManager {
  /**
   * Construtor da classe TemplateManager.
   * @param {string} scriptName - O nome do script.
   * @param {string} scriptVersion - A versão do script.
   * @param {UIManager} uiManager - A instância do UIManager.
   */
  constructor(scriptName, scriptVersion, uiManager) {
    this.scriptName = scriptName;
    this.scriptVersion = scriptVersion;
    this.schemaVersion = '1.0.0';
    this.uiManager = uiManager;

    this.userId = null;
    this.templates = []; // Array de instâncias da classe Template
    this.templatesShouldBeDrawn = true;
  }

  /**
   * Define o ID do usuário atual.
   * @param {number} id - O ID numérico do usuário.
   */
  setUserId(id) {
    this.userId = id;
  }

  /**
   * Carrega os templates salvos no armazenamento do Tampermonkey.
   */
  async loadTemplates() {
    const savedData = JSON.parse(await GM.getValue('wgramTemplates', '{}'));

    if (!savedData.templates || savedData.whoami !== 'Wgram') {
      console.log('[Wgram] Nenhum template salvo encontrado ou formato inválido.');
      return;
    }

    this.templates = [];
    for (const templateData of Object.values(savedData.templates)) {
        const template = await Template.fromJSON(templateData);
        this.templates.push(template);
    }
    
    this.uiManager.displayStatus(`${this.templates.length} template(s) carregado(s).`);
  }

  /**
   * Salva os templates atuais no armazenamento do Tampermonkey.
   * @private
   */
  async #saveTemplates() {
    const dataToSave = {
      whoami: 'Wgram',
      scriptVersion: this.scriptVersion,
      schemaVersion: this.schemaVersion,
      templates: {},
    };

    for (const template of this.templates) {
      dataToSave.templates[template.id] = template.toJSON();
    }

    await GM.setValue('wgramTemplates', JSON.stringify(dataToSave));
    console.log('[Wgram] Templates salvos com sucesso.');
  }

  /**
   * Cria um novo template, processa e o salva.
   * @param {File} file - O arquivo de imagem do template.
   * @param {string} name - O nome do template.
   * @param {number[]} coords - As coordenadas [tx, ty, px, py].
   */
  async createTemplate(file, name, coords) {
    this.uiManager.displayStatus(`Processando "${name}"...`);
    
    try {
      const authorId = this.userId ? numberToEncoded(this.userId, ENCODING_BASE) : 'anon';
      const template = new Template({
        displayName: name,
        authorId: authorId,
        coords: coords,
      });

      await template.processImage(file);
      
      // Substitui todos os templates antigos pelo novo (lógica de template único)
      this.templates = [template];

      await this.#saveTemplates();
      this.uiManager.displayStatus(`Template "${name}" criado com sucesso!`);
    } catch (error) {
      this.uiManager.displayError(`Falha ao criar template: ${error.message}`);
      console.error(error);
    }
  }

  /**
   * Desenha os templates sobre a imagem de um tile recebido.
   * @param {Blob} tileBlob - O blob da imagem original do tile.
   * @param {number[]} tileCoords - As coordenadas [x, y] do tile.
   * @returns {Promise<Blob>} O blob da imagem modificada.
   */
  async drawTemplateOnTile(tileBlob, tileCoords) {
    if (!this.templatesShouldBeDrawn || this.templates.length === 0) {
      return tileBlob;
    }

    const tileBitmap = await createImageBitmap(tileBlob);
    const canvas = new OffscreenCanvas(tileBitmap.width, tileBitmap.height);
    const ctx = canvas.getContext('2d');
    
    // Desenha a imagem original do tile primeiro
    ctx.drawImage(tileBitmap, 0, 0);

    // Encontra e desenha cada template que se sobrepõe a este tile
    for (const template of this.templates) {
      const chunk = template.getChunkForTile(tileCoords);
      if (chunk) {
        ctx.drawImage(chunk.bitmap, chunk.drawX, chunk.drawY);
      }
    }

    return await canvas.convertToBlob({ type: 'image/png' });
  }

  /**
   * Ativa ou desativa a renderização de todos os templates.
   * @param {boolean} shouldDraw - True para ativar, false para desativar.
   */
  setTemplatesShouldBeDrawn(shouldDraw) {
    this.templatesShouldBeDrawn = shouldDraw;
    this.uiManager.displayStatus(`Templates ${shouldDraw ? 'ativados' : 'desativados'}.`);
  }
}
