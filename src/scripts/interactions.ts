// Campo de pontos que reage ao cursor.
// Só roda com mouse e sem "reduzir movimento".
const canReact =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

if (canReact) {
  const SPACING = 30; // distância entre os pontos, em pixels
  const RADIUS = 190; // alcance do cursor
  const PUSH = 24; // quanto os pontos se afastam do cursor
  const FOLLOW = 0.16; // suavidade do retorno (menor = mais lento)
  const WAVE_SPEED = 720; // velocidade da onda do clique, em pixels por segundo
  const WAVE_TIME = 1.2; // duração da onda, em segundos

  interface Wave {
    x: number;
    y: number;
    start: number;
  }

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let color = "#2563eb";
  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let offsetX = new Float32Array(0);
  let offsetY = new Float32Array(0);
  let glow = new Float32Array(0);

  const pointer = { x: 0, y: 0, inside: false };
  const smooth = { x: 0, y: 0 };
  const waves: Wave[] = [];
  let frame = 0;

  const resize = () => {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    const total = cols * rows;
    offsetX = new Float32Array(total);
    offsetY = new Float32Array(total);
    glow = new Float32Array(total);
  };

  // Usa a cor de destaque da página (azul no início e no software, dourado no filmmaker)
  const readColor = () => {
    const themed = document.querySelector<HTMLElement>("[data-theme]");
    const value = themed
      ? getComputedStyle(themed).getPropertyValue("--accent").trim()
      : "";
    color = value || "#2563eb";
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!ctx) return;

    smooth.x += (pointer.x - smooth.x) * 0.22;
    smooth.y += (pointer.y - smooth.y) * 0.22;

    // descarta ondas antigas
    for (let w = waves.length - 1; w >= 0; w--) {
      if ((now - waves[w].start) / 1000 > WAVE_TIME) waves.splice(w, 1);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;

    // continua rodando enquanto algo ainda estiver se movendo
    let busy =
      waves.length > 0 ||
      Math.abs(pointer.x - smooth.x) > 0.5 ||
      Math.abs(pointer.y - smooth.y) > 0.5;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const baseX = col * SPACING;
        const baseY = row * SPACING;
        let targetX = 0;
        let targetY = 0;
        let near = 0;

        // empurrão do cursor
        if (pointer.inside) {
          const dx = baseX - smooth.x;
          const dy = baseY - smooth.y;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS) {
            const k = 1 - dist / RADIUS;
            const push = k * k * PUSH;
            const inv = dist || 1;
            targetX += (dx / inv) * push;
            targetY += (dy / inv) * push;
            near = k;
          }
        }

        // ondas dos cliques
        for (const wave of waves) {
          const age = (now - wave.start) / 1000;
          const dx = baseX - wave.x;
          const dy = baseY - wave.y;
          const dist = Math.hypot(dx, dy);
          const band = Math.abs(dist - age * WAVE_SPEED);
          if (band < 90) {
            const k = (1 - band / 90) * Math.max(0, 1 - age / WAVE_TIME);
            const inv = dist || 1;
            targetX += (dx / inv) * k * 20;
            targetY += (dy / inv) * k * 20;
            near = Math.max(near, k);
          }
        }

        if (
          Math.abs(targetX - offsetX[i]) > 0.05 ||
          Math.abs(targetY - offsetY[i]) > 0.05 ||
          Math.abs(near - glow[i]) > 0.01
        ) {
          busy = true;
        }

        offsetX[i] += (targetX - offsetX[i]) * FOLLOW;
        offsetY[i] += (targetY - offsetY[i]) * FOLLOW;
        glow[i] += (near - glow[i]) * 0.14;

        if (glow[i] > 0.02) {
          ctx.globalAlpha = Math.min(1, glow[i]) * 0.9;
          ctx.beginPath();
          ctx.arc(
            baseX + offsetX[i],
            baseY + offsetY[i],
            1 + glow[i] * 2.2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
    if (busy) schedule();
  };

  // Procura o canvas de novo a cada página (o site troca de página sem recarregar)
  const refresh = () => {
    canvas = document.querySelector<HTMLCanvasElement>("[data-field]");
    ctx = canvas?.getContext("2d") ?? null;
    readColor();
    resize();
    schedule();
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!pointer.inside) {
        pointer.inside = true;
        smooth.x = event.clientX;
        smooth.y = event.clientY;
      }
      schedule();
    },
    { passive: true },
  );

  window.addEventListener("pointerdown", (event) => {
    waves.push({ x: event.clientX, y: event.clientY, start: performance.now() });
    schedule();
  });

  document.documentElement.addEventListener("mouseleave", () => {
    pointer.inside = false;
    schedule();
  });

  window.addEventListener("resize", () => {
    resize();
    schedule();
  });

  document.addEventListener("astro:page-load", refresh);
  refresh();
}