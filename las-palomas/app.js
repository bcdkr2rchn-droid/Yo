(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // H.264 para Safari y Chrome; WebM (VP9) para navegadores sin H.264.
  const videoExt = document.createElement("video").canPlayType('video/mp4; codecs="avc1.42E01E"') ? ".mp4" : ".webm";
  const loadVideo = (video) => {
    if (video.dataset.src && !video.getAttribute("src")) video.src = video.dataset.src.replace(/\.mp4$/, videoExt);
  };

  // ---------- Letras: cada carácter entra con un giro, palabra por palabra ----------
  const splitHeading = (el) => {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    let index = 0;
    const lines = $$(".line", el).length ? $$(".line", el) : [el];
    lines.forEach((line) => {
      const text = line.textContent;
      line.textContent = "";
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          line.append(" ");
          return;
        }
        const word = document.createElement("span");
        word.className = "w";
        word.setAttribute("aria-hidden", "true");
        [...part].forEach((ch) => {
          const c = document.createElement("span");
          c.className = "c";
          c.textContent = ch;
          c.style.setProperty("--i", index++);
          word.append(c);
        });
        line.append(word);
      });
    });
  };
  const typeText = (el) => {
    el.setAttribute("aria-label", el.textContent.trim());
    const chars = [...el.textContent];
    el.textContent = "";
    chars.forEach((ch, i) => {
      const t = document.createElement("span");
      t.className = "t";
      t.setAttribute("aria-hidden", "true");
      t.textContent = ch;
      t.style.setProperty("--i", i);
      el.append(t);
    });
  };
  $$("[data-split]").forEach(splitHeading);
  $$("[data-type]").forEach(typeText);

  // ---------- Entradas al hacer scroll ----------
  const inObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        inObserver.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -12% 0px" },
  );
  const hero = $(".hero");
  const animated = $$("[data-split], [data-type], .fade-up, .reveal-img").filter((el) => !el.closest(".loader") && !hero.contains(el));

  // ---------- Pantalla de carga ----------
  const loader = $(".loader");
  const heroVideo = $(".hero-media video");
  const revealHero = () => {
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-ready");
    $$("[data-split], [data-type], .fade-up", hero).forEach((el) => el.classList.add("is-in"));
    animated.forEach((el) => inObserver.observe(el));
  };
  loadVideo(heroVideo);
  if (reduceMotion) {
    loader.remove();
    revealHero();
  } else {
    requestAnimationFrame(() => $(".loader-text", loader).classList.add("is-in"));
    heroVideo.play().catch(() => {});
    setTimeout(() => {
      loader.classList.add("is-done");
      revealHero();
      setTimeout(() => loader.remove(), 1400);
    }, 2300);
  }

  // Pausa del video principal
  const videoToggle = $(".video-toggle");
  const setHeroPaused = (paused) => {
    if (paused) heroVideo.pause();
    else heroVideo.play().catch(() => {});
    videoToggle.setAttribute("aria-pressed", String(paused));
    $("use", videoToggle).setAttribute("href", paused ? "#i-play" : "#i-pause");
    $("span", videoToggle).textContent = paused ? "REPRODUCIR" : "PAUSAR";
  };
  videoToggle.addEventListener("click", () => setHeroPaused(!heroVideo.paused));
  if (reduceMotion) setHeroPaused(true);

  // ---------- Encabezado, menú móvil y sección activa ----------
  const header = $(".site-header");
  const menuToggle = $(".menu-toggle");
  const mobileNav = $("#mobile-nav");
  const setMenu = (open) => {
    mobileNav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    $("use", menuToggle).setAttribute("href", open ? "#i-x-light" : "#i-list-light");
  };
  menuToggle.addEventListener("click", () => setMenu(!mobileNav.classList.contains("is-open")));
  $$("a", mobileNav).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  const navLinks = $$(".nav a");
  const sectionObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.section === entry.target.id));
      }),
    { rootMargin: "-45% 0px -50% 0px" },
  );
  navLinks.forEach((a) => sectionObserver.observe(document.getElementById(a.dataset.section)));

  // ---------- Cifras que cuentan ----------
  const countObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        if (reduceMotion) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / 1600);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { threshold: 0.6 },
  );
  $$("[data-count]").forEach((el) => countObserver.observe(el));

  // ---------- Videos: cargan y se reproducen sólo a la vista ----------
  const userPaused = new WeakSet();
  const videoObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target: video, isIntersecting }) => {
        if (isIntersecting) {
          loadVideo(video);
          if (!reduceMotion && !userPaused.has(video)) video.play().catch(() => {});
        } else if (video.getAttribute("src")) {
          video.pause();
        }
      }),
    { rootMargin: "200px 0px" },
  );
  $$("video[data-autoplay]").forEach((video) => videoObserver.observe(video));

  $$(".play-toggle").forEach((btn) => {
    const video = $("video", btn.parentElement);
    const sync = () => {
      $("use", btn).setAttribute("href", video.paused ? "#i-play" : "#i-pause");
      btn.setAttribute("aria-label", video.paused ? "Reproducir video" : "Pausar video");
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
  $$(".exp-tile").forEach((tile) => {
    const video = $("video", tile);
    const start = () => {
      if (reduceMotion) return;
      loadVideo(video);
      video.play().then(() => tile.classList.add("is-playing")).catch(() => {});
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

  // ---------- Carrusel ----------
  $$("[data-rail]").forEach((btn) => {
    const rail = $(".rail", btn.closest(".rail-wrap"));
    btn.addEventListener("click", () => rail.scrollBy({ left: Number(btn.dataset.rail) * rail.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" }));
  });

  // ---------- Paralaje suave y encabezado sólido ----------
  const parallaxItems = $$("[data-parallax]").map((el) => ({
    box: el.closest(".band, .town") || el,
    media: el.matches(".band") ? $$(":scope > video, :scope > img", el) : [el],
  }));
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle("is-solid", window.scrollY > 80);
    if (reduceMotion) return;
    parallaxItems.forEach(({ box, media }) => {
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const offset = (r.top + r.height / 2 - innerHeight / 2) * -0.12;
      media.forEach((m) => (m.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`));
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true },
  );
  onScroll();

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
    group = $$("button img", img.closest("[data-gallery]"));
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
  $$("[data-gallery] button img").forEach((img) => img.closest("button").addEventListener("click", () => openLightbox(img)));
  $(".lb-close", lightbox).addEventListener("click", closeLightbox);
  $(".lb-prev", lightbox).addEventListener("click", () => showPhoto(groupIndex - 1));
  $(".lb-next", lightbox).addEventListener("click", () => showPhoto(groupIndex + 1));
  lightbox.addEventListener("click", (e) => e.target === lightbox && closeLightbox());

  // ---------- Modal de reservación ----------
  const modal = $(".modal");
  const openModal = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    setMenu(false);
    $(".modal-close", modal).focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    lastFocus?.focus();
  };
  $$("[data-open-reservation]").forEach((b) => b.addEventListener("click", openModal));
  $(".modal-close", modal).addEventListener("click", closeModal);
  modal.addEventListener("mousedown", (e) => e.target === modal && closeModal());

  window.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPhoto(groupIndex - 1);
      if (e.key === "ArrowRight") showPhoto(groupIndex + 1);
    } else if (!modal.hidden && e.key === "Escape") {
      closeModal();
    } else if (e.key === "Escape") {
      setMenu(false);
    }
  });
})();
