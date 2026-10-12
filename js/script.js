const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const wide = window.matchMedia('(min-width: 1024px)');
const hasGsap = () => Boolean(window.gsap && window.ScrollTrigger);

const heroFrame = document.getElementById('hero-frame');
const heroAudioButton = document.getElementById('hero-audio-toggle');
const heroFullscreenButton = document.getElementById('hero-fullscreen-toggle');
const fullscreenIcon = document.getElementById('fullscreen-icon');
const navTrack = document.getElementById('nav-track');
const navIndicator = document.getElementById('nav-indicator');
const navLinks = navTrack ? [...navTrack.querySelectorAll('.nav-link[href^="#"]')] : [];
const ambient = document.querySelector('.ambient');

// ---------- Reveals: run once, never hide content again ----------

function startReveals() {
    const targets = document.querySelectorAll('[data-reveal], .tile, .service');
    if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-revealed'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => observer.observe(el));
}

// ---------- Hero wordmark: "Latentiq" denoises out of noise on every load ----------

function initWordmark() {
    const h1 = document.getElementById('hero-wordmark');
    const canvas = h1 && h1.querySelector('canvas');
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;

    const WORD = 'Latentiq';
    const FONT = '"Bodoni Moda", Didot, "Bodoni 72", serif';
    const INK = '#f2f0ed';
    const TINTS = [[255, 74, 178], [155, 107, 255], [242, 240, 237]];
    const STEPS = 30;
    const TRACK = -0.035; // tracking in em, set explicitly so every canvas renders the word identically
    let box = null;
    let done = false;

    // Find the word's real ink bounds by drawing it once off-screen and scanning the pixels.
    // (measureText's bounding box is several percent off for this face at display sizes.)
    function inkMetrics() {
        const size = 200;
        const probe = document.createElement('canvas');
        probe.width = size * 6; probe.height = size * 2;
        const p = probe.getContext('2d', { willReadFrequently: true });
        const x0 = size * 0.5, base = size * 1.3;
        p.font = `500 ${size}px ${FONT}`;
        p.textBaseline = 'alphabetic';
        if ('letterSpacing' in p) p.letterSpacing = `${(TRACK * size).toFixed(2)}px`;
        p.fillText(WORD, x0, base);
        const d = p.getImageData(0, 0, probe.width, probe.height).data;
        let minX = probe.width, maxX = 0, minY = probe.height, maxY = 0;
        for (let y = 0; y < probe.height; y++) {
            for (let x = 0; x < probe.width; x++) {
                if (d[(y * probe.width + x) * 4 + 3] > 8) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        const u = 100 / size;
        return { left: (x0 - minX) * u, width: (maxX - minX + 1) * u, ascent: (base - minY) * u, height: (maxY - minY + 1) * u };
    }

    // Fit the word to the full width of the hero; on very wide screens cap its height instead
    function measure() {
        const ink = inkMetrics();
        const holder = h1.parentElement;
        const pad = getComputedStyle(holder);
        const available = holder.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
        let k = available / ink.width;
        const maxTall = window.innerHeight * 0.42;
        if (ink.height * k > maxTall) k = maxTall / ink.height;
        const width = Math.min(available, Math.round(ink.width * k));
        holder.style.setProperty('--wm-w', `${width}px`);
        return {
            width,
            height: Math.ceil(ink.height * k) + 2,
            size: 100 * k,
            left: ink.left * k,
            ascent: ink.ascent * k,
        };
    }

    function drawWord(c, scale, blur) {
        c.font = `500 ${box.size * scale}px ${FONT}`;
        c.textBaseline = 'alphabetic';
        if ('letterSpacing' in c) c.letterSpacing = `${(TRACK * box.size * scale).toFixed(2)}px`;
        if (blur && 'filter' in c) c.filter = `blur(${blur}px)`;
        c.fillText(WORD, box.left * scale, (box.ascent + 1) * scale);
        if ('filter' in c) c.filter = 'none';
    }

    function layout() {
        box = measure();
        h1.style.setProperty('--wm-h', `${box.height}px`);
    }

    function drawFinal() {
        layout(); // re-measure: the display face may have finished loading since the first pass
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(box.width * dpr);
        canvas.height = Math.round(box.height * dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = INK;
        drawWord(ctx, dpr);
    }

    function animate() {
        // Work at half resolution: the grain is the point, and it keeps each step cheap
        const scale = 0.5;
        const w = canvas.width = Math.max(2, Math.round(box.width * scale));
        const h = canvas.height = Math.max(2, Math.round(box.height * scale));
        const makeMask = (blur) => {
            const m = document.createElement('canvas');
            m.width = w; m.height = h;
            const mc = m.getContext('2d');
            mc.fillStyle = '#fff';
            drawWord(mc, scale, blur);
            return mc.getImageData(0, 0, w, h).data;
        };
        const soft = makeMask(Math.max(4, h * 0.08));
        const sharp = makeMask(0);
        const img = ctx.createImageData(w, h);
        const px = img.data;
        let step = 0;

        function frame() {
            const a = Math.pow(step / STEPS, 1.5);
            for (let i = 0; i < px.length; i += 4) {
                const m = (soft[i + 3] * (1 - a) + sharp[i + 3] * a) / 255;
                if (m < 0.01) { px[i + 3] = 0; continue; }
                const n = Math.random();
                const r = Math.random();
                const tint = r < 0.3 ? TINTS[0] : r < 0.55 ? TINTS[1] : TINTS[2];
                const ink = a + (1 - a) * n;
                px[i] = tint[0] + (242 - tint[0]) * a;
                px[i + 1] = tint[1] + (240 - tint[1]) * a;
                px[i + 2] = tint[2] + (237 - tint[2]) * a;
                px[i + 3] = 255 * m * Math.min(1, ink * (0.35 + 0.65 * a) * 1.6);
            }
            ctx.putImageData(img, 0, 0);
            if (step < STEPS) {
                step++;
                setTimeout(() => requestAnimationFrame(frame), 55);
            } else {
                done = true;
                drawFinal();
            }
        }
        frame();
    }

    const fontReady = document.fonts
        ? Promise.race([document.fonts.load(`500 100px ${FONT}`), new Promise((r) => setTimeout(r, 2500))])
        : Promise.resolve();

    fontReady.then(() => {
        layout();
        h1.classList.add('is-canvas');
        if (reducedMotion.matches) {
            done = true;
            drawFinal();
            canvas.animate && canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
        } else {
            setTimeout(animate, 250);
        }
    }).catch(() => h1.classList.remove('is-canvas'));

    if (document.fonts) document.fonts.ready.then(() => { if (done) drawFinal(); });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!done) return;
            drawFinal();
        }, 150);
    });
}

// ---------- Showreel ----------

let heroPlayer;
let isHeroMuted = true;

window.onYouTubeIframeAPIReady = function () {
    heroPlayer = new YT.Player('hero-video-player', {
        videoId: 'yM-_Xojn5Hs',
        playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: 'yM-_Xojn5Hs', controls: 0, modestbranding: 1, rel: 0, playsinline: 1, vq: 'hd1080' },
        events: { onReady: (e) => e.target.playVideo() }
    });
};

function setHeroMuted(muted) {
    if (!heroPlayer || !heroPlayer.mute) return;
    isHeroMuted = muted;
    muted ? heroPlayer.mute() : heroPlayer.unMute();
    if (!heroAudioButton) return;
    heroAudioButton.classList.toggle('is-playing', !muted);
    heroAudioButton.setAttribute('aria-pressed', String(!muted));
    heroAudioButton.setAttribute('aria-label', muted ? 'Turn showreel sound on' : 'Turn showreel sound off');
    document.getElementById('audio-status-text').textContent = muted ? 'Sound off' : 'Sound on';
}

if (heroAudioButton) {
    heroAudioButton.addEventListener('click', () => setHeroMuted(!isHeroMuted));
}

function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
}

function updateFullscreenUI() {
    const isFullscreen = Boolean(getFullscreenElement());
    fullscreenIcon.classList.toggle('ph-corners-out', !isFullscreen);
    fullscreenIcon.classList.toggle('ph-corners-in', isFullscreen);
    heroFullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Play showreel fullscreen');
}

function toggleFullscreen() {
    if (getFullscreenElement()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
        const request = heroFrame.requestFullscreen || heroFrame.webkitRequestFullscreen;
        if (request) Promise.resolve(request.call(heroFrame)).catch(() => {});
    }
}

// The click is the one moment browsers allow sound, so open the reel properly
function watchReel() {
    if (heroPlayer && heroPlayer.seekTo) {
        heroPlayer.seekTo(0, true);
        heroPlayer.playVideo();
    }
    setHeroMuted(false);
    if (!getFullscreenElement()) toggleFullscreen();
}

if (heroFullscreenButton && heroFrame) {
    heroFullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
}

const watchReelButton = document.getElementById('watch-reel');
if (watchReelButton) watchReelButton.addEventListener('click', watchReel);

if (heroFrame) {
    heroFrame.addEventListener('click', (e) => {
        if (e.target.closest('button') || getFullscreenElement()) return;
        watchReel();
    });
}

// ---------- Navigation: one indicator glides to the current section ----------

function moveIndicator(link) {
    if (!navIndicator) return;
    if (!link) {
        navIndicator.classList.remove('is-ready');
        return;
    }
    navIndicator.style.setProperty('--ix', `${link.offsetLeft}px`);
    navIndicator.style.setProperty('--iw', `${link.offsetWidth}px`);
    navIndicator.classList.add('is-ready');
    const target = link.offsetLeft - (navTrack.clientWidth - link.offsetWidth) / 2;
    navTrack.scrollTo({ left: target, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
}

let activeLink = null;
function setActive(id) {
    const link = navLinks.find((l) => l.getAttribute('href') === `#${id}`) || null;
    if (link === activeLink) return;
    navLinks.forEach((l) => l.removeAttribute('aria-current'));
    if (link) link.setAttribute('aria-current', 'true');
    activeLink = link;
    moveIndicator(link);
}

if (navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
        });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    navLinks
        .map((l) => document.querySelector(l.getAttribute('href')))
        .filter(Boolean)
        .forEach((section) => navObserver.observe(section));
    window.addEventListener('resize', () => moveIndicator(activeLink));
    document.fonts && document.fonts.ready.then(() => moveIndicator(activeLink));
}

// ---------- Services: the sticky stage follows the service in view ----------

function initServices() {
    const grid = document.querySelector('.services-grid');
    const stage = document.getElementById('services-stage');
    const services = [...document.querySelectorAll('.service')];
    if (!grid || !stage || !services.length) return;
    let current = 0;

    function show(i) {
        current = i;
        services.forEach((s, k) => s.classList.toggle('is-active', k === i));
        [...stage.children].forEach((item, k) => item.classList.toggle('is-active', k === i));
    }

    function build() {
        if (wide.matches && !stage.childElementCount) {
            services.forEach((service) => {
                const visual = service.querySelector('.service-visual');
                const item = document.createElement('div');
                item.className = 'stage-item';
                item.innerHTML = visual ? visual.innerHTML : '';
                stage.appendChild(item);
            });
        }
        grid.classList.toggle('is-staged', wide.matches);
        show(current);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) show(services.indexOf(entry.target));
        });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    services.forEach((s) => observer.observe(s));
    wide.addEventListener('change', build);
    build();
}

// ---------- Smooth scroll and scroll-linked motion ----------

function initSmoothScroll() {
    if (reducedMotion.matches || !window.Lenis) return null;
    const lenis = new window.Lenis({ lerp: 0.09, anchors: { offset: -80 }, autoRaf: !hasGsap() });
    if (hasGsap()) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add((time) => lenis.raf(time * 1000));
        window.gsap.ticker.lagSmoothing(0);
    }
    return lenis;
}

function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map((word, i) => {
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = word;
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        return span;
    });
}

function initScrollMotion() {
    if (!hasGsap() || reducedMotion.matches) return;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    // The reel recedes into a framed card as the page takes over
    if (heroFrame) {
        gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
            .to(heroFrame, { scale: 0.86, borderRadius: 28, ease: 'none' }, 0)
            .to('.hero-content', { yPercent: -18, ease: 'none' }, 0)
            .to('.hero-content', { opacity: 0, ease: 'none', duration: 0.45 }, 0);
        document.addEventListener('fullscreenchange', () => {
            gsap.set(heroFrame, getFullscreenElement() ? { clearProps: 'transform,borderRadius' } : {});
            ScrollTrigger.refresh();
        });
    }

    // The statement lights up word by word as it is read
    const statement = document.getElementById('statement');
    if (statement) {
        const words = splitWords(statement);
        gsap.fromTo(words, { opacity: 0.16 }, {
            opacity: 1, ease: 'none', stagger: 0.1,
            scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
        });
    }

    // The services marquee runs faster while the page is moving
    const track = document.querySelector('.marquee-track');
    if (track) {
        track.style.animation = 'none';
        const loop = gsap.to(track, { xPercent: -50, repeat: -1, ease: 'none', duration: 48 });
        let boost = 0;
        ScrollTrigger.create({ onUpdate: (self) => { boost = Math.min(Math.abs(self.getVelocity()) / 250, 6); } });
        gsap.ticker.add(() => {
            loop.timeScale(loop.timeScale() + (1 + boost - loop.timeScale()) * 0.08);
            boost *= 0.92;
        });
    }

    // The closing line drifts up slightly slower than the page
    gsap.fromTo('.closing-title', { yPercent: 20 }, {
        yPercent: -10, ease: 'none',
        scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: true },
    });
}

// ---------- Cursor label: "Play reel" over the showreel ----------

function initCursorLabel() {
    const label = document.getElementById('cursor-label');
    if (!label || !finePointer.matches) return;
    const text = label.firstElementChild;
    let x = -200, y = -200, tx = -200, ty = -200, running = false;

    function step() {
        x += (tx - x) * 0.22;
        y += (ty - y) * 0.22;
        label.style.setProperty('--cx', `${x.toFixed(1)}px`);
        label.style.setProperty('--cy', `${y.toFixed(1)}px`);
        running = Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2;
        if (running) requestAnimationFrame(step);
    }

    document.addEventListener('pointermove', (e) => {
        tx = e.clientX;
        ty = e.clientY;
        const host = e.target.closest('[data-cursor]');
        const on = Boolean(host) && !e.target.closest('button, a') && !getFullscreenElement();
        if (on && text.dataset.label !== host.dataset.cursor) {
            text.dataset.label = host.dataset.cursor;
            text.innerHTML = `<i class="ph-fill ph-play" aria-hidden="true"></i>${host.dataset.cursor}`;
        }
        if (on && !label.classList.contains('is-on')) { x = tx; y = ty; }
        label.classList.toggle('is-on', on);
        if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => label.classList.remove('is-on'));
}

// ---------- Ambient light: eases toward the pointer, desktop only ----------

function initAmbient() {
    if (!ambient || !finePointer.matches || reducedMotion.matches) return;
    let tx = 70, ty = 10, cx = 70, cy = 10, running = false;
    const step = () => {
        cx += (tx - cx) * 0.045;
        cy += (ty - cy) * 0.045;
        ambient.style.setProperty('--lx', `${cx.toFixed(2)}%`);
        ambient.style.setProperty('--ly', `${cy.toFixed(2)}%`);
        running = Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1;
        if (running) requestAnimationFrame(step);
    };
    document.addEventListener('pointermove', (e) => {
        tx = (e.clientX / window.innerWidth) * 100;
        ty = (e.clientY / window.innerHeight) * 100;
        if (!running && !document.hidden) {
            running = true;
            requestAnimationFrame(step);
        }
    }, { passive: true });
}

// ---------- Start ----------

requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
startReveals();
initWordmark();
initServices();
initCursorLabel();
initAmbient();

// The animation libraries load after this file, from a CDN. Everything above runs without them;
// smooth scrolling and scroll-linked motion join in once they have arrived.
// (Deferred scripts run before DOMContentLoaded fires, so by then the libraries have executed.)
let librariesStarted = false;
function initWhenLibrariesReady() {
    if (librariesStarted) return;
    librariesStarted = true;
    initSmoothScroll();
    initScrollMotion();
}
if (document.readyState === 'complete') {
    initWhenLibrariesReady();
} else {
    document.addEventListener('DOMContentLoaded', initWhenLibrariesReady, { once: true });
    window.addEventListener('load', initWhenLibrariesReady, { once: true });
}
