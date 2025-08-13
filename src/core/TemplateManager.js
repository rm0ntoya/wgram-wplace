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
            this.templates = [template]; // Substitui o template atual pelo novo
            this.uiManager.displayStatus(`Template "${name}" carregado com sucesso!`);
            this.setTemplatesShouldBeDrawn(true);
        } catch (error) {
            this.uiManager.displayError(`Falha ao processar o template: ${error.message}`);
            console.error(error);
        }
    }

    async drawTemplateOnTile(tileBlob, tileCoords) {
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
        ctx.drawImage(tileBitmap, 0, 0, scaledWidth, scaledHeight);
        for (const template of this.templates) {
            const chunk = template.getChunkForTile(tileCoords);
            if (chunk) {
                ctx.drawImage(chunk.bitmap, 0, 0);
            }
        }
        return await canvas.convertToBlob({ type: 'image/png' });
    }

    setTemplatesShouldBeDrawn(shouldDraw) {
        this.templatesShouldBeDrawn = shouldDraw;
        this.uiManager.displayStatus(`Templates ${shouldDraw ? 'ativados' : 'desativados'}.`);
    }
}
