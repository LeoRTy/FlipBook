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
- **Papéis por pessoa:** leitor (vê, visualiza e compartilha), editor (cria, edita, duplica e exclui) e
  administrador (dá os papéis, convidando pelo e-mail).
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
| `ADMINS` | e-mails dos administradores, separados por vírgula |
| `NOME_EMPRESA` | nome que aparece no topo |
| `PORT` | porta (padrão 8080) |
| `DADOS` | pasta do banco e das imagens |

**Atenção:** com `IDENTIDADE_CABECALHO` ligado, o servidor confia nesse cabeçalho. Ele só pode ser alcançado
passando pelo porteiro. Se a porta ficar aberta para fora, qualquer pessoa manda o cabeçalho que quiser e entra como
quem bem entender.

Quem entra sem papel definido é **leitor**. Um administrador abre o selo "Administrador", no topo, digita o e-mail da
pessoa e escolhe Leitor ou Editor. O convite não envia e-mail: o papel passa a valer na próxima vez que a pessoa
abrir o Montador.

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

Sobe um servidor descartável numa pasta temporária e confere 49 pontos: criar, salvar, enviar imagem, duplicar,
excluir, gerar o arquivo do cliente, edição simultânea, papéis e recusas.

## Limites

- Até 300 páginas por catálogo e 4 MB por imagem (a tela reduz cada imagem para no máximo 1600 px antes de enviar).
- Excluir não tem lixeira: a tela pede confirmação.
- Os catálogos são de todos que entram; quem edita é definido pelos papéis.
