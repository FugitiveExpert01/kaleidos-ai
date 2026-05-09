const introScreen = document.getElementById('intro-screen');
const customCursor = document.getElementById('custom-cursor');
const glow = document.getElementById('cursor-glow');
const nav = document.getElementById('main-nav');
const navScroll = document.getElementById('nav-scroll');
const body = document.body;

let heroPlayer;
let isHeroMuted = true;

function onYouTubeIframeAPIReady() {
    heroPlayer = new YT.Player('hero-video-player', {
        videoId: 'yM-_Xojn5Hs',
        playerVars: { 'autoplay': 1, 'mute': 1, 'loop': 1, 'playlist': 'yM-_Xojn5Hs', 'controls': 0, 'modestbranding': 1, 'showinfo': 0, 'rel': 0, 'vq': 'hd1080' },
        events: { 'onReady': (e) => e.target.playVideo() }
    });
}

const audioBtn = document.getElementById('hero-audio-toggle');
audioBtn.addEventListener('click', () => {
    if (!heroPlayer) return;
    isHeroMuted = !isHeroMuted;
    isHeroMuted ? heroPlayer.mute() : heroPlayer.unMute();
    document.getElementById('visualizer-icon').classList.toggle('is-playing', !isHeroMuted);
    document.getElementById('audio-status-text').innerText = isHeroMuted ? 'Sound Off' : 'Sound On';
});

document.addEventListener('mousemove', (e) => {
    glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`;
    customCursor.style.left = `${e.clientX}px`; customCursor.style.top = `${e.clientY}px`;
    customCursor.classList.toggle('active', !body.classList.contains('can-scroll'));
});

introScreen.addEventListener('click', () => {
    introScreen.style.opacity = '0';
    nav.classList.add('visible');
    body.classList.add('can-scroll');
    if (heroPlayer) heroPlayer.playVideo();
    setTimeout(() => { introScreen.style.display = 'none'; }, 1200);
});

const fluxObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        } else {
            entry.target.classList.remove('in-view');
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.flux').forEach(el => fluxObserver.observe(el));

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

setTimeout(() => document.getElementById('intro-text').classList.add('visible'), 500);
