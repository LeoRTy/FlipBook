/**
 * Teste automático do Montador de Catálogo. Sobe um Montador descartável (banco e imagens numa pasta temporária, login
 * de teste) e confere a API. Rodar antes de toda publicação:  node testes/teste_api.js
 */
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORTA = 3986;
const BASE = `http://127.0.0.1:${PORTA}`;
const ANA = "ana@empresa.example";
const BIA = "bia@empresa.example";
const CAIO = "caio@empresa.example";
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "catalogo-teste-"));
// menor JPEG válido (1x1)
const JPEG = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=", "base64");

let passou = 0, falhou = 0;
async function pedir(quem, metodo, caminho, corpo, extra = {}) {
    const cab = { "x-teste-email": quem, ...extra };
    if (metodo !== "GET" && extra["X-Catalogo"] === undefined) cab["X-Catalogo"] = "1";
    let body;
    if (Buffer.isBuffer(corpo)) { body = corpo; if (!cab["Content-Type"]) cab["Content-Type"] = "image/jpeg"; }
    else if (corpo !== undefined) { body = JSON.stringify(corpo); cab["Content-Type"] = "application/json"; }
    const r = await fetch(BASE + caminho, { method: metodo, headers: cab, body });
    const texto = await r.text();
    let dados; try { dados = JSON.parse(texto); } catch { dados = texto; }
    return { status: r.status, dados, cab: r.headers, texto };
}
function confere(nome, ok, detalhe = "") {
    if (ok) passou++; else falhou++;
    console.log(`${ok ? "ok   " : "FALHA"} ${nome}${ok ? "" : "  -> " + String(detalhe).slice(0, 300)}`);
}

async function testes() {
    let r = await pedir(ANA, "GET", "/saude");
    confere("saúde responde com a versão", r.status === 200 && r.dados.ok);
    r = await pedir(ANA, "GET", "/");
    confere("página é servida com cabeçalhos de segurança e versão nos arquivos", r.status === 200 && r.cab.get("content-security-policy") && /app\.js\?v=/.test(r.texto));
    r = await pedir(ANA, "GET", "/..%2Fserver.js");
    confere("não serve arquivo fora da pasta pública", r.status === 404);
    r = await pedir(ANA, "GET", "/api/eu");
    confere("identifica quem entrou e manda os padrões de aparência", r.status === 200 && r.dados.email === ANA && r.dados.padrao.destaque === "#c2410c", JSON.stringify(r.dados));

    // papéis: ANA é a administradora (login de teste); BIA vira editora; CAIO fica sem papel (leitor)
    confere("quem é administrador recebe o papel de administrador", (await pedir(ANA, "GET", "/api/eu")).dados.papel === "admin");
    confere("quem não tem papel é leitor", (await pedir(CAIO, "GET", "/api/eu")).dados.papel === "leitor");
    r = await pedir(BIA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "editor" });
    confere("quem não é administrador não muda permissões", r.status === 403);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent("sem-arroba"), { papel: "editor" });
    confere("permissão com e-mail inválido é recusada", r.status === 400);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "dono" });
    confere("papel desconhecido é recusado", r.status === 400);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "editor" });
    confere("administrador convida uma pessoa como editora", r.status === 200 && (await pedir(BIA, "GET", "/api/eu")).dados.papel === "editor");
    r = await pedir(ANA, "GET", "/api/admin/papeis");
    confere("a administração lista os papéis e o histórico", r.status === 200 && r.dados.papeis.length === 1 && r.dados.papeis[0].email === BIA && r.dados.historico.length === 1, JSON.stringify(r.dados));
    r = await pedir(CAIO, "POST", "/api/catalogos", { titulo: "Não pode" });
    confere("leitor não cria catálogo", r.status === 403, JSON.stringify(r.dados));

    r = await pedir(ANA, "GET", "/api/catalogos");
    confere("biblioteca começa vazia", r.status === 200 && Array.isArray(r.dados) && r.dados.length === 0);
    r = await pedir(ANA, "POST", "/api/catalogos", { titulo: "Coleção Verão" }, { "X-Catalogo": "" });
    confere("mudança sem o cabeçalho da tela é recusada", r.status === 403);
    r = await pedir(ANA, "POST", "/api/catalogos", { titulo: "Coleção Verão" });
    const id = r.dados.id;
    confere("cria catálogo", r.status === 200 && /^[A-Za-z0-9_-]{8,24}$/.test(id), JSON.stringify(r.dados));
    r = await pedir(ANA, "GET", "/api/catalogos/" + id);
    let cat = r.dados.dados, base = r.dados.atualizado_em;
    confere("catálogo novo vem com a aparência padrão e duas páginas", r.status === 200 && cat.titulo === "Coleção Verão" && cat.paginas.length === 2 && cat.aparencia.fundo === "#1f1c24" && cat.aparencia.logo === false, JSON.stringify(cat));

    r = await pedir(ANA, "POST", `/api/catalogos/${id}/imagens?r=0.7`, Buffer.from("isto nao e imagem, e so texto comprido para passar do tamanho minimo exigido pelo servidor ......................"));
    confere("recusa arquivo que não é JPEG", r.status === 415);
    r = await pedir(ANA, "POST", `/api/catalogos/${id}/imagens?r=0.7`, JPEG, { "Content-Type": "image/png" });
    confere("recusa outro tipo de arquivo", r.status === 415);
    r = await pedir(ANA, "POST", `/api/catalogos/${id}/imagens?r=0.7`, JPEG);
    const img1 = r.dados.id;
    confere("guarda imagem", r.status === 200 && img1, JSON.stringify(r.dados));
    r = await pedir(ANA, "POST", `/api/catalogos/${id}/imagens?r=0.7`, JPEG);
    const img2 = r.dados.id;
    r = await fetch(BASE + "/api/imagens/" + img1, { headers: { "x-teste-email": ANA } });
    confere("serve a imagem guardada", r.status === 200 && r.headers.get("content-type") === "image/jpeg" && Buffer.from(await r.arrayBuffer()).equals(JPEG));
    r = await pedir(ANA, "GET", "/api/imagens/naoexiste123");
    confere("imagem que não existe dá 404", r.status === 404);

    cat.capa = { img: img1, r: 0.7 };
    cat.paginas[0] = { ...cat.paginas[0], img: img2, r: 0.7, nome: "Vaso <b>Grande</b>", preco: "R$ 89,90", descricao: "Polietileno" };
    cat.aparencia.info = true; cat.aparencia.whatsapp = "55 11 99999-9999"; cat.aparencia.destaque = "#ff0000"; cat.aparencia.fundo = "javascript:alert(1)";
    cat.titulo = "Coleção </script><script>alert(1)</script>";
    r = await pedir(ANA, "PUT", "/api/catalogos/" + id, { dados: cat, base });
    confere("salva o catálogo", r.status === 200 && r.dados.atualizado_em, JSON.stringify(r.dados));
    base = r.dados.atualizado_em;
    r = await pedir(ANA, "GET", "/api/catalogos/" + id);
    cat = r.dados.dados;
    confere("o que foi salvo volta igual, e cor inválida vira a cor padrão", cat.capa.img === img1 && cat.paginas[0].nome === "Vaso <b>Grande</b>" && cat.aparencia.destaque === "#ff0000" && cat.aparencia.fundo === "#1f1c24", JSON.stringify(cat.aparencia));

    r = await pedir(ANA, "POST", "/api/catalogos", { titulo: "Outro" });
    const outro = r.dados.id;
    const invasor = (await pedir(ANA, "GET", "/api/catalogos/" + outro)).dados;
    invasor.dados.capa = { img: img1, r: 0.7 };
    r = await pedir(ANA, "PUT", "/api/catalogos/" + outro, { dados: invasor.dados, base: invasor.atualizado_em });
    confere("um catálogo não pode usar imagem de outro", r.status === 400);

    r = await pedir(BIA, "PUT", "/api/catalogos/" + id, { dados: cat, base: "2000-01-01T00:00:00.000Z" });
    confere("avisa quando outra pessoa salvou enquanto eu editava", r.status === 409, JSON.stringify(r.dados));
    r = await pedir(BIA, "PUT", "/api/catalogos/" + id, { dados: cat, base: "2000-01-01T00:00:00.000Z", forcar: true });
    confere("dá para ficar com a minha versão mesmo assim", r.status === 200);

    r = await pedir(ANA, "GET", `/api/catalogos/${id}/exportar`);
    const html = r.texto;
    confere("gera o arquivo do cliente para baixar", r.status === 200 && /attachment; filename="colecao-script-script-alert-1-script\.html"/.test(r.cab.get("content-disposition") || ""), r.cab.get("content-disposition"));
    confere("o arquivo traz as imagens embutidas", html.includes("data:image/jpeg;base64," + JPEG.toString("base64")));
    confere("o arquivo traz o visualizador e não depende do servidor", html.includes("Revista.montar(") && html.includes(".v-stage") && !html.includes("/api/"));
    confere("texto do catálogo não consegue fechar o script do arquivo", !/<\/script><script>alert\(1\)/.test(html) && html.includes("\\u003c/script>"));
    confere("o título do arquivo é escapado", html.includes("<title>Coleção &lt;/script&gt;"));

    // o leitor vê e compartilha, e mais nada
    r = await pedir(CAIO, "GET", "/api/catalogos");
    confere("leitor vê a biblioteca", r.status === 200 && r.dados.length >= 1);
    r = await pedir(CAIO, "GET", "/api/catalogos/" + id);
    confere("leitor abre o catálogo para visualizar", r.status === 200);
    r = await pedir(CAIO, "GET", `/api/catalogos/${id}/exportar`);
    confere("leitor gera o arquivo do cliente", r.status === 200 && r.texto.includes("Revista.montar("));
    r = await pedir(CAIO, "PUT", "/api/catalogos/" + id, { dados: cat, base: "x", forcar: true });
    confere("leitor não edita", r.status === 403);
    r = await pedir(CAIO, "POST", `/api/catalogos/${id}/imagens?r=0.7`, JPEG);
    confere("leitor não envia imagem", r.status === 403);
    r = await pedir(CAIO, "POST", `/api/catalogos/${id}/duplicar`);
    confere("leitor não duplica", r.status === 403);
    r = await pedir(CAIO, "DELETE", "/api/catalogos/" + id);
    confere("leitor não exclui", r.status === 403);
    r = await pedir(ANA, "DELETE", "/api/admin/papeis/" + encodeURIComponent(BIA));
    confere("retirar o papel devolve a pessoa a leitora", r.status === 200 && (await pedir(BIA, "GET", "/api/eu")).dados.papel === "leitor");

    r = await pedir(ANA, "POST", `/api/catalogos/${id}/duplicar`);
    const copia = r.dados.id;
    confere("duplica o catálogo", r.status === 200 && copia && copia !== id);
    r = await pedir(ANA, "GET", "/api/catalogos/" + copia);
    const c2 = r.dados.dados;
    confere("a cópia tem imagens próprias (não as do original)", /\(cópia\)$/.test(c2.titulo) && c2.capa.img && c2.capa.img !== img1 && c2.paginas[0].img && c2.paginas[0].img !== img2, JSON.stringify(c2.capa));

    r = await pedir(ANA, "GET", "/api/catalogos");
    const linha = r.dados.find((x) => x.id === id);
    confere("a biblioteca lista os três, com capa, páginas e quem editou", r.dados.length === 3 && linha.capa === img1 && linha.paginas === 2 && linha.atualizado_por === BIA && linha.compartilhado_em, JSON.stringify(linha));

    r = await pedir(ANA, "DELETE", "/api/catalogos/" + id);
    confere("exclui o catálogo", r.status === 200);
    r = await pedir(ANA, "GET", "/api/catalogos/" + id);
    confere("catálogo excluído não abre mais", r.status === 404);
    r = await pedir(ANA, "GET", "/api/imagens/" + img1);
    confere("as imagens do catálogo excluído somem", r.status === 404);
    r = await pedir(ANA, "GET", "/api/imagens/" + c2.capa.img);
    confere("a cópia continua com as imagens dela", r.status === 200);
    r = await fetch(BASE + "/api/eu");
    confere("sem o cabeçalho de identificação, não entra", r.status === 401);
    r = await pedir(ANA, "GET", "/api/catalogos/id-invalido!!");
    confere("id inválido dá 404", r.status === 404);
}

const proc = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORTA), DADOS: pasta, AMBIENTE: "teste", IDENTIDADE_CABECALHO: "x-teste-email", ADMINS: ANA, NODE_NO_WARNINGS: "1" },
    stdio: ["ignore", "pipe", "pipe"]
});
let saida = "";
proc.stdout.on("data", (d) => { saida += d; });
proc.stderr.on("data", (d) => { saida += d; });

(async () => {
    for (let i = 0; i < 40; i++) {
        try { await fetch(BASE + "/saude"); break; } catch { await new Promise((r) => setTimeout(r, 150)); }
    }
    try { await testes(); }
    catch (e) { falhou++; console.log("FALHA geral:", e.stack || e.message); }
    proc.kill();
    await new Promise((r) => setTimeout(r, 300));
    try { fs.rmSync(pasta, { recursive: true, force: true }); } catch { /* pasta temporária */ }
    console.log(`\n${passou} passaram, ${falhou} falharam`);
    if (falhou) console.log("--- saída do Montador:\n" + saida);
    process.exit(falhou ? 1 : 0);
})();
