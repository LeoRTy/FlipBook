# Montador de Catálogo com servidor

A mesma revista digital do FlipBook, agora com os catálogos **guardados no servidor**: uma biblioteca para a equipe
criar, editar, duplicar, excluir e compartilhar catálogos, sempre com as últimas edições.

A versão de arquivo único (`index.html`, na raiz do repositório) continua existindo e não precisa de servidor.
Use esta pasta quando mais de uma pessoa precisa trabalhar nos mesmos catálogos, ou quando você quer voltar a um
catálogo de outro computador.

## O que tem

- **Biblioteca:** cada catálogo salvo aparece com a capa, o número de páginas, quem editou por último e quando foi
  gerado o último arquivo. Botões: Editar, Visualizar, Compartilhar, Duplicar e Excluir.
- **Editor:** capa, páginas e contracapa. Cada imagem vira uma página; dá para enviar várias de uma vez, trocar,
  remover e mudar a ordem.
- **Aparência por catálogo:** cor do fundo, do destaque e do papel, logo, numeração, textos dos botões de WhatsApp.
- **Salvar só no botão:** nada é gravado sozinho. "Novo catálogo" abre o editor em branco e o catálogo só passa a existir
  no Salvar (Ctrl+S também salva). **Redefinir** desfaz o que não foi salvo, com confirmação. Ao sair com alterações
  por salvar, o Montador pergunta antes. Se outra pessoa salvou o mesmo catálogo enquanto você editava, ele avisa.
- **Ajuda na tela:** o "i" de cada tela abre um pop-up com o botão Entendi.
- **Compartilhar** gera no servidor um arquivo HTML único, com as imagens embutidas. A pessoa escolhe entre enviar por um aplicativo do aparelho ou baixar o arquivo. O cliente abre no celular ou no
  computador e folheia, sem login. O arquivo continua funcionando mesmo que o catálogo seja excluído depois.
- **Carregar catálogo** (1.3.0): traz para a biblioteca um catálogo que chegou num arquivo .html, gerado pelo
  Compartilhar deste Montador ou da página do FlipBook (a versão de arquivo único). Exemplo: alguém de fora monta o
  catálogo na página do FlipBook e manda o arquivo; você carrega e passa a ter essa versão para editar ou reenviar.
  Veja "Carregar catálogo" abaixo.
- **Papéis por pessoa:** leitor (vê, visualiza e compartilha), editor (cria, edita, duplica, carrega e exclui) e
  administrador (dá os papéis). Veja "Pessoas e papéis" abaixo.
- **Aguardando liberação** (1.4.0): quem abre o Montador sem papel não vê nada além de um aviso de que o pedido de
  acesso foi registrado, e espera um administrador liberar.
- **Sininho** (1.4.0): no topo, só para administradores, com o número de pedidos esperando. Clicar abre a
  Administração já filtrada nos pedidos, com o botão **Liberar** em cada um.
- **Lista de todas as pessoas** (1.4.0) na Administração: quem já abriu o Montador entra sozinho na lista, com a data
  do primeiro e do último acesso. Busca por nome ou e-mail, filtro por papel e **Editar papel** / **Liberar** em cada
  pessoa.
- **Ajuda na tela:** um "i" em cada tela explica para que serve e como usar.
- Tema claro e escuro, e layout que funciona no celular.

## Como é feito

Node (22.5 ou mais novo), **sem nenhuma dependência**: o servidor usa só o que já vem no Node, inclusive o banco
SQLite. Não há `npm install`. As telas são HTML, CSS e JavaScript puros.

```
server.js            o servidor inteiro (API, arquivos, geração do arquivo do cliente)
public/index.html    a página
public/app.js        biblioteca, editor e administração
public/revista.js    o visualizador da revista (o mesmo que vai dentro do arquivo do cliente)
public/revista.css   estilo do visualizador
public/base.css      desenho das telas
public/tema.css      TODAS as cores e a fonte: troque este arquivo para dar a cara da sua empresa
public/catalogo.css  telas próprias (biblioteca e editor)
testes/teste_api.js  teste automático da API
```

Os dados ficam na pasta `dados/` (ou onde a variável `DADOS` apontar): `catalogo.sqlite` e a pasta `imagens/`.
Para fazer backup, copie essa pasta.

## Rodar no seu computador

```bash
node server.js
```

Abra http://localhost:8080. Nesse **modo local** não há identificação: quem abrir o endereço é administrador.
Serve para uma pessoa só, ou para experimentar.

Com Docker:

```bash
docker compose up -d --build
```

## Usar com a equipe

O servidor **não tem tela de login**. Para várias pessoas, coloque na frente um porteiro que já faça o login
(um proxy reverso com autenticação, ou o login único da empresa) e que informe o e-mail de quem entrou num cabeçalho.

| Variável | Para quê |
|---|---|
| `IDENTIDADE_CABECALHO` | nome do cabeçalho em que o porteiro manda o e-mail, por exemplo `x-forwarded-email`. Vazio = modo local |
| `ADMINS` | e-mails dos administradores, separados por vírgula. Sem ninguém aqui, ninguém libera quem chega |
| `NOME_EMPRESA` | nome que aparece no topo |
| `PORT` | porta (padrão 8080) |
| `DADOS` | pasta do banco e das imagens |

**Atenção:** com `IDENTIDADE_CABECALHO` ligado, o servidor confia nesse cabeçalho. Ele só pode ser alcançado
passando pelo porteiro. Se a porta ficar aberta para fora, qualquer pessoa manda o cabeçalho que quiser e entra como
quem bem entender.

## Pessoas e papéis

Não há cadastro de pessoas: quem abre o Montador entra **sozinho na lista**, pelo e-mail que o porteiro informa, com a
data do primeiro e do último acesso (o último é anotado no máximo uma vez por hora). Tudo fica no SQLite do próprio
Montador (tabelas `pessoas` e `papeis`).

| Papel | O que faz | Quem é |
|---|---|---|
| **Aguardando liberação** | nada: só vê o aviso "Aguardando liberação", com o botão "Verificar de novo" | quem abriu o Montador e ainda não recebeu papel |
| **Leitor** | vê a biblioteca, visualiza e compartilha | quem um administrador marcou como leitor |
| **Editor** | tudo do leitor, e também cria, edita, duplica, carrega e exclui | quem um administrador marcou como editor |
| **Administrador** | tudo do editor, e abre a Administração | quem está em `ADMINS` (no modo local, quem abrir). Não muda pela tela |
| **Sem acesso** | nada: só vê o aviso "Sem acesso ao Montador" | quem um administrador barrou (ou cujo pedido ele recusou) |

**O caminho de um pedido**

1. A pessoa passa pelo porteiro e abre o Montador. Como não tem papel, vê "Aguardando liberação". O Montador anota o
   acesso e a pessoa entra na lista.
2. Os administradores veem o **sininho** no topo com o número de pedidos (ele se atualiza sozinho a cada minuto).
   Clicar nele abre a Administração já filtrada em "Aguardando liberação".
3. O administrador clica em **Liberar**, escolhe Leitor ou Editor (ou Sem acesso, para recusar) e confirma. A pessoa
   clica em "Verificar de novo" (ou abre de novo) e entra. Nenhum e-mail é enviado.

**A Administração** (selo "Administrador", no topo):

- **Lista de todas as pessoas:** quem já abriu o Montador, quem foi convidado e os administradores de `ADMINS`, com o
  papel, o primeiro e o último acesso e quem deu o papel. Os pedidos aguardando ficam destacados.
- **Busca** por nome ou e-mail e **filtro** por papel (Todos, Aguardando liberação, Leitores, Editores,
  Administradores, Sem acesso), com a quantidade em cada um.
- **Liberar** (no pedido) e **Editar papel** (nos outros) abrem uma janela com Leitor, Editor e Sem acesso. Quem foi
  convidado e ainda não entrou tem **Cancelar convite** no lugar de Sem acesso.
- **Convidar por e-mail:** dá o papel antes de a pessoa entrar; quando ela abrir, entra direto, sem aguardar.
- **Últimas mudanças:** as 50 últimas alterações de papel, com quem fez.

**Sem acesso** não substitui o porteiro: quem não deve chegar ao Montador de jeito nenhum se tira no login da
empresa. Sem acesso serve para recusar um pedido sem ele ficar para sempre no sininho.

**No servidor:** a tela esconde o que a pessoa não pode usar, e o servidor recusa de qualquer forma (403). Quem
aguarda liberação ou está sem acesso só consegue chamar `GET /api/eu`. A resposta de `/api/eu` traz `papel`
(`admin`, `editor`, `leitor`, `pendente` ou `sem_acesso`) e, para administradores, `pendentes` (o número do sininho).
Rotas da Administração, só para administradores: `GET /api/admin/papeis` (pessoas e histórico),
`PUT /api/admin/papeis/<e-mail>` com `{"papel": "leitor" | "editor" | "sem_acesso"}` e
`DELETE /api/admin/papeis/<e-mail>` (tira o papel: quem já entrou volta a aguardar; quem só tinha convite sai da lista).

### Atualizando da 1.3

Até a 1.3, quem entrava sem papel virava **leitor** sozinho. A partir da 1.4.0, fica **aguardando liberação**. Depois
de atualizar, quem era leitor sem papel definido vai ver o aviso na próxima vez que abrir, e o pedido aparece no
sininho: é só liberar como Leitor. Quem já tinha papel (editor ou leitor dado por um administrador) continua igual.
No modo local nada muda: quem abre é administrador.

## Carregar catálogo

Na biblioteca, **Carregar catálogo** (ao lado de "Novo catálogo", só para editor e administrador) pede um arquivo
.html, mostra de onde ele veio, quantas páginas e imagens tem e o nome que está dentro dele, e pede o nome do
catálogo. Ao clicar em **Carregar**, o catálogo entra na biblioteca (grava na hora, como o Duplicar) e se edita,
duplica, compartilha e exclui como qualquer outro.

| De onde vem | Onde o catálogo está dentro do .html | O que entra |
|---|---|---|
| Compartilhar deste Montador | `Revista.montar(document.getElementById("revista"), {...});` | tudo: páginas, imagens, textos, cores, logo, numeração, WhatsApp e textos dos botões |
| Compartilhar da página do FlipBook (`index.html` e o montador baixado) | `window.CATALOG = {...};` | páginas, imagens, nome/preço/descrição, WhatsApp, cor do fundo e "mostrar nome e preço". A página não tem cor de destaque, cor do papel nem logo, e sempre numera: entra com a numeração ligada, o logo desligado e as outras cores do `PADRAO` |

Não dá para carregar (a mensagem diz o motivo): arquivo que não é catálogo, o montador do FlipBook ainda vazio (sem
ter clicado em Compartilhar), catálogo cortado ou mexido, catálogo sem nenhuma imagem, mais de 300 páginas e a
primeira versão do FlipBook (`versao-antiga/`), que guarda as imagens numa pasta.

**Segurança** (o arquivo vem de fora e pode ter sido mexido):

- Só os **dados** do catálogo são lidos, como texto (`public/ler-catalogo.js`, o mesmo para a tela e o servidor). O
  HTML nunca é executado, servido nem guardado.
- Imagens só JPEG embutido no arquivo (`data:image/jpeg;base64,...`), conferido pelo cabeçalho do JPEG, até 4 MB cada.
  Imagem por link, em outro formato, grande demais ou danificada não entra: a página fica em branco e a tela avisa
  qual foi.
- Textos passam pela mesma limpeza do Salvar (texto puro, com tamanho máximo) e sempre saem escapados; cor inválida
  vira a cor padrão.
- Arquivo de até 60 MB (cerca de 200 páginas). Passou disso, o servidor descarta o resto e responde 413 com a mensagem.
- Rota: `POST /api/carregar?titulo=<nome>&arquivo=<nome do arquivo>`, corpo = o .html (`Content-Type: text/html`), com
  o mesmo cabeçalho `X-Catalogo: 1` das outras mudanças.

## Personalizar

- **Cores e fonte das telas:** `public/tema.css`.
- **Aparência padrão de um catálogo novo:** `PADRAO`, em `server.js`.
- **Logo:** coloque `public/logo.png` (aparece no topo das telas) e `public/logo-claro.png` (versão clara, vai no
  topo do catálogo do cliente quando a opção "Mostrar o logo" está ligada).
- **Textos de ajuda:** `AJUDA`, no começo de `public/app.js`.

## Testar

```bash
node testes/teste_api.js
```

Sobe um servidor descartável numa pasta temporária e confere 99 pontos: criar, salvar, enviar imagem, duplicar,
excluir, gerar o arquivo do cliente, edição simultânea, papéis, recusas, o Carregar catálogo (arquivo deste
Montador e da página do FlipBook, textos com HTML, imagens ruins, arquivos que não são catálogo, grande demais e quem
não pode) e as pessoas (1.4.0): quem chega fica aguardando liberação, o sininho conta, liberar dá o papel e tira do
sininho, convite, sem acesso, cancelar convite, e quem não é administrador não lista pessoas nem libera. No fim sobe
um segundo servidor no modo local para conferir que nele ninguém aguarda.

## Limites

- Até 300 páginas por catálogo e 4 MB por imagem (a tela reduz cada imagem para no máximo 1600 px antes de enviar).
- Carregar catálogo: arquivo .html de até 60 MB, com imagens JPEG de até 4 MB cada.
- Excluir não tem lixeira: a tela pede confirmação.
- Os catálogos são de todos que entram; quem edita é definido pelos papéis.
