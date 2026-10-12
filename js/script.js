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

// ---------- Entrance: the frame opens like a film gate ----------

requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

// ---------- Reveals: run once, never hide content again ----------

const revealTargets = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => revealObserver.observe(el));
} else {
    revealTargets.forEach((el) => el.classList.add('is-revealed'));
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

if (heroAudioButton) {
    heroAudioButton.addEventListener('click', () => {
        if (!heroPlayer) return;
        isHeroMuted = !isHeroMuted;
        isHeroMuted ? heroPlayer.mute() : heroPlayer.unMute();
        heroAudioButton.classList.toggle('is-playing', !isHeroMuted);
        heroAudioButton.setAttribute('aria-pressed', String(!isHeroMuted));
        heroAudioButton.setAttribute('aria-label', isHeroMuted ? 'Turn showreel sound on' : 'Turn showreel sound off');
        document.getElementById('audio-status-text').textContent = isHeroMuted ? 'Sound off' : 'Sound on';
    });
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

if (heroFullscreenButton && heroFrame) {
    heroFullscreenButton.addEventListener('click', () => {
        if (getFullscreenElement()) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
            (heroFrame.requestFullscreen || heroFrame.webkitRequestFullscreen).call(heroFrame);
        }
    });
    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
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
