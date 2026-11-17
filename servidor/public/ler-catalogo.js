/*
 * Montador de Catálogo (versão com servidor): leitura de um arquivo .html de catálogo ("Carregar catálogo", 1.3.0).
 *
 * O mesmo código roda na tela (para mostrar o nome e o número de páginas antes de enviar) e no servidor (que confere
 * tudo de novo, valida as imagens e guarda). Ele só LÊ os dados do catálogo de dentro do texto do arquivo: o HTML
 * recebido nunca é executado, aberto numa página nem servido.
 *
 * Formatos aceitos:
 *  - "servidor": o arquivo do Compartilhar desta versão com servidor. O catálogo vai em
 *    Revista.montar(document.getElementById("revista"), {...});  com os campos titulo, aparencia, capa, contracapa e
 *    paginas (img, r, nome, preco, descricao).
 *  - "flipbook": o arquivo do Compartilhar da página do FlipBook (index.html e o montador baixado). O catálogo vai em
 *    window.CATALOG = {...};  com os campos title, whatsapp, bg, showInfo, cover, back e pages (img, r, name, price, desc).
 * A primeira versão do FlipBook (pasta versao-antiga/) não leva o catálogo dentro do arquivo (as imagens ficam numa
 * pasta), então não dá para carregar.
 */
(function (raiz, fabrica) {
    if (typeof module === "object" && module.exports) module.exports = fabrica();
    else raiz.LerCatalogo = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var NAO_E_CATALOGO = "Não encontrei um catálogo dentro deste arquivo. O Montador carrega o arquivo .html gerado pelo " +
        "Compartilhar desta versão com servidor ou da página do FlipBook. A primeira versão do FlipBook, que guarda as " +
        "imagens numa pasta separada, não dá para carregar.";
    var MONTADOR_VAZIO = "Este arquivo é o montador do FlipBook sem catálogo dentro. Peça o arquivo gerado no botão " +
        "Compartilhar do FlipBook (é ele que leva as páginas).";
    var DANIFICADO = "O catálogo dentro deste arquivo está incompleto ou foi alterado, e não dá para ler. Peça o arquivo de novo.";

    /** A partir de um "{", acha o "}" que fecha o objeto, pulando o que está dentro de textos. Devolve o trecho ou null. */
    function objetoJson(t, inicio) {
        var nivel = 0;
        for (var i = inicio; i < t.length; i++) {
            var c = t.charCodeAt(i);
            if (c === 34) {                                   // abre aspas: vai até a aspa que fecha (pulando \")
                for (i++; i < t.length; i++) {
                    var d = t.charCodeAt(i);
                    if (d === 92) i++;
                    else if (d === 34) break;
                }
            } else if (c === 123 || c === 91) nivel++;         // { [
            else if (c === 125 || c === 93) {                  // } ]
                nivel--;
                if (nivel === 0) return t.slice(inicio, i + 1);
            }
        }
        return null;
    }

    var ehObjeto = function (v) { return Boolean(v) && typeof v === "object" && !Array.isArray(v); };
    var comoTexto = function (v) { return typeof v === "string" ? v : typeof v === "number" ? String(v) : ""; };
    var folha = function (o) { o = ehObjeto(o) ? o : {}; return { img: typeof o.img === "string" ? o.img : "", r: Number(o.r) || 0 }; };

    /** Arquivo do Compartilhar desta versão com servidor. */
    function doServidor(d) {
        if (!ehObjeto(d) || !Array.isArray(d.paginas)) return null;
        return {
            formato: "servidor",
            titulo: comoTexto(d.titulo),
            aparencia: ehObjeto(d.aparencia) ? d.aparencia : {},
            capa: folha(d.capa), contracapa: folha(d.contracapa),
            paginas: d.paginas.map(function (p) {
                var f = folha(p); p = ehObjeto(p) ? p : {};
                return { img: f.img, r: f.r, nome: comoTexto(p.nome), preco: comoTexto(p.preco), descricao: comoTexto(p.descricao) };
            })
        };
    }

    /** Arquivo da página do FlipBook. Ela não tem cor de destaque, cor do papel nem logo, e sempre numera as páginas:
     *  o catálogo entra com a numeração ligada, o logo desligado e as outras cores no padrão (PADRAO do server.js). */
    function doFlipbook(d) {
        if (!ehObjeto(d) || !Array.isArray(d.pages)) return null;
        return {
            formato: "flipbook",
            titulo: comoTexto(d.title),
            aparencia: { fundo: comoTexto(d.bg), info: Boolean(d.showInfo), whatsapp: comoTexto(d.whatsapp), numeros: true, logo: false },
            capa: folha(d.cover), contracapa: folha(d.back),
            paginas: d.pages.map(function (p) {
                var f = folha(p); p = ehObjeto(p) ? p : {};
                return { img: f.img, r: f.r, nome: comoTexto(p.name), preco: comoTexto(p.price), descricao: comoTexto(p.desc) };
            })
        };
    }

    var MARCAS = [
        { re: /Revista\.montar\(\s*document\.getElementById\(\s*["']revista["']\s*\)\s*,\s*\{/g, ler: doServidor },
        { re: /window\.CATALOG\s*=\s*\{/g, ler: doFlipbook }
    ];

    /**
     * Lê o catálogo de dentro do texto de um arquivo .html. Devolve
     *   { formato: "servidor" | "flipbook", titulo, aparencia, capa: {img, r}, contracapa: {img, r},
     *     paginas: [{ img, r, nome, preco, descricao }] }
     * com as imagens ainda como vieram (quem chama confere cada uma). Se não for um catálogo, lança um erro com uma
     * mensagem para mostrar à pessoa.
     */
    function extrair(texto) {
        texto = String(texto == null ? "" : texto);
        var achouMarca = false;
        for (var k = 0; k < MARCAS.length; k++) {
            var m, re = MARCAS[k].re;
            re.lastIndex = 0;
            while ((m = re.exec(texto))) {
                achouMarca = true;
                var trecho = objetoJson(texto, m.index + m[0].length - 1);
                if (!trecho) continue;
                var dados;
                try { dados = JSON.parse(trecho); } catch (e) { continue; }
                var lido = MARCAS[k].ler(dados);
                if (lido) return lido;
            }
        }
        if (/window\.CATALOG\s*=\s*null\s*;/.test(texto)) throw new Error(MONTADOR_VAZIO);
        throw new Error(achouMarca ? DANIFICADO : NAO_E_CATALOGO);
    }

    var NOME_FORMATO = { servidor: "Arquivo do Montador com servidor", flipbook: "Arquivo da página do FlipBook" };
    return { extrair: extrair, NOME_FORMATO: NOME_FORMATO };
});
