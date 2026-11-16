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
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3m0 0L8 7m4-4 4 4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.500 4 4"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3M7 21v-7h10v7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  github: '<path d="M9 19c-4.500 1.400-4.500-2.500-6-3m12 5v-3.500c0-1 .1-1.400-.5-2 2.800-.300 5.500-1.400 5.500-6a4.600 4.600 0 0 0-1.300-3.200 4.200 4.200 0 0 0-.1-3.200s-1.100-.300-3.500 1.300a12 12 0 0 0-6.200 0C6.500 2.800 5.400 3.100 5.400 3.100a4.200 4.200 0 0 0-.1 3.200A4.600 4.600 0 0 0 4 9.500c0 4.600 2.700 5.700 5.500 6-.6.600-.6 1.200-.5 2V21"/>'
};
const ic = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.book}</svg>`;
const CREDITO = { nome: "Leonardo Teixeira", descricao: "Desenvolvedor e criador do Montador de Catálogo.",
  linkedin: "https://br.linkedin.com/in/leonardo-teixeira-3244a6143", portfolio: "https://leorty.github.io/Portfolio-dev" };

/* ajuda na tela (o "i") */
const AJUDA = {
  admin: ["Para que serve a Administração do Montador", "Aqui você decide o que cada pessoa pode fazer no Montador de Catálogo.", [
    "<b>Leitor</b> vê os catálogos, visualiza e compartilha com clientes. Não cria, não edita e não exclui. É o papel de quem ainda não recebeu outro.",
    "<b>Editor</b> faz tudo isso e também cria, edita, duplica e exclui catálogos.",
    "<b>Administrador</b> vem da configuração do servidor: faz tudo e abre esta tela.",
    "Para <b>convidar</b>, digite o e-mail da empresa, escolha o papel e clique em Adicionar. A pessoa não recebe e-mail: o papel passa a valer na próxima vez que ela abrir o Montador.",
    "<b>Retirar</b> devolve a pessoa ao papel de leitor."]],
  lista: ["Como funciona o Montador de Catálogo", "Aqui ficam os catálogos da empresa, sempre com as últimas edições.", [
    "<b>Novo catálogo</b> abre o editor em branco. O catálogo só passa a existir quando você clica em <b>Salvar</b>.",
    "<b>Editar</b> (ou clicar na capa) abre o catálogo para mexer. As alterações só valem depois do <b>Salvar</b>.",
    "<b>Compartilhar</b> gera o arquivo para mandar ao cliente por WhatsApp ou e-mail. Ele abre e folheia, sem precisar de login. Você escolhe entre <b>Enviar por aplicativo</b> e <b>Baixar o arquivo</b> (para abrir no seu computador ou mandar depois).",
    "<b>Duplicar</b> cria uma cópia, boa para fazer uma versão nova sem perder a antiga.",
    "<b>Excluir</b> apaga o catálogo e as imagens dele. Arquivos que você já mandou a clientes continuam funcionando.",
    "Os catálogos são de todos: quem tem acesso ao Montador vê e edita os mesmos."]],
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
const S = { eu: null, erro: null, lista: null, cat: null, id: null, base: null, salvoJson: "", credito: false, modal: null, previa: null, ajuda: false };

async function api(metodo, caminho, corpo, bruto) {
  const cab = { "X-Catalogo": "1" };
  if (corpo !== undefined && !bruto) cab["Content-Type"] = "application/json";
  if (bruto) cab["Content-Type"] = "image/jpeg";
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
      ${edita ? `<button class="btn forte" data-a="novo">${ic("plus")} Novo catálogo</button>` : ""}</section>
    ${ajudaHtml("lista")}
    ${L === null ? `<div class="vazio">Carregando…</div>` : L.length ? `<div class="cats">${cartoes}</div>`
      : `<div class="vazio">${edita ? 'Nenhum catálogo ainda. Clique em "Novo catálogo" para montar o primeiro.' : "Nenhum catálogo ainda."}</div>`}
  </main>${rodape()}`;
}

/* ───────────── administração: papéis por pessoa ───────────── */
const NOME_PAPEL = { leitor: "Leitor (vê e compartilha)", editor: "Editor (cria, edita e exclui)" };
function telaAdmin() {
  const D = S.papeis;
  const linhas = D ? D.papeis.map((p) => `<div class="item"><span class="av">${esc(nomeDoEmail(p.email).split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase())}</span>
      <div class="txt"><div class="tt">${esc(nomeDoEmail(p.email))}</div><div class="sub">${esc(p.email)} · definido por ${esc(nomeDoEmail(p.criado_por))} em ${esc(dataHora(p.criado_em))}</div></div>
      <select class="btn mini" data-papel="${esc(p.email)}" aria-label="Papel de ${esc(p.email)}">${Object.entries(NOME_PAPEL).map(([k, t]) => `<option value="${k}" ${p.papel === k ? "selected" : ""}>${t}</option>`).join("")}</select>
      <button class="btn mini perigo" data-a="papel-tirar" data-k="${esc(p.email)}">Retirar</button></div>`).join("") : "";
  return `${topo()}<main class="wrap">
    <div class="adm-cab"><button class="voltar" data-a="sair-admin">${ic("back")} Catálogos</button></div>
    <h1 class="adm-titulo">Administração do Montador</h1>
    <section class="painel-adm">${ajudaHtml("admin")}
      <div class="linha-acoes convite"><input id="novo-email" class="entrada-linha" type="email" placeholder="e-mail da pessoa (nome@empresa)" maxlength="120">
        <select id="novo-papel" class="btn" aria-label="Papel">${Object.entries(NOME_PAPEL).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>
        <button class="btn forte" data-a="papel-add">${ic("plus")} Adicionar</button></div>
      ${!D ? `<div class="vazio">Carregando…</div>` : D.papeis.length ? `<div class="lista">${linhas}</div>`
        : `<div class="vazio">Ninguém recebeu um papel ainda. Quem entra sem papel é leitor: vê e compartilha, mas não edita.</div>`}
      ${D && D.historico.length ? `<h2 class="sub-titulo">Últimas mudanças</h2><div class="lista hist">${D.historico.map((h) => `<div class="item"><time>${esc(dataHora(h.quando))}</time><div class="txt"><div class="tt">${esc(h.alvo.replace("permissão: ", ""))}</div><div class="sub">${esc(h.detalhe)} · por ${esc(nomeDoEmail(h.quem))}</div></div></div>`).join("")}</div>` : ""}
    </section></main>${rodape()}`;
}
async function carregarPapeis() { S.papeis = await api("GET", "/admin/papeis"); }

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
async function abrirAdmin() {
  if (S.cat && !(await podeSair())) return;
  fecharEditor();
  S.tela = "admin"; S.papeis = null; S.ajuda = false;
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

/* ───────────── render e eventos ───────────── */
function render() {
  let html;
  if (S.erro) html = `${topo()}<main class="entrada"><div class="caixa"><h1>Montador de Catálogo</h1><div class="aviso-caixa">${ic("info")} <b>Não foi possível abrir.</b><br>${esc(S.erro)}</div>
      <button class="btn" data-a="recarregar">Tentar de novo</button></div></main>${rodape()}`;
  else if (!S.eu) html = `${topo()}<main class="entrada"><div class="vazio">Carregando…</div></main>`;
  else html = S.tela === "admin" ? telaAdmin() : S.cat ? telaEditor() : telaLista();
  const foco = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset : {};
  const rolagem = scrollY;
  $("#app").innerHTML = html + janela() + ajudaJanela();
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
      case "editar": await abrir(k); return;
      case "ver": { const r = await api("GET", "/catalogos/" + k); visualizar(r.dados); return; }
      case "salvar": await salvarCatalogo(); return;
      case "redefinir": await redefinir(); return;
      case "admin": await abrirAdmin(); return;
      case "sair-admin": S.tela = null; S.ajuda = false; await irLista(); return;
      case "papel-add": { const email = $("#novo-email").value.trim().toLowerCase(), papel = $("#novo-papel").value;
        if (!email) { toast("Digite o e-mail da pessoa."); return; }
        await api("PUT", "/admin/papeis/" + encodeURIComponent(email), { papel }); await carregarPapeis(); render(); toast("Permissão adicionada."); return; }
      case "papel-tirar": await api("DELETE", "/admin/papeis/" + encodeURIComponent(k)); await carregarPapeis(); render(); toast("Permissão retirada: a pessoa volta a ser leitora."); return;
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
  if (t.dataset.papel) {
    try { await api("PUT", "/admin/papeis/" + encodeURIComponent(t.dataset.papel), { papel: t.value }); await carregarPapeis(); toast("Papel alterado."); }
    catch (err) { toast(err.message); }
    render(); return;
  }
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
  if (!S.cat) return;
  if (t.dataset.c) { S.cat[t.dataset.c] = t.value; tocou(); }
  else if (t.dataset.ap && t.type !== "checkbox") { S.cat.aparencia[t.dataset.ap] = t.value; tocou(); }
  else if (t.dataset.f) { objetoDe(t.closest(".pc"))[t.dataset.f] = t.value; tocou(); }
});
document.addEventListener("toggle", (e) => { if (e.target.matches && e.target.matches("details.bloco-ed")) S.aparenciaAberta = e.target.open; }, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !S.previa) { if (S.ajuda) fecharAjuda(); else if (S.modal) fecharModal(-1); else if (S.credito) { S.credito = false; render(); } }
  // Ctrl+S (ou Cmd+S) salva o catálogo aberto
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && S.cat && !S.previa && !S.modal) { e.preventDefault(); salvarCatalogo(); }
});
// fechar a aba ou recarregar com alterações por salvar: o navegador pergunta
addEventListener("beforeunload", (e) => { if (mudou()) { e.preventDefault(); e.returnValue = ""; } });
addEventListener("popstate", () => rota());

/** Onde o endereço diz que estamos (lista, um catálogo ou catálogo novo). Também trata o Voltar do navegador. */
async function rota() {
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
api("GET", "/eu").then((eu) => { S.eu = eu; render(); return rota(); }).catch((e) => { S.erro = e.message; render(); });
})();
