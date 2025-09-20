// Lista de imagens do catálogo
const imagens = [
  "src/imagens/capa.jpg",
  "src/imagens/vaso01.jpg",
  "src/imagens/vaso02.jpg",
  "src/imagens/vaso03.jpg",
  "src/imagens/vaso04.jpg",
  //"src/imagens/vaso05.jpg",
  //"src/imagens/vaso06.jpg",
  //"src/imagens/vaso07.jpg",
  //"src/imagens/vaso08.jpg",
  //"src/imagens/vaso09.jpg",
  //"src/imagens/vaso10.jpg",
  //"src/imagens/vaso11.jpg",


  "src/imagens/fim.jpg"
];




// CODIGO JS//


// Detecta se é dispositivo mobile/tablet
const isMobile = window.innerWidth <= 768;

// Pega o elemento onde o flipbook ou imagens serão renderizados
const bookElement = document.getElementById("book");

if (isMobile) {
  // ============================
  //  MODO MOBILE/TABLET → Rolagem simples
  // ============================
  imagens.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.style.width = "100%";
    img.style.display = "block";
    img.style.marginBottom = "10px";
    bookElement.appendChild(img);
  });

} else {
  // ============================
  //  MODO DESKTOP → Flipbook
  // ============================

  const pageFlip = new St.PageFlip(bookElement, {
    width: 595,          // largura base de uma página
    height: 842,         // altura base de uma página
    size: 'stretch',     // ajusta-se ao container
    minWidth: 800,       // largura mínima para manter 2 páginas
    minHeight: 420,
    maxWidth: 2000,
    maxHeight: 2600,
    drawShadow: true,    // sombra no meio
    flippingTime: 800,   // tempo de virar página
    showCover: true,     // capa aparece sozinha
    useMouseEvents: true,
    mobileScrollSupport: false,
    usePortrait: false   // não entra em modo retrato (1 página)
  });

  pageFlip.loadFromImages(imagens);

  // ===== Funções de controle dos botões =====
  function next() { pageFlip.flipNext(); }
  function prev() { pageFlip.flipPrev(); }
  function goToFirst() { pageFlip.flip(0); }
  function goToLast() { pageFlip.flip(imagens.length - 1); }

  function toggleFullscreen() {
    // Coloca livro + botões em fullscreen
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

  // Expondo as funções globalmente (para os botões do HTML funcionarem)
  window.next = next;
  window.prev = prev;
  window.goToFirst = goToFirst;
  window.goToLast = goToLast;
  window.toggleFullscreen = toggleFullscreen;
}

