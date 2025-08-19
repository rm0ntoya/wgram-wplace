import Template from './Template.js';

/**
 * Gerencia todo o sistema de templates, incluindo o carregamento de projetos do Firestore.
 * @class TemplateManager
 */
export default class TemplateManager {
    constructor(scriptName, scriptVersion, uiManager, authManager) {
        this.scriptName = scriptName;
        this.scriptVersion = scriptVersion;
        this.uiManager = uiManager;
        this.authManager = authManager;
        this.userId = null;
        this.templates = [];
        this.templatesShouldBeDrawn = true;
    }

    setUserId(id) {
        this.userId = id;
    }

    async loadProjectFromFirestore(projectId) {
        this.uiManager.displayStatus(`A procurar projeto ${projectId}...`);
        try {
            const docRef = this.authManager.db.collection('publicProjects').doc(projectId);
            const doc = await docRef.get();

            if (!doc.exists) {
                return this.uiManager.displayError("Projeto público não encontrado com este ID.");
            }

            const projectData = doc.data();
            const { processedImageBase64, name, coordinates } = projectData;

            if (!processedImageBase64) {
                return this.uiManager.displayError("O projeto encontrado não contém uma imagem de template.");
            }

            if (coordinates && coordinates.tl_x !== undefined) {
                this.uiManager.toggleCoordsFields(false);
                const coordsArray = [coordinates.tl_x, coordinates.tl_y, coordinates.px_x, coordinates.px_y].map(Number);
                await this.createTemplateFromBase64(processedImageBase64, name, coordsArray);
            } else {
                this.uiManager.displayError("Projeto não tem coordenadas. Por favor, insira-as.");
                this.uiManager.toggleCoordsFields(true);
                // Adiciona um listener temporário ao botão para usar as coordenadas manuais
                const loadBtn = document.getElementById('wgram-btn-load');
                const tempListener = async () => {
                    const tx = document.getElementById('wgram-input-tx').value;
                    const ty = document.getElementById('wgram-input-ty').value;
                    const px = document.getElementById('wgram-input-px').value;
                    const py = document.getElementById('wgram-input-py').value;
                    if (!tx || !ty || !px || !py) {
                        return this.uiManager.displayError('Coordenadas incompletas.');
                    }
                    const coordsArray = [tx, ty, px, py].map(Number);
                    await this.createTemplateFromBase64(processedImageBase64, name, coordsArray);
                    loadBtn.removeEventListener('click', tempListener); // Remove o listener para não acumular
                };
                loadBtn.addEventListener('click', tempListener);
            }
        } catch (error) {
            this.uiManager.displayError("Erro ao comunicar com a base de dados.");
            console.error(error);
        }
    }

    async createTemplateFromBase64(base64, name, coords) {
        this.uiManager.displayStatus(`A processar o template "${name}"...`);
        try {
            const template = new Template({ displayName: name, coords: coords });
            await template.processImage(base64);
            this.uiManager.displayTemplateUI(template);
            this.templates = [template]; // Substitui o template atual pelo novo
            this.uiManager.displayStatus(`Template "${name}" carregado com sucesso!`);
            this.setTemplatesShouldBeDrawn(true);
        } catch (error) {
            this.uiManager.displayError(`Falha ao processar o template: ${error.message}`);
            console.error(error);
        }
    }

/**
 * Desenha os templates ativos sobre um tile do mapa do jogo.
 * @param {Blob} tileBlob - O tile original do jogo.
 * @param {number[]} tileCoords - As coordenadas [x, y] do tile.
 * @returns {Promise<Blob>} O tile modificado com o template desenhado por cima.
 */
async drawTemplateOnTile(tileBlob, tileCoords) {
    // Se os templates não devem ser desenhados ou não há templates, retorna o tile original.
    if (!this.templatesShouldBeDrawn || this.templates.length === 0) {
        return tileBlob;
    }

    const RENDER_SCALE = 3;
    const tileBitmap = await createImageBitmap(tileBlob);
    const scaledWidth = tileBitmap.width * RENDER_SCALE;
    const scaledHeight = tileBitmap.height * RENDER_SCALE;
    
    const canvas = new OffscreenCanvas(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Desenha o tile original do jogo como base
    ctx.drawImage(tileBitmap, 0, 0, scaledWidth, scaledHeight);

    // 2. Itera sobre cada template ativo para desenhá-lo por cima
    for (const template of this.templates) {
        const chunk = template.getChunkForTile(tileCoords);
        if (chunk) {
            // Verifica se alguma cor no template atual está desabilitada
            const isAnyColorDisabled = Object.values(template.colorPalette).some(c => !c.enabled);

            if (!isAnyColorDisabled) {
                // --- CAMINHO RÁPIDO ---
                // Se nenhuma cor estiver desabilitada, simplesmente desenha o bitmap do chunk.
                ctx.drawImage(chunk.bitmap, 0, 0);
            } else {
                // --- CAMINHO LENTO (COM FILTRO) ---
                // Se houver filtros ativos, é preciso processar o chunk píxel a píxel.
                const tempChunkCanvas = new OffscreenCanvas(chunk.bitmap.width, chunk.bitmap.height);
                const tempChunkCtx = tempChunkCanvas.getContext('2d', { willReadFrequently: true });
                
                // a. Desenha o chunk original num canvas temporário
                tempChunkCtx.drawImage(chunk.bitmap, 0, 0);
                
                // b. Obtém os dados de todos os píxeis do chunk
                const imageData = tempChunkCtx.getImageData(0, 0, tempChunkCanvas.width, tempChunkCanvas.height);
                const data = imageData.data;

                // c. Itera sobre cada píxel (em grupos de 4 valores: R, G, B, A)
                for (let i = 0; i < data.length; i += 4) {
                    // Se o píxel não for totalmente transparente
                    if (data[i + 3] > 0) {
                        const colorKey = `${data[i]},${data[i + 1]},${data[i + 2]}`;
                        const colorInfo = template.colorPalette[colorKey];
                        
                        // Se a cor do píxel não for encontrada na paleta ou estiver desabilitada...
                        if (!colorInfo || !colorInfo.enabled) {
                            // ...torna o píxel totalmente transparente alterando seu canal Alfa para 0.
                            data[i + 3] = 0;
                        }
                    }
                }

                // d. Coloca os dados de píxel, agora filtrados, de volta no canvas temporário
                tempChunkCtx.putImageData(imageData, 0, 0);

                // e. Desenha o chunk filtrado (do canvas temporário) no canvas final
                ctx.drawImage(tempChunkCanvas, 0, 0);
            }
        }
    }

    // 3. Retorna o canvas final como um novo blob de imagem
    return await canvas.convertToBlob({ type: 'image/png' });
}

    setTemplatesShouldBeDrawn(shouldDraw) {
        this.templatesShouldBeDrawn = shouldDraw;
        this.uiManager.displayStatus(`Templates ${shouldDraw ? 'ativados' : 'desativados'}.`);
    }
}
