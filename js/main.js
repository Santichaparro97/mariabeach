// Scroll suave y controlado: la rueda del mouse mueve la página
// con una inercia lenta en vez del salto seco del navegador
(function () {
  let objetivo = window.scrollY;
  let actual = window.scrollY;
  let corriendo = false;

  const maximo = () => document.documentElement.scrollHeight - window.innerHeight;

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // no interferir con el zoom
    e.preventDefault();
    objetivo = Math.max(0, Math.min(maximo(), objetivo + e.deltaY * 1.1));
    if (!corriendo) { corriendo = true; requestAnimationFrame(paso); }
  }, { passive: false });

  function paso() {
    actual += (objetivo - actual) * 0.075; // 0.075 = lento y flotante
    if (Math.abs(objetivo - actual) < 0.5) {
      actual = objetivo;
      corriendo = false;
    } else {
      requestAnimationFrame(paso);
    }
    window.scrollTo(0, actual);
  }

  // si el scroll se mueve por otro medio (barra, teclado, anclas), se sincroniza
  window.addEventListener('scroll', () => {
    if (!corriendo) { objetivo = window.scrollY; actual = objetivo; }
  }, { passive: true });
})();

// Barra superior: se esconde al bajar, reaparece al subir
(function () {
  const bar = document.querySelector('.site-top');
  if (!bar) return;
  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 80) {
      // arriba de todo: visible y 100% transparente
      bar.classList.remove('oculta', 'con-fondo');
    } else if (y > lastY) {
      bar.classList.add('oculta'); // bajando: se esconde
    } else {
      bar.classList.remove('oculta'); // subiendo: aparece
      bar.classList.add('con-fondo');
    }
    lastY = y;
  }, { passive: true });
})();

// Slider del hero: fade automático + flechas
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  const prev = document.querySelector('.hero-arrow--prev');
  const next = document.querySelector('.hero-arrow--next');
  let current = 0;
  let timer;

  function show(i) {
    slides[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 6000);
  }

  prev.addEventListener('click', () => { show(current - 1); restart(); });
  next.addEventListener('click', () => { show(current + 1); restart(); });
  restart();
})();

// Autoplay de respaldo: si el navegador frena el autoplay,
// se reintenta al cargar y ante la primera interacción
(function () {
  const playAll = () => {
    document.querySelectorAll('video').forEach(v => {
      if (v.paused) v.play().catch(() => {});
    });
  };
  window.addEventListener('load', playAll);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') playAll();
  });
  ['click', 'touchstart', 'scroll', 'keydown'].forEach(ev =>
    document.addEventListener(ev, playAll, { passive: true })
  );
})();

// Carrusel de sunset sessions: siempre 2 visibles, la flecha rota entre los 5
(function () {
  const videos = [
    'video/sunset-1.mp4',
    'video/sunset-2.mp4',
    'video/sunset-3.mp4',
    'video/sunset-4.mp4',
    'video/sunset-5.mp4'
  ];
  const big = document.getElementById('sunset-big');
  const small = document.getElementById('sunset-small');
  const arrow = document.querySelector('.sunset-arrow');
  if (!big || !small || !arrow) return;

  const bigBox = big.closest('.video-box');
  const smallBox = small.closest('.video-box');
  let index = 0; // principal = videos[index], chico = videos[index + 1]
  let animating = false;

  arrow.addEventListener('click', () => {
    if (animating) return;
    animating = true;

    const b = bigBox.getBoundingClientRect();
    const s = smallBox.getBoundingClientRect();

    // Capa flotante: copia del video chico que viaja hasta el lugar principal
    const fly = document.createElement('div');
    fly.className = 'video-box';
    fly.style.cssText = 'position:fixed;left:' + s.left + 'px;top:' + s.top + 'px;' +
      'width:' + s.width + 'px;height:' + s.height + 'px;margin:0;z-index:50;' +
      'transform-origin:top left;transition:transform .55s ease-in-out;';
    const flyVideo = document.createElement('video');
    flyVideo.src = small.getAttribute('src');
    flyVideo.muted = true;
    flyVideo.loop = true;
    flyVideo.autoplay = true;
    flyVideo.playsInline = true;
    flyVideo.addEventListener('loadedmetadata', () => {
      try { flyVideo.currentTime = small.currentTime; } catch (e) {}
    });
    fly.appendChild(flyVideo);
    document.body.appendChild(fly);
    flyVideo.play().catch(() => {});

    // En el mismo instante, el lugar chico ya muestra el siguiente video:
    // queda tapado por la capa flotante hasta que esta se va — nunca hay hueco
    index = (index + 1) % videos.length;
    small.src = videos[(index + 1) % videos.length];
    small.play().catch(() => {});

    // reflow síncrono y arranca el viaje hacia el lugar principal
    void fly.offsetWidth;
    fly.style.transform = 'translate(' + (b.left - s.left) + 'px, ' + (b.top - s.top) + 'px) ' +
      'scale(' + (b.width / s.width) + ', ' + (b.height / s.height) + ')';

    // el principal sale (se desliza y desvanece) mientras el nuevo entra
    big.style.transition = 'transform .55s ease-in-out, opacity .55s ease-in-out';
    big.style.transform = 'translateX(-70%)';
    big.style.opacity = '0';

    setTimeout(() => {
      // La capa ya cubre el lugar principal: se cambia el video de abajo
      // (reponiéndolo en su posición, sin animar) y recién listo se retira la capa
      big.src = videos[index];
      big.style.transition = 'none';
      big.style.transform = '';
      big.style.opacity = '';
      void big.offsetWidth;
      big.style.transition = '';
      const revelar = () => {
        fly.remove();
        animating = false;
      };
      big.addEventListener('loadeddata', () => {
        big.play().catch(() => {});
        revelar();
      }, { once: true });
      setTimeout(revelar, 450); // respaldo por si el video ya estaba en caché
      big.play().catch(() => {});
    }, 570);
  });
})();
