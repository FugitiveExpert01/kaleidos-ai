function getAnimate() {
    const animateFn = window.Motion?.animate || window.motion?.animate || window.MotionOne?.animate;
    if (!animateFn) {
        console.error('Motion One failed to load. Make sure the UMD script is included before script.js.');
    }
    return animateFn;
}

const customCursor = document.getElementById('custom-cursor');
const cursorLabel = customCursor.querySelector('.cursor-label');
const glow = document.getElementById('cursor-glow');
const nav = document.getElementById('main-nav');
const navScroll = document.getElementById('nav-scroll');
const heroFrame = document.querySelector('.hero-frame');
const heroAudioButton = document.getElementById('hero-audio-toggle');
const body = document.body;

// BOLT OPTIMIZATION: Cache DOM elements once at startup
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-item');
const dotGrid = document.querySelector('.dot-grid-overlay');
const bgMesh = document.querySelector('.bg-mesh');

let heroPlayer;
let isHeroMuted = true;

function animateIn(el, delay = 0) {
    const animateFn = getAnimate();
    if (!animateFn) return;
    animateFn(el, {
        opacity: [0, 1],
        transform: ['translateY(60px) scale(0.95) skewY(2deg)', 'translateY(0px) scale(1) skewY(0deg)'],
        filter: ['blur(30px)', 'blur(0px)']
    }, {
        duration: 1.2,
        easing: [0.16, 1, 0.3, 1],
        delay
    });
}

function animatePulse(el) {
    const animateFn = getAnimate();
    if (!animateFn) return;
    animateFn(el, {
        scale: [1, 1.04, 1]
    }, {
        duration: 0.45,
        easing: 'ease-out'
    });
}

function animateLoop(el, props) {
    const animateFn = getAnimate();
    if (!animateFn) return;
    animateFn(el, props, {
        duration: 4,
        easing: 'ease-in-out',
        repeat: Infinity,
        direction: 'alternate'
    });
}

window.onYouTubeIframeAPIReady = function() {
    heroPlayer = new YT.Player('hero-video-player', {
        videoId: 'yM-_Xojn5Hs',
        playerVars: { 'autoplay': 1, 'mute': 1, 'loop': 1, 'playlist': 'yM-_Xojn5Hs', 'controls': 0, 'modestbranding': 1, 'showinfo': 0, 'rel': 0, 'vq': 'hd1080' },
        events: { 'onReady': (e) => e.target.playVideo() }
    });
};

function toggleAudio() {
    if (!heroPlayer) return;
    isHeroMuted = !isHeroMuted;
    isHeroMuted ? heroPlayer.mute() : heroPlayer.unMute();
    document.getElementById('visualizer-icon').classList.toggle('is-playing', !isHeroMuted);
    document.getElementById('audio-status-text').innerText = isHeroMuted ? 'Sound Off' : 'Sound On';
}

const audioBtn = document.getElementById('hero-audio-toggle');
audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudio();
});

const homeSection = document.getElementById('home');
if (homeSection) {
    homeSection.addEventListener('click', () => toggleAudio());
}

// BOLT OPTIMIZATION: Use requestAnimationFrame to throttle mousemove events
let mouseX = 0, mouseY = 0, mouseUpdatePending = false;
function updateMouseEffects() {
    glow.style.left = `${mouseX}px`;
    glow.style.top = `${mouseY}px`;

    // Background mesh shift
    if (bgMesh) {
        bgMesh.style.setProperty('--mouse-x', `${(mouseX / window.innerWidth) * 100}%`);
        bgMesh.style.setProperty('--mouse-y', `${(mouseY / window.innerHeight) * 100}%`);
        bgMesh.style.transform = `translate(${(mouseX / window.innerWidth - 0.5) * 20}px, ${(mouseY / window.innerHeight - 0.5) * 20}px)`;
    }

    customCursor.style.left = `${mouseX}px`;
    customCursor.style.top = `${mouseY}px`;
    customCursor.classList.add('active');

    if (heroFrame) {
        const factorX = (mouseX / window.innerWidth - 0.5) * 20;
        const factorY = (mouseY / window.innerHeight - 0.5) * 15;
        heroFrame.style.transform = `translate(${factorX}px, ${factorY}px) scale(1.02)`;
    }
    mouseUpdatePending = false;
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Interactive Cursor Updates
    const target = e.target;
    if (target.closest('a') || target.closest('button')) {
        customCursor.classList.add('hovering');
        const label = target.closest('a')?.innerText || target.closest('button')?.innerText || "VIEW";
        if (cursorLabel) cursorLabel.innerText = label.split('\n')[0].trim();
    } else if (target.closest('#home')) {
        customCursor.classList.add('hovering');
        if (cursorLabel) cursorLabel.innerText = isHeroMuted ? "UNMUTE" : "MUTE";
    } else {
        customCursor.classList.remove('hovering');
        if (cursorLabel) cursorLabel.innerText = "";
    }

    if (!mouseUpdatePending) {
        mouseUpdatePending = true;
        requestAnimationFrame(updateMouseEffects);
    }
});


const fluxObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            animateIn(entry.target, index * 0.1);
            entry.target.classList.add('in-view');
        } else {
            entry.target.classList.remove('in-view');
        }
    });
}, { threshold: 0.18 });
document.querySelectorAll('.flux').forEach(el => fluxObserver.observe(el));

// BOLT OPTIMIZATION: Use cached navItems
navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => animatePulse(item));
});

if (heroAudioButton) {
    animateLoop(heroAudioButton, {
        transform: ['translateY(0px)', 'translateY(-4px)']
    });
    heroAudioButton.addEventListener('mouseenter', () => animatePulse(heroAudioButton));
}


function centerNavItem(activeItem) {
    const scrollPos = activeItem.offsetLeft - (navScroll.offsetWidth / 2) + (activeItem.offsetWidth / 2);
    navScroll.scrollTo({ left: scrollPos, behavior: 'smooth' });
}

// BOLT OPTIMIZATION: Use IntersectionObserver for navigation highlighting to avoid layout thrashing.
// This replaces the expensive getBoundingClientRect() calls in the scroll listener.
let currentActiveId = "home";
let currentScrollY = 0, scrollUpdatePending = false;

const navObserverOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
};

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id && id !== currentActiveId) {
                currentActiveId = id;
                navItems.forEach((li) => {
                    const isActive = li.getAttribute("href") === `#${id}`;
                    li.classList.toggle("text-brand", isActive);
                    li.classList.toggle("bg-white/10", isActive);
                    if (isActive) centerNavItem(li);
                });
            }
        }
    });
}, navObserverOptions);

sections.forEach(section => navObserver.observe(section));

function updateScrollEffects() {
    const scrollProgress = currentScrollY / (document.documentElement.scrollHeight - window.innerHeight);

    // Parallax for dot grid
    if (dotGrid) {
        dotGrid.style.transform = `translateY(${currentScrollY * 0.3}px)`;
        dotGrid.style.opacity = 0.28 + (scrollProgress * 0.1);
    }

    // Scroll scrubbing for mesh background colors
    if (bgMesh) {
        bgMesh.style.filter = `hue-rotate(${scrollProgress * 50}deg)`;
    }

    // Hero scaling on scroll
    if (heroFrame && currentScrollY < window.innerHeight) {
        const scale = 1 + (currentScrollY * 0.0002);
        const blur = currentScrollY * 0.01;
        heroFrame.style.filter = `blur(${blur}px)`;
        heroFrame.style.opacity = 1 - (currentScrollY / window.innerHeight);
    }

    scrollUpdatePending = false;
}

window.addEventListener('scroll', () => {
    currentScrollY = window.scrollY;
    if (!scrollUpdatePending) {
        scrollUpdatePending = true;
        requestAnimationFrame(updateScrollEffects);
    }
}, { passive: true });

window.addEventListener('load', () => {
    const animateFn = getAnimate();
    if (animateFn) {
        animateFn(nav, { opacity: [0, 1], transform: ['translateY(-20px)', 'translateY(0)'] }, { duration: 0.8, easing: [0.16, 1, 0.3, 1] });
        const home = document.querySelector('#home');
        if (home) home.classList.add('in-view');
    } else {
        nav.style.opacity = '1';
    }
});
