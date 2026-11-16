/**
 * Montador de Catálogo: versão com servidor.
 *
 * Monta revistas digitais de produtos (catálogos com efeito de folhear). Os catálogos e as imagens ficam guardados
 * no servidor: a pessoa entra, escolhe um catálogo salvo ou cria um novo, edita, e ao compartilhar recebe um arquivo
 * HTML único, sempre com a última versão salva, que abre em qualquer celular ou computador sem login.
 *
 *  - Banco: SQLite (/dados/catalogo.sqlite). Imagens: arquivos em /dados/imagens.
 *  - Sem dependências além do próprio Node (22.5 ou mais novo).
 *  - Login: este servidor NÃO tem tela de login. Ou ele roda só para você (modo local, todo mundo é administrador),
 *    ou fica atrás de um porteiro (proxy reverso com login) que informa o e-mail da pessoa num cabeçalho.
 *    Veja IDENTIDADE_CABECALHO e ADMINS abaixo, e o LEIA-ME.
 */
"use strict";

process.env.TZ = process.env.TZ || "America/Sao_Paulo";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

/* ─────────────────────────────── configuração ─────────────────────────────── */

const PORTA = Number(process.env.PORT || 8080);
const AMBIENTE = process.env.AMBIENTE === "teste" ? "teste" : "producao";
const VERSAO = (() => { try { return fs.readFileSync(path.join(__dirname, "VERSAO"), "utf8").trim(); } catch { return "dev"; } })();
const normal = (e) => String(e || "").trim().toLowerCase();
// Nome do cabeçalho em que o porteiro (proxy com login) informa o e-mail de quem entrou, por exemplo
// "x-forwarded-email". Vazio = modo local: não há identificação e quem abrir é administrador.
// ATENÇÃO: só use o cabeçalho se o servidor NÃO for alcançável sem passar pelo porteiro; senão qualquer um o forja.
const IDENTIDADE_CABECALHO = normal(process.env.IDENTIDADE_CABECALHO);
// Administradores (e-mails separados por vírgula). Só vale com IDENTIDADE_CABECALHO.
const ADMINS = String(process.env.ADMINS || "").split(",").map(normal).filter(Boolean);
// Nome que aparece no topo das telas.
const NOME_EMPRESA = String(process.env.NOME_EMPRESA || "Sua Empresa").slice(0, 60);
const PASTA_DADOS = process.env.DADOS || path.join(__dirname, "dados");
const PASTA_IMAGENS = path.join(PASTA_DADOS, "imagens");
const PASTA_PUBLICA = path.join(__dirname, "public");
const MAX_IMAGEM = 4 * 1024 * 1024;      // por imagem (a tela já reduz antes de enviar)
const MAX_PAGINAS = 300;

if (!IDENTIDADE_CABECALHO) console.warn("[INICIO] MODO LOCAL: sem identificação. Quem alcançar este endereço é administrador.");
else if (!ADMINS.length) console.warn("[INICIO] ADMINS vazio: ninguém consegue abrir a Administração.");

class Erro extends Error {
    constructor(mensagem, status = 400) { super(mensagem); this.status = status; }
}

/* ─────────────────────────────────── banco ─────────────────────────────────── */

fs.mkdirSync(PASTA_IMAGENS, { recursive: true });
const db = new DatabaseSync(path.join(PASTA_DADOS, "catalogo.sqlite"));
db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS catalogos (
        id TEXT PRIMARY KEY, titulo TEXT NOT NULL DEFAULT '', dados TEXT NOT NULL,
        criado_por TEXT NOT NULL, criado_em TEXT NOT NULL, atualizado_por TEXT NOT NULL, atualizado_em TEXT NOT NULL,
        compartilhado_em TEXT, compartilhado_por TEXT);
    CREATE TABLE IF NOT EXISTS imagens (
        id TEXT PRIMARY KEY, catalogo TEXT NOT NULL, proporcao REAL NOT NULL DEFAULT 0, bytes INTEGER NOT NULL,
        criado_por TEXT NOT NULL, criado_em TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS imagens_catalogo ON imagens (catalogo);
    CREATE TABLE IF NOT EXISTS papeis (
        email TEXT PRIMARY KEY, papel TEXT NOT NULL, criado_por TEXT NOT NULL, criado_em TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS historico (
        id INTEGER PRIMARY KEY AUTOINCREMENT, quando TEXT NOT NULL, quem TEXT NOT NULL, alvo TEXT NOT NULL, detalhe TEXT NOT NULL);
`);
const agora = () => new Date().toISOString();
const um = (sql, ...p) => db.prepare(sql).get(...p);
const todos = (sql, ...p) => db.prepare(sql).all(...p);
const rodar = (sql, ...p) => db.prepare(sql).run(...p);
const registrar = (quem, alvo, detalhe) => rodar("INSERT INTO historico (quando, quem, alvo, detalhe) VALUES (?, ?, ?, ?)", agora(), quem, alvo, detalhe);
const novoId = () => crypto.randomBytes(9).toString("base64url");
const ID_OK = /^[A-Za-z0-9_-]{8,24}$/;

/* ───────────────────────── o catálogo: formato e aparência padrão ───────────────────────── */

const COR = /^#[0-9a-fA-F]{6}$/;
const texto = (v, max) => String(v ?? "").trim().slice(0, max);
/** Aparência padrão de um catálogo novo. Tudo pode ser mudado por catálogo; troque aqui para a identidade da empresa. */
const PADRAO = { fundo: "#1f1c24", destaque: "#c2410c", papel: "#fbf9f4", logo: false, numeros: true, info: false,
    whatsapp: "", botaoContato: "Fale com a gente", botaoPedido: "Pedir", mensagemContato: "Olá! Vi o catálogo e gostaria de mais informações.",
    dica: "Deslize ou use as setas para folhear" };

function limparImagem(v) { return ID_OK.test(String(v || "")) ? String(v) : ""; }
function limparFolha(o) {
    o = o && typeof o === "object" ? o : {};
    return { img: limparImagem(o.img), r: Math.min(3, Math.max(0, Number(o.r) || 0)) };
}
/** Aceita o que a tela manda e devolve um catálogo bem formado (nada do que vem de fora é guardado sem conferir). */
function limparCatalogo(c) {
    c = c && typeof c === "object" ? c : {};
    const ap = c.aparencia && typeof c.aparencia === "object" ? c.aparencia : {};
    const cor = (v, p) => COR.test(String(v || "")) ? String(v).toLowerCase() : p;
    const paginas = (Array.isArray(c.paginas) ? c.paginas : []).slice(0, MAX_PAGINAS).map((p) => ({
        id: ID_OK.test(String(p && p.id || "")) ? String(p.id) : novoId(),
        ...limparFolha(p), nome: texto(p && p.nome, 80), preco: texto(p && p.preco, 40), descricao: texto(p && p.descricao, 300) }));
    return {
        titulo: texto(c.titulo, 80),
        aparencia: {
            fundo: cor(ap.fundo, PADRAO.fundo), destaque: cor(ap.destaque, PADRAO.destaque), papel: cor(ap.papel, PADRAO.papel),
            logo: ap.logo === undefined ? PADRAO.logo : Boolean(ap.logo),
            numeros: ap.numeros === undefined ? PADRAO.numeros : Boolean(ap.numeros),
            info: Boolean(ap.info),
            whatsapp: texto(ap.whatsapp, 30),
            botaoContato: texto(ap.botaoContato, 40) || PADRAO.botaoContato,
            botaoPedido: texto(ap.botaoPedido, 30) || PADRAO.botaoPedido,
            mensagemContato: texto(ap.mensagemContato, 200) || PADRAO.mensagemContato,
            dica: texto(ap.dica, 80) || PADRAO.dica
        },
        capa: limparFolha(c.capa), contracapa: limparFolha(c.contracapa), paginas
    };
}
const catalogoNovo = (titulo) => limparCatalogo({ titulo, aparencia: {}, paginas: [{}, {}] });
const imagensDe = (c) => [c.capa.img, c.contracapa.img, ...c.paginas.map((p) => p.img)].filter(Boolean);

function ler(id) {
    if (!ID_OK.test(String(id || ""))) throw new Erro("Catálogo não encontrado.", 404);
    const linha = um("SELECT * FROM catalogos WHERE id = ?", id);
    if (!linha) throw new Erro("Catálogo não encontrado. Talvez alguém o tenha excluído.", 404);
    let dados;
    try { dados = limparCatalogo(JSON.parse(linha.dados)); } catch { dados = catalogoNovo(linha.titulo); }
    return { linha, dados };
}
const resumo = (l) => {
    let d; try { d = JSON.parse(l.dados); } catch { d = catalogoNovo(""); }
    return { id: l.id, titulo: l.titulo, capa: (d.capa && d.capa.img) || ((d.paginas || []).find((p) => p.img) || {}).img || "",
        proporcao: (d.capa && d.capa.r) || 0, paginas: (d.paginas || []).length, fundo: (d.aparencia || {}).fundo || PADRAO.fundo,
        criado_por: l.criado_por, criado_em: l.criado_em, atualizado_por: l.atualizado_por, atualizado_em: l.atualizado_em,
        compartilhado_em: l.compartilhado_em };
};
const arquivoImagem = (id) => path.join(PASTA_IMAGENS, id + ".jpg");

/** Apaga as imagens do catálogo que não estão mais em nenhuma página (só as enviadas há mais de 1 hora). */
function limparImagensSoltas(id, dados) {
    const usadas = new Set(imagensDe(dados));
    const limite = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    for (const im of todos("SELECT id FROM imagens WHERE catalogo = ? AND criado_em < ?", id, limite)) {
        if (usadas.has(im.id)) continue;
        try { fs.unlinkSync(arquivoImagem(im.id)); } catch { /* já não existia */ }
        rodar("DELETE FROM imagens WHERE id = ?", im.id);
    }
}

/* ───────────────────────────── quem está usando ───────────────────────────── */

const nomeDoEmail = (email) => email.split("@")[0].split(/[._-]+/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

/** Modo local: uma pessoa só, administradora. Com porteiro: o e-mail vem do cabeçalho combinado. */
async function identificar(req) {
    if (!IDENTIDADE_CABECALHO) return { email: "local@exemplo.local", nome: "Você", admin: true };
    const email = normal(req.headers[IDENTIDADE_CABECALHO]);
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) throw new Erro("Sem identificação do login. Abra o Montador pelo endereço oficial.", 401);
    return { email, nome: nomeDoEmail(email), admin: ADMINS.includes(email) };
}

/* ─────────────────────────────── o arquivo do cliente ─────────────────────────────── */

const ler64 = (arq) => fs.readFileSync(arq).toString("base64");
/** Monta o HTML único da revista: visualizador + dados + imagens embutidas. Abre sem internet e sem login. */
function gerarHtml(dados) {
    const img = (id) => (id && fs.existsSync(arquivoImagem(id))) ? "data:image/jpeg;base64," + ler64(arquivoImagem(id)) : "";
    const ap = dados.aparencia;
    const revista = {
        titulo: dados.titulo, aparencia: ap,
        logo: ap.logo && fs.existsSync(path.join(PASTA_PUBLICA, "logo-claro.png")) ? "data:image/png;base64," + ler64(path.join(PASTA_PUBLICA, "logo-claro.png")) : "",
        capa: { img: img(dados.capa.img), r: dados.capa.r }, contracapa: { img: img(dados.contracapa.img), r: dados.contracapa.r },
        paginas: dados.paginas.map((p) => ({ img: img(p.img), r: p.r, nome: p.nome, preco: p.preco, descricao: p.descricao }))
    };
    // "<" e os separadores de linha quebrariam o <script> do arquivo do cliente: viram escapes
    const json = JSON.stringify(revista).replace(/</g, "\\u003c").split(String.fromCharCode(0x2028)).join("\\u2028").split(String.fromCharCode(0x2029)).join("\\u2029");
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const css = fs.readFileSync(path.join(PASTA_PUBLICA, "revista.css"), "utf8");
    const js = fs.readFileSync(path.join(PASTA_PUBLICA, "revista.js"), "utf8");
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(dados.titulo || "Catálogo")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{min-height:100%}body{font-family:"Instrument Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:${ap.fundo}}
${css}
</style>
</head>
<body>
<div id="revista"></div>
<script>
${js}
Revista.montar(document.getElementById("revista"), ${json});
</script>
</body>
</html>
`;
}
function nomeArquivo(titulo) {
    return (String(titulo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "catalogo") + ".html";
}

/* ─────────────────────────────────── servidor ─────────────────────────────────── */

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const SEGURANCA = {
    "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
};
function responder(res, status, corpo, extra = {}) {
    const json = typeof corpo !== "string" && !Buffer.isBuffer(corpo);
    res.writeHead(status, { "Content-Type": json ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
        "Cache-Control": "no-store", ...SEGURANCA, ...extra });
    res.end(json ? JSON.stringify(corpo) : corpo);
}
function lerBruto(req, max) {
    return new Promise((resolve, reject) => {
        let tam = 0; const partes = [];
        req.on("data", (d) => { tam += d.length; if (tam > max) { reject(new Erro("Arquivo grande demais.", 413)); req.destroy(); } else partes.push(d); });
        req.on("end", () => resolve(Buffer.concat(partes)));
        req.on("error", reject);
    });
}
async function lerJson(req) {
    const b = await lerBruto(req, 2 * 1024 * 1024);
    if (!b.length) return {};
    try { const v = JSON.parse(b.toString("utf8")); return v && typeof v === "object" ? v : {}; }
    catch { throw new Erro("O pedido não veio em JSON."); }
}
function arquivo(res, caminho) {
    const rel = caminho === "/" ? "/index.html" : caminho;
    const alvo = path.normalize(path.join(PASTA_PUBLICA, rel));
    if (!alvo.startsWith(PASTA_PUBLICA + path.sep) || !fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) return false;
    const ext = path.extname(alvo);
    if (ext === ".html") {
        const html = fs.readFileSync(alvo, "utf8").replace(/((?:href|src)="[^"?:]+\.(?:css|js))"/g, `$1?v=${VERSAO}"`);
        res.writeHead(200, { "Content-Type": TIPOS[ext], "Cache-Control": "no-store", ...SEGURANCA });
        res.end(html);
        return true;
    }
    res.writeHead(200, { "Content-Type": TIPOS[ext] || "application/octet-stream", "Cache-Control": "public, max-age=300", ...SEGURANCA });
    fs.createReadStream(alvo).pipe(res);
    return true;
}

async function atender(req, res) {
    const url = new URL(req.url, "http://montador");
    const caminho = decodeURIComponent(url.pathname);
    const partes = caminho.split("/").filter(Boolean);

    if (caminho === "/saude") return responder(res, 200, { ok: true, versao: VERSAO, ambiente: AMBIENTE });
    if (partes[0] !== "api") {
        if (req.method === "GET" && arquivo(res, caminho)) return;
        return responder(res, 404, "Página não encontrada.");
    }

    const eu = await identificar(req);
    if (req.method !== "GET" && req.headers["x-catalogo"] !== "1") throw new Erro("Pedido recusado.", 403);
    const [, recurso, id, sub] = partes;

    // Papéis:
    //   administrador: quem está em ADMINS (ou todo mundo, no modo local). Faz tudo e decide o papel de cada pessoa.
    //   editor: cria, edita, duplica e exclui catálogos.
    //   leitor: só vê, visualiza e compartilha. É o papel de quem ainda não recebeu outro.
    eu.papel = eu.admin ? "admin" : ((um("SELECT papel FROM papeis WHERE email = ?", eu.email) || {}).papel || "leitor");
    const exigirEditor = () => {
        if (eu.papel === "leitor") throw new Erro("Você pode ver e compartilhar os catálogos, mas não criar, editar ou excluir. Peça a um administrador do Montador.", 403);
    };

    if (recurso === "admin") {
        if (eu.papel !== "admin") throw new Erro("Só administradores mexem nas permissões do Montador.", 403);
        if (id !== "papeis") return responder(res, 404, { erro: "Rota desconhecida." });
        if (req.method === "GET" && !sub) {
            return responder(res, 200, { papeis: todos("SELECT email, papel, criado_por, criado_em FROM papeis ORDER BY email"),
                historico: todos("SELECT quando, quem, alvo, detalhe FROM historico WHERE alvo LIKE 'permissão:%' ORDER BY id DESC LIMIT 50") });
        }
        const alvo = normal(sub);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(alvo)) throw new Erro("E-mail inválido.");
        if (req.method === "PUT") {
            const corpo = await lerJson(req);
            const papel = corpo.papel === "editor" ? "editor" : corpo.papel === "leitor" ? "leitor" : null;
            if (!papel) throw new Erro("Escolha o papel: leitor ou editor.");
            const antes = (um("SELECT papel FROM papeis WHERE email = ?", alvo) || {}).papel;
            rodar("INSERT INTO papeis (email, papel, criado_por, criado_em) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET papel = excluded.papel, criado_por = excluded.criado_por, criado_em = excluded.criado_em",
                alvo, papel, eu.email, agora());
            if (antes !== papel) registrar(eu.email, "permissão: " + alvo, `${papel}${antes ? " (antes: " + antes + ")" : " (convidado)"}`);
            return responder(res, 200, { ok: true });
        }
        if (req.method === "DELETE") {
            const r = rodar("DELETE FROM papeis WHERE email = ?", alvo);
            if (r.changes) registrar(eu.email, "permissão: " + alvo, "retirada (volta a ser leitor)");
            return responder(res, 200, { ok: true });
        }
        return responder(res, 404, { erro: "Rota desconhecida." });
    }
    const rota = `${req.method} ${recurso}${id ? "/:id" : ""}${sub ? "/" + sub : ""}`;

    switch (rota) {
        case "GET eu":
            return responder(res, 200, { ...eu, ambiente: AMBIENTE, versao: VERSAO, empresa: NOME_EMPRESA, temLogo: fs.existsSync(path.join(PASTA_PUBLICA, "logo.png")), padrao: PADRAO, maxPaginas: MAX_PAGINAS });

        case "GET catalogos":
            return responder(res, 200, todos("SELECT * FROM catalogos ORDER BY atualizado_em DESC").map(resumo));

        case "POST catalogos": {
            exigirEditor();
            const corpo = await lerJson(req);
            const novo = novoId(), dados = catalogoNovo(texto(corpo.titulo, 80) || "Novo catálogo");
            rodar("INSERT INTO catalogos (id, titulo, dados, criado_por, criado_em, atualizado_por, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)",
                novo, dados.titulo, JSON.stringify(dados), eu.email, agora(), eu.email, agora());
            registrar(eu.email, dados.titulo, "catálogo criado");
            return responder(res, 200, { id: novo });
        }

        case "GET catalogos/:id": {
            const { linha, dados } = ler(id);
            return responder(res, 200, { id: linha.id, dados, atualizado_em: linha.atualizado_em, atualizado_por: linha.atualizado_por,
                compartilhado_em: linha.compartilhado_em });
        }

        case "PUT catalogos/:id": {
            exigirEditor();
            const { linha } = ler(id);
            const corpo = await lerJson(req);
            // outra pessoa salvou depois que esta tela abriu o catálogo: não passar por cima sem avisar
            if (corpo.base && corpo.base !== linha.atualizado_em && linha.atualizado_por !== eu.email && !corpo.forcar) {
                throw new Erro(`${nomeDoEmail(linha.atualizado_por)} alterou este catálogo enquanto você editava.`, 409);
            }
            const dados = limparCatalogo(corpo.dados);
            const donas = new Set(todos("SELECT id FROM imagens WHERE catalogo = ?", id).map((r) => r.id));
            if (!imagensDe(dados).every((i) => donas.has(i))) throw new Erro("O catálogo cita uma imagem que não é dele.");
            const quando = agora();
            rodar("UPDATE catalogos SET titulo = ?, dados = ?, atualizado_por = ?, atualizado_em = ? WHERE id = ?",
                dados.titulo, JSON.stringify(dados), eu.email, quando, id);
            limparImagensSoltas(id, dados);
            return responder(res, 200, { ok: true, atualizado_em: quando });
        }

        case "DELETE catalogos/:id": {
            exigirEditor();
            const { linha } = ler(id);
            for (const im of todos("SELECT id FROM imagens WHERE catalogo = ?", id)) {
                try { fs.unlinkSync(arquivoImagem(im.id)); } catch { /* já não existia */ }
            }
            rodar("DELETE FROM imagens WHERE catalogo = ?", id);
            rodar("DELETE FROM catalogos WHERE id = ?", id);
            registrar(eu.email, linha.titulo, "catálogo excluído");
            return responder(res, 200, { ok: true });
        }

        case "POST catalogos/:id/duplicar": {
            exigirEditor();
            const { linha, dados } = ler(id);
            const novo = novoId(), mapa = new Map();
            for (const antiga of new Set(imagensDe(dados))) {
                const im = um("SELECT * FROM imagens WHERE id = ?", antiga);
                if (!im || !fs.existsSync(arquivoImagem(antiga))) continue;
                const nova = novoId();
                fs.copyFileSync(arquivoImagem(antiga), arquivoImagem(nova));
                rodar("INSERT INTO imagens (id, catalogo, proporcao, bytes, criado_por, criado_em) VALUES (?, ?, ?, ?, ?, ?)", nova, novo, im.proporcao, im.bytes, eu.email, agora());
                mapa.set(antiga, nova);
            }
            const troca = (f) => ({ ...f, img: mapa.get(f.img) || "" });
            const copia = { ...dados, titulo: texto(linha.titulo + " (cópia)", 80), capa: troca(dados.capa), contracapa: troca(dados.contracapa),
                paginas: dados.paginas.map((p) => ({ ...troca(p), id: novoId() })) };
            rodar("INSERT INTO catalogos (id, titulo, dados, criado_por, criado_em, atualizado_por, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)",
                novo, copia.titulo, JSON.stringify(copia), eu.email, agora(), eu.email, agora());
            registrar(eu.email, copia.titulo, `catálogo criado como cópia de "${linha.titulo}"`);
            return responder(res, 200, { id: novo });
        }

        case "POST catalogos/:id/imagens": {
            exigirEditor();
            ler(id);
            if (!/^image\/jpeg\b/.test(req.headers["content-type"] || "")) throw new Erro("Envie a imagem em JPEG.", 415);
            const bytes = await lerBruto(req, MAX_IMAGEM);
            if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Erro("O arquivo não é uma imagem JPEG.", 415);
            if (um("SELECT COUNT(*) AS n FROM imagens WHERE catalogo = ?", id).n >= MAX_PAGINAS * 2) throw new Erro("Este catálogo já tem imagens demais.");
            const nova = novoId();
            fs.writeFileSync(arquivoImagem(nova), bytes);
            rodar("INSERT INTO imagens (id, catalogo, proporcao, bytes, criado_por, criado_em) VALUES (?, ?, ?, ?, ?, ?)",
                nova, id, Math.min(3, Math.max(0, Number(url.searchParams.get("r")) || 0)), bytes.length, eu.email, agora());
            return responder(res, 200, { id: nova });
        }

        case "GET imagens/:id": {
            if (!ID_OK.test(id) || !um("SELECT 1 AS ok FROM imagens WHERE id = ?", id) || !fs.existsSync(arquivoImagem(id))) return responder(res, 404, "Imagem não encontrada.");
            res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400", ...SEGURANCA });
            fs.createReadStream(arquivoImagem(id)).pipe(res);
            return;
        }

        case "GET catalogos/:id/exportar": {
            const { linha, dados } = ler(id);
            const html = gerarHtml(dados);
            rodar("UPDATE catalogos SET compartilhado_em = ?, compartilhado_por = ? WHERE id = ?", agora(), eu.email, id);
            registrar(eu.email, linha.titulo, `arquivo do cliente gerado (${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB)`);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
                "Content-Disposition": `attachment; filename="${nomeArquivo(linha.titulo)}"`, "X-Content-Type-Options": "nosniff" });
            res.end(html);
            return;
        }

        default: return responder(res, 404, { erro: "Rota desconhecida." });
    }
}

const servidor = http.createServer((req, res) => {
    atender(req, res).catch((e) => {
        if (e instanceof Erro) return responder(res, e.status, { erro: e.message });
        console.error("[ERRO]", e.stack || e.message);
        if (!res.headersSent) responder(res, 500, { erro: "Erro interno no Montador de Catálogo." });
        else res.destroy();
    });
});
servidor.listen(PORTA, () => console.log(`[INICIO] Montador de Catálogo ${VERSAO} (${AMBIENTE}) na porta ${PORTA}; identificação: ${IDENTIDADE_CABECALHO || "modo local"}`));
for (const sinal of ["SIGTERM", "SIGINT"]) process.on(sinal, () => servidor.close(() => { db.close(); process.exit(0); }));
