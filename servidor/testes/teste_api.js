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
const DANI = "dani@empresa.example";   // convidada antes de entrar
const EVA = "eva@empresa.example";     // convite cancelado
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

    // papéis: ANA é a administradora (login de teste); BIA vira editora; CAIO é liberado como leitor
    confere("quem é administrador recebe o papel de administrador", (await pedir(ANA, "GET", "/api/eu")).dados.papel === "admin");
    // 1.4.0: quem abre sem papel fica aguardando liberação (antes entrava como leitor)
    r = await pedir(CAIO, "GET", "/api/eu");
    confere("quem abre sem papel fica aguardando liberação", r.status === 200 && r.dados.papel === "pendente" && r.dados.pendentes === 0, JSON.stringify(r.dados));
    r = await pedir(CAIO, "GET", "/api/catalogos");
    confere("quem aguarda liberação não vê os catálogos", r.status === 403 && /aguardando liberação/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await pedir(CAIO, "POST", "/api/catalogos", { titulo: "Não pode" });
    confere("quem aguarda liberação não cria catálogo", r.status === 403 && /aguardando liberação/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await pedir(CAIO, "GET", "/api/admin/papeis");
    confere("quem aguarda liberação não lista as pessoas", r.status === 403 && !r.dados.pessoas, JSON.stringify(r.dados));
    r = await pedir(CAIO, "PUT", "/api/admin/papeis/" + encodeURIComponent(CAIO), { papel: "editor" });
    confere("quem aguarda liberação não se libera sozinho", r.status === 403 && (await pedir(CAIO, "GET", "/api/eu")).dados.papel === "pendente");
    r = await pedir(ANA, "GET", "/api/eu");
    confere("o sininho do administrador conta quem aguarda", r.dados.pendentes === 1, JSON.stringify(r.dados));
    r = await pedir(ANA, "GET", "/api/admin/papeis");
    let pc = (r.dados.pessoas || []).find((x) => x.email === CAIO);
    confere("a pessoa entra sozinha na lista no primeiro acesso, como aguardando, com a data do primeiro e do último acesso",
        r.status === 200 && pc && pc.papel === "pendente" && pc.nome === "Caio" && pc.pediu_em && pc.primeiro_acesso === pc.pediu_em && pc.ultimo_acesso >= pc.primeiro_acesso &&
        r.dados.pessoas.some((x) => x.email === ANA && x.papel === "admin"), JSON.stringify(r.dados.pessoas));
    r = await pedir(BIA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "editor" });
    confere("quem não é administrador não muda permissões", r.status === 403);
    confere("o segundo pedido também entra no sininho", (await pedir(ANA, "GET", "/api/eu")).dados.pendentes === 2);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent("sem-arroba"), { papel: "editor" });
    confere("permissão com e-mail inválido é recusada", r.status === 400);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "dono" });
    confere("papel desconhecido é recusado", r.status === 400);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(ANA), { papel: "leitor" });
    confere("o papel de administrador não muda pela tela", r.status === 400 && /ADMINS/.test(r.dados.erro) && (await pedir(ANA, "GET", "/api/eu")).dados.papel === "admin", JSON.stringify(r.dados));
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(CAIO), { papel: "leitor" });
    confere("administrador libera o pedido como leitor e ele sai do sininho",
        r.status === 200 && (await pedir(CAIO, "GET", "/api/eu")).dados.papel === "leitor" && (await pedir(ANA, "GET", "/api/eu")).dados.pendentes === 1);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "editor" });
    confere("administrador libera uma pessoa como editora e o sininho zera", r.status === 200 && (await pedir(BIA, "GET", "/api/eu")).dados.papel === "editor" && (await pedir(ANA, "GET", "/api/eu")).dados.pendentes === 0);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(DANI), { papel: "editor" });
    let pd = (await pedir(ANA, "GET", "/api/admin/papeis")).dados.pessoas.find((x) => x.email === DANI);
    confere("convidar por e-mail põe a pessoa na lista antes de ela entrar", r.status === 200 && pd && pd.papel === "editor" && !pd.ultimo_acesso && pd.definido_por === ANA, JSON.stringify(pd));
    confere("quem foi convidado entra direto com o papel, sem aguardar", (await pedir(DANI, "GET", "/api/eu")).dados.papel === "editor" && (await pedir(ANA, "GET", "/api/eu")).dados.pendentes === 0);
    r = await pedir(ANA, "GET", "/api/admin/papeis");
    const pb = r.dados.pessoas.find((x) => x.email === BIA);
    confere("a administração lista todas as pessoas, com papel e histórico",
        r.status === 200 && r.dados.pessoas.length === 4 && pb && pb.papel === "editor" && pb.definido_por === ANA && r.dados.historico.length === 3 &&
        r.dados.historico.some((h) => /acesso liberado/.test(h.detalhe)) && r.dados.historico.some((h) => /convidado/.test(h.detalhe)), JSON.stringify(r.dados));
    r = await pedir(CAIO, "GET", "/api/admin/papeis");
    confere("leitor não lista as pessoas", r.status === 403 && /Só administradores/.test(r.dados.erro) && !r.dados.pessoas, JSON.stringify(r.dados));
    r = await pedir(BIA, "GET", "/api/admin/papeis");
    confere("editor não lista as pessoas", r.status === 403 && !r.dados.pessoas);
    r = await pedir(BIA, "PUT", "/api/admin/papeis/" + encodeURIComponent(CAIO), { papel: "editor" });
    confere("editor não libera nem muda o papel de ninguém", r.status === 403 && (await pedir(CAIO, "GET", "/api/eu")).dados.papel === "leitor");
    confere("quem não é administrador não recebe o número do sininho", (await pedir(BIA, "GET", "/api/eu")).dados.pendentes === 0);
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
    // 1.4.0: retirar o papel não devolve mais a leitor; a pessoa volta a aguardar liberação
    r = await pedir(ANA, "DELETE", "/api/admin/papeis/" + encodeURIComponent(BIA));
    confere("retirar o papel deixa a pessoa aguardando liberação de novo", r.status === 200 && (await pedir(BIA, "GET", "/api/eu")).dados.papel === "pendente" && (await pedir(ANA, "GET", "/api/eu")).dados.pendentes === 1);
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(BIA), { papel: "sem_acesso" });
    confere("sem acesso barra a pessoa e tira o pedido do sininho",
        r.status === 200 && (await pedir(BIA, "GET", "/api/eu")).dados.papel === "sem_acesso" && (await pedir(ANA, "GET", "/api/eu")).dados.pendentes === 0);
    r = await pedir(BIA, "GET", "/api/catalogos");
    confere("quem está sem acesso não vê os catálogos", r.status === 403 && /não foi liberado/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await pedir(ANA, "GET", "/api/admin/papeis");
    confere("quem está sem acesso aparece na lista como sem acesso, e o histórico diz que o pedido foi recusado",
        r.dados.pessoas.find((x) => x.email === BIA).papel === "sem_acesso" && r.dados.historico[0].detalhe === "sem acesso (pedido recusado)", JSON.stringify(r.dados.historico[0]));
    r = await pedir(ANA, "PUT", "/api/admin/papeis/" + encodeURIComponent(EVA), { papel: "leitor" });
    const comConvite = (await pedir(ANA, "GET", "/api/admin/papeis")).dados.pessoas.some((x) => x.email === EVA);
    r = await pedir(ANA, "DELETE", "/api/admin/papeis/" + encodeURIComponent(EVA));
    r = await pedir(ANA, "GET", "/api/admin/papeis");
    confere("cancelar o convite de quem nunca entrou tira a pessoa da lista", comConvite && !r.dados.pessoas.some((x) => x.email === EVA) && /convite cancelado/.test(r.dados.historico[0].detalhe), JSON.stringify(r.dados.historico[0]));

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
    r = await fetch(BASE + "/app.js");
    confere("o Compartilhar oferece baixar o arquivo além de enviar por aplicativo", /Baixar o arquivo/.test(await r.text()));

    await testesCarregar();
}

/* Carregar catálogo (1.3.0): um .html de catálogo (do Compartilhar deste Montador ou da página do FlipBook) vira
   catálogo da biblioteca. O teste sobe o Montador com CATALOGO_MAX_CARREGAR_MB=6 para conferir o limite do arquivo
   sem mandar 60 MB. */
const carregar = (quem, html, titulo, extra = {}) => pedir(quem, "POST", "/api/carregar?titulo=" + encodeURIComponent(titulo) + "&arquivo=teste.html",
    Buffer.from(html, "utf8"), { "Content-Type": "text/html; charset=utf-8", ...extra });
/** Monta um arquivo igual ao que o Compartilhar da página do FlipBook gera (window.CATALOG = {...}; no primeiro script). */
const arquivoFlipbook = (d) => `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${d.title || "Catálogo"}</title></head><body>
<script>window.CATALOG = ${JSON.stringify(d).replace(/</g, "\\u003c")};if(window.CATALOG)document.documentElement.className='viewer-only';</script>
<div id="builder"></div>
<script>const MARK = 'window.CATALOG' + ' = null;'; let html = SRC.replace(MARK, () => 'window.CATALOG = ' + json + ';');</script>
</body></html>`;
const baixarImagem = async (id) => Buffer.from(await (await fetch(BASE + "/api/imagens/" + id, { headers: { "x-teste-email": ANA } })).arrayBuffer());

async function testesCarregar() {
    // um catálogo deste Montador, com capa, uma página com imagem e textos, contracapa e aparência fora do padrão
    let r = await pedir(ANA, "POST", "/api/catalogos", { titulo: "Para carregar" });
    const orig = r.dados.id;
    const iCapa = (await pedir(ANA, "POST", `/api/catalogos/${orig}/imagens?r=1`, JPEG)).dados.id;
    const iPag = (await pedir(ANA, "POST", `/api/catalogos/${orig}/imagens?r=1`, JPEG)).dados.id;
    const iContra = (await pedir(ANA, "POST", `/api/catalogos/${orig}/imagens?r=1`, JPEG)).dados.id;
    let c = (await pedir(ANA, "GET", "/api/catalogos/" + orig)).dados;
    Object.assign(c.dados, { capa: { img: iCapa, r: 1 }, contracapa: { img: iContra, r: 1 } });
    c.dados.paginas[0] = { ...c.dados.paginas[0], img: iPag, r: 1, nome: "Vaso <b>Grande</b>", preco: "R$ 89,90", descricao: "Polietileno" };
    Object.assign(c.dados.aparencia, { destaque: "#123456", numeros: false, info: true, whatsapp: "55 11 97777-6666", logo: true });
    await pedir(ANA, "PUT", "/api/catalogos/" + orig, { dados: c.dados, base: c.atualizado_em });
    const doServidor = (await pedir(ANA, "GET", `/api/catalogos/${orig}/exportar`)).texto;

    r = await carregar(ANA, doServidor, "Veio do Montador");
    const g = r.dados;
    confere("carrega o arquivo do Compartilhar deste Montador", r.status === 200 && g.formato === "servidor" && g.paginas === 2 && g.imagens === 3 && g.avisos.length === 0 && g.id !== orig, JSON.stringify(r.dados));
    let novo = (await pedir(ANA, "GET", "/api/catalogos/" + g.id)).dados.dados;
    confere("o catálogo carregado tem o nome escolhido, a aparência, a numeração e os textos do arquivo",
        novo.titulo === "Veio do Montador" && novo.aparencia.destaque === "#123456" && novo.aparencia.numeros === false && novo.aparencia.info === true &&
        novo.aparencia.whatsapp === "55 11 97777-6666" && novo.aparencia.logo === true && novo.paginas[0].nome === "Vaso <b>Grande</b>" && novo.paginas[0].preco === "R$ 89,90", JSON.stringify(novo));
    confere("as imagens do catálogo carregado são cópias próprias, iguais às do arquivo, e a proporção vem da própria imagem",
        novo.capa.img && novo.capa.img !== iCapa && (await baixarImagem(novo.capa.img)).equals(JPEG) && (await baixarImagem(novo.paginas[0].img)).equals(JPEG) &&
        (await baixarImagem(novo.contracapa.img)).equals(JPEG) && novo.paginas[0].r === 1 && novo.capa.r === 1, JSON.stringify([novo.capa, novo.paginas[0]]));
    r = await pedir(ANA, "GET", "/api/catalogos");
    confere("o catálogo carregado aparece na biblioteca como os outros", r.dados.some((x) => x.id === g.id && x.titulo === "Veio do Montador" && x.capa === novo.capa.img));
    r = await pedir(ANA, "POST", `/api/catalogos/${g.id}/duplicar`);
    const dup = r.dados.id;
    novo.paginas[1].nome = "Editado depois";
    r = await pedir(ANA, "PUT", "/api/catalogos/" + g.id, { dados: novo });
    confere("o catálogo carregado se edita, duplica, compartilha e exclui como qualquer outro",
        r.status === 200 && dup && (await pedir(ANA, "GET", `/api/catalogos/${g.id}/exportar`)).texto.includes("Editado depois") &&
        (await pedir(ANA, "DELETE", "/api/catalogos/" + dup)).status === 200);
    r = await carregar(ANA, doServidor.replace('"fundo":"#1f1c24"', '"fundo":"url(javascript:alert(1))"'), "Mexido");
    confere("cor mexida no arquivo vira a cor padrão", r.status === 200 && (await pedir(ANA, "GET", "/api/catalogos/" + r.dados.id)).dados.dados.aparencia.fundo === "#1f1c24", JSON.stringify(r.dados));

    // arquivo da página do FlipBook: textos com HTML, imagem por link, imagem PNG, imagem grande demais e ids repetidos
    const flip = { title: "Casa Aurora · Catálogo 2027", whatsapp: "55 11 98888-7777", bg: "#2b3a55", showInfo: true,
        cover: { img: "data:image/jpeg;base64," + JPEG.toString("base64"), r: 0.7 }, back: { img: "" },
        pages: [
            { id: "abc12345", img: "data:image/jpeg;base64," + JPEG.toString("base64"), r: 1, name: 'Vaso <img src=x onerror=alert(1)>', price: "R$ 10", desc: "</script><script>alert(1)</script>" },
            { id: "abc12345", img: "https://exemplo.com/foto.jpg", r: 0.7, name: "Por link" },
            { id: "x", img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", r: 1 },
            { id: "y", img: "data:image/jpeg;base64,/9j/" + "A".repeat(5800000), r: 1 }
        ] };
    r = await carregar(ANA, arquivoFlipbook(flip), "Do FlipBook");
    const f = r.dados;
    confere("carrega o arquivo da página do FlipBook e avisa das imagens que não deu para ler",
        r.status === 200 && f.formato === "flipbook" && f.paginas === 4 && f.imagens === 2 && f.avisos.length === 3 &&
        /Página 2: imagem fora do arquivo/.test(f.avisos[0]) && /Página 3: imagem em formato não aceito/.test(f.avisos[1]) && /Página 4: imagem grande demais/.test(f.avisos[2]), JSON.stringify(r.dados));
    novo = (await pedir(ANA, "GET", "/api/catalogos/" + f.id)).dados.dados;
    confere("da página do FlipBook vêm o fundo, o WhatsApp, nome/preço/descrição e a numeração; logo desligado e as outras cores do padrão",
        novo.titulo === "Do FlipBook" && novo.aparencia.fundo === "#2b3a55" && novo.aparencia.info === true && novo.aparencia.whatsapp === "55 11 98888-7777" &&
        novo.aparencia.numeros === true && novo.aparencia.logo === false && novo.aparencia.destaque === "#c2410c" && novo.contracapa.img === "" &&
        novo.paginas[1].img === "" && novo.paginas[2].img === "" && novo.paginas[3].img === "" && novo.paginas[1].nome === "Por link", JSON.stringify(novo));
    confere("cada página carregada ganha id próprio (o arquivo repetia)", new Set(novo.paginas.map((p) => p.id)).size === 4);
    confere("texto com HTML entra como texto puro", novo.paginas[0].nome === "Vaso <img src=x onerror=alert(1)>" && novo.paginas[0].descricao === "</script><script>alert(1)</script>");
    r = await pedir(ANA, "GET", `/api/catalogos/${f.id}/exportar`);
    confere("o texto com HTML não vira código no arquivo do cliente", r.status === 200 && !r.texto.includes("<img src=x") && !r.texto.includes("</script><script>alert(1)") && r.texto.includes("\\u003cimg src=x"));

    // arquivos que não são catálogo, ou mexidos
    r = await carregar(ANA, "<!DOCTYPE html><html><body><h1>Oi</h1><script>alert(1)</script></body></html>", "Qualquer");
    confere("arquivo que não é catálogo é recusado com mensagem clara", r.status === 400 && /Não encontrei um catálogo/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await carregar(ANA, "<html><script>window.CATALOG = null;if(window.CATALOG)x();</script></html>", "Vazio");
    confere("o montador do FlipBook sem catálogo dentro é recusado", r.status === 400 && /sem catálogo dentro/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await carregar(ANA, arquivoFlipbook(flip).replace("};if(window.CATALOG)", ";if(window.CATALOG)"), "Cortado");
    confere("catálogo cortado ou mexido é recusado", r.status === 400 && /incompleto ou foi alterado/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await carregar(ANA, arquivoFlipbook({ title: "Sem fotos", cover: { img: "" }, back: { img: "" }, pages: [{ img: "" }, { img: "" }] }), "Sem fotos");
    confere("catálogo sem nenhuma imagem é recusado", r.status === 400 && /não tem nenhuma imagem/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await carregar(ANA, arquivoFlipbook({ title: "Grande", cover: flip.cover, back: { img: "" }, pages: Array.from({ length: 301 }, () => ({ img: "" })) }), "Grande");
    confere("catálogo com mais páginas que o limite é recusado", r.status === 400 && /301 páginas e o limite do Montador é 300/.test(r.dados.erro), JSON.stringify(r.dados));
    r = await carregar(ANA, doServidor, "   ");
    confere("carregar sem nome é recusado", r.status === 400 && /nome/.test(r.dados.erro));
    r = await carregar(ANA, doServidor, "Tipo errado", { "Content-Type": "image/jpeg" });
    confere("carregar algo que não é .html é recusado", r.status === 415);
    r = await carregar(ANA, "<html>" + "x".repeat(6.5 * 1024 * 1024) + "</html>", "Grande demais");
    confere("arquivo grande demais é recusado com a mensagem do limite", r.status === 413 && /limite de 6,0 MB/.test(r.dados.erro), JSON.stringify(r.dados).slice(0, 200));

    // quem não pode
    const antes = (await pedir(ANA, "GET", "/api/catalogos")).dados.length;
    r = await carregar(CAIO, doServidor, "Leitor tentando");
    confere("leitor não carrega catálogo", r.status === 403, JSON.stringify(r.dados));
    r = await fetch(BASE + "/api/carregar?titulo=Sem", { method: "POST", headers: { "X-Catalogo": "1", "Content-Type": "text/html" }, body: doServidor });
    confere("sem o cabeçalho de identificação, não carrega", r.status === 401);
    r = await carregar(ANA, doServidor, "Sem o cabeçalho", { "X-Catalogo": "" });
    confere("carregar sem o cabeçalho da tela é recusado", r.status === 403);
    confere("nenhuma tentativa recusada deixou catálogo na biblioteca", (await pedir(ANA, "GET", "/api/catalogos")).dados.length === antes);

    // a tela
    r = await pedir(ANA, "GET", "/");
    confere("a página carrega o leitor de catálogo", /ler-catalogo\.js\?v=/.test(r.texto));
    r = await pedir(ANA, "GET", "/app.js");
    confere("a biblioteca tem o botão Carregar catálogo e a ajuda dele", r.texto.includes("Carregar catálogo") && r.texto.includes("Como carregar um catálogo"));
    r = await pedir(ANA, "GET", "/api/eu");
    confere("a tela recebe o limite do arquivo", r.dados.maxCarregar === 6 * 1024 * 1024, JSON.stringify(r.dados.maxCarregar));
    r = await carregar("novo@empresa.example", doServidor, "Quem aguarda");
    confere("quem aguarda liberação não carrega catálogo", r.status === 403 && /aguardando liberação/.test(r.dados.erro), JSON.stringify(r.dados));

    // a tela (1.4.0): aviso de aguardando liberação, sininho e lista de pessoas, com a ajuda de cada uma
    r = await pedir(ANA, "GET", "/app.js");
    confere("a tela tem o aviso de aguardando liberação, o sininho e a lista de pessoas com busca e filtro",
        r.texto.includes("Aguardando liberação") && r.texto.includes("Verificar de novo") && r.texto.includes("function sinoHtml") &&
        r.texto.includes('id="adm-busca"') && r.texto.includes('id="adm-filtro"') && r.texto.includes("Liberar") && r.texto.includes("Editar papel"));
    confere("as telas novas têm a ajuda do i", ["espera", "semacesso", "papel", "admin"].every((k) => r.texto.includes(`ajudaHtml("${k}")`)) &&
        ["O que é aguardando liberação", "Por que estou sem acesso", "O que cada papel pode fazer"].every((t) => r.texto.includes(t)));
}

/* modo local (sem porteiro): continua sem aguardar nada; a pessoa local é a administradora */
async function testesModoLocal() {
    const portaLocal = PORTA + 1, pastaLocal = fs.mkdtempSync(path.join(os.tmpdir(), "catalogo-local-"));
    const p = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
        env: { ...process.env, PORT: String(portaLocal), DADOS: pastaLocal, IDENTIDADE_CABECALHO: "", ADMINS: "", NODE_NO_WARNINGS: "1" }, stdio: "ignore" });
    const base = `http://127.0.0.1:${portaLocal}`;
    try {
        for (let i = 0; i < 40; i++) { try { await fetch(base + "/saude"); break; } catch { await new Promise((r) => setTimeout(r, 150)); } }
        const eu = await (await fetch(base + "/api/eu")).json();
        const lista = await fetch(base + "/api/catalogos");
        confere("no modo local quem abre é administrador e não aguarda liberação", eu.papel === "admin" && eu.pendentes === 0 && lista.status === 200, JSON.stringify(eu));
        const adm = await (await fetch(base + "/api/admin/papeis")).json();
        confere("no modo local a lista de pessoas tem só a pessoa local, como administradora", adm.pessoas.length === 1 && adm.pessoas[0].papel === "admin" && adm.pessoas[0].primeiro_acesso, JSON.stringify(adm));
    } finally {
        p.kill();
        await new Promise((r) => setTimeout(r, 300));
        try { fs.rmSync(pastaLocal, { recursive: true, force: true }); } catch { /* pasta temporária */ }
    }
}

const proc = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORTA), DADOS: pasta, AMBIENTE: "teste", IDENTIDADE_CABECALHO: "x-teste-email", ADMINS: ANA, CATALOGO_MAX_CARREGAR_MB: "6", NODE_NO_WARNINGS: "1" },
    stdio: ["ignore", "pipe", "pipe"]
});
let saida = "";
proc.stdout.on("data", (d) => { saida += d; });
proc.stderr.on("data", (d) => { saida += d; });

(async () => {
    for (let i = 0; i < 40; i++) {
        try { await fetch(BASE + "/saude"); break; } catch { await new Promise((r) => setTimeout(r, 150)); }
    }
    try { await testes(); await testesModoLocal(); }
    catch (e) { falhou++; console.log("FALHA geral:", e.stack || e.message); }
    proc.kill();
    await new Promise((r) => setTimeout(r, 300));
    try { fs.rmSync(pasta, { recursive: true, force: true }); } catch { /* pasta temporária */ }
    console.log(`\n${passou} passaram, ${falhou} falharam`);
    if (falhou) console.log("--- saída do Montador:\n" + saida);
    process.exit(falhou ? 1 : 0);
})();
