/**
 * Lida com a injeção de código na página para interceptar requisições de rede.
 * @class Injector
 */
export default class Injector {
  /**
   * Injeta o script espião de fetch na página.
   * Este código é executado fora do sandbox do Tampermonkey.
   * @param {string} scriptName - O nome do script para identificação nas mensagens.
   */
  injectFetchSpy(scriptName) {
    const script = document.createElement('script');
    script.textContent = `(${this.#fetchSpy.toString()})('${scriptName}');`;
    document.documentElement.appendChild(script);
    script.remove();
  }

  /**
   * O código que será injetado na página para interceptar `window.fetch`.
   * @private
   */
  #fetchSpy(scriptName) {
    const originalFetch = window.fetch;
    const fetchedBlobQueue = new Map();

    // Listener para receber o blob modificado do script principal
    window.addEventListener('message', (event) => {
      const { source, blobID, blobData } = event.data;

      if (source !== scriptName || !blobID || !blobData) {
        return;
      }

      const resolveCallback = fetchedBlobQueue.get(blobID);
      if (typeof resolveCallback === 'function') {
        resolveCallback(blobData); // Resolve a Promise com o blob modificado
        fetchedBlobQueue.delete(blobID);
      }
    });

    // Sobrescreve a função fetch global
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      const url = (args[0] instanceof Request) ? args[0].url : args[0] || '';
      const contentType = clonedResponse.headers.get('content-type') || '';

      // Se for uma resposta JSON
      if (contentType.includes('application/json')) {
        clonedResponse.json().then(jsonData => {
          window.postMessage({
            source: `${scriptName}-script`,
            endpoint: url,
            jsonData: jsonData
          }, '*');
        }).catch(err => {
          console.error(`[${scriptName}] Erro ao processar JSON:`, err);
        });
      }
      // Se for uma imagem (e não de um mapa de fundo)
      else if (contentType.includes('image/') && !url.includes('openfreemap') && !url.includes('maps')) {
        const blob = await clonedResponse.blob();
        
        // Retorna uma nova Promise que será resolvida quando o script principal devolver o blob
        return new Promise((resolve) => {
          const blobUUID = crypto.randomUUID();

          // Armazena a função `resolve` para ser chamada mais tarde
          fetchedBlobQueue.set(blobUUID, (processedBlob) => {
            resolve(new Response(processedBlob, {
              headers: clonedResponse.headers,
              status: clonedResponse.status,
              statusText: clonedResponse.statusText
            }));
          });

          // Envia o blob original para o script principal para processamento
          window.postMessage({
            source: `${scriptName}-script`,
            endpoint: url,
            blobID: blobUUID,
            blobData: blob,
            blink: Date.now()
          }, '*');
        });
      }

      return response; // Retorna a resposta original para outras requisições
    };
  }
}
