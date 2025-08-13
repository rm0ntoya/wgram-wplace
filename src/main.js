/**
 * @file Ponto de entrada principal para o script Wgram.
 * Orquestra a inicialização e a interação entre os diferentes módulos.
 */

// Módulos da Interface
import UIManager from './components/UIManager.js';

// Módulos do Core
import ApiManager from './core/ApiManager.js';
import TemplateManager from './core/TemplateManager.js';
import Injector from './core/Injector.js';

/**
 * Classe principal que encapsula toda a lógica do script.
 */
class WgramScript {
  constructor() {
    this.info = {
      name: GM_info.script.name,
      version: GM_info.script.version,
    };

    // Inicializa os módulos principais, injetando as dependências necessárias.
    // O UIManager precisa dos outros para delegar ações dos botões.
    this.uiManager = new UIManager(this.info.name, this.info.version);
    this.templateManager = new TemplateManager(this.info.name, this.info.version, this.uiManager);
    this.apiManager = new ApiManager(this.templateManager, this.uiManager);
    this.injector = new Injector();

    // Conecta o UIManager aos outros managers para que ele possa chamá-los.
    this.uiManager.templateManager = this.templateManager;
    this.uiManager.apiManager = this.apiManager;
  }

  /**
   * Inicia a execução do script.
   */
  async start() {
    console.log(`[${this.info.name}] v${this.info.version} a iniciar...`);

    // 1. Injeta o CSS na página.
    this.injectCSS();

    // 2. Injeta o espião de 'fetch' para interceptar as comunicações de rede.
    this.injector.injectFetchSpy(this.info.name);

    // 3. Inicia o listener que processa as mensagens recebidas do espião.
    this.apiManager.initializeApiListener();

    // 4. Carrega os templates guardados em armazenamento.
    await this.templateManager.loadTemplates();

    // 5. Constrói a interface do usuário.
    this.uiManager.buildMainOverlay();

    console.log(`[${this.info.name}] Carregado com sucesso!`);
  }

  /**
   * Carrega e injeta o CSS a partir dos recursos do script.
   */
  injectCSS() {
    try {
      // O 'WGRAM_CSS' deve corresponder ao nome dado no @resource do meta.js
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

// Cria a instância da classe principal e inicia o script.
const wgram = new WgramScript();
wgram.start();
