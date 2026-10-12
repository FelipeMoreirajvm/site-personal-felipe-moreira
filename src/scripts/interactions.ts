// Reações ao cursor. Só roda com mouse e sem "reduzir movimento".
const canReact =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

if (canReact) {
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const smooth = { x: pointer.x, y: pointer.y }; // segue o mouse com suavidade
  const ringPos = { x: pointer.x, y: pointer.y }; // anel do cursor, com mais atraso
  let inside = false;
  let frame = 0;

  let hero: HTMLElement | null = null;
  let cursor: HTMLElement | null = null;
  let ambient: HTMLElement | null = null;
  let letters: HTMLElement[] = [];
  let magnets: HTMLElement[] = [];

  const clamp = (value: number, limit: number) =>
    Math.max(-limit, Math.min(limit, value));

  const render = () => {
    if (cursor) {
      cursor.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    }

    if (ambient) {
      ambient.style.setProperty("--ax", `${smooth.x}px`);
      ambient.style.setProperty("--ay", `${smooth.y}px`);
    }

    if (hero) {
      const box = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${smooth.x - box.left}px`);
      hero.style.setProperty("--my", `${smooth.y - box.top}px`);
      hero.style.setProperty("--px", ((smooth.x / window.innerWidth - 0.5) * 2).toFixed(3));
      hero.style.setProperty("--py", ((smooth.y / window.innerHeight - 0.5) * 2).toFixed(3));
    }

    // Letras do nome: sobem e brilham quando o cursor chega perto
    for (const letter of letters) {
      let near = 0;
      if (inside) {
        const lift = Number(letter.dataset.near ?? 0) * 12;
        const box = letter.getBoundingClientRect();
        const dx = smooth.x - (box.left + box.width / 2);
        const dy = smooth.y - (box.top + box.height / 2 + lift);
        near = Math.max(0, 1 - Math.hypot(dx, dy) / 220);
      }
      letter.dataset.near = near.toFixed(3);
      letter.style.setProperty("--near", near.toFixed(3));
    }

    // Botões magnéticos
    for (const magnet of magnets) {
      let tx = 0;
      let ty = 0;
      if (inside) {
        const prevX = Number(magnet.dataset.tx ?? 0);
        const prevY = Number(magnet.dataset.ty ?? 0);
        const box = magnet.getBoundingClientRect();
        const dx = smooth.x - (box.left + box.width / 2 - prevX);
        const dy = smooth.y - (box.top + box.height / 2 - prevY);
        const strength = Math.max(0, 1 - Math.hypot(dx, dy) / 130);
        tx = clamp(dx * 0.35 * strength, 10);
        ty = clamp(dy * 0.35 * strength, 10);
      }
      magnet.dataset.tx = tx.toFixed(2);
      magnet.dataset.ty = ty.toFixed(2);
      magnet.style.setProperty("--tx", `${tx}px`);
      magnet.style.setProperty("--ty", `${ty}px`);
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const tick = () => {
    frame = 0;
    smooth.x += (pointer.x - smooth.x) * 0.12;
    smooth.y += (pointer.y - smooth.y) * 0.12;
    ringPos.x += (pointer.x - ringPos.x) * 0.25;
    ringPos.y += (pointer.y - ringPos.y) * 0.25;

    render();

    const settled =
      Math.abs(pointer.x - smooth.x) < 0.4 &&
      Math.abs(pointer.y - smooth.y) < 0.4 &&
      Math.abs(pointer.x - ringPos.x) < 0.4 &&
      Math.abs(pointer.y - ringPos.y) < 0.4;

    if (!settled) schedule();
  };

  // Procura de novo os elementos a cada página (o site troca de página sem recarregar)
  const refresh = () => {
    hero = document.querySelector<HTMLElement>("[data-hero]");
    cursor = document.querySelector<HTMLElement>("[data-cursor]");
    ambient = document.querySelector<HTMLElement>("[data-ambient]");
    letters = Array.from(document.querySelectorAll<HTMLElement>(".letter"));
    magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnet]"));
    hero?.style.setProperty("--lit", inside ? "1" : "0");
    schedule();
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!inside) {
        inside = true;
        smooth.x = ringPos.x = event.clientX;
        smooth.y = ringPos.y = event.clientY;
        cursor?.classList.add("is-on");
        hero?.style.setProperty("--lit", "1");
      }

      const target = event.target as Element | null;
      cursor?.classList.toggle("is-link", Boolean(target?.closest("a, button, [data-magnet]")));

      // Luz que acompanha o cursor dentro dos cartões das abas
      const card = target?.closest<HTMLElement>(".card, .tab-hero");
      if (card) {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${event.clientX - box.left}px`);
        card.style.setProperty("--sy", `${event.clientY - box.top}px`);
      }

      schedule();
    },
    { passive: true },
  );

  document.documentElement.addEventListener("mouseleave", () => {
    inside = false;
    pointer.x = window.innerWidth / 2;
    pointer.y = window.innerHeight / 2;
    cursor?.classList.remove("is-on");
    hero?.style.setProperty("--lit", "0");
    schedule();
  });

  document.addEventListener("astro:page-load", refresh);
  refresh();
}