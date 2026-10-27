# Catálogo Flipbook

Este projeto é um catálogo digital em formato de Flipbook, desenvolvido em HTML, CSS e JavaScript.  
Ele possui duas versões disponíveis: uma estruturada em pastas (padrão profissional) e outra em arquivo único (mais simples para testes rápidos).

---------------------------------------------------------
Funcionalidades
---------------------------------------------------------
- Desktop: exibe o catálogo como flipbook (com efeito de virar páginas), botões de navegação e suporte a atalhos de teclado.
- Mobile/Tablet: as páginas aparecem em formato de imagens empilhadas, com rolagem vertical simples e espaçamento de 5px.
- Fullscreen: é possível visualizar o flipbook em tela cheia, incluindo os botões de navegação.

---------------------------------------------------------
Versão 1 — Estruturada em Pastas
---------------------------------------------------------
raiz
│   index.html
│   README.txt
└───src
    ├───css
    │     style.css
    ├───js
    │     script.js
    └───imagens
          capa.jpg
          img01.jpg
          img02.jpg
          img03.jpg
          img04.jpg
          fim.jpg

Nesta versão:
- O código está separado em HTML, CSS e JS.
- Facilita manutenção e evolução do projeto.
- Ideal para uso em produção.

---------------------------------------------------------
Versão 2 — Arquivo Único
---------------------------------------------------------
raiz
│   index.html
│   README.txt
└───imagens
     capa.jpg
     img01.jpg
     img02.jpg
     img03.jpg
     img04.jpg
     fim.jpg

Nesta versão:
- Todo o código (HTML, CSS e JS) está dentro de um único arquivo index.html.
- Mais simples para testar rapidamente.
- Ideal para demonstrações, protótipos e quando não há necessidade de organização em pastas.

---------------------------------------------------------
Como Usar
---------------------------------------------------------
1. Escolha qual versão deseja usar (estruturada ou arquivo único).
2. Coloque suas imagens dentro da pasta "imagens".
   - capa.jpg → capa do catálogo
   - img01.jpg até img04.jpg → páginas internas
   - fim.jpg → contra-capa
3. Abra o index.html no navegador.
   - Recomenda-se usar Live Server no VS Code ou outro servidor local para melhor funcionamento.

---------------------------------------------------------
Tecnologias Usadas
---------------------------------------------------------
- HTML5
- CSS3 (responsivo com media queries)
- JavaScript
- StPageFlip (biblioteca para efeito de virar páginas)

---------------------------------------------------------
Autor
---------------------------------------------------------
Projeto desenvolvido por Leonardo Rodrigo Teixeira
Objetivo: demonstração e testes de catálogo digital estilo Flipbook.
