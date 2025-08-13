# 👋 Wgram - Cliente de Templates para Wplace

<div align="center">

**O seu assistente de pixel art para o Wplace, conectando a sua criatividade diretamente ao jogo.**

<!-- 
    ADICIONE O SEU GIF AQUI! 
    Substitua o link abaixo por um link para um GIF que mostre o seu script em ação.
    Pode fazer o upload do GIF para o seu repositório do GitHub e usar o link.
-->

</div>

<div align="center">

[![Versão](https://img.shields.io/badge/versão-1.5.1-blue.svg)](https://github.com/rm0ntoya/wgram-wplace)
[![Licença](https://img.shields.io/badge/licença-MPL--2.0-brightgreen.svg)](https://github.com/rm0ntoya/wgram-wplace/blob/main/LICENSE)
[![Status](https://img.shields.io/badge/status-ativo-success.svg)](https://github.com/rm0ntoya/wgram-wplace)

</div>

## 🚀 Sobre o Projeto

Bem-vindo ao **Wgram**, o script complementar para a aplicação web [WGram - Gerador de Pixel Art](https://wgram.discloud.app). Este script foi projetado para integrar perfeitamente a sua experiência no Wplace, permitindo que carregue templates de pixel art diretamente no jogo a partir de projetos criados ou partilhados na nossa plataforma.

Chega de converter e carregar ficheiros manualmente. Com o Wgram, basta um ID de projeto para começar a sua obra de arte!

---

## ✨ Funcionalidades Principais

* 🔐 **Login Seguro**: Autenticação via Firebase para manter a sua conta segura.
* 🆔 **Carregamento por ID**: Carregue qualquer projeto público ou seu diretamente no jogo usando apenas o ID do projeto.
* 🌐 **Integração com a Plataforma Web**: O script comunica com a base de dados do [WGram Gerador de Pixel Art](https://wgram.discloud.app) para obter os templates.
* 📊 **Visualização de Informações**: Antes de carregar, veja o nome do projeto, o criador e o total de píxeis.
* 📈 **Contador de Carregamentos**: Cada vez que um projeto é carregado, o criador é notificado através das estatísticas na plataforma web.
* 🎨 **Interface Moderna**: Um painel de controlo limpo, profissional e fácil de usar dentro do jogo.

---

## 📥 Como Instalar

Para usar o Wgram, precisa primeiro de um gestor de scripts no seu navegador.

### Passo 1: Instalar um Gestor de Scripts

#### 💻 Para Computador (Chrome, Firefox, etc.)

Recomendamos o **Tampermonkey**, a extensão mais popular para gerir scripts de utilizador.

1.  **Aceda à loja de extensões do seu navegador:**
    * [Tampermonkey para Google Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * [Tampermonkey para Mozilla Firefox](https://addons.mozilla.org/pt-BR/firefox/addon/tampermonkey/)
    * [Tampermonkey para Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2.  Clique em "Adicionar ao navegador" ou "Instalar".

#### 📱 Para Android

Para usar scripts no Android, recomendamos o navegador **Kiwi Browser**, que suporta extensões do Chrome.

1.  **Instale o Kiwi Browser**: Vá à [Google Play Store](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser) e instale o Kiwi.
2.  **Instale o Tampermonkey**: Abra o Kiwi, navegue até à [página do Tampermonkey na Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) e instale-o como faria no computador.

### Passo 2: Instalar o Script Wgram

Com o Tampermonkey instalado, agora só precisa de adicionar o nosso script.

1.  **Clique no link de instalação abaixo:**
    * ➡️ **[Instalar Wgram Script](https://github.com/rm0ntoya/wgram-wplace/raw/main/dist/Wgram.user.js)** ⬅️
2.  O Tampermonkey abrirá uma nova página mostrando os detalhes do script.
3.  Clique no botão **"Instalar"**.

Pronto! O script Wgram está instalado e será ativado automaticamente quando visitar o site do Wplace.

---

## 🎮 Como Usar

O Wgram funciona em conjunto com a nossa aplicação web.

### 1. Obter um ID de Projeto

Primeiro, precisa de um ID de um projeto de pixel art.

1.  **Aceda ao nosso site**: Visite **[https://wgram.discloud.app](https://wgram.discloud.app)**.
2.  **Crie uma conta ou faça login**: O registo é rápido e necessário para salvar os seus projetos.
3.  **Crie o seu próprio projeto ou explore os projetos públicos**:
    * **Para criar**: Vá à aba "Conversor", carregue a sua imagem, ajuste as cores e configurações e salve o projeto.
    * **Para usar um projeto público**: Vá à aba "Projetos Públicos" e explore as criações da comunidade.
4.  **Copie o ID do Projeto**: Cada projeto, seja seu ou público, tem um ID único. Copie o ID do projeto que deseja usar.

### 2. Carregar o Template no Jogo

1.  **Aceda ao site do Wplace**: Com o script Wgram ativo, verá um painel de login.
2.  **Faça Login**: Use as mesmas credenciais (email e senha) que usou no site [wgram.discloud.app](https://wgram.discloud.app).
3.  **Cole o ID**: Após o login, o painel principal do Wgram aparecerá. Cole o ID do projeto que copiou no campo de texto.
4.  **Carregue o Projeto**: Clique no botão **"Carregar por ID"**.
    * As informações do projeto (nome, criador, píxeis) aparecerão no painel.
    * Se o projeto já tiver coordenadas salvas, o template será carregado automaticamente no mapa.
    * Se não tiver, os campos para inserir as coordenadas aparecerão. Preencha-os e clique novamente em "Carregar por ID" para posicionar o seu template.

Agora está pronto para começar a sua construção!

---

## ❤️ Apoie o Projeto

Muito obrigado por usar o Wgram! Este foi um projeto solo, desenvolvido com muita dedicação para melhorar a experiência da nossa comunidade.

Se gostou da ferramenta e quer apoiar o desenvolvimento futuro, qualquer contribuição é imensamente apreciada. Você pode ajudar doando qualquer valor através do Pix.

> **Chave Pix**: `contato.ruanpablo2006@gmail.com`

O seu apoio ajuda a manter o site no ar e motiva a criação de novas funcionalidades. Muito obrigado!

---

## 📜 Licença

Este projeto é distribuído sob a licença **MPL-2.0**. Para mais detalhes, consulte o ficheiro de licença no repositório.
