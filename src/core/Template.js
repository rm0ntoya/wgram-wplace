import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/helpers.js';

const TILE_SIZE = 1000;
const RENDER_SCALE = 3; // Fator de escala para pixel art, deve ser ímpar

/**
 * Representa uma única instância de um template, com sua lógica de processamento e dados.
 * @class Template
 */
export default class Template {
  /**
   * Construtor da classe Template.
   * @param {object} options - Opções para o template.
   * @param {string} [options.displayName='Meu Template'] - Nome de exibição.
   * @param {string} [options.authorId=''] - ID do autor.
   * @param {number[]} [options.coords=[0,0,0,0]] - Coordenadas [tx, ty, px, py].
   */
  constructor({ displayName = 'Meu Template', authorId = '', coords = [0, 0, 0, 0] }) {
    this.id = crypto.randomUUID(); // ID único para cada instância
    this.displayName = displayName;
    this.authorId = authorId;
    this.coords = coords;
    this.pixelCount = 0;
    this.width = 0;
    this.height = 0;
    this.chunks = {}; // Armazena os pedaços de imagem processados por tile
  }

  /**
   * Processa o arquivo de imagem, dividindo-o em chunks por tile.
   * @param {File} file - O arquivo de imagem a ser processado.
   */
  async processImage(file) {
    const mainBitmap = await createImageBitmap(file);
    this.width = mainBitmap.width;
    this.height = mainBitmap.height;
    this.pixelCount = this.width * this.height;

    const [startTileX, startTileY] = [this.coords[0], this.coords[1]];
    const [startPixelX, startPixelY] = [this.coords[2], this.coords[3]];

    // Itera sobre a imagem e a divide em chunks que correspondem aos tiles do jogo
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
          this.chunks[tileKey] = {
            canvas: canvas,
            ctx: canvas.getContext('2d', { willReadFrequently: true }),
          };
          this.chunks[tileKey].ctx.imageSmoothingEnabled = false;
        }

        // Desenha um único pixel da imagem original no canvas do chunk correspondente
        this.chunks[tileKey].ctx.drawImage(
          mainBitmap,
          x, y, 1, 1, // Pega 1 pixel da imagem de origem
          pixelXInTile * RENDER_SCALE, pixelYInTile * RENDER_SCALE, RENDER_SCALE, RENDER_SCALE // Desenha-o escalado no canvas do chunk
        );
      }
    }

    // Converte os canvases finais em bitmaps para performance
    for (const tileKey in this.chunks) {
        const chunk = this.chunks[tileKey];
        chunk.bitmap = await chunk.canvas.transferToImageBitmap();
        delete chunk.canvas; // Libera memória
        delete chunk.ctx;
    }
  }

  /**
   * Retorna o chunk de imagem para um determinado tile.
   * @param {number[]} tileCoords - As coordenadas [x, y] do tile.
   * @returns {{bitmap: ImageBitmap, drawX: number, drawY: number}|null} O chunk ou null se não houver.
   */
  getChunkForTile(tileCoords) {
    const tileKey = `${tileCoords[0]},${tileCoords[1]}`;
    const chunk = this.chunks[tileKey];

    if (chunk && chunk.bitmap) {
      return {
        bitmap: chunk.bitmap,
        drawX: 0, // O chunk já está na posição correta em seu próprio canvas
        drawY: 0,
      };
    }
    return null;
  }

  /**
   * Converte a instância da classe para um objeto JSON para salvamento.
   * @returns {object}
   */
  toJSON() {
    // Esta função precisaria converter os bitmaps em base64 para serem salvos
    // Por simplicidade, vamos pular a serialização do bitmap por agora.
    // Uma implementação real converteria this.chunks para base64 aqui.
    return {
      id: this.id,
      displayName: this.displayName,
      authorId: this.authorId,
      coords: this.coords,
      width: this.width,
      height: this.height,
      pixelCount: this.pixelCount,
      // chunks: serializarChunks(this.chunks) // Função a ser implementada
    };
  }

  /**
   * Cria uma instância de Template a partir de um objeto JSON.
   * @param {object} jsonData - Os dados para criar a instância.
   * @returns {Promise<Template>}
   */
  static async fromJSON(jsonData) {
    const template = new Template(jsonData);
    template.id = jsonData.id;
    template.width = jsonData.width;
    template.height = jsonData.height;
    template.pixelCount = jsonData.pixelCount;
    // Aqui viria a lógica para desserializar os chunks de base64 para bitmaps
    // template.chunks = await desserializarChunks(jsonData.chunks);
    return template;
  }
}
