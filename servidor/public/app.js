/* Montador de Catálogo: telas (biblioteca de catálogos e editor). Fala com o servidor em /api. */
(() => {
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dataHora = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };
const nomeDoEmail = (e) => String(e || "").split("@")[0].split(/[._-]+/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
const novoId = () => { const a = new Uint8Array(9); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_"); };
function toast(msg) {
  const t = document.createElement("div"); t.className = "t"; t.textContent = msg;
  $("#toast").appendChild(t); setTimeout(() => t.remove(), 4200);
}

const P = {
  book: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.600 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3m0 0L8 7m4-4 4 4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.500 4 4"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3M7 21v-7h10v7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  arquivo: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M12 11v6m-3-3 3 3 3-3"/>',
  github: '<path d="M9 19c-4.500 1.400-4.500-2.500-6-3m12 5v-3.500c0-1 .1-1.400-.5-2 2.800-.300 5.500-1.400 5.500-6a4.600 4.600 0 0 0-1.300-3.200 4.200 4.200 0 0 0-.1-3.200s-1.100-.300-3.500 1.300a12 12 0 0 0-6.200 0C6.500 2.800 5.400 3.100 5.400 3.100a4.200 4.200 0 0 0-.1 3.200A4.600 4.600 0 0 0 4 9.500c0 4.600 2.700 5.700 5.500 6-.6.600-.6 1.200-.5 2V21"/>'
};
const ic = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.book}</svg>`;
const CREDITO = { nome: "Leonardo Teixeira", descricao: "Desenvolvedor e criador do Montador de Catálogo.",
  linkedin: "https://br.linkedin.com/in/leonardo-teixeira-3244a6143", portfolio: "https://leorty.github.io/Portfolio-dev" };

/* ajuda na tela (o "i") */
const AJUDA = {
  admin: ["Para que serve a Administração do Montador", "Aqui você vê todas as pessoas do Montador de Catálogo e decide o que cada uma pode fazer.", [
    "A lista mostra <b>todas as pessoas</b>: quem já abriu o Montador (entra na lista sozinha no primeiro acesso, com a data do primeiro e do último acesso), quem foi convidado e os administradores. Use a busca e o filtro para achar alguém.",
    "<b>Aguardando liberação:</b> a pessoa abriu o Montador e ainda não tem papel. Ela só vê um aviso. Clique em <b>Liberar</b> e escolha o papel. O <b>sininho</b> no topo mostra quantas estão esperando e abre esta lista já filtrada.",
    "<b>Leitor</b> vê os catálogos, visualiza e compartilha com clientes. Não cria, não edita e não exclui.",
    "<b>Editor</b> faz tudo isso e também cria, edita, duplica, carrega e exclui catálogos.",
    "<b>Administrador</b> vem da configuração do servidor (variável ADMINS): faz tudo e abre esta tela. Esse papel não muda por aqui.",
    "<b>Sem acesso</b> barra a pessoa: ela vê só um aviso e não aparece no sininho. Dá para liberar depois, em <b>Editar papel</b>.",
    "<b>Convidar por e-mail</b> dá o papel a alguém antes de a pessoa entrar. Não é enviado e-mail: o papel vale quando ela abrir o Montador.",
    "Quem consegue chegar até o Montador é decidido pelo login da empresa, na frente do servidor. Aqui se decide o que cada um faz depois de entrar."]],
  papel: ["O que cada papel pode fazer", "Escolha o papel e salve. Vale na próxima vez que a pessoa abrir ou atualizar o Montador.", [
    "<b>Leitor</b> vê os catálogos, visualiza e compartilha com clientes.",
    "<b>Editor</b> faz tudo do leitor e também cria, edita, duplica, carrega e exclui catálogos.",
    "<b>Sem acesso</b> barra a pessoa: ela vê só um aviso, e o pedido sai do sininho. Para quem ainda está aguardando, é o mesmo que recusar o pedido.",
    "<b>Cancelar convite</b> aparece para quem foi convidado e ainda não abriu o Montador: a pessoa sai da lista. Se ela abrir depois, aparece como aguardando liberação.",
    "<b>Administrador</b> não aparece aqui: vem da configuração do servidor (ADMINS).",
    "A pessoa não recebe e-mail. Para ela, basta abrir o Montador de novo (ou clicar em <i>Verificar de novo</i> no aviso)."]],
  espera: ["O que é aguardando liberação", "Você já entrou, mas ainda não tem um papel no Montador de Catálogo.", [
    "Quem abre o Montador pela primeira vez fica <b>aguardando liberação</b>. O pedido é registrado sozinho e aparece para os administradores, no sininho do topo.",
    "Um administrador escolhe o seu papel: <b>Leitor</b> (vê e compartilha os catálogos) ou <b>Editor</b> (também cria, edita e exclui).",
    "Não chega e-mail quando o acesso é liberado. Clique em <b>Verificar de novo</b> ou abra o Montador mais tarde."]],
  semacesso: ["Por que estou sem acesso", "Um administrador do Montador de Catálogo não liberou a sua entrada.", [
    "Quem abre o Montador pela primeira vez fica aguardando liberação, e um administrador escolhe o papel de cada pessoa. No seu caso, ele marcou <b>Sem acesso</b>.",
    "Se achar que é engano, fale com um administrador do Montador. Ele pode liberar o seu acesso a qualquer momento.",
    "Depois que ele liberar, clique em <b>Verificar de novo</b> ou abra o Montador outra vez."]],
  lista: ["Como funciona o Montador de Catálogo", "Aqui ficam os catálogos da empresa, sempre com as últimas edições.", [
    "<b>Novo catálogo</b> abre o editor em branco. O catálogo só passa a existir quando você clica em <b>Salvar</b>.",
    "<b>Carregar catálogo</b> traz para cá um catálogo que chegou num arquivo .html (gerado pelo Compartilhar deste Montador ou da página do FlipBook). Ele vira mais um catálogo da biblioteca, para editar ou mandar de novo.",
    "<b>Editar</b> (ou clicar na capa) abre o catálogo para mexer. As alterações só valem depois do <b>Salvar</b>.",
    "<b>Compartilhar</b> gera o arquivo para mandar ao cliente por WhatsApp ou e-mail. Ele abre e folheia, sem precisar de login. Você escolhe entre <b>Enviar por aplicativo</b> e <b>Baixar o arquivo</b> (para abrir no seu computador ou mandar depois).",
    "<b>Duplicar</b> cria uma cópia, boa para fazer uma versão nova sem perder a antiga.",
    "<b>Excluir</b> apaga o catálogo e as imagens dele. Arquivos que você já mandou a clientes continuam funcionando.",
    "Os catálogos são de todos: quem tem acesso ao Montador vê e edita os mesmos."]],
  carregar: ["Como carregar um catálogo", "Traga para a biblioteca um catálogo que chegou num arquivo .html.", [
    "Serve para o arquivo gerado pelo <b>Compartilhar</b> deste Montador e para o arquivo da <b>página do FlipBook</b> (a versão de arquivo único, que qualquer pessoa pode usar). Exemplo: alguém de fora monta o catálogo na página do FlipBook e manda o arquivo para você.",
    "Clique em <b>Carregar catálogo</b>, escolha o arquivo .html e confira o nome. Ao clicar em <b>Carregar</b>, ele vira mais um catálogo da biblioteca: dá para editar, duplicar, compartilhar e excluir como qualquer outro.",
    "Vêm do arquivo: capa, páginas, contracapa, nome, preço e descrição dos produtos, WhatsApp, cores e numeração. A página do FlipBook só traz a cor do fundo: as outras cores ficam as do padrão e o logo começa desligado (dá para ligar em <i>Aparência e textos</i>).",
    "Se alguma imagem não puder ser lida, a página entra em branco e o Montador avisa qual foi. Depois é só abrir o catálogo e colocar a imagem certa.",
    "O Montador só lê o catálogo de dentro do arquivo: nada do arquivo é executado e ele mesmo não fica guardado. Aceita imagens JPEG de até 4 MB cada e o arquivo inteiro até 60 MB.",
    "Não dá para carregar: arquivo que não é catálogo, o montador do FlipBook ainda vazio (sem ter clicado em Compartilhar) e a primeira versão do FlipBook, que guarda as imagens numa pasta separada.",
    "Quem carrega é quem cria catálogos: editor e administrador."]],
  editor: ["Como montar o catálogo", "Carregue as páginas, ajuste a aparência e compartilhe.", [
    "<b>Páginas:</b> clique em um quadro para enviar a imagem. A capa é a primeira e a contracapa a última. Em <i>Adicionar páginas prontas</i> dá para escolher várias de uma vez: cada imagem vira uma página, na ordem escolhida.",
    "<b>Tamanho:</b> o catálogo adota o formato da capa. Use todas as páginas no mesmo tamanho (por exemplo A4 em pé) para nada ficar cortado.",
    "<b>Ordem:</b> as setas de cada página mudam a posição; o X exclui a página.",
    "<b>Aparência e textos:</b> cores do fundo, do destaque e do papel, logo, numeração e os textos dos botões. O link <i>padrão</i> ao lado de cada cor volta à cor original.",
    "<b>Nome, preço e descrição:</b> ligue se as imagens são só fotos dos produtos. Deixe desligado se a arte já vem pronta com tudo escrito.",
    "<b>WhatsApp:</b> preenchendo o número, aparece um botão na contracapa (e em cada produto, se nome e preço estiverem ligados).",
    "<b>Salvar</b> grava o catálogo e tudo o que você mudou. Nada é gravado sozinho: enquanto houver alteração por salvar, aparece o aviso <i>Alterações não salvas</i> ao lado dos botões. O atalho Ctrl+S também salva.",
    "<b>Redefinir</b> desfaz tudo o que você fez desde o último Salvar. O Montador pergunta antes, e o que já estava salvo não muda.",
    "<b>Sair sem salvar:</b> se você for para outra tela ou fechar a aba com alterações por salvar, o Montador pergunta se quer salvar, sair sem salvar ou continuar editando.",
    "<b>Visualizar</b> mostra como o cliente vai ver, já com o que você está editando. <b>Compartilhar</b> gera o arquivo da última versão salva; se houver alteração por salvar, ele pede para salvar antes.",
    "Mais de uma pessoa no mesmo catálogo: se alguém salvou enquanto você editava, o Montador avisa e pergunta com qual versão ficar."]]
};
function ajudaHtml(qual) {
  const titulo = AJUDA[qual][0];
  return `<div class="ajuda-linha"><button class="i-bt" data-a="ajuda" data-k="${qual}" aria-haspopup="dialog" title="${esc(titulo)}">${ic("info")}<span>${esc(titulo)}</span></button></div>`;
}
/* O pop-up da ajuda: abre na frente da tela e fecha no botão Entendi, no X, no Esc ou clicando fora. */
function ajudaJanela() {
  if (!S.ajuda || !AJUDA[S.ajuda]) return "";
  const [titulo, resumo, itens] = AJUDA[S.ajuda];
  return `<div class="fundo ajuda-fundo" data-a="fecha-ajuda-fundo"><div class="janela ajuda-pop" role="dialog" aria-modal="true" aria-labelledby="aj-t" aria-describedby="aj-r">
    <button class="aj-x" data-a="fecha-ajuda" aria-label="Fechar">${ic("x")}</button>
    <div class="aj-cab"><span class="aj-ic">${ic("info")}</span><h2 id="aj-t">${esc(titulo)}</h2></div>
    <div class="aj-corpo"><p class="aj-resumo" id="aj-r">${resumo}</p>
      <ul class="aj-lista">${itens.map((t) => `<li>${t}</li>`).join("")}</ul></div>
    <div class="aj-fim"><button class="btn forte" data-a="fecha-ajuda" id="aj-ok">Entendi</button></div>
  </div></div>`;
}
function fecharAjuda() {
  const qual = S.ajuda; S.ajuda = false; render();
  const bt = $(`.i-bt[data-k="${qual}"]`); if (bt) bt.focus();
}

/* ───────────── estado ───────────── */
const S = { eu: null, erro: null, lista: null, cat: null, id: null, base: null, salvoJson: "", credito: false, modal: null, previa: null, ajuda: false,
  papeis: null, formPapel: null, admBusca: "", admFiltro: "todos" };

async function api(metodo, caminho, corpo, bruto) {
  const cab = { "X-Catalogo": "1" };
  if (corpo !== undefined && !bruto) cab["Content-Type"] = "application/json";
  if (bruto) cab["Content-Type"] = typeof bruto === "string" ? bruto : "image/jpeg";   // corpo cru: imagem (padrão) ou o tipo pedido
  const r = await fetch("api" + caminho, { method: metodo, headers: cab, body: corpo === undefined ? undefined : bruto ? corpo : JSON.stringify(corpo), redirect: "manual", cache: "no-store" });
  if (r.type === "opaqueredirect" || r.status === 0) { location.reload(); throw new Error("Seu login expirou. Recarregando…"); }
  let dados = null;
  try { dados = await r.json(); } catch { /* sem corpo */ }
  if (!r.ok) { const e = new Error((dados && dados.erro) || `Falha (${r.status}).`); e.status = r.status; throw e; }
  return dados;
}

/* ───────────── peças comuns ───────────── */
const temaAtual = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
function topo() {
  const p = S.eu;
  return `${p && p.ambiente === "teste" ? `<div class="faixa-teste">AMBIENTE DE TESTE</div>` : ""}
  <header class="top"><div class="wrap">
    <div class="marca">${p && p.temLogo ? `<img class="marca-img" src="logo.png" alt="">` : `<div class="logo" aria-hidden="true">❒</div>`}
      <div><div class="t1">Montador de Catálogo</div><div class="t2">${esc(p ? p.empresa : "")}</div></div></div>
    <div class="acoes">
      ${p ? `<span class="quem" title="${esc(p.email)}">${esc(p.nome)}</span>` : ""}
      ${p && p.papel === "admin" ? sinoHtml() : ""}
      ${p && p.papel === "admin" ? `<button class="selo" data-a="admin" title="Abrir a Administração do Montador" aria-label="Administração">${ic("shield")} <span class="tx">Administrador</span></button>` : ""}
      <button class="ib" data-a="tema" aria-label="Trocar tema">${ic(temaAtual() === "dark" ? "sun" : "moon")}</button>
    </div></div></header>`;
}
function rodape() {
  return `<footer class="rodape">
    <button type="button" class="credito-btn" data-a="credito" aria-expanded="${S.credito}">Montador de Catálogo</button>
    ${S.credito ? `<div class="painel" role="dialog" aria-label="Criação e desenvolvimento">
      <button class="x" data-a="fecha-credito" aria-label="Fechar">${ic("x")}</button>
      <h4>Montador de Catálogo</h4>
      <div class="cred-linha"><b>${esc(CREDITO.nome)}</b>
        <a class="cred-bt" href="${esc(CREDITO.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de ${esc(CREDITO.nome)}" title="LinkedIn">in</a>
        <a class="cred-bt" href="${esc(CREDITO.portfolio)}" target="_blank" rel="noopener noreferrer" aria-label="Portfólio de ${esc(CREDITO.nome)}" title="Portfólio">${ic("github")}</a></div>
      <p>${esc(CREDITO.descricao)}</p></div>` : ""}</footer>`;
}
function janela() {
  const m = S.modal; if (!m) return "";
  return `<div class="fundo" data-a="fecha-modal-fundo"><div class="janela centro" role="dialog" aria-modal="true">
    ${m.ok ? `<div class="modal-ic">${ic("check")}</div>` : ""}<h2>${esc(m.titulo)}</h2><p class="modal-txt">${m.html}</p>
    <div class="fim">${m.botoes.map((b, i) => `<button class="btn ${b.forte ? "forte" : ""} ${b.perigo ? "perigo" : ""}" data-a="modal-botao" data-k="${i}">${esc(b.texto)}</button>`).join("")}</div></div></div>`;
}
/** Pergunta com botões; resolve com o índice do botão (ou -1 se fechou). */
function perguntar(titulo, html, botoes, ok) {
  return new Promise((resolve) => { S.modal = { titulo, html, botoes, ok, resolve }; render(); });
}
function fecharModal(i) { const m = S.modal; S.modal = null; render(); if (m) m.resolve(i); }

/* ───────────── biblioteca de catálogos ───────────── */
function telaLista() {
  const L = S.lista, edita = S.eu.papel !== "leitor";
  const cartoes = (L || []).map((c) => `
    <article class="cat" data-id="${esc(c.id)}">
      <button class="cat-capa" data-a="${edita ? "editar" : "ver"}" data-k="${esc(c.id)}" data-fundo="${esc(c.fundo)}" aria-label="${edita ? "Editar" : "Visualizar"} ${esc(c.titulo)}">
        ${c.capa ? `<img src="api/imagens/${esc(c.capa)}" alt="" loading="lazy">` : `<span class="cat-vazia">${ic("book")}<span>Sem capa</span></span>`}</button>
      <div class="cat-corpo"><h3>${esc(c.titulo || "Sem título")}</h3>
        <p>${c.paginas} ${c.paginas === 1 ? "página" : "páginas"} · editado por ${esc(nomeDoEmail(c.atualizado_por))} em ${esc(dataHora(c.atualizado_em))}</p>
        <p class="mini">${c.compartilhado_em ? "Último arquivo gerado em " + esc(dataHora(c.compartilhado_em)) : "Ainda não compartilhado"}</p></div>
      <div class="cat-acoes">
        ${edita ? `<button class="btn mini forte" data-a="editar" data-k="${esc(c.id)}">${ic("edit")} Editar</button>` : `<button class="btn mini forte" data-a="ver" data-k="${esc(c.id)}">${ic("eye")} Visualizar</button>`}
        <button class="btn mini" data-a="compartilhar" data-k="${esc(c.id)}" title="Gerar o arquivo do cliente">${ic("share")} Compartilhar</button>
        ${edita ? `<button class="btn mini" data-a="ver" data-k="${esc(c.id)}" title="Visualizar">${ic("eye")}<span class="sr">Visualizar</span></button>
        <button class="btn mini" data-a="duplicar" data-k="${esc(c.id)}" title="Criar uma cópia">${ic("copy")}<span class="sr">Duplicar</span></button>
        <button class="btn mini perigo" data-a="excluir" data-k="${esc(c.id)}" title="Excluir">${ic("trash")}<span class="sr">Excluir</span></button>` : ""}
      </div></article>`).join("");
  return `${topo()}<main class="wrap">
    <section class="ola linha"><div><h1>Catálogos</h1><p>${edita ? "Escolha um catálogo salvo para editar ou compartilhar, ou crie um novo. Tudo o que você salva fica guardado aqui." : "Escolha um catálogo para visualizar ou compartilhar com o cliente. Para criar ou editar, peça a um administrador do Montador."}</p></div>
      ${edita ? `<div class="ola-botoes">
        <button class="btn" data-a="carregar" title="Trazer para a biblioteca um catálogo que veio num arquivo .html">${ic("arquivo")} Carregar catálogo</button>
        <input type="file" id="carregar-arq" accept=".html,.htm,text/html" hidden>
        <button class="btn forte" data-a="novo">${ic("plus")} Novo catálogo</button></div>` : ""}</section>
    ${ajudaHtml("lista")}
    ${L === null ? `<div class="vazio">Carregando…</div>` : L.length ? `<div class="cats">${cartoes}</div>`
      : `<div class="vazio">${edita ? 'Nenhum catálogo ainda. Clique em "Novo catálogo" para montar o primeiro.' : "Nenhum catálogo ainda."}</div>`}
  </main>${rodape()}`;
}

/* ───────────── administração: todas as pessoas e o papel de cada uma (1.4.0) ─────────────
   A pessoa entra na lista sozinha no primeiro acesso e fica aguardando liberação até um administrador escolher o papel.
   O sininho do topo conta quem está aguardando e abre esta tela já filtrada. */
const iniciais = (n) => String(n || "?").split(/ +/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
const NOME_PAPEL = { admin: "Administrador", editor: "Editor", leitor: "Leitor", pendente: "Aguardando liberação", sem_acesso: "Sem acesso" };
const COR_PAPEL = { admin: "ok", editor: "ok", leitor: "", pendente: "warn", sem_acesso: "no" };
const OPCOES_PAPEL = {
  leitor: ["Leitor", "Vê os catálogos, visualiza e compartilha com clientes. Não cria, não edita e não exclui."],
  editor: ["Editor", "Faz tudo do leitor e também cria, edita, duplica, carrega e exclui catálogos."],
  sem_acesso: ["Sem acesso", "A pessoa não entra: vê só um aviso e não aparece no sininho. Dá para liberar depois."],
  "": ["Cancelar convite", "Tira o convite e a pessoa sai da lista. Se ela abrir o Montador depois, aparece como aguardando liberação."]
};
const FILTROS_PAPEL = [["todos", "Todos"], ["pendente", "Aguardando liberação"], ["leitor", "Leitores"], ["editor", "Editores"], ["admin", "Administradores"], ["sem_acesso", "Sem acesso"]];

/* o sininho dos administradores: quantas pessoas abriram o Montador e esperam um papel */
function sinoHtml() {
  const n = (S.eu && S.eu.pendentes) || 0;
  const dica = n ? `${n} ${n === 1 ? "pessoa aguardando" : "pessoas aguardando"} liberação` : "Ninguém aguardando liberação";
  return `<button class="ib sino ${n ? "tem" : ""}" data-a="pendentes" title="${dica}" aria-label="${dica}">${ic("bell")}${n ? `<span class="sino-n">${n > 99 ? "99+" : n}</span>` : ""}</button>`;
}
function pessoasFiltradas() {
  if (!S.papeis) return [];
  const q = (S.admBusca || "").trim().toLowerCase(), f = S.admFiltro || "todos";
  return S.papeis.pessoas.filter((p) => (f === "todos" || p.papel === f) && (!q || `${p.nome} ${p.email}`.toLowerCase().includes(q)));
}
function listaAdminHtml() {
  if (!S.papeis) return `<div class="vazio">Carregando…</div>`;
  const L = pessoasFiltradas();
  if (!L.length) return `<div class="vazio">${S.papeis.pessoas.length ? "Ninguém encontrado. Mude a busca ou o filtro." : "Ninguém abriu o Montador ainda."}</div>`;
  return L.map((p) => {
    const quando = p.papel === "pendente" ? "abriu o Montador em " + dataHora(p.pediu_em)
      : p.ultimo_acesso ? `primeiro acesso ${dataHora(p.primeiro_acesso)} · último ${dataHora(p.ultimo_acesso)}` : p.papel === "admin" ? "ainda não entrou" : "convidado, ainda não entrou";
    const definido = p.definido_por && p.papel !== "pendente" ? ` · papel dado por ${nomeDoEmail(p.definido_por)} em ${dataHora(p.definido_em)}` : "";
    return `<div class="item ${p.papel === "pendente" ? "pendente" : ""}"><span class="av">${esc(iniciais(p.nome))}</span>
      <div class="txt"><div class="tt">${esc(p.nome)} <span class="pill ${COR_PAPEL[p.papel] || ""}">${NOME_PAPEL[p.papel] || esc(p.papel)}</span></div>
        <div class="sub">${esc(p.email)} · ${esc(quando)}${esc(definido)}</div></div>
      ${p.papel === "admin" ? `<span class="sub fixo">definido na configuração</span>`
        : `<button class="btn mini ${p.papel === "pendente" ? "forte" : ""}" data-a="papel-editar" data-k="${esc(p.email)}">${p.papel === "pendente" ? "Liberar" : "Editar papel"}</button>`}</div>`;
  }).join("");
}
const contaTexto = () => S.papeis ? `Mostrando ${pessoasFiltradas().length} de ${S.papeis.pessoas.length} ${S.papeis.pessoas.length === 1 ? "pessoa" : "pessoas"}.` : "";
function telaAdmin() {
  const D = S.papeis, n = (k) => D ? D.pessoas.filter((p) => k === "todos" || p.papel === k).length : 0;
  return `${topo()}<main class="wrap">
    <div class="adm-cab"><button class="voltar" data-a="sair-admin">${ic("back")} Catálogos</button></div>
    <h1 class="adm-titulo">Administração do Montador</h1>
    <section class="painel-adm">${ajudaHtml("admin")}
      <div class="adm-barra">
        <label class="busca">${ic("search")}<input id="adm-busca" type="search" placeholder="Buscar por nome ou e-mail" value="${esc(S.admBusca || "")}" aria-label="Buscar pessoa"></label>
        <select id="adm-filtro" class="btn" aria-label="Filtrar por papel">${FILTROS_PAPEL.map(([k, t]) => `<option value="${k}" ${(S.admFiltro || "todos") === k ? "selected" : ""}>${t} (${n(k)})</option>`).join("")}</select>
        <button class="btn forte" data-a="convidar">${ic("plus")} Convidar por e-mail</button></div>
      <div class="lista" id="adm-lista">${listaAdminHtml()}</div>
      <p class="nota" id="adm-conta">${contaTexto()}</p>
      ${D && D.historico.length ? `<h2 class="sub-titulo">Últimas mudanças</h2><div class="lista hist">${D.historico.map((h) => `<div class="item"><time>${esc(dataHora(h.quando))}</time><div class="txt"><div class="tt">${esc(h.alvo.replace("permissão: ", ""))}</div><div class="sub">${esc(h.detalhe)} · por ${esc(nomeDoEmail(h.quem))}</div></div></div>`).join("")}</div>` : ""}
    </section></main>${rodape()}`;
}
/* janela para liberar um pedido, editar o papel de uma pessoa ou convidar por e-mail */
function janelaPapel() {
  const f = S.formPapel; if (!f) return "";
  // "Cancelar convite" só para quem foi convidado e ainda não entrou; no convite novo, só Leitor e Editor
  const chaves = f.convite ? ["leitor", "editor"] : f.convidado ? ["leitor", "editor", ""] : ["leitor", "editor", "sem_acesso"];
  const opcoes = chaves.map((k) => { const [t, d] = OPCOES_PAPEL[k];
    return `<label class="opcao"><input type="radio" name="papel" value="${k}" ${f.papel === k ? "checked" : ""}><span><b>${t}</b><small>${d}</small></span></label>`; }).join("");
  return `<div class="fundo" data-a="fecha-form-fundo"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="pp-t">
    <h2 id="pp-t">${f.convite ? "Convidar por e-mail" : f.pendente ? "Liberar acesso" : "Editar papel"}</h2>
    ${ajudaHtml("papel")}
    ${f.convite ? `<label class="campo"><span>E-mail da pessoa</span><input id="pp-email" type="email" maxlength="120" placeholder="nome@empresa">
        <span class="ajuda">Não é enviado e-mail. O papel passa a valer quando a pessoa abrir o Montador.</span></label>`
      : `<p class="pp-quem"><b>${esc(f.nome)}</b><span>${esc(f.email)}</span></p>`}
    <div class="opcoes" role="radiogroup" aria-label="Papel">${opcoes}</div>
    <div class="erro" id="pp-erro" role="alert"></div>
    <div class="fim"><button class="btn" data-a="fecha-form">Cancelar</button><button class="btn forte" data-a="papel-salvar">${f.convite ? "Convidar" : f.pendente ? "Liberar" : "Salvar"}</button></div>
  </div></div>`;
}
async function salvarPapel() {
  const f = S.formPapel, marcado = document.querySelector('input[name="papel"]:checked');
  const email = f.convite ? $("#pp-email").value.trim().toLowerCase() : f.email;
  const erro = (m) => { $("#pp-erro").textContent = m; };
  if (!email) return erro("Digite o e-mail da pessoa.");
  if (!marcado) return erro("Escolha o papel.");
  try {
    if (marcado.value) await api("PUT", "/admin/papeis/" + encodeURIComponent(email), { papel: marcado.value });
    else await api("DELETE", "/admin/papeis/" + encodeURIComponent(email));
    S.formPapel = null;
    await carregarPapeis(); S.eu = { ...S.eu, pendentes: (await api("GET", "/eu")).pendentes };
    render();
    toast(f.convite ? "Convite registrado." : !marcado.value ? "Convite cancelado." : marcado.value === "sem_acesso" ? "Acesso barrado." : f.pendente ? "Acesso liberado." : "Papel alterado.");
  } catch (e) { erro(e.message); }
}
function redesenharLista() {
  const l = $("#adm-lista"); if (l) l.innerHTML = listaAdminHtml();
  const c = $("#adm-conta"); if (c) c.textContent = contaTexto();
}
async function carregarPapeis() { S.papeis = await api("GET", "/admin/papeis"); }

/* quem abriu o Montador e ainda não recebeu papel (ou foi barrado): só este aviso */
function telaPendente() {
  const p = S.eu, barrado = p.papel === "sem_acesso";
  return `${topo()}<main class="entrada"><div class="caixa"><div class="modal-ic espera ${barrado ? "barrado" : ""}">${ic(barrado ? "lock" : "clock")}</div>
    <h1>${barrado ? "Sem acesso ao Montador" : "Aguardando liberação"}</h1>
    <p>Olá, ${esc(String(p.nome || "").split(" ")[0])}. ${barrado ? "Um administrador não liberou o seu acesso ao Montador de Catálogo. Se achar que é engano, fale com ele."
      : "Seu pedido de acesso ao Montador de Catálogo foi registrado. Os administradores já veem o pedido e vão definir o que você pode fazer aqui."}</p>
    ${barrado ? ajudaHtml("semacesso") : ajudaHtml("espera")}
    <button class="btn forte" data-a="recarregar">Verificar de novo</button>
  </div></main>${rodape()}`;
}

/* ───────────── editor ─────────────
   Nada é gravado sozinho: o catálogo (e as alterações) só vão para o servidor no botão Salvar.
   "Novo catálogo" abre o editor em branco e o catálogo só passa a existir no primeiro Salvar.
   Redefinir desfaz tudo o que foi feito desde o último Salvar. Ao sair com alterações, o Montador pergunta antes. */

// Imagens escolhidas e ainda não salvas ficam só no navegador: "local:N" -> { blob, url, r }. Sobem no Salvar.
const locais = new Map();
let nLocal = 0;
const ehLocal = (id) => String(id || "").startsWith("local:");
const srcImg = (id) => !id ? "" : ehLocal(id) ? ((locais.get(id) || {}).url || "") : "api/imagens/" + id;
function soltarLocais(manter) {
  for (const [k, l] of locais) { if (manter && manter.has(k)) continue; URL.revokeObjectURL(l.url); locais.delete(k); }
}
const folha = (im) => ({ id: novoId(), img: im ? im.id : "", r: im ? im.r : 0, nome: "", preco: "", descricao: "" });
const emBranco = () => ({ titulo: "", aparencia: { ...S.eu.padrao }, capa: { img: "", r: 0 }, contracapa: { img: "", r: 0 }, paginas: [folha(), folha()] });
const proporcao = () => { const c = S.cat; return Math.min(1.3, Math.max(0.5, c.capa.r || ((c.paginas.find((p) => p.r) || {}).r) || 0.72)); };
/** Há alteração ainda não salva? (compara com a cópia do último Salvar) */
const mudou = () => Boolean(S.cat) && JSON.stringify(S.cat) !== S.salvoJson;

function cartaoPagina(p, tipo, i) {
  const c = S.cat, rotulo = tipo === "capa" ? "Capa" : tipo === "contracapa" ? "Contracapa" : "Página " + (i + 1);
  const ferramentas = tipo === "pagina" ? `<div class="pc-tools"><button data-p="antes" title="Mover para antes" aria-label="Mover para antes">${ic("left")}</button><button data-p="depois" title="Mover para depois" aria-label="Mover para depois">${ic("right")}</button><button data-p="apagar" title="Excluir página" aria-label="Excluir página">${ic("x")}</button></div>` : "";
  const img = p.img ? `<img src="${esc(srcImg(p.img))}" alt=""><span class="chg">Trocar imagem</span>`
    : `<span><span class="plus">＋</span>${tipo === "pagina" ? (c.aparencia.info ? "Foto do produto" : "Imagem da página") : tipo === "capa" ? "Imagem da capa" : "Imagem da contracapa"}</span>`;
  const campos = tipo === "pagina" && c.aparencia.info ? `
      <input type="text" data-f="nome" placeholder="Nome do produto" value="${esc(p.nome)}" maxlength="80">
      <input type="text" data-f="preco" placeholder="Preço (ex.: R$ 89,90)" value="${esc(p.preco)}" maxlength="40">
      <textarea data-f="descricao" rows="2" placeholder="Descrição curta" maxlength="300">${esc(p.descricao)}</textarea>` : "";
  return `<article class="pc ${tipo}" data-tipo="${tipo}" data-id="${esc(p.id || "")}">
      <div class="pc-head"><span class="pc-label">${rotulo}</span>${ferramentas}</div>
      <label class="pc-img ${p.img ? "has" : ""}">${img}<input type="file" accept="image/*" hidden></label>
      ${campos}${p.img ? '<button class="link" data-p="tirar">Remover imagem</button>' : ""}</article>`;
}
function paginasHtml() {
  const c = S.cat;
  return cartaoPagina(c.capa, "capa") + c.paginas.map((p, i) => cartaoPagina(p, "pagina", i)).join("") + cartaoPagina(c.contracapa, "contracapa");
}
function telaEditor() {
  const c = S.cat, ap = c.aparencia, n = c.paginas.length;
  const chave = (campo, titulo, ajuda) => `<label class="sw"><input type="checkbox" data-ap="${campo}" ${ap[campo] ? "checked" : ""}><span>${titulo}<small>${ajuda}</small></span></label>`;
  const cor = (campo, titulo) => `<label class="f cor">${titulo}<span class="cor-linha"><input type="color" data-ap="${campo}" value="${esc(ap[campo])}"><button class="link" data-a="cor-padrao" data-k="${campo}" title="Voltar à cor padrão">padrão</button></span></label>`;
  return `${topo()}
  <div class="ed-barra" id="ed-barra"><div class="wrap">
    <button class="voltar" data-a="lista">${ic("back")} Catálogos</button>
    <span class="salvo" id="salvo" role="status"></span>
    <button class="btn" data-a="redefinir" id="bt-redefinir" title="Desfazer tudo o que foi feito desde o último Salvar">${ic("undo")} <span class="tx">Redefinir</span></button>
    <button class="btn" data-a="visualizar" title="Ver como o cliente vai ver">${ic("eye")} <span class="tx">Visualizar</span></button>
    <button class="btn" data-a="compartilhar-editor" title="Gerar o arquivo do cliente">${ic("share")} <span class="tx">Compartilhar</span></button>
    <button class="btn forte" data-a="salvar" id="bt-salvar" title="Gravar o catálogo e as alterações">${ic("save")} Salvar</button>
  </div></div>
  <main class="wrap ed">
    ${ajudaHtml("editor")}
    <section class="bloco-ed"><h2>Informações</h2>
      <div class="duas"><label class="f">Nome do catálogo<input class="inp" data-c="titulo" type="text" maxlength="80" placeholder="Ex.: Coleção Verão 2027" value="${esc(c.titulo)}"></label>
        <label class="f">WhatsApp para pedidos (opcional)<input class="inp" data-ap="whatsapp" type="text" inputmode="tel" maxlength="30" placeholder="55 11 99999-9999" value="${esc(ap.whatsapp)}"></label></div>
    </section>
    <details class="bloco-ed" ${S.aparenciaAberta ? "open" : ""}><summary><h2>Aparência e textos</h2><span>cores, logo e botões do catálogo</span></summary>
      <div class="cores">${cor("fundo", "Fundo da tela")}${cor("destaque", "Cor de destaque")}${cor("papel", "Cor do papel")}</div>
      ${chave("logo", "Mostrar o logo da empresa no topo do catálogo", "Aparece no arquivo que o cliente abre. Precisa do arquivo public/logo-claro.png no servidor.")}
      ${chave("numeros", "Numerar as páginas", "Mostra 01, 02, 03… no canto de cada página.")}
      ${chave("info", "Adicionar nome, preço e descrição nas páginas", "Deixe desligado se as páginas já vêm prontas da arte, com todas as informações.")}
      <div class="duas topo-esp"><label class="f">Texto do botão da contracapa<input class="inp" data-ap="botaoContato" type="text" maxlength="40" value="${esc(ap.botaoContato)}"></label>
        <label class="f">Texto do botão de cada produto<input class="inp" data-ap="botaoPedido" type="text" maxlength="30" value="${esc(ap.botaoPedido)}"></label></div>
      <label class="f topo-esp">Mensagem que chega no WhatsApp<input class="inp" data-ap="mensagemContato" type="text" maxlength="200" value="${esc(ap.mensagemContato)}"></label>
      <label class="f topo-esp">Dica que aparece ao abrir<input class="inp" data-ap="dica" type="text" maxlength="80" value="${esc(ap.dica)}"></label>
      <p class="nota">Os botões de WhatsApp só aparecem se o número estiver preenchido. O link padrão ao lado de cada cor volta à cor original.</p>
    </details>
    <div class="sec-head"><h2>Páginas</h2><span id="conta">Capa + ${n} ${n === 1 ? "página" : "páginas"} + contracapa</span></div>
    <section class="b-pages" id="paginas">${paginasHtml()}</section>
    <div class="b-add">
      <label class="btn add">${ic("plus")} Adicionar páginas prontas<input type="file" accept="image/*" multiple id="varias" hidden></label>
      <button class="btn" data-a="pagina-vazia">${ic("plus")} Página vazia</button>
    </div>
    <p class="nota">Dica: selecione várias imagens de uma vez e cada uma vira uma página, na ordem escolhida. O catálogo adota o formato da capa, então use todas as páginas no mesmo tamanho (por exemplo A4 em pé) para nada ficar cortado. Nada é gravado até você clicar em <b>Salvar</b>.</p>
  </main>${rodape()}`;
}

/* a barra do editor: diz se há alteração por salvar e liga ou desliga Salvar e Redefinir */
function atualizarBarra(texto) {
  const barra = $("#ed-barra"); if (!barra || !S.cat) return;
  const pend = mudou(), novoCat = !S.id;
  $("#salvo").textContent = texto || (pend ? "Alterações não salvas" : novoCat ? "Catálogo novo, ainda não salvo" : "Salvo");
  barra.classList.toggle("pendente", pend || novoCat);
  $("#bt-salvar").disabled = Boolean(texto) || (!pend && !novoCat);
  $("#bt-redefinir").disabled = Boolean(texto) || !pend;
}
const tocou = () => atualizarBarra();

/* Salvar: cria o catálogo (se for novo), envia as imagens que estavam só no navegador e grava tudo. */
let salvando = false;
async function gravar(forcar) {
  try {
    const r = await api("PUT", "/catalogos/" + S.id, { dados: S.cat, base: S.base, forcar: Boolean(forcar) });
    S.base = r.atualizado_em; S.salvoJson = JSON.stringify(S.cat);
    return true;
  } catch (e) {
    if (e.status !== 409) throw e;
    const i = await perguntar("Outra pessoa editou este catálogo", esc(e.message) + " Você quer ficar com a sua versão ou abrir a versão dela?",
      [{ texto: "Abrir a versão dela" }, { texto: "Ficar com a minha", forte: true }]);
    if (i === 1) return gravar(true);
    if (i === 0) { await abrir(S.id); toast("Aberta a versão mais recente."); }
    return false;
  }
}
async function salvarCatalogo() {
  if (salvando || !S.cat) return false;
  if (!S.cat.titulo.trim()) {
    toast("Dê um nome ao catálogo antes de salvar.");
    const campo = $('[data-c="titulo"]'); if (campo) campo.focus();
    return false;
  }
  salvando = true; atualizarBarra("Salvando…");
  let ok = false;
  try {
    if (!S.id) {
      const r = await api("POST", "/catalogos", { titulo: S.cat.titulo.trim() });
      S.id = r.id; S.base = null;
      history.replaceState(null, "", "#/c/" + S.id);
    }
    const porSubir = [S.cat.capa, S.cat.contracapa, ...S.cat.paginas].filter((f) => ehLocal(f.img));
    let n = 0;
    for (const f of porSubir) {
      atualizarBarra(`Enviando imagens: ${++n} de ${porSubir.length}…`);
      const l = locais.get(f.img);
      if (!l) { f.img = ""; f.r = 0; continue; }
      const r = await api("POST", `/catalogos/${S.id}/imagens?r=${l.r}`, l.blob, true);
      f.img = r.id;
    }
    atualizarBarra("Salvando…");
    ok = await gravar(false);
    if (ok) { soltarLocais(); redesenharPaginas(); toast("Catálogo salvo."); }
  } catch (e) { toast(e.message); }
  salvando = false; atualizarBarra();
  return ok;
}

/** Antes de sair do editor: se há alteração por salvar, pergunta. Devolve true se pode sair. */
async function podeSair() {
  if (!mudou()) return true;
  const i = await perguntar("Sair sem salvar?", "Este catálogo tem alterações que ainda não foram salvas. O que você quer fazer?",
    [{ texto: "Continuar editando" }, { texto: "Sair sem salvar", perigo: true }, { texto: "Salvar e sair", forte: true }]);
  if (i === 2) return salvarCatalogo();
  return i === 1;
}
function fecharEditor() { S.cat = null; S.id = null; S.base = null; S.salvoJson = ""; soltarLocais(); }

function reduzir(file, max = 1600, q = 0.85) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      let w = im.naturalWidth, h = im.naturalHeight;
      const s = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * s); h = Math.round(h * s);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob((b) => b ? res({ blob: b, r: +(w / h).toFixed(4) }) : rej(new Error("Imagem inválida")), "image/jpeg", q);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Não consegui abrir essa imagem.")); };
    im.src = url;
  });
}
/** Prepara a imagem escolhida e a guarda só no navegador, até o Salvar. */
async function guardarLocal(file) {
  const im = await reduzir(file);
  const chave = "local:" + (++nLocal);
  locais.set(chave, { blob: im.blob, url: URL.createObjectURL(im.blob), r: im.r });
  return { id: chave, r: im.r };
}
function redesenharPaginas() {
  const el = $("#paginas"); if (!el) return;
  el.style.setProperty("--r", proporcao());
  el.innerHTML = paginasHtml();
  const n = S.cat.paginas.length;
  $("#conta").textContent = `Capa + ${n} ${n === 1 ? "página" : "páginas"} + contracapa`;
}
const objetoDe = (cartao) => { const t = cartao.dataset.tipo; return t === "capa" ? S.cat.capa : t === "contracapa" ? S.cat.contracapa : S.cat.paginas.find((p) => p.id === cartao.dataset.id); };

/* ───────────── ações ───────────── */
async function carregarLista() { S.lista = await api("GET", "/catalogos"); }
async function abrir(id) {
  if (S.eu.papel === "leitor") throw new Error("Você pode ver e compartilhar os catálogos, mas não editar.");
  const r = await api("GET", "/catalogos/" + id);
  soltarLocais();
  S.id = r.id; S.cat = r.dados; S.base = r.atualizado_em; S.salvoJson = JSON.stringify(S.cat); S.aparenciaAberta = false; S.tela = null;
  if (location.hash !== "#/c/" + id) history.pushState(null, "", "#/c/" + id);
  render(); scrollTo(0, 0);
}
/** Novo catálogo: abre o editor em branco. Nada vai para o servidor até o Salvar. */
function novo() {
  soltarLocais();
  S.id = null; S.base = null; S.cat = emBranco(); S.salvoJson = JSON.stringify(S.cat); S.aparenciaAberta = false; S.tela = null;
  if (location.hash !== "#/novo") history.pushState(null, "", "#/novo");
  render(); scrollTo(0, 0);
  const campo = $('[data-c="titulo"]'); if (campo) campo.focus();
}
async function irLista() {
  if (S.cat && !(await podeSair())) return;
  fecharEditor(); S.lista = null;
  if (location.hash) history.pushState(null, "", location.pathname);
  render();
  try { await carregarLista(); } catch (e) { toast(e.message); S.lista = []; }
  render();
}
/** Abre a Administração; o sininho abre já filtrada em "Aguardando liberação". */
async function abrirAdmin(filtro) {
  if (S.cat && !(await podeSair())) return;
  fecharEditor();
  S.tela = "admin"; S.papeis = null; S.ajuda = false; S.admFiltro = filtro || "todos"; S.admBusca = "";
  if (location.hash) history.pushState(null, "", location.pathname);
  render(); await carregarPapeis(); render();
}
async function compartilhar(id) {
  toast("Preparando o arquivo…");
  let blob, nome = "catalogo.html";
  try {
    const r = await fetch(`api/catalogos/${id}/exportar`, { headers: { "X-Catalogo": "1" }, cache: "no-store" });
    if (!r.ok) { let d = null; try { d = await r.json(); } catch { /* sem corpo */ } throw new Error((d && d.erro) || `Falha (${r.status}).`); }
    const m = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || ""); if (m) nome = m[1];
    blob = await r.blob();
  } catch (e) { toast(e.message); return; }
  const file = new File([blob], nome, { type: "text/html" });
  const mb = (file.size / 1048576).toFixed(1).replace(".", ",");
  // Onde o aparelho sabe enviar arquivos (celular, Windows), a pessoa escolhe: enviar por um aplicativo ou só baixar.
  let enviado = false, querEnviar = false;
  try { querEnviar = Boolean(navigator.canShare && navigator.canShare({ files: [file] })); } catch { querEnviar = false; }
  if (querEnviar) {
    const i = await perguntar("Como você quer o arquivo?", `O arquivo <b>${esc(nome)}</b> (${mb} MB) está pronto. <b>Enviar</b> abre os aplicativos deste aparelho (WhatsApp, e-mail e outros). <b>Baixar</b> guarda o arquivo aqui, para abrir no navegador ou mandar depois.`,
      [{ texto: "Cancelar" }, { texto: "Baixar o arquivo" }, { texto: "Enviar por aplicativo", forte: true }]);
    if (i < 1) return;
    querEnviar = i === 2;
  }
  try {
    if (querEnviar) { await navigator.share({ files: [file], title: nome }); enviado = true; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  if (!enviado) {
    const url = URL.createObjectURL(file), a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  await perguntar("Catálogo pronto!", `O arquivo <b>${esc(nome)}</b> (${mb} MB) foi ${enviado ? "enviado" : "baixado"}. Mande para o cliente por WhatsApp ou e-mail: ao abrir, ele vê só a revista, pronta para folhear, sem precisar de login. O catálogo continua salvo aqui para você editar e gerar de novo quando quiser.`,
    [{ texto: "Entendi", forte: true }], true);
  if (!S.cat) { try { await carregarLista(); } catch { /* fica a lista de antes */ } render(); }
}
/** Compartilhar de dentro do editor: o arquivo sai do que está salvo, então pede para salvar antes. */
async function compartilharDoEditor() {
  if (!S.id || mudou()) {
    const i = await perguntar("Salvar antes de compartilhar?", "O arquivo do cliente é gerado a partir do que está salvo. Este catálogo tem alterações que ainda não foram salvas.",
      [{ texto: "Cancelar" }, { texto: "Salvar e compartilhar", forte: true }]);
    if (i !== 1 || !(await salvarCatalogo())) return;
  }
  await compartilhar(S.id);
}
async function redefinir() {
  if (!mudou()) return;
  const i = await perguntar("Redefinir o catálogo?", S.id
      ? "Tudo o que você mudou desde o último Salvar será desfeito, inclusive as imagens que ainda não foram salvas. O que já estava salvo continua como está."
      : "Este catálogo ainda não foi salvo. Tudo o que você fez nele será apagado e ele volta a ficar em branco.",
    [{ texto: "Cancelar" }, { texto: "Sim, redefinir", perigo: true }]);
  if (i !== 1) return;
  S.cat = JSON.parse(S.salvoJson); soltarLocais();
  render(); toast("Alterações desfeitas.");
}
function visualizar(c = S.cat) {
  const dados = { titulo: c.titulo, aparencia: c.aparencia, logo: "", capa: { img: srcImg(c.capa.img), r: c.capa.r }, contracapa: { img: srcImg(c.contracapa.img), r: c.contracapa.r },
    paginas: c.paginas.map((p) => ({ img: srcImg(p.img), r: p.r, nome: p.nome, preco: p.preco, descricao: p.descricao })) };
  $("#app").hidden = true; scrollTo(0, 0);
  S.previa = Revista.montar($("#revista"), dados, { previa: true, aoFechar: () => { S.previa = null; $("#app").hidden = false; } });
}

/* ───────────── Carregar catálogo (1.3.0) ─────────────
   A pessoa escolhe um .html de catálogo (do Compartilhar deste Montador ou da página do FlipBook). A tela só lê o nome e o número de
   páginas, com o mesmo leitor do servidor (ler-catalogo.js), e pede o nome do catálogo. Quem confere tudo (formato,
   imagens, tamanhos, permissão) e grava é o servidor. O HTML escolhido nunca é aberto nem executado aqui. */
const mbTexto = (n) => (n / 1048576).toFixed(1).replace(".", ",");
async function escolherCarregar(arq) {
  if (!arq) return;
  const max = S.eu.maxCarregar || 60 * 1048576;
  const recusar = (html) => perguntar("Não deu para carregar este arquivo", html, [{ texto: "Entendi", forte: true }]);
  if (!/\.html?$/i.test(arq.name) && arq.type !== "text/html") return recusar(`<b>${esc(arq.name)}</b> não é um arquivo .html. Escolha o arquivo do catálogo, que termina em <b>.html</b>.`);
  if (arq.size > max) return recusar(`O arquivo <b>${esc(arq.name)}</b> tem ${mbTexto(arq.size)} MB e o limite para carregar é ${mbTexto(max)} MB.`);
  toast("Lendo o arquivo…");
  let lido;
  try { lido = LerCatalogo.extrair(await arq.text()); }
  catch (e) { return recusar(esc(e.message)); }
  // conta só as imagens que vêm dentro do arquivo (as por link o servidor ignora e avisa)
  const imagens = [lido.capa, lido.contracapa, ...lido.paginas].filter((f) => /^data:image\//i.test(f.img)).length;
  const titulo = (lido.titulo || arq.name.replace(/\.html?$/i, "").replace(/[-_]+/g, " ")).trim().slice(0, 80);
  S.formCarregar = { arquivo: arq, nome: arq.name, tamanho: arq.size, formato: lido.formato, paginas: lido.paginas.length, imagens, titulo, erro: "", enviando: false };
  render();
  const campo = $("#cc-titulo"); if (campo) { campo.focus(); campo.select(); }
}
function janelaCarregar() {
  const f = S.formCarregar; if (!f) return "";
  const n = f.paginas, trava = f.enviando ? "disabled" : "";
  return `<div class="fundo" data-a="fecha-carregar-fundo"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="cc-t">
    <h2 id="cc-t">Carregar catálogo</h2>
    ${ajudaHtml("carregar")}
    <div class="cc-arq">${ic("arquivo")}<div><b>${esc(f.nome)}</b>
      <span>${esc(LerCatalogo.NOME_FORMATO[f.formato] || "Arquivo de catálogo")} · capa + ${n} ${n === 1 ? "página" : "páginas"} + contracapa · ${f.imagens} ${f.imagens === 1 ? "imagem" : "imagens"} · ${mbTexto(f.tamanho)} MB</span></div></div>
    <label class="campo"><span>Nome do catálogo</span><input id="cc-titulo" type="text" maxlength="80" value="${esc(f.titulo)}" placeholder="Ex.: Catálogo Casa Aurora" ${trava}>
      <span class="ajuda">É o nome que aparece na biblioteca. Dá para mudar depois, no editor.</span></label>
    <p class="nota cc-nota">Vira um catálogo novo da biblioteca, com as páginas, as imagens, a aparência e a numeração do arquivo. O arquivo em si não fica guardado.</p>
    <div class="erro" id="cc-erro" role="alert">${esc(f.erro)}</div>
    <div class="fim"><button class="btn" data-a="fecha-carregar" ${trava}>Cancelar</button>
      <button class="btn forte" data-a="carregar-enviar" ${trava}>${ic("arquivo")} ${f.enviando ? "Carregando…" : "Carregar"}</button></div>
  </div></div>`;
}
function fecharCarregar() { if (S.formCarregar && !S.formCarregar.enviando) { S.formCarregar = null; render(); } }
async function enviarCarregar() {
  const f = S.formCarregar; if (!f || f.enviando) return;
  const titulo = f.titulo.trim();
  if (!titulo) { f.erro = "Dê um nome ao catálogo."; render(); const c = $("#cc-titulo"); if (c) c.focus(); return; }
  f.enviando = true; f.erro = ""; render();
  let r;
  try { r = await api("POST", `/carregar?titulo=${encodeURIComponent(titulo)}&arquivo=${encodeURIComponent(f.nome)}`, f.arquivo, "text/html"); }
  catch (e) { f.enviando = false; f.erro = e.message; render(); return; }
  S.formCarregar = null;
  try { await carregarLista(); } catch { /* fica a lista de antes */ }
  render();
  const avisos = r.avisos || [];
  const lista = avisos.slice(0, 6).map((a) => "• " + esc(a)).join("<br>") + (avisos.length > 6 ? `<br>• e mais ${avisos.length - 6}` : "");
  const i = await perguntar("Catálogo carregado!", `<b>${esc(r.titulo)}</b> entrou na biblioteca com capa + ${r.paginas} ${r.paginas === 1 ? "página" : "páginas"} + contracapa. Dá para editar, duplicar e compartilhar como qualquer outro.` +
      (avisos.length ? `<br><br><b>${avisos.length === 1 ? "Uma imagem não pôde ser lida" : avisos.length + " imagens não puderam ser lidas"}</b>, e a página ficou em branco:<br>${lista}<br>Abra o catálogo e coloque a imagem certa nessas páginas.` : ""),
    [{ texto: "Ficar nos catálogos" }, { texto: "Abrir para editar", forte: true }], !avisos.length);
  if (i === 1) await abrir(r.id);
}

/* ───────────── render e eventos ───────────── */
/** Aguardando liberação ou sem acesso: a pessoa só vê o aviso. */
const semEntrada = () => Boolean(S.eu) && (S.eu.papel === "pendente" || S.eu.papel === "sem_acesso");
function render() {
  let html;
  if (S.erro) html = `${topo()}<main class="entrada"><div class="caixa"><h1>Montador de Catálogo</h1><div class="aviso-caixa">${ic("info")} <b>Não foi possível abrir.</b><br>${esc(S.erro)}</div>
      <button class="btn" data-a="recarregar">Tentar de novo</button></div></main>${rodape()}`;
  else if (!S.eu) html = `${topo()}<main class="entrada"><div class="vazio">Carregando…</div></main>`;
  else if (semEntrada()) html = telaPendente();
  else html = S.tela === "admin" ? telaAdmin() : S.cat ? telaEditor() : telaLista();
  const foco = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset : {};
  const rolagem = scrollY;
  $("#app").innerHTML = html + janelaCarregar() + janela() + janelaPapel() + ajudaJanela();
  document.title = (S.eu && S.eu.ambiente === "teste" ? "[TESTE] " : "") + (S.cat ? (S.cat.titulo || "Catálogo novo") + " · " : "") + "Montador de Catálogo";
  document.querySelectorAll("[data-fundo]").forEach((el) => el.style.setProperty("--fundo", el.dataset.fundo));
  const pg = $("#paginas"); if (pg) pg.style.setProperty("--r", proporcao());
  if (S.cat) atualizarBarra(salvando ? "Salvando…" : "");
  if (foco.c) { const el = $(`[data-c="${foco.c}"]`); if (el) el.focus({ preventScroll: true }); }
  if (scrollY !== rolagem) scrollTo(0, rolagem);
}

document.addEventListener("click", async (e) => {
  const pag = e.target.closest("[data-p]");
  if (pag && S.cat) {
    const cartao = pag.closest(".pc"), acao = pag.dataset.p, Pg = S.cat.paginas, i = Pg.findIndex((p) => p.id === cartao.dataset.id);
    if (acao === "antes" && i > 0) [Pg[i - 1], Pg[i]] = [Pg[i], Pg[i - 1]];
    else if (acao === "depois" && i > -1 && i < Pg.length - 1) [Pg[i + 1], Pg[i]] = [Pg[i], Pg[i + 1]];
    else if (acao === "apagar") {
      const p = Pg[i];
      if (p.img || p.nome) {
        const r = await perguntar("Excluir esta página?", `A página ${i + 1} sai do catálogo. Se mudar de ideia, use o Redefinir antes de salvar.`, [{ texto: "Cancelar" }, { texto: "Excluir página", perigo: true }]);
        if (r !== 1) return;
      }
      Pg.splice(Pg.indexOf(p), 1);
    }
    else if (acao === "tirar") { const o = objetoDe(cartao); o.img = ""; o.r = 0; }
    else return;
    tocou(); redesenharPaginas(); return;
  }
  const el = e.target.closest("[data-a]");
  if (S.credito && !e.target.closest(".painel") && !(el && el.dataset.a === "credito")) { S.credito = false; render(); }
  if (!el) return;
  const a = el.dataset.a, k = el.dataset.k;
  try {
    switch (a) {
      case "recarregar": location.reload(); return;
      case "tema": { const novoTema = temaAtual() === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = novoTema;
        try { localStorage.setItem("montador-tema", novoTema); } catch { /* sem armazenamento */ } render(); return; }
      case "ajuda": S.ajuda = k; render(); { const ok = $("#aj-ok"); if (ok) ok.focus(); } return;
      case "fecha-ajuda": fecharAjuda(); return;
      case "fecha-ajuda-fundo": if (e.target === el) fecharAjuda(); return;
      case "credito": S.credito = !S.credito; render(); return;
      case "fecha-credito": S.credito = false; render(); return;
      case "modal-botao": fecharModal(Number(k)); return;
      case "fecha-modal-fundo": if (e.target === el) fecharModal(-1); return;
      case "novo": novo(); return;
      case "carregar": { const inp = $("#carregar-arq"); if (inp) inp.click(); return; }
      case "carregar-enviar": await enviarCarregar(); return;
      case "fecha-carregar": fecharCarregar(); return;
      case "fecha-carregar-fundo": if (e.target === el) fecharCarregar(); return;
      case "editar": await abrir(k); return;
      case "ver": { const r = await api("GET", "/catalogos/" + k); visualizar(r.dados); return; }
      case "salvar": await salvarCatalogo(); return;
      case "redefinir": await redefinir(); return;
      case "admin": await abrirAdmin("todos"); return;
      case "pendentes": await abrirAdmin("pendente"); return;
      case "sair-admin": S.tela = null; S.ajuda = false; await irLista(); return;
      case "papel-editar": { const p = S.papeis.pessoas.find((x) => x.email === k); if (!p) return;
        S.formPapel = { email: p.email, nome: p.nome, papel: p.papel === "pendente" ? "leitor" : p.papel, pendente: p.papel === "pendente", convidado: !p.ultimo_acesso };
        render(); return; }
      case "convidar": S.formPapel = { convite: true, papel: "leitor" }; render(); { const c = $("#pp-email"); if (c) c.focus(); } return;
      case "papel-salvar": await salvarPapel(); return;
      case "fecha-form": S.formPapel = null; render(); return;
      case "fecha-form-fundo": if (e.target === el) { S.formPapel = null; render(); } return;
      case "lista": await irLista(); return;
      case "duplicar": { await api("POST", `/catalogos/${k}/duplicar`); await carregarLista(); render(); toast("Cópia criada."); return; }
      case "excluir": { const c = S.lista.find((x) => x.id === k);
        const i = await perguntar("Excluir catálogo", `Excluir <b>${esc(c.titulo || "Sem título")}</b> com todas as páginas e imagens? Isso não tem volta pela tela. Arquivos já enviados a clientes continuam funcionando.`,
          [{ texto: "Cancelar" }, { texto: "Excluir", perigo: true }]);
        if (i !== 1) return;
        await api("DELETE", "/catalogos/" + k); await carregarLista(); render(); toast("Catálogo excluído."); return; }
      case "compartilhar": await compartilhar(k); return;
      case "compartilhar-editor": await compartilharDoEditor(); return;
      case "visualizar": visualizar(); return;
      case "pagina-vazia": S.cat.paginas.push(folha()); tocou(); redesenharPaginas(); return;
      case "cor-padrao": S.cat.aparencia[k] = S.eu.padrao[k]; $(`[data-ap="${k}"]`).value = S.eu.padrao[k]; tocou(); return;
      default: return;
    }
  } catch (err) { toast(err.message); }
});

document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.id === "adm-filtro") { S.admFiltro = t.value; redesenharLista(); return; }
  if (t.id === "carregar-arq") { const arq = t.files[0]; t.value = ""; try { await escolherCarregar(arq); } catch (err) { toast(err.message); } return; }
  if (!S.cat) return;
  if (t.id === "varias") {
    const arquivos = [...t.files]; t.value = "";
    if (!arquivos.length) return;
    toast(`Preparando ${arquivos.length} ${arquivos.length > 1 ? "imagens" : "imagem"}…`);
    let ok = 0;
    for (const f of arquivos) {
      if (S.cat.paginas.length >= S.eu.maxPaginas) { toast(`Limite de ${S.eu.maxPaginas} páginas.`); break; }
      try { S.cat.paginas.push(folha(await guardarLocal(f))); ok++; redesenharPaginas(); tocou(); } catch (err) { toast(err.message); }
    }
    toast(`${ok} ${ok === 1 ? "página adicionada" : "páginas adicionadas"}. Clique em Salvar para gravar.`);
    return;
  }
  if (t.type === "file" && t.closest(".pc")) {
    const f = t.files[0]; if (!f) return;
    const cartao = t.closest(".pc"), o = objetoDe(cartao);
    cartao.classList.add("loading");
    try { const im = await guardarLocal(f); o.img = im.id; o.r = im.r; }
    catch (err) { toast(err.message || "Não consegui abrir essa imagem."); }
    redesenharPaginas(); tocou();
    return;
  }
  if (t.dataset.ap && t.type === "checkbox") {
    S.cat.aparencia[t.dataset.ap] = t.checked; tocou();
    if (t.dataset.ap === "info") redesenharPaginas();
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "adm-busca") { S.admBusca = t.value; redesenharLista(); return; }
  if (t.id === "cc-titulo" && S.formCarregar) { S.formCarregar.titulo = t.value; return; }
  if (!S.cat) return;
  if (t.dataset.c) { S.cat[t.dataset.c] = t.value; tocou(); }
  else if (t.dataset.ap && t.type !== "checkbox") { S.cat.aparencia[t.dataset.ap] = t.value; tocou(); }
  else if (t.dataset.f) { objetoDe(t.closest(".pc"))[t.dataset.f] = t.value; tocou(); }
});
document.addEventListener("toggle", (e) => { if (e.target.matches && e.target.matches("details.bloco-ed")) S.aparenciaAberta = e.target.open; }, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !S.previa) { if (S.ajuda) fecharAjuda(); else if (S.formPapel) { S.formPapel = null; render(); } else if (S.modal) fecharModal(-1); else if (S.formCarregar) fecharCarregar(); else if (S.credito) { S.credito = false; render(); } }
  if (e.key === "Enter" && e.target.id === "cc-titulo") { e.preventDefault(); enviarCarregar(); }
  // Ctrl+S (ou Cmd+S) salva o catálogo aberto
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && S.cat && !S.previa && !S.modal) { e.preventDefault(); salvarCatalogo(); }
});
// fechar a aba ou recarregar com alterações por salvar: o navegador pergunta
addEventListener("beforeunload", (e) => { if (mudou()) { e.preventDefault(); e.returnValue = ""; } });
addEventListener("popstate", () => rota());

/** Onde o endereço diz que estamos (lista, um catálogo ou catálogo novo). Também trata o Voltar do navegador. */
async function rota() {
  if (semEntrada()) return;
  const h = location.hash, m = /^#\/c\/([A-Za-z0-9_-]+)$/.exec(h);
  if (S.previa) S.previa.fechar();
  const atual = S.cat ? (S.id ? "#/c/" + S.id : "#/novo") : null;
  if (atual !== null && h !== atual) {
    // saindo do editor pelo Voltar do navegador: pergunta se há alteração por salvar
    if (!(await podeSair())) { history.pushState(null, "", atual); return; }
    fecharEditor();
  }
  try {
    if (m) { if (S.id !== m[1]) await abrir(m[1]); }
    else if (h === "#/novo" && S.eu.papel !== "leitor") { if (!S.cat) novo(); }
    else { S.lista = null; render(); await carregarLista(); render(); }
  } catch (e) {
    toast(e.message); fecharEditor(); history.replaceState(null, "", location.pathname);
    try { await carregarLista(); } catch { S.lista = []; }
    render();
  }
}

try { const t = localStorage.getItem("montador-tema"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch { /* sem armazenamento */ }
render();
// o sininho se atualiza sozinho a cada minuto, sem redesenhar a tela (para não atrapalhar quem está digitando)
setInterval(async () => {
  if (!S.eu || S.eu.papel !== "admin" || document.hidden) return;
  try { const eu = await api("GET", "/eu"); if (eu.pendentes !== S.eu.pendentes) { S.eu.pendentes = eu.pendentes; const sino = $(".sino"); if (sino) sino.outerHTML = sinoHtml(); } }
  catch { /* tenta de novo no próximo minuto */ }
}, 60 * 1000);
api("GET", "/eu").then((eu) => { S.eu = eu; render(); return rota(); }).catch((e) => { S.erro = e.message; render(); });
})();
