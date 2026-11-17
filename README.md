# FlipBook · Revista digital de catálogo

Uma revista online para apresentar produtos, com efeito de folhear em 3D. Tudo em um único arquivo HTML, sem servidor, sem instalação e sem bibliotecas externas.

🔗 **Montar uma revista:** https://leorty.github.io/FlipBook/
📖 **Ver uma revista pronta (exemplo):** https://leorty.github.io/FlipBook/exemplo.html
⬇️ **Baixar o montador para usar offline:** https://leorty.github.io/FlipBook/catalogo-revista.html

## Como funciona

O mesmo arquivo tem dois modos.

**Editor.** A loja ou a gráfica abre o arquivo em branco e monta a revista: capa, páginas e contracapa. Cada imagem vira uma página, na ordem escolhida, e dá para reorganizar, trocar ou excluir. O progresso fica salvo no navegador, então dá para fechar e continuar depois.

**Revista do cliente.** Ao tocar em **Compartilhar**, o editor gera um novo arquivo HTML que mostra só a revista, já com as imagens dentro. Onde o aparelho sabe enviar arquivos (celular, Windows), você escolhe entre **Enviar por aplicativo** e **Baixar o arquivo**; nos demais, o arquivo é baixado direto. Esse arquivo pode ser enviado por WhatsApp ou e-mail, ou publicado em qualquer hospedagem para virar um link.

## Funcionalidades

* Folhear com animação 3D, sombra de lombada, curvatura de página e espessura do miolo
* Navegação por setas na tela, setas do teclado, toque na página ou deslizando o dedo
* Abre em 2 páginas lado a lado no computador e em 1 página por vez no celular; um botão troca o modo enquanto a revista está aberta
* Inclinação 3D que acompanha o mouse no computador
* A revista adota o formato da capa, então artes prontas da gráfica (A4 em pé, quadrado etc.) não são cortadas
* Modo "página pronta" (só a arte) ou modo com nome, preço e descrição do produto sobre a imagem
* Botão de WhatsApp opcional na contracapa e em cada produto, com mensagem já preenchida
* Cor de fundo personalizável, tela cheia e layout responsivo para celular
* Compartilhamento nativo do celular quando disponível, ou download do arquivo
* Imagens otimizadas automaticamente para o arquivo final não ficar pesado

## Tecnologias

HTML5, CSS3 (transformações 3D, perspectiva, `backface-visibility`, variáveis CSS) e JavaScript puro. O salvamento do editor usa IndexedDB, e o arquivo do cliente é gerado no próprio navegador com as imagens embutidas em base64.

## Estrutura

```
index.html        editor + visualizador (arquivo único)
catalogo-revista.html  cópia do montador para download
exemplo.html      revista de exemplo já gerada pelo editor (marca fictícia)
servidor/         versão com catálogos guardados no servidor (biblioteca, papéis, Node + SQLite)
versao-antiga/    primeira versão do projeto, feita com StPageFlip
```

## Versão com servidor

Para uma equipe trabalhar nos mesmos catálogos, a pasta [`servidor`](servidor/) traz o Montador com os catálogos guardados no servidor: biblioteca (criar, editar, duplicar, excluir e carregar um catálogo de um arquivo .html), salvar só no botão, aparência por catálogo, papéis por pessoa (leitor, editor, administrador) e o arquivo do cliente gerado sempre da última versão salva. Node sem dependências e banco SQLite. Veja o [LEIA-ME da pasta](servidor/README.md).

## Versão anterior

A primeira versão do FlipBook (com imagens fixas no código e a biblioteca StPageFlip) continua disponível na pasta [`versao-antiga`](versao-antiga/), e pode ser vista em https://leorty.github.io/FlipBook/versao-antiga/

## Autor

Desenvolvido por **Leonardo Rodrigo Teixeira** · [LinkedIn](https://www.linkedin.com/in/leonardo-teixeira-3244a6143)
