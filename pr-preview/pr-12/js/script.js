const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

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
    const revealTargets = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach((el) => el.classList.add('is-revealed'));
        return;
    }
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => revealObserver.observe(el));
}

// ---------- Entrance: the frame opens like a film gate ----------

function startPage() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.add('is-loaded');
        startReveals();
    }));
}

// ---------- Intro: the wordmark denoises out of latent noise, once per visit ----------

function runIntro(done) {
    const screen = document.getElementById('intro');
    const canvas = document.getElementById('intro-canvas');
    const stepLabel = document.getElementById('intro-step');
    const skip = document.getElementById('intro-skip');
    try { sessionStorage.setItem('lq-intro', '1'); } catch (e) {}

    let finished = false;
    function finish() {
        if (finished) return;
        finished = true;
        screen.classList.add('is-leaving');
        done();
        setTimeout(() => {
            root.classList.remove('intro');
            screen.remove();
        }, 900);
    }
    skip.addEventListener('click', finish);
    window.addEventListener('keydown', finish, { once: true });
    window.addEventListener('wheel', finish, { once: true, passive: true });
    window.addEventListener('touchmove', finish, { once: true, passive: true });

    const ctx = canvas.getContext('2d');
    if (!ctx) { finish(); return; }

    const fontReady = document.fonts
        ? Promise.race([document.fonts.load('500 200px "Bodoni Moda"'), new Promise((r) => setTimeout(r, 1200))])
        : Promise.resolve();

    fontReady.then(() => {
        if (finished) return;
        // Work at reduced resolution: the grain is the point, and it keeps each step cheap
        const rect = canvas.getBoundingClientRect();
        const w = canvas.width = Math.max(240, Math.round(rect.width / 2));
        const h = canvas.height = Math.max(70, Math.round(rect.height / 2));

        const mask = document.createElement('canvas');
        mask.width = w; mask.height = h;
        const m = mask.getContext('2d');
        m.fillStyle = '#fff';
        m.textAlign = 'center';
        m.textBaseline = 'middle';
        let size = h * 0.92;
        m.font = `500 ${size}px "Bodoni Moda", Didot, serif`;
        const measured = m.measureText('Latentiq').width;
        if (measured > w * 0.94) { size *= (w * 0.94) / measured; m.font = `500 ${size}px "Bodoni Moda", Didot, serif`; }
        m.fillText('Latentiq', w / 2, h * 0.52);
        const target = m.getImageData(0, 0, w, h).data;

        const img = ctx.createImageData(w, h);
        const px = img.data;
        const BG = [20, 20, 22], FG = [242, 240, 237];
        const TINTS = [[255, 74, 178], [155, 107, 255], [242, 240, 237]];
        const STEPS = 30, STEP_MS = 50;
        let step = 0;

        function draw() {
            if (finished) return;
            const a = Math.pow(step / STEPS, 1.6);
            for (let i = 0; i < px.length; i += 4) {
                const t = target[i + 3] / 255;
                const n = Math.random();
                const r = Math.random();
                const tint = r < 0.25 ? TINTS[0] : r < 0.45 ? TINTS[1] : TINTS[2];
                for (let c = 0; c < 3; c++) {
                    const clean = BG[c] + (FG[c] - BG[c]) * t;
                    const noise = BG[c] + (tint[c] - BG[c]) * n * 0.9;
                    px[i + c] = clean * a + noise * (1 - a);
                }
                px[i + 3] = 255;
            }
            ctx.putImageData(img, 0, 0);
            stepLabel.textContent = `step ${String(step).padStart(2, '0')} / ${STEPS}`;
            if (step < STEPS) {
                step++;
                setTimeout(() => requestAnimationFrame(draw), STEP_MS);
            } else {
                screen.classList.add('is-resolved');
                setTimeout(finish, 650);
            }
        }
        draw();
    });
}

if (root.classList.contains('intro') && document.getElementById('intro')) {
    runIntro(startPage);
} else {
    root.classList.remove('intro');
    startPage();
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
    if (isFullscreen) heroFrame.style.transform = '';
}

function toggleFullscreen() {
    if (getFullscreenElement()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
        const request = heroFrame.requestFullscreen || heroFrame.webkitRequestFullscreen;
        if (request) Promise.resolve(request.call(heroFrame)).catch(() => {});
    }
}

if (heroFullscreenButton && heroFrame) {
    heroFullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
}

// "Watch the reel": the click is the one moment browsers allow sound, so open it properly
const watchReelButton = document.getElementById('watch-reel');
if (watchReelButton && heroFrame) {
    watchReelButton.addEventListener('click', () => {
        if (heroPlayer && heroPlayer.seekTo) {
            heroPlayer.seekTo(0, true);
            heroPlayer.playVideo();
        }
        setHeroMuted(false);
        if (!getFullscreenElement()) toggleFullscreen();
        if (!heroFrame.requestFullscreen && !heroFrame.webkitRequestFullscreen) {
            heroFrame.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
        }
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

// ---------- Scroll: the frame settles back as the page takes over ----------

let scrollPending = false;
function updateScroll() {
    scrollPending = false;
    if (!heroFrame || getFullscreenElement()) return;
    const progress = Math.min(window.scrollY / window.innerHeight, 1);
    heroFrame.style.transform = progress > 0 ? `scale(${1 - progress * 0.05})` : '';
    heroFrame.style.opacity = String(1 - progress * 0.45);
}

window.addEventListener('scroll', () => {
    if (reducedMotion.matches || scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(updateScroll);
}, { passive: true });

// ---------- Ambient light: eases toward the pointer, desktop only ----------

if (ambient && finePointer.matches && !reducedMotion.matches) {
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
