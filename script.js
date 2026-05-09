function getAnimate() {
    const animateFn = window.Motion?.animate || window.motion?.animate || window.MotionOne?.animate;
    if (!animateFn) {
        console.error('Motion One failed to load. Make sure the UMD script is included before script.js.');
    }
    return animateFn;
}

const introScreen = document.getElementById('intro-screen');
const introText = document.getElementById('intro-text');
if (introText) {
    introText.classList.add('visible');
}
const customCursor = document.getElementById('custom-cursor');
const glow = document.getElementById('cursor-glow');
const nav = document.getElementById('main-nav');
const navScroll = document.getElementById('nav-scroll');
const heroFrame = document.querySelector('.hero-frame');
const heroAudioButton = document.getElementById('hero-audio-toggle');
const body = document.body;

let heroPlayer;
let isHeroMuted = true;

function animateIn(el, delay = 0) {
    const animateFn = getAnimate();
    if (!animateFn) return;
    animateFn(el, {
        opacity: [0, 1],
        transform: ['translateY(32px) scale(0.96)', 'translateY(0px) scale(1)'],
        filter: ['blur(18px)', 'blur(0px)']
    }, {
        duration: 0.85,
        easing: 'ease-out',
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

const audioBtn = document.getElementById('hero-audio-toggle');
audioBtn.addEventListener('click', () => {
    if (!heroPlayer) return;
    isHeroMuted = !isHeroMuted;
    isHeroMuted ? heroPlayer.mute() : heroPlayer.unMute();
    document.getElementById('visualizer-icon').classList.toggle('is-playing', !isHeroMuted);
    document.getElementById('audio-status-text').innerText = isHeroMuted ? 'Sound Off' : 'Sound On';
});

document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    glow.style.left = `${x}px`;
    glow.style.top = `${y}px`;
    customCursor.style.left = `${x}px`;
    customCursor.style.top = `${y}px`;
    customCursor.classList.toggle('active', !body.classList.contains('can-scroll'));

    if (heroFrame) {
        const factorX = (x / window.innerWidth - 0.5) * 14;
        const factorY = (y / window.innerHeight - 0.5) * 10;
        heroFrame.style.transform = `translate(${factorX}px, ${factorY}px) scale(1.01)`;
    }
});

introScreen.addEventListener('click', () => {
    const animateFn = getAnimate();
    if (animateFn) {
        animateFn(introScreen, { opacity: [1, 0], transform: ['scale(1)', 'scale(0.98)'] }, { duration: 0.9, easing: 'ease-in' });
    }
    nav.classList.add('visible');
    body.classList.add('can-scroll');
    if (heroPlayer) heroPlayer.playVideo();
    setTimeout(() => { introScreen.style.display = 'none'; }, 900);
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

document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('mouseenter', () => animatePulse(item));
});

if (heroAudioButton) {
    animateLoop(heroAudioButton, {
        transform: ['translateY(0px)', 'translateY(-4px)']
    });
    heroAudioButton.addEventListener('mouseenter', () => animatePulse(heroAudioButton));
}

if (introText) {
    const animateFn = getAnimate();
    if (animateFn) {
        animateFn(introText, { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0px)'] }, { duration: 1, easing: 'ease-out' });
    }
}

function centerNavItem(activeItem) {
    const scrollPos = activeItem.offsetLeft - (navScroll.offsetWidth / 2) + (activeItem.offsetWidth / 2);
    navScroll.scrollTo({ left: scrollPos, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    let current = "home";
    document.querySelectorAll('section').forEach((section) => {
        if (section.getBoundingClientRect().top <= 300) current = section.getAttribute("id");
    });
    document.querySelectorAll('.nav-item').forEach((li) => {
        const isActive = li.getAttribute("href") === `#${current}`;
        li.classList.toggle("text-brand", isActive);
        li.classList.toggle("bg-white/10", isActive);
        if (isActive) centerNavItem(li);
    });
});

const dotGrid = document.querySelector('.dot-grid-overlay');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    dotGrid.style.transform = `translateY(${scrollY * 0.3}px)`;
});
