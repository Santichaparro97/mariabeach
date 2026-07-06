// Menú hamburguesa (móvil): abre/cierra el overlay y se cierra al elegir sección
(function () {
  const bar = document.querySelector('.site-top');
  const toggle = document.querySelector('.menu-toggle');
  if (!bar || !toggle) return;

  toggle.addEventListener('click', () => bar.classList.toggle('menu-abierto'));
  document.querySelectorAll('.nav-menu a').forEach(a =>
    a.addEventListener('click', () => bar.classList.remove('menu-abierto'))
  );
})();

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
    if (bar.classList.contains('menu-abierto')) return;
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
      if (v.closest('.video-shelf')) return; // los del estante esperan pausados
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

// Carrusel de sunset sessions: 5 videos precargados que se intercambian
// como elementos (nunca se recarga un archivo => sin tildes ni blancos)
(function () {
  const srcs = [
    'video/sunset-1.mp4',
    'video/sunset-2.mp4',
    'video/sunset-3.mp4',
    'video/sunset-4.mp4',
    'video/sunset-5.mp4'
  ];
  const bigBox = document.querySelector('.sunset-crop--big');
  const smallBox = document.querySelector('.sunset-crop--small');
  const arrow = document.querySelector('.sunset-arrow');
  if (!bigBox || !smallBox || !arrow) return;

  // estante oculto donde esperan los videos que no están en pantalla
  const shelf = document.createElement('div');
  shelf.className = 'video-shelf';
  shelf.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
  document.body.appendChild(shelf);

  const pool = srcs.map((src, i) => {
    if (i === 0) return document.getElementById('sunset-big');
    if (i === 1) return document.getElementById('sunset-small');
    const v = document.createElement('video');
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    shelf.appendChild(v);
    v.load();
    return v;
  });

  let index = 0; // principal = pool[index], chico = pool[index + 1]
  let animating = false;

  arrow.addEventListener('click', () => {
    if (animating) return;
    animating = true;

    const b = bigBox.getBoundingClientRect();
    const s = smallBox.getBoundingClientRect();
    const bigVid = bigBox.querySelector('video');
    const smallVid = smallBox.querySelector('video');

    // capa flotante que lleva el MISMO video chico (conserva buffer y fotograma)
    const fly = document.createElement('div');
    fly.className = 'video-box';
    fly.style.cssText = 'position:fixed;left:' + s.left + 'px;top:' + s.top + 'px;' +
      'width:' + s.width + 'px;height:' + s.height + 'px;margin:0;z-index:50;' +
      'transform-origin:top left;transition:transform .6s cubic-bezier(.4, 0, .2, 1);';
    fly.appendChild(smallVid);
    document.body.appendChild(fly);
    smallVid.play().catch(() => {});

    // el hueco chico recibe al instante el siguiente video, ya precargado
    const nextVid = pool[(index + 2) % pool.length];
    smallBox.appendChild(nextVid);
    nextVid.play().catch(() => {});

    // arranca el viaje hacia el lugar principal
    void fly.offsetWidth;
    fly.style.transform = 'translate(' + (b.left - s.left) + 'px, ' + (b.top - s.top) + 'px) ' +
      'scale(' + (b.width / s.width) + ', ' + (b.height / s.height) + ')';

    // el principal se funde suave hacia el fondo oscuro mientras lo cubren
    bigVid.style.transition = 'opacity .6s ease';
    bigVid.style.opacity = '0';

    setTimeout(() => {
      // el video que viajó pasa a ser el principal: mismo elemento, sigue andando
      bigVid.style.transition = '';
      bigVid.style.opacity = '';
      bigVid.pause();
      shelf.appendChild(bigVid); // el saliente vuelve al estante
      bigBox.appendChild(smallVid);
      smallVid.play().catch(() => {});
      fly.remove();
      index = (index + 1) % pool.length;
      animating = false;
    }, 620);
  });
})();
