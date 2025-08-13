/**
 * @file Contém funções utilitárias (helpers) usadas em todo o script.
 */

/**
 * Sanitiza uma string para exibir como texto simples, prevenindo XSS.
 * @param {string} text - O texto a ser sanitizado.
 * @returns {string} A string com caracteres HTML escapados.
 */
export function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Converte um número para uma string codificada em uma base customizada.
 * @param {number} number - O número a ser codificado.
 * @param {string} encoding - A string de caracteres a ser usada como base.
 * @returns {string} A string codificada.
 */
export function numberToEncoded(number, encoding) {
  if (number === 0) return encoding[0];

  let result = '';
  const base = encoding.length;

  while (number > 0) {
    result = encoding[number % base] + result;
    number = Math.floor(number / base);
  }

  return result;
}

/**
 * Converte um array de bytes (Uint8Array) para uma string base64.
 * @param {Uint8Array} uint8Array - O array de bytes a ser convertido.
 * @returns {string} A string em base64.
 */
export function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

/**
 * Converte uma string base64 para um Uint8Array.
 * @param {string} base64 - A string em base64 a ser convertida.
 * @returns {Uint8Array} O array de bytes decodificado.
 */
export function base64ToUint8Array(base64) {
  const binary = window.atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}
