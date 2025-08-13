/**
 * Representa uma única instância de um template, com sua lógica de processamento e dados.
 * @class Template
 */
export default class Template {
    constructor({ displayName = 'Template Carregado', authorId = '', coords = [0,0,0,0], chunks = {} }) {
        this.id = crypto.randomUUID();
        this.displayName = displayName;
        this.authorId = authorId;
        this.coords = coords;
        this.pixelCount = 0;
        this.width = 0;
        this.height = 0;
        this.chunks = chunks;
    }

    /**
     * Processa a fonte de dados da imagem (base64 ou ficheiro), convertendo-a numa grelha de píxeis.
     * @param {string | File} dataSource - A imagem como uma string base64 ou um objeto File.
     */
    async processImage(dataSource) {
        const TILE_SIZE = 1000;
        const RENDER_SCALE = 3; // Cada píxel será desenhado num espaço de 3x3

        let imageSource = dataSource;
        // Se a fonte for uma string base64, converte-a para um objeto de imagem
        if (typeof dataSource === 'string') {
            const img = new Image();
            img.src = dataSource;
            await new Promise(resolve => img.onload = resolve);
            imageSource = img;
        }

        const mainBitmap = await createImageBitmap(imageSource);
        this.width = mainBitmap.width;
        this.height = mainBitmap.height;
        this.pixelCount = this.width * this.height;
        const [startTileX, startTileY, startPixelX, startPixelY] = this.coords;

        // Usa um canvas temporário de 1x1 para ler a cor de cada píxel individualmente
        const tempCanvas = new OffscreenCanvas(1, 1);
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Calcula a posição global do píxel no mapa do jogo
                const currentGlobalPixelX = startPixelX + x;
                const currentGlobalPixelY = startPixelY + y;

                // Determina a que tile do jogo este píxel pertence
                const tileX = startTileX + Math.floor(currentGlobalPixelX / TILE_SIZE);
                const tileY = startTileY + Math.floor(currentGlobalPixelY / TILE_SIZE);
                const pixelXInTile = currentGlobalPixelX % TILE_SIZE;
                const pixelYInTile = currentGlobalPixelY % TILE_SIZE;
                const tileKey = `${tileX},${tileY}`;

                // Se for o primeiro píxel neste tile, cria um novo canvas para ele
                if (!this.chunks[tileKey]) {
                    const canvas = new OffscreenCanvas(TILE_SIZE * RENDER_SCALE, TILE_SIZE * RENDER_SCALE);
                    this.chunks[tileKey] = { canvas: canvas, ctx: canvas.getContext('2d') };
                    this.chunks[tileKey].ctx.imageSmoothingEnabled = false;
                }

                // Lê a cor do píxel atual da imagem de origem
                tempCtx.drawImage(mainBitmap, x, y, 1, 1, 0, 0, 1, 1);
                const pixelData = tempCtx.getImageData(0, 0, 1, 1).data;

                // Se o píxel for transparente, ignora-o
                if (pixelData[3] === 0) continue;

                // Desenha um quadrado de 1x1 no centro de uma grelha de 3x3 para criar o efeito de malha
                this.chunks[tileKey].ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
                this.chunks[tileKey].ctx.fillRect(pixelXInTile * RENDER_SCALE + 1, pixelYInTile * RENDER_SCALE + 1, 1, 1);
            }
        }

        // Converte os canvases finais em ImageBitmaps para melhor performance
        for (const tileKey in this.chunks) {
            const chunk = this.chunks[tileKey];
            chunk.bitmap = await chunk.canvas.transferToImageBitmap();
            delete chunk.canvas;
            delete chunk.ctx;
        }
    }

    /**
     * Retorna o chunk de imagem processado para um determinado tile do mapa.
     * @param {number[]} tileCoords - As coordenadas [x, y] do tile.
     * @returns {{bitmap: ImageBitmap, drawX: number, drawY: number}|null}
     */
    getChunkForTile(tileCoords) {
        const tileKey = `${tileCoords[0]},${tileCoords[1]}`;
        const chunk = this.chunks[tileKey];
        if (chunk && chunk.bitmap) {
            return { bitmap: chunk.bitmap, drawX: 0, drawY: 0 };
        }
        return null;
    }
}
