import { useEffect, useRef } from 'react';

const AMBIENT = {
  calm:       { a: 'rgba(96,165,250,0.09)',  b: 'rgba(34,211,238,0.07)'  },
  joy:        { a: 'rgba(251,191,36,0.10)',  b: 'rgba(245,158,11,0.08)'  },
  energy:     { a: 'rgba(251,146,60,0.09)',  b: 'rgba(220,38,38,0.07)'   },
  focus:      { a: 'rgba(167,139,250,0.09)', b: 'rgba(79,70,229,0.08)'   },
  melancholy: { a: 'rgba(176,188,204,0.22)', b: 'rgba(120,134,153,0.18)'  },
};

const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
const randI = (lo, hi) => Math.floor(rand(lo, hi));

const SHADES = [
  [245, 200, 66], [255, 220, 120], [255, 190, 50],
  [255, 240, 170], [230, 160, 40],
];
const shade = () => SHADES[randI(0, SHADES.length)];

// Pre-build rgba string once — avoids string creation every frame
const toRgba = ([r, g, b], a) =>
  `rgba(${r},${g},${b},${Math.min(Math.max(a, 0), 1).toFixed(2)})`;

function resetDust(d, W, H, fromBottom) {
  d.x       = rand(0, W);
  d.y       = fromBottom ? H + rand(2, 10) : rand(0, H);
  d.r       = rand(0.6, 2.2);
  d.vx      = rand(-0.1, 0.1);
  d.vy      = rand(-0.65, -0.22);
  d.life    = fromBottom ? 0 : rand(0, 1);
  d.speed   = rand(0.003, 0.006);
  d.twinkle = Math.random() < 0.28;
  d.color   = shade();
}

function makeDust(W, H, fromBottom = false) {
  const d = {};
  resetDust(d, W, H, fromBottom);
  return d;
}

function makeShell(W, H, x, peakY) {
  const vy = -Math.sqrt(2 * 0.1 * (H - peakY)) * rand(0.9, 1.05);
  return { x, y: H, vx: rand(-0.5, 0.5), vy, peakY, trail: [], color: shade() };
}

function makeSparks(x, y, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(-0.08, 0.08);
    const speed = rand(1.6, 5.0);
    out.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: rand(0.85, 1.0),
      r: rand(1.0, 2.6),
      decay: rand(0.014, 0.024),
      trail: [],
      color: shade(),
    });
  }
  return out;
}

function makeFlash(x, y) {
  return { x, y, alpha: 1.0, r: rand(18, 36) };
}

function pickLaunchPoint(W, H, box, mobile) {
  const MAR    = 40;
  const leftW  = box ? box.left - MAR : 0;
  const rightW = box ? W - box.right - MAR : 0;
  const hasSides = !mobile && leftW > 80 && rightW > 80;

  const roll = Math.random();
  const zone = !hasSides ? 'top' : roll < 0.40 ? 'top' : roll < 0.70 ? 'left' : 'right';

  let x, peakY;
  if (zone === 'top') {
    x = hasSides && box
      ? (Math.random() < 0.5 ? rand(W * 0.03, box.left - MAR) : rand(box.right + MAR, W * 0.97))
      : rand(W * 0.05, W * 0.95);
    const ceiling = box ? Math.max(box.top - 30, H * 0.06) : H * 0.3;
    peakY = rand(H * 0.04, Math.min(ceiling, H * 0.42));
  } else if (zone === 'left') {
    x     = rand(W * 0.03, leftW);
    peakY = rand(H * 0.08, H * 0.65);
  } else {
    x     = rand(box.right + MAR, W * 0.97);
    peakY = rand(H * 0.08, H * 0.65);
  }
  return makeShell(W, H, x, peakY);
}

export default function Background({ emotionId, isAnimating }) {
  const canvasRef = useRef(null);
  const isAnimRef = useRef(isAnimating);

  useEffect(() => { isAnimRef.current = isAnimating; }, [isAnimating]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    // isMob is set once and updated on resize — avoids reading window.innerWidth every frame
    let isMob = window.innerWidth < 768;

    const DUST_MAX  = () => isMob ? 25 : 50;
    const SPARK_MAX = () => isMob ? 22 : 40;
    const SHELL_MAX = () => isMob ? 2  : 3;

    const s = {
      dust: [], shells: [], sparks: [], flashes: [],
      nextLaunch: 0, activeLaunches: 0,
      frameId: null, W: 0, H: 0, dpr: 1,
      box: null, lastFrame: 0,
      wasAnimating: false,
    };

    function resize() {
      isMob = window.innerWidth < 768;  // update cached mobile flag
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.W   = window.innerWidth;
      s.H   = window.innerHeight;
      canvas.width  = s.W * s.dpr;
      canvas.height = s.H * s.dpr;
      canvas.style.width  = s.W + 'px';
      canvas.style.height = s.H + 'px';
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);

      const n = DUST_MAX();
      // Resize dust pool without Object.assign — mutate in place
      while (s.dust.length < n)  s.dust.push(makeDust(s.W, s.H));
      while (s.dust.length > n)  s.dust.pop();
      s.dust.forEach(d => resetDust(d, s.W, s.H, false));

      const hero = document.querySelector('.display__hero');
      if (hero) {
        const r = hero.getBoundingClientRect();
        s.box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      } else {
        const pw = Math.min(820, s.W - 40);
        s.box = { left: (s.W - pw) / 2, right: (s.W + pw) / 2, top: 220, bottom: s.H * 0.9 };
      }
    }

    function glow(x, y, r, color, alpha, blur) {
      ctx.save();
      ctx.shadowColor = toRgba(color, alpha);
      ctx.shadowBlur  = blur;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(r, 0.1), 0, Math.PI * 2);
      ctx.fillStyle = toRgba(color, alpha);
      ctx.fill();
      ctx.restore();
    }

    function loop(now) {
      s.frameId = requestAnimationFrame(loop);

      if (now - s.lastFrame < 16) return;
      s.lastFrame = now;

      ctx.clearRect(0, 0, s.W, s.H);

      const animating = isAnimRef.current;

      // Detect the exact frame when animation stops — clear fireworks once
      if (s.wasAnimating && !animating) {
        s.shells         = [];
        s.sparks         = [];
        s.flashes        = [];
        s.activeLaunches = 0;
      }
      s.wasAnimating = animating;

      // Nothing to draw while paused
      if (!animating) return;

      // Apply clip region: everything EXCEPT the card box
      ctx.save();
      if (s.box) {
        ctx.beginPath();
        ctx.rect(0, 0, s.W, s.H);
        ctx.rect(s.box.left, s.box.top, s.box.right - s.box.left, s.box.bottom - s.box.top);
        ctx.clip('evenodd');
      }

      // Dust — batched: set shadow once, draw all particles in one style pass
      const panelTop = s.box ? s.box.top : s.H * 0.42;
      ctx.shadowBlur = 4;
      for (let i = 0; i < s.dust.length; i++) {
        const d = s.dust[i];
        d.life += d.twinkle ? d.speed * rand(1.0, 1.8) : d.speed;

        if (d.life >= 1)      { resetDust(d, s.W, s.H, true);  continue; }
        if (d.y <= panelTop)  { resetDust(d, s.W, s.H, true);  continue; }

        const fade  = Math.min((d.y - panelTop) / 90, 1);
        const alpha = Math.sin(d.life * Math.PI) * 0.72 * fade;
        d.x += d.vx;
        d.y += d.vy;

        ctx.shadowColor = toRgba(d.color, alpha * 0.4);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = toRgba(d.color, alpha);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Launch new shell
      if (now >= s.nextLaunch && s.activeLaunches < SHELL_MAX()) {
        s.shells.push(pickLaunchPoint(s.W, s.H, s.box, isMob));
        s.activeLaunches++;
        s.nextLaunch = now + (isMob ? rand(3000, 6000) : rand(1500, 3500));
      }

      // Rising shells
      const aliveShells = [];
      for (let i = 0; i < s.shells.length; i++) {
        const sh = s.shells[i];
        sh.trail.push({ x: sh.x, y: sh.y });
        if (sh.trail.length > 7) sh.trail.shift();
        sh.x  += sh.vx;
        sh.y  += sh.vy;
        sh.vy += 0.1;
        for (let t = 0; t < sh.trail.length; t++) {
          const frac = (t + 1) / sh.trail.length;
          glow(sh.trail[t].x, sh.trail[t].y, 1.1 * frac, sh.color, frac * 0.8, 5);
        }
        glow(sh.x, sh.y, 1.8, sh.color, 1.0, 9);
        if (sh.vy >= -0.5) {
          s.flashes.push(makeFlash(sh.x, sh.y));
          s.sparks.push(...makeSparks(sh.x, sh.y, SPARK_MAX()));
          s.activeLaunches = Math.max(0, s.activeLaunches - 1);
        } else {
          aliveShells.push(sh);
        }
      }
      s.shells = aliveShells;

      // Explosion flashes
      const aliveFlashes = [];
      for (let i = 0; i < s.flashes.length; i++) {
        const f = s.flashes[i];
        f.alpha -= 0.055;
        if (f.alpha <= 0) continue;
        ctx.save();
        ctx.shadowColor = toRgba([255, 230, 100], f.alpha * 0.75);
        ctx.shadowBlur  = 48;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (1.5 - f.alpha), 0, Math.PI * 2);
        ctx.fillStyle = toRgba([255, 240, 160], f.alpha * 0.4);
        ctx.fill();
        ctx.restore();
        glow(f.x, f.y, f.r * 0.3, [255, 240, 200], f.alpha * 0.85, 16);
        aliveFlashes.push(f);
      }
      s.flashes = aliveFlashes;

      // Sparks
      const aliveSparks = [];
      for (let i = 0; i < s.sparks.length; i++) {
        const sp = s.sparks[i];
        sp.trail.push({ x: sp.x, y: sp.y });
        if (sp.trail.length > 7) sp.trail.shift();
        sp.vx *= 0.964; sp.vy *= 0.964;
        sp.vy += 0.058;
        sp.x  += sp.vx;
        sp.y  += sp.vy;
        sp.alpha -= sp.decay;
        if (sp.alpha <= 0) continue;
        for (let t = 0; t < sp.trail.length; t++) {
          const frac  = (t + 1) / sp.trail.length;
          const alpha = sp.alpha * frac * 0.55;
          if (alpha < 0.015) continue;
          ctx.save();
          ctx.shadowColor = toRgba(sp.color, alpha * 0.65);
          ctx.shadowBlur  = 3;
          ctx.beginPath();
          ctx.arc(sp.trail[t].x, sp.trail[t].y, Math.max(sp.r * frac * 0.5, 0.3), 0, Math.PI * 2);
          ctx.fillStyle = toRgba(sp.color, alpha);
          ctx.fill();
          ctx.restore();
        }
        glow(sp.x, sp.y, sp.r, sp.color, sp.alpha, 4 + sp.r * 2);
        aliveSparks.push(sp);
      }
      s.sparks = aliveSparks;

      ctx.restore(); // end clip region
    }

    resize();
    window.addEventListener('resize', resize);
    s.nextLaunch = performance.now() + 800;
    s.frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const col = AMBIENT[emotionId] || AMBIENT.calm;
    document.documentElement.style.setProperty('--amb1', col.a);
    document.documentElement.style.setProperty('--amb2', col.b);
  }, [emotionId]);

  return (
    <>
      <div className="bg-ambient" aria-hidden="true">
        <div className="bg-ambient__blob bg-ambient__blob--tl" />
        <div className="bg-ambient__blob bg-ambient__blob--br" />
        <div className="bg-ambient__blob bg-ambient__blob--mid" />
      </div>
      <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />
    </>
  );
}
