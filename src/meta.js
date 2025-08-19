// ==UserScript==
// @name         Wgram - Pixel Art Manager
// @namespace    https://github.com/rm0ntoya
// @version      2.9
// @description  Um script de usuário para aprimorar a experiência no Wplace.live com login e salvamento na nuvem.
// @author       rm0ntoya
// @license      MPL-2.4
// @homepageURL  https://github.com/rm0ntoya/wgram-wplace
// @supportURL   https://github.com/rm0ntoya/wgram-wplace/issues
// @icon         https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/refs/heads/main/src/assets/icon.png

// @match        *://*.wplace.live/*

// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM.setValue
// @grant        GM_getValue


// @require      https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js
// @require      https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js
// @require      https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js

// @run-at       document-end

// @resource     WGRAM_CSS https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/style.css
// @updateURL    https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/Wgram.meta.js
// @downloadURL  https://raw.githubusercontent.com/rm0ntoya/wgram-wplace/main/dist/Wgram.user.js
