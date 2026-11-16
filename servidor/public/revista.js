/* Revista digital: o catálogo que o cliente folheia. Usado na pré-visualização do editor e embutido no arquivo do
   cliente. Não depende de nada de fora. Origem: FlipBook (github.com/LeoRTy/FlipBook). */
var Revista = (function () {
  "use strict";
  var DUR = 900;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ICON_L = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  var ICON_R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2l-.5-.3z"/></svg>';
  var ICON_1 = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="4" width="10" height="16" rx="1.5"/></svg>';
  var ICON_2 = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="5" width="9" height="14" rx="1.5"/><rect x="12.5" y="5" width="9" height="14" rx="1.5"/></svg>';

  function montar(root, data, opts) {
    opts = opts || {};
    var ap = data.aparencia || {};
    var els = {}, S = [], leaves = [], flipped = 0, cur = 0, mode = "", zc = 0, active = true, hintT, rt;
    var fim = new AbortController();
    var forced = "spread";
    try { var v = localStorage.getItem("revista-layout-v2"); if (v === "single" || v === "spread") forced = v; } catch (e) { /* sem armazenamento */ }
    if (!v && matchMedia("(max-width: 640px)").matches) forced = "single";

    var isSingle = function () { return forced === "single"; };
    var pageRatio = function () {
      var p = data.paginas.filter(function (x) { return x.r; })[0];
      var r = (data.capa && data.capa.r) || (p && p.r) || 0.72;
      return Math.min(1.3, Math.max(0.5, r));
    };
    var waNumber = function () { return String(ap.whatsapp || "").replace(/\D/g, ""); };
    var waLink = function (msg) { return "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(msg); };
    var botaoWa = function (msg, rotulo) { return '<a class="wa" target="_blank" rel="noopener" href="' + waLink(msg) + '">' + ICON_WA + esc(rotulo) + "</a>"; };

    function seq(single) {
      var n = 0, s = [{ kind: "cover", img: data.capa.img }];
      data.paginas.forEach(function (p) { s.push(Object.assign({ kind: "page", num: ++n }, p)); });
      if (!single && (s.length + 1) % 2) s.push({ kind: "blank" });
      s.push({ kind: "back", img: data.contracapa.img });
      return s;
    }

    function face(p, side, esq) {
      var inner = "", cls = "";
      var contato = waNumber() ? botaoWa(ap.mensagemContato || "Olá! Vi o catálogo e gostaria de mais informações.", ap.botaoContato || "Fale com a gente") : "";
      if (p.kind === "cover") {
        cls = "is-cover";
        inner = p.img ? '<img src="' + p.img + '" alt="">' :
          '<div class="cover-empty"><div class="ce-kicker">Catálogo</div><div class="ce-title">' + esc(data.titulo || "Seu catálogo") + "</div></div>";
      } else if (p.kind === "back") {
        cls = "is-cover";
        inner = p.img ? '<img src="' + p.img + '" alt="">' + (contato ? '<div class="back-cta">' + contato + "</div>" : "") :
          '<div class="back-empty"><div class="ce-title sm">' + esc(data.titulo || "") + "</div>" + contato + "</div>";
      } else if (p.kind === "page") {
        if (!p.img) cls = "noimg";
        var has = ap.info && (p.nome || p.preco || p.descricao), cap = "";
        if (has) {
          var wa = waNumber() ? botaoWa("Olá! Tenho interesse no produto: " + (p.nome || "página " + p.num) + (p.preco ? " (" + p.preco + ")" : ""), ap.botaoPedido || "Pedir") : "";
          cap = '<div class="cap">' + (p.nome ? '<div class="cap-name">' + esc(p.nome) + "</div>" : "") + (p.descricao ? '<div class="cap-desc">' + esc(p.descricao) + "</div>" : "") +
            ((p.preco || wa) ? '<div class="cap-row">' + (p.preco ? '<span class="price">' + esc(p.preco) + "</span>" : "<span></span>") + wa + "</div>" : "") + "</div>";
        }
        inner = (p.img ? '<img src="' + p.img + '" alt="">' : "") + cap + (ap.numeros === false ? "" : '<div class="pn">' + String(p.num).padStart(2, "0") + "</div>");
      } else if (p.kind === "paper") cls = "paper";
      return '<div class="face ' + side + " " + cls + (esq && p.kind === "page" ? " esq" : "") + '">' + inner + '<div class="spine"></div><div class="shade"></div></div>';
    }

    function build() {
      var single = isSingle();
      mode = single ? "single" : "spread";
      root.classList.toggle("single", single);
      els.layoutBtn.innerHTML = single ? ICON_2 + '<span class="lbl">Ver 2 páginas</span>' : ICON_1 + '<span class="lbl">Ver 1 página</span>';
      els.layoutBtn.title = single ? "Ver duas páginas lado a lado" : "Ver uma página por vez";
      S = seq(single);
      leaves.forEach(function (l) { l.remove(); });
      leaves = [];
      var n = single ? S.length : S.length / 2;
      for (var i = 0; i < n; i++) {
        var f = single ? S[i] : S[2 * i], b = single ? { kind: "paper" } : S[2 * i + 1];
        var leaf = document.createElement("div");
        leaf.className = "leaf";
        // em uma página por vez, as de posição ímpar são as páginas da esquerda da revista
        leaf.innerHTML = face(f, "front", single && i % 2 === 1) + face(b, "back");
        els.book.appendChild(leaf);
        leaves.push(leaf);
      }
      var last = data.paginas.length + 1;
      flipped = single ? Math.min(cur, n - 1) : (cur >= last ? n : Math.ceil(cur / 2));
      layout();
      render();
    }

    function layout() {
      var r = els.stage.getBoundingClientRect(), R = pageRatio();
      var ph = mode === "single" ? Math.min(r.height * 0.9, r.width * 0.86 / R) : Math.min(r.height * 0.86, r.width * 0.9 / (2 * R));
      ph = Math.max(180, ph);
      root.style.setProperty("--ph", ph + "px");
      root.style.setProperty("--pw", ph * R + "px");
    }

    function render() {
      var n = leaves.length, maxF = mode === "single" ? n - 1 : n;
      leaves.forEach(function (l, i) {
        var t = i < flipped;
        l.style.transform = t ? "rotateY(-180deg)" : "rotateY(0deg)";
        if (!l.classList.contains("moving")) l.style.zIndex = t ? i + 1 : n - i + 1;
      });
      var shift = 0;
      if (mode === "spread") { if (flipped === 0) shift = -25; else if (flipped === n) shift = 25; }
      els.book.style.transform = "translateX(" + shift + "%)";
      var showL = mode === "spread" && flipped > 0, showR = mode === "single" || flipped < n;
      els.shadow.style.left = showL ? "0" : "50%";
      els.shadow.style.right = showR ? "0" : "50%";
      var rightCount = mode === "single" ? n - flipped - 1 : n - flipped;
      els.er.style.width = Math.min(12, Math.max(0, rightCount) * 1.1) + "px";
      els.el.style.width = mode === "spread" ? Math.min(12, Math.max(0, flipped - 1) * 1.1) + "px" : "0";
      els.prev.disabled = flipped <= 0;
      els.next.disabled = flipped >= maxF;

      var last = data.paginas.length + 1, label;
      if (mode === "single") {
        cur = flipped;
        var p = S[flipped];
        label = p.kind === "cover" ? "Capa" : p.kind === "back" ? "Contracapa" : "Página " + p.num;
      } else {
        cur = flipped === 0 ? 0 : flipped === n ? last : 2 * flipped - 1;
        if (flipped === 0) label = "Capa";
        else if (flipped === n) label = "Contracapa";
        else {
          var nums = [S[2 * flipped - 1], S[2 * flipped]].filter(function (x) { return x && x.kind === "page"; }).map(function (x) { return x.num; });
          label = nums.length === 2 ? "Páginas " + nums[0] + " e " + nums[1] : nums.length ? "Página " + nums[0] : "Final";
        }
      }
      els.count.textContent = label;
      els.track.style.width = (maxF ? flipped / maxF * 100 : 0) + "%";
    }

    function bump() { els.clip.classList.remove("bump"); void els.clip.offsetWidth; els.clip.classList.add("bump"); }

    function go(dir) {
      var n = leaves.length, maxF = mode === "single" ? n - 1 : n, nf = flipped + dir;
      if (nf < 0 || nf > maxF) return bump();
      var leaf = leaves[dir > 0 ? flipped : flipped - 1];
      leaf.classList.remove("moving"); void leaf.offsetWidth; leaf.classList.add("moving");
      leaf.style.zIndex = n * 3 + (++zc);
      clearTimeout(leaf._t);
      leaf._t = setTimeout(function () { leaf.classList.remove("moving"); if (active) render(); }, DUR + 60);
      flipped = nf;
      render();
      els.hint.classList.add("off");
    }

    function desmontar() {
      active = false;
      fim.abort();
      clearTimeout(hintT); clearTimeout(rt);
      root.hidden = true;
      root.innerHTML = "";
      root.className = "";
      leaves = [];
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      if (opts.aoFechar) opts.aoFechar();
    }

    root.hidden = false;
    root.className = "v" + (ap.info ? "" : " contain");
    root.style.setProperty("--vbg", ap.fundo || "#1f1c24");
    root.style.setProperty("--vac", ap.destaque || "#c2410c");
    root.style.setProperty("--vpaper", ap.papel || "#fbf9f4");
    var fsOk = document.fullscreenEnabled;
    root.innerHTML =
      '<div class="v-top">' +
        (opts.previa ? '<button class="v-iconbtn" data-v="close">← Voltar ao editor</button>' : (data.logo ? '<img class="v-logo" src="' + data.logo + '" alt="">' : "<span></span>")) +
        '<div class="v-title">' + esc(data.titulo || "") + "</div>" +
        '<div class="v-tools"><button class="v-iconbtn" data-v="layout"></button>' + (fsOk ? '<button class="v-iconbtn" data-v="fs" title="Tela cheia">⛶</button>' : "") + "</div>" +
      "</div>" +
      '<div class="v-stage">' +
        '<div class="v-clip"><div class="v-tilt"><div class="v-book"><div class="v-shadow"></div><div class="edge l"></div><div class="edge r"></div></div></div></div>' +
        '<div class="v-hint">' + esc(ap.dica || "Deslize ou use as setas para folhear") + "</div>" +
      "</div>" +
      '<div class="v-bar">' +
        '<button class="v-nav" data-v="prev" aria-label="Página anterior">' + ICON_L + "</button>" +
        '<div class="v-count"><span></span><div class="v-track"><i></i></div></div>' +
        '<button class="v-nav" data-v="next" aria-label="Próxima página">' + ICON_R + "</button>" +
      "</div>" +
      '<a class="v-credit" href="https://br.linkedin.com/in/leonardo-teixeira-3244a6143" target="_blank" rel="noopener">Desenvolvido por Leonardo Teixeira</a>';
    els = {
      stage: $(".v-stage", root), clip: $(".v-clip", root), tilt: $(".v-tilt", root), book: $(".v-book", root),
      shadow: $(".v-shadow", root), el: $(".edge.l", root), er: $(".edge.r", root),
      count: $(".v-count span", root), track: $(".v-track i", root), prev: $("[data-v=prev]", root), next: $("[data-v=next]", root),
      hint: $(".v-hint", root), layoutBtn: $("[data-v=layout]", root)
    };
    hintT = setTimeout(function () { if (els.hint) els.hint.classList.add("off"); }, 6000);

    var sinal = { signal: fim.signal };
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]"); if (!b) return;
      var a = b.dataset.v;
      if (a === "prev") go(-1);
      else if (a === "next") go(1);
      else if (a === "close") desmontar();
      else if (a === "layout") {
        forced = mode === "single" ? "spread" : "single";
        try { localStorage.setItem("revista-layout-v2", forced); } catch (err) { /* sem armazenamento */ }
        build();
      } else if (a === "fs") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); }
    }, sinal);

    var start = null, st = els.stage;
    st.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button") || (e.pointerType === "mouse" && e.button !== 0)) return;
      start = { x: e.clientX, y: e.clientY };
    }, sinal);
    st.addEventListener("pointerup", function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        var r = els.clip.getBoundingClientRect();
        var mid = mode === "single" ? r.left + r.width * 0.35 : r.left + r.width / 2;
        go(e.clientX > mid ? 1 : -1);
      }
    }, sinal);
    st.addEventListener("pointercancel", function () { start = null; }, sinal);
    st.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = st.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      els.tilt.style.setProperty("--ry", (mode === "single" ? 0 : x * 8) + "deg");
      els.tilt.style.setProperty("--rx", (12 - y * 7) + "deg");
    }, sinal);
    st.addEventListener("pointerleave", function () { els.tilt.style.setProperty("--ry", "0deg"); els.tilt.style.setProperty("--rx", "12deg"); }, sinal);
    st.addEventListener("dragstart", function (e) { e.preventDefault(); }, sinal);
    addEventListener("keydown", function (e) {
      if (!active) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      if (e.key === "Escape" && opts.previa) desmontar();
    }, sinal);
    addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (active) layout(); }, 120);
    }, sinal);

    requestAnimationFrame(build);
    return { fechar: desmontar };
  }

  return { montar: montar };
})();
