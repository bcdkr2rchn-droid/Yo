(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---------- Hero: cuatro experiencias que rotan ----------
  const slides = [
    {
      id: "hotel",
      eyebrow: "SANTIAGO, NUEVO LEÓN",
      title: ["VIVE EL LUGAR.", "SIENTE LA", "HISTORIA."],
      body: "Hotel, gastronomía, spa y celebraciones en el corazón del Pueblo Mágico.",
      image: "media/video/santiago-atardecer.jpg",
    },
    {
      id: "restaurante",
      eyebrow: "COCINA DEL NORESTE",
      title: ["SABORES QUE", "CUENTAN", "HISTORIAS."],
      body: "Gastronomía, tradición y hospitalidad servidas en un espacio con identidad propia.",
      image: "media/img/restaurante-arco-azul.webp",
    },
    {
      id: "spa",
      eyebrow: "UN MOMENTO PARA TI",
      title: ["PAUSA.", "RESPIRA.", "RENUEVA."],
      body: "Una experiencia de bienestar en medio de la calma y el encanto de Santiago.",
      image: "media/img/spa-alberca.webp",
    },
    {
      id: "eventos",
      eyebrow: "CELEBRACIONES CON ALMA",
      title: ["HAZLO TUYO.", "HAZLO", "INOLVIDABLE."],
      body: "Un escenario con historia para celebrar los momentos que merecen quedarse contigo.",
      image: "media/img/evento-noche.webp",
    },
  ];
  const hero = $(".hero");
  const layers = $$(".hero-layer", hero);
  const heroVideo = $("video.hero-layer", hero);
  const content = $(".hero-content", hero);
  const videoToggle = $(".video-toggle", hero);
  let current = 0;
  let timer = null;
  let videoPaused = reduceMotion;

  function renderSlide(index) {
    current = (index + slides.length) % slides.length;
    const s = slides[current];
    hero.className = `hero hero-${s.id}`;
    hero.style.setProperty("--hero-image", `url(${s.image})`);
    layers.forEach((layer) =>
      layer.classList.toggle(
        "is-active",
        Number(layer.dataset.slide) === current,
      ),
    );
    $('[data-hero="eyebrow"]', hero).textContent = s.eyebrow;
    $('[data-hero="title"]', hero).replaceChildren(
      ...s.title.map((line) => Object.assign(document.createElement("span"), { textContent: line })),
    );
    $('[data-hero="body"]', hero).textContent = s.body;
    $('[data-hero="count"]', hero).textContent = `0${current + 1} / 04`;
    $(".progress-track i", hero).style.width =
      `${((current + 1) / slides.length) * 100}%`;
    content.style.animation = "none";
    void content.offsetWidth;
    content.style.animation = "";
    videoToggle.hidden = current !== 0;
    if (current === 0 && !videoPaused) heroVideo.play().catch(() => {});
    else heroVideo.pause();
  }

  function schedule() {
    clearInterval(timer);
    if (!reduceMotion)
      timer = setInterval(
        () => renderSlide(current + 1),
        current === 0 ? 11000 : 8000,
      );
  }

  $$(".slide-controls [data-step]", hero).forEach((btn) =>
    btn.addEventListener("click", () => {
      renderSlide(current + Number(btn.dataset.step));
      schedule();
    }),
  );
  hero.addEventListener("mouseenter", () => clearInterval(timer));
  hero.addEventListener("mouseleave", schedule);

  videoToggle.addEventListener("click", () => {
    videoPaused = !videoPaused;
    if (videoPaused) heroVideo.pause();
    else heroVideo.play().catch(() => {});
    videoToggle.setAttribute("aria-pressed", String(videoPaused));
    $("use", videoToggle).setAttribute(
      "href",
      videoPaused ? "#i-play" : "#i-pause",
    );
    $("span", videoToggle).textContent = videoPaused
      ? "REPRODUCIR VIDEO"
      : "PAUSAR VIDEO";
  });

  if (reduceMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
    videoToggle.setAttribute("aria-pressed", "true");
    $("use", videoToggle).setAttribute("href", "#i-play");
    $("span", videoToggle).textContent = "REPRODUCIR VIDEO";
  } else {
    heroVideo.play().catch(() => {});
  }
  renderSlide(0);
  schedule();

  // ---------- Header flotante, menú móvil y sección activa ----------
  const header = $(".glass-header");
  const menuButton = $(".menu-button");
  const mobileMenu = $("#mobile-menu");
  const setMenu = (open) => {
    mobileMenu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    $("use", menuButton).setAttribute(
      "href",
      open ? "#i-x-regular" : "#i-list-regular",
    );
  };
  menuButton.addEventListener("click", () =>
    setMenu(!mobileMenu.classList.contains("is-open")),
  );
  $$("a", mobileMenu).forEach((a) =>
    a.addEventListener("click", () => setMenu(false)),
  );

  new IntersectionObserver(
    ([entry]) =>
      header.classList.toggle(
        "is-floating",
        !entry.isIntersecting && window.innerWidth > 900,
      ),
    {
      rootMargin: "-140px 0px 0px 0px",
    },
  ).observe(hero);

  const navLinks = $$(".desktop-nav a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting)
          navLinks.forEach((a) =>
            a.classList.toggle(
              "is-active",
              a.dataset.section === entry.target.id,
            ),
          );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  ["hotel", "restaurante", "spa", "eventos"].forEach((id) =>
    sectionObserver.observe(document.getElementById(id)),
  );

  // ---------- Videos: cargan y se reproducen sólo cuando están a la vista ----------
  const loadVideo = (video) => {
    if (video.dataset.src && !video.src) video.src = video.dataset.src;
  };
  const userPaused = new WeakSet();
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target: video, isIntersecting }) => {
        if (isIntersecting) {
          loadVideo(video);
          if (!reduceMotion && !userPaused.has(video))
            video.play().catch(() => {});
        } else if (video.src) {
          video.pause();
        }
      });
    },
    { rootMargin: "200px 0px" },
  );
  $$("video[data-autoplay]").forEach((video) => videoObserver.observe(video));

  $$(".reel").forEach((reel) => {
    const video = $("video", reel);
    const btn = $(".reel-toggle", reel);
    const label = $("figcaption", reel).textContent.toLowerCase();
    const sync = () => {
      const paused = video.paused;
      $("use", btn).setAttribute("href", paused ? "#i-play" : "#i-pause");
      btn.setAttribute(
        "aria-label",
        `${paused ? "Reproducir" : "Pausar"} video de ${label}`,
      );
    };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    btn.addEventListener("click", () => {
      loadVideo(video);
      if (video.paused) {
        userPaused.delete(video);
        video.play().catch(() => {});
      } else {
        userPaused.add(video);
        video.pause();
      }
    });
    sync();
  });

  // Tarjetas de experiencias: video al pasar el cursor
  $$(".experience-tile").forEach((tile) => {
    const video = $("video", tile);
    const start = () => {
      if (reduceMotion) return;
      loadVideo(video);
      video
        .play()
        .then(() => tile.classList.add("is-playing"))
        .catch(() => {});
    };
    const stop = () => {
      tile.classList.remove("is-playing");
      video.pause();
    };
    tile.addEventListener("mouseenter", start);
    tile.addEventListener("focus", start);
    tile.addEventListener("mouseleave", stop);
    tile.addEventListener("blur", stop);
  });

  // ---------- Carrusel de platillos ----------
  const rail = $(".rail");
  $$("[data-rail]").forEach((btn) =>
    btn.addEventListener("click", () =>
      rail.scrollBy({
        left: Number(btn.dataset.rail) * rail.clientWidth * 0.8,
        behavior: reduceMotion ? "auto" : "smooth",
      }),
    ),
  );

  // ---------- Visor de fotos ----------
  const lightbox = $(".lightbox");
  const lbImg = $("img", lightbox);
  const lbCaption = $("figcaption", lightbox);
  const lbCount = $(".lb-count", lightbox);
  let group = [];
  let groupIndex = 0;
  let lastFocus = null;

  const showPhoto = (i) => {
    groupIndex = (i + group.length) % group.length;
    const img = group[groupIndex];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = img.alt;
    lbCount.textContent = `${groupIndex + 1} / ${group.length}`;
  };
  const openLightbox = (img) => {
    const gallery = img.closest("[data-gallery]");
    group = $$("button img", gallery);
    lastFocus = document.activeElement;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    showPhoto(group.indexOf(img));
    $(".lb-close", lightbox).focus();
  };
  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    lastFocus?.focus();
  };
  $$("[data-gallery] button img").forEach((img) =>
    img.parentElement.addEventListener("click", () => openLightbox(img)),
  );
  $(".lb-close", lightbox).addEventListener("click", closeLightbox);
  $(".lb-prev", lightbox).addEventListener("click", () =>
    showPhoto(groupIndex - 1),
  );
  $(".lb-next", lightbox).addEventListener("click", () =>
    showPhoto(groupIndex + 1),
  );
  lightbox.addEventListener(
    "click",
    (e) => e.target === lightbox && closeLightbox(),
  );

  // ---------- Modal de reservación ----------
  const backdrop = $(".modal-backdrop");
  const setPurpose = (purpose) => {
    $$("[data-purpose]", backdrop).forEach((b) =>
      b.classList.toggle("is-active", b.dataset.purpose === purpose),
    );
    $$("[data-purpose-panel]", backdrop).forEach(
      (p) => (p.hidden = p.dataset.purposePanel !== purpose),
    );
  };
  const openModal = (purpose = "hospedaje") => {
    setPurpose(purpose);
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    setMenu(false);
    $(".modal-close", backdrop).focus();
  };
  const closeModal = () => {
    backdrop.hidden = true;
    lastFocus?.focus();
  };
  $$("[data-open-reservation]").forEach((b) =>
    b.addEventListener("click", () =>
      openModal(b.dataset.openReservation || "hospedaje"),
    ),
  );
  $$("[data-purpose]", backdrop).forEach((b) =>
    b.addEventListener("click", () => setPurpose(b.dataset.purpose)),
  );
  $(".modal-close", backdrop).addEventListener("click", closeModal);
  backdrop.addEventListener(
    "mousedown",
    (e) => e.target === backdrop && closeModal(),
  );

  window.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPhoto(groupIndex - 1);
      if (e.key === "ArrowRight") showPhoto(groupIndex + 1);
    } else if (!backdrop.hidden && e.key === "Escape") {
      closeModal();
    }
  });

  // ---------- Revelado suave al hacer scroll ----------
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }),
    { rootMargin: "0px 0px -10% 0px" },
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));
})();
