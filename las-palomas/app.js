(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // H.264 para Safari y Chrome; WebM (VP9) para navegadores sin H.264.
  const videoExt = document
    .createElement("video")
    .canPlayType('video/mp4; codecs="avc1.42E01E"')
    ? ".mp4"
    : ".webm";
  const loadVideo = (video) => {
    if (video.dataset.src && !video.getAttribute("src"))
      video.src = video.dataset.src.replace(/\.mp4$/, videoExt);
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
      // Degradado letra por letra en la cursiva: --p va de 0 (bugambilia) a 1 (azul).
      if (line.classList.contains("it")) {
        const chars = $$(".c", line);
        chars.forEach((c, i) =>
          c.style.setProperty("--p", (i / Math.max(1, chars.length - 1)).toFixed(3)),
        );
      }
    });
  };
  const typeText = (el) => {
    el.setAttribute("aria-label", el.textContent.trim());
    const chars = [...el.textContent];
    // Un solo contenedor para que el gap del eyebrow no separe cada letra.
    const run = document.createElement("span");
    run.className = "type-run";
    run.setAttribute("aria-hidden", "true");
    chars.forEach((ch, i) => {
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = ch;
      t.style.setProperty("--i", i);
      run.append(t);
    });
    el.textContent = "";
    el.append(run);
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
  const animated = $$(
    "[data-split], [data-type], .fade-up, .reveal-img",
  ).filter((el) => !el.closest(".loader") && !hero.contains(el));

  // ---------- Pantalla de carga ----------
  const loader = $(".loader");
  const heroVideo = $(".hero-media video");
  const revealHero = () => {
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-ready");
    $$("[data-split], [data-type], .fade-up", hero).forEach((el) =>
      el.classList.add("is-in"),
    );
    animated.forEach((el) => inObserver.observe(el));
  };
  loadVideo(heroVideo);
  if (reduceMotion) {
    loader.remove();
    revealHero();
  } else {
    requestAnimationFrame(() =>
      $(".loader-text", loader).classList.add("is-in"),
    );
    heroVideo.play().catch(() => {});
    setTimeout(() => {
      loader.classList.add("is-done");
      revealHero();
      setTimeout(() => loader.remove(), 1300);
      // Cuando termina la entrada, el video sigue al scroll como tarjeta 3D.
      setTimeout(() => hero.classList.add("is-live"), 2500);
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
    $("use", menuToggle).setAttribute(
      "href",
      open ? "#i-x-light" : "#i-list-light",
    );
  };
  menuToggle.addEventListener("click", () =>
    setMenu(!mobileNav.classList.contains("is-open")),
  );
  $$("a", mobileNav).forEach((a) =>
    a.addEventListener("click", () => setMenu(false)),
  );

  const navLinks = $$(".nav a");
  const sectionObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting)
          navLinks.forEach((a) =>
            a.classList.toggle(
              "is-active",
              a.dataset.section === entry.target.id,
            ),
          );
      }),
    { rootMargin: "-45% 0px -50% 0px" },
  );
  navLinks.forEach((a) =>
    sectionObserver.observe(document.getElementById(a.dataset.section)),
  );

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
          if (!reduceMotion && !userPaused.has(video))
            video.play().catch(() => {});
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
      btn.setAttribute(
        "aria-label",
        video.paused ? "Reproducir video" : "Pausar video",
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
  $$(".exp-tile").forEach((tile) => {
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

  // ---------- Carrusel ----------
  $$("[data-rail]").forEach((btn) => {
    const rail = $(".rail", btn.closest(".rail-wrap"));
    btn.addEventListener("click", () =>
      rail.scrollBy({
        left: Number(btn.dataset.rail) * rail.clientWidth * 0.8,
        behavior: reduceMotion ? "auto" : "smooth",
      }),
    );
  });

  // ---------- Paralaje suave y encabezado sólido ----------
  const parallaxItems = $$("[data-parallax]").map((el) => ({
    box: el.closest(".band, .town") || el,
    media: el.matches(".band") ? $$(":scope > video, :scope > img", el) : [el],
  }));
  const spheres = $$(".sphere").map((el) => ({
    el,
    depth: Number(el.dataset.depth) || 0.2,
    box: el.closest("section, footer"),
  }));
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle("is-solid", window.scrollY > 80);
    // Un salto con ancla puede pasar elementos sin que el observador los vea.
    if (document.body.classList.contains("is-ready")) {
      animated.forEach((el) => {
        if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < innerHeight * 0.88) {
          el.classList.add("is-in");
          inObserver.unobserve(el);
        }
      });
    }
    if (reduceMotion) return;
    hero.style.setProperty(
      "--hp",
      Math.min(1, Math.max(0, scrollY / hero.offsetHeight)).toFixed(3),
    );
    spheres.forEach(({ el, depth, box }) => {
      const y = box.getBoundingClientRect().top + el.offsetTop;
      if (y < -500 || y > innerHeight + 500) return;
      const offset = (y + el.offsetHeight / 2 - innerHeight / 2) * -depth * 0.45;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    parallaxItems.forEach(({ box, media }) => {
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const offset = (r.top + r.height / 2 - innerHeight / 2) * -0.12;
      media.forEach(
        (m) =>
          (m.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`),
      );
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

  // ---------- Barra de avance ----------
  const progress = $(".progress i");
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // ---------- Brillo que sigue al cursor sobre el vidrio ----------
  document.addEventListener(
    "pointermove",
    (e) => {
      const card = e.target.closest?.(".glass");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { passive: true },
  );

  // ---------- Tarjetas que se inclinan en 3D con el cursor ----------
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const tiltCards = $$(
      ".room, .dish-card, .exp-tile, .celebration, .wine, .stat, .include, .contact-card, .reel, .step, .capacity, .rail-item, .tile, .plate",
    );
    tiltCards.forEach((card) => {
      card.classList.add("tilt");
      if (card.matches(".exp-tile, .celebration, .reel, .tile, .room, .dish-card")) {
        const glare = document.createElement("span");
        glare.className = "glare";
        glare.setAttribute("aria-hidden", "true");
        card.append(glare);
      }
      const set = (rx, ry, lift) => {
        card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        card.style.setProperty("--lift", `${lift}px`);
      };
      card.addEventListener("pointerenter", () =>
        card.classList.add("is-settled", "is-tilting"),
      );
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const max = r.width > 520 ? 3 : 7;
        set(-y * max * 2, x * max * 2, 16);
        card.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        set(0, 0, 0);
      });
    });
  }

  // ---------- Temporadas ----------
  const tabs = $$(".season-tab");
  const selectSeason = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
      $$("video[data-autoplay]", panel).forEach((v) => {
        if (active) {
          loadVideo(v);
          if (!reduceMotion) v.play().catch(() => {});
        } else v.pause();
      });
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectSeason(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      selectSeason(next);
      next.focus();
    });
  });

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
  $$("[data-gallery] button img").forEach((img) =>
    img.closest("button").addEventListener("click", () => openLightbox(img)),
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
  $$("[data-open-reservation]").forEach((b) =>
    b.addEventListener("click", openModal),
  );
  $(".modal-close", modal).addEventListener("click", closeModal);
  modal.addEventListener(
    "mousedown",
    (e) => e.target === modal && closeModal(),
  );

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
