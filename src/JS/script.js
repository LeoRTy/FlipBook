const imagens = [
  "src/imagens/capa.jpg",
  "src/imagens/vaso01.jpg",
  "src/imagens/vaso02.jpg",
  "src/imagens/vaso03.jpg",
  "src/imagens/vaso04.jpg",
  // "src/imagens/vaso05.jpg",
  // ...
  "src/imagens/fim.jpg"
];

const bookElement = document.getElementById("book");

const pageFlip = new St.PageFlip(bookElement, {
  width: 595,
  height: 842,
  size: 'stretch',
  minWidth: 315,
  minHeight: 420,
  maxWidth: 2000,
  maxHeight: 2600,
  drawShadow: true,
  flippingTime: 800,
  showCover: true,
  useMouseEvents: true,
  mobileScrollSupport: false
});

pageFlip.loadFromImages(imagens);

// 🔹 Controles extras
function next() { pageFlip.flipNext(); }
function prev() { pageFlip.flipPrev(); }
function goToFirst() { pageFlip.flip(0); }
function goToLast() { pageFlip.flip(imagens.length - 1); }

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    bookElement.requestFullscreen().catch(err => {
      alert(`Erro ao ativar fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// 🔹 Atalhos de teclado
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
