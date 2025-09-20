// Lista de imagens do catálogo
const imagens = [
  "./src/imagens/capa.jpg",
  
  "./src/imagens/vaso01.jpg",
  "./src/imagens/vaso02.jpg",
  "./src/imagens/vaso03.jpg",
  "./src/imagens/vaso04.jpg",
  //"./src/imagens/vasoXX.jpg",
  //"./src/imagens/vasoXX.jpg",
  //"./src/imagens/vasoXX.jpg",
  //"./src/imagens/vasoXX.jpg",
  //"./src/imagens/vasoXX.jpg",

  "./src/imagens/fim.jpg"
];


///////////////////
//    SCRIPT     //
///////////////////

// Detecta se a tela é mobile/tablet (apenas resolução)
const isMobile = window.innerWidth <= 768;

// Elemento onde o catálogo será renderizado
const bookElement = document.getElementById("book");

if (isMobile) {
  // ============================
  // 📱 MODO MOBILE → Rolagem simples
  // ============================
  imagens.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.marginBottom = "5px"; // espaçamento entre imagens
    bookElement.appendChild(img);
  });

} else {
  // ============================
  // 💻 MODO DESKTOP → Flipbook
  // ============================
  const pageFlip = new St.PageFlip(bookElement, {
    width: 595,
    height: 842,
    size: 'stretch',
    minWidth: 800,
    minHeight: 420,
    maxWidth: 2000,
    maxHeight: 2600,
    drawShadow: true,
    flippingTime: 800,
    showCover: true,
    useMouseEvents: true,
    mobileScrollSupport: false,
    usePortrait: false
  });

  pageFlip.loadFromImages(imagens);

  // ===== Controles =====
  function next() { pageFlip.flipNext(); }
  function prev() { pageFlip.flipPrev(); }
  function goToFirst() { pageFlip.flip(0); }
  function goToLast() { pageFlip.flip(imagens.length - 1); }

  function toggleFullscreen() {
    const viewer = document.getElementById("viewer");
    if (!document.fullscreenElement) {
      viewer.requestFullscreen().catch(err => {
        alert(`Erro ao ativar fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // ===== Atalhos de teclado =====
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight": next(); break;
      case "ArrowLeft": prev(); break;
      case "Home": goToFirst(); break;
      case "End": goToLast(); break;
      case "Escape":
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  });

  // Deixa as funções globais (para os botões funcionarem)
  window.next = next;
  window.prev = prev;
  window.goToFirst = goToFirst;
  window.goToLast = goToLast;
  window.toggleFullscreen = toggleFullscreen;
}
