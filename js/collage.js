// Work collage: every graphic here is generated live, and each one sleeps while it is off screen.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const collage = document.getElementById('collage');

function whenVisible(el, onChange, rootMargin = '0px') {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => onChange(e.isIntersecting)), { rootMargin });
    io.observe(el);
    return io;
}

// ---------- Latent field (Three.js) ----------

function sampleTargets(count) {
    const blob = new Float32Array(count * 3);
    const knot = new Float32Array(count * 3);
    const wave = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const centres = [[-0.9, 0.3, 0.2], [0.8, -0.2, -0.3], [0.1, 0.7, -0.6], [0.2, -0.75, 0.5]];
    const gauss = () => {
        let u = 0, v = 0;
        while (!u) u = Math.random();
        while (!v) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    for (let i = 0; i < count; i++) {
        seeds[i] = Math.random();
        // Clusters in latent space
        const c = centres[i % centres.length];
        blob[i * 3] = c[0] + gauss() * 0.32;
        blob[i * 3 + 1] = c[1] + gauss() * 0.32;
        blob[i * 3 + 2] = c[2] + gauss() * 0.32;
        // Torus knot surface
        const t = (i / count) * Math.PI * 2 * 3;
        const p = 2, q = 3, r = 0.55 + 0.25 * Math.cos(q * t);
        const tube = 0.16 * Math.sqrt(Math.random());
        const a = Math.random() * Math.PI * 2;
        knot[i * 3] = r * Math.cos(p * t) * 1.5 + tube * Math.cos(a);
        knot[i * 3 + 1] = r * Math.sin(p * t) * 1.5 + tube * Math.sin(a);
        knot[i * 3 + 2] = -0.35 * Math.sin(q * t) * 1.5 + tube * Math.cos(a * 1.7);
        // Flowing plane
        const gx = (Math.random() - 0.5) * 3.6;
        const gz = (Math.random() - 0.5) * 2.4;
        wave[i * 3] = gx;
        wave[i * 3 + 1] = Math.sin(gx * 2.1) * 0.22 + Math.cos(gz * 2.7) * 0.18 - 0.1;
        wave[i * 3 + 2] = gz;
    }
    return { shapes: [blob, knot, wave], seeds };
}

async function startLatentField(tile, canvas) {
    let THREE;
    try {
        THREE = await import(THREE_URL);
    } catch (e) {
        return; // the tile keeps its gradient background
    }
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
        return;
    }
    const isSmall = window.innerWidth < 720;
    const COUNT = isSmall ? 12000 : 24000;
    const meta = document.getElementById('latent-meta');
    if (meta) meta.textContent = `${COUNT.toLocaleString('en-GB')} points · WebGL`;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, 4.4);

    const { shapes, seeds } = sampleTargets(COUNT);
    const geometry = new THREE.BufferGeometry();
    const from = new THREE.BufferAttribute(shapes[0].slice(), 3);
    const to = new THREE.BufferAttribute(shapes[1].slice(), 3);
    geometry.setAttribute('position', from);
    geometry.setAttribute('aTo', to);
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uMix: { value: 0 },
            uTime: { value: 0 },
            uSize: { value: 26 * renderer.getPixelRatio() },
        },
        vertexShader: /* glsl */ `
            attribute vec3 aTo;
            attribute float aSeed;
            uniform float uMix;
            uniform float uTime;
            uniform float uSize;
            varying vec3 vColor;
            varying float vFade;
            void main() {
                float m = smoothstep(0.0, 1.0, clamp(uMix * 1.25 - aSeed * 0.25, 0.0, 1.0));
                vec3 p = mix(position, aTo, m);
                p += 0.035 * vec3(
                    sin(uTime * 0.7 + aSeed * 6.283 + p.y * 3.0),
                    cos(uTime * 0.6 + aSeed * 4.0 + p.z * 3.0),
                    sin(uTime * 0.5 + aSeed * 5.0 + p.x * 3.0));
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = uSize * (0.35 + aSeed * 0.9) / -mv.z;
                vec3 pink = vec3(1.0, 0.29, 0.70);
                vec3 violet = vec3(0.61, 0.42, 1.0);
                vec3 cyan = vec3(0.31, 0.83, 0.90);
                vColor = mix(mix(violet, pink, smoothstep(-0.8, 0.9, p.y + aSeed * 0.4)), cyan, step(0.93, aSeed) * 0.8);
                vFade = smoothstep(7.0, 3.0, -mv.z);
            }`,
        fragmentShader: /* glsl */ `
            varying vec3 vColor;
            varying float vFade;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float a = smoothstep(0.5, 0.0, d);
                gl_FragColor = vec4(vColor * a, a * 0.55 * vFade);
            }`,
    });
    const points = new THREE.Points(geometry, material);
    points.rotation.x = 0.25;
    points.frustumCulled = false;
    scene.add(points);

    function resize() {
        const { width, height } = tile.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
    }
    resize();
    new ResizeObserver(resize).observe(tile);

    let shapeIndex = 1;
    let pointerX = 0, pointerY = 0;
    tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect();
        pointerX = (e.clientX - r.left) / r.width - 0.5;
        pointerY = (e.clientY - r.top) / r.height - 0.5;
    });
    tile.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });

    const HOLD = 3.2, MORPH = 2.6;
    let running = false, last = 0, clock = 0, phase = 0;

    function morphNext() {
        from.array.set(to.array);
        shapeIndex = (shapeIndex + 1) % shapes.length;
        to.array.set(shapes[shapeIndex]);
        from.needsUpdate = true;
        to.needsUpdate = true;
        material.uniforms.uMix.value = 0;
        phase = 0;
    }

    function frame(now) {
        if (!running) return;
        const dt = Math.min((now - (last || now)) / 1000, 0.05);
        last = now;
        clock += dt;
        phase += dt;
        material.uniforms.uTime.value = clock;
        material.uniforms.uMix.value = Math.min(phase / MORPH, 1);
        if (phase > MORPH + HOLD) morphNext();
        points.rotation.y += dt * 0.12;
        camera.position.x += (pointerX * 0.9 - camera.position.x) * 0.04;
        camera.position.y += (-pointerY * 0.6 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }

    if (reducedMotion) {
        material.uniforms.uMix.value = 1;
        renderer.render(scene, camera);
        return;
    }
    whenVisible(tile, (visible) => {
        if (visible && !running && !document.hidden) {
            running = true;
            last = 0;
            requestAnimationFrame(frame);
        } else if (!visible) {
            running = false;
        }
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) running = false;
    });
}

// ---------- Denoising loop (2D canvas) ----------

function startDenoise(canvas, label) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;

    function paintScene(seed) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        const sky = g.createLinearGradient(0, 0, 0, h * 0.62);
        sky.addColorStop(0, '#1d1530');
        sky.addColorStop(0.55, '#6b2f78');
        sky.addColorStop(1, '#ff7aa8');
        g.fillStyle = sky;
        g.fillRect(0, 0, w, h);
        const sx = w * (0.3 + 0.4 * seed), sy = h * 0.5;
        const sun = g.createRadialGradient(sx, sy, 2, sx, sy, h * 0.42);
        sun.addColorStop(0, 'rgba(255, 228, 200, 1)');
        sun.addColorStop(0.18, 'rgba(255, 170, 160, 0.85)');
        sun.addColorStop(1, 'rgba(255, 120, 170, 0)');
        g.fillStyle = sun;
        g.fillRect(0, 0, w, h);
        const ridges = [['#3a1f4f', 0.46, 18], ['#26173a', 0.54, 13], ['#151020', 0.62, 9]];
        ridges.forEach(([color, base, amp], k) => {
            g.fillStyle = color;
            g.beginPath();
            g.moveTo(0, h);
            for (let x = 0; x <= w; x += 4) {
                const y = h * base - amp * (Math.sin(x * 0.035 + seed * 9 + k) + 0.6 * Math.sin(x * 0.083 + k * 2.1 + seed * 4));
                g.lineTo(x, y);
            }
            g.lineTo(w, h);
            g.fill();
        });
        const water = g.createLinearGradient(0, h * 0.62, 0, h);
        water.addColorStop(0, 'rgba(255, 140, 180, 0.35)');
        water.addColorStop(1, 'rgba(20, 16, 30, 0.95)');
        g.fillStyle = water;
        g.fillRect(0, h * 0.62, w, h * 0.38);
        return g.getImageData(0, 0, w, h).data;
    }

    const STEPS = 30;
    let target = paintScene(Math.random());
    const img = ctx.createImageData(w, h);
    const px = img.data;
    let step = 0, running = false, timer = 0;

    function render() {
        const a = Math.pow(step / STEPS, 1.5);
        for (let i = 0; i < px.length; i += 4) {
            const n = Math.random() * 255;
            px[i] = target[i] * a + n * (1 - a) * 0.9;
            px[i + 1] = target[i + 1] * a + n * (1 - a) * 0.55;
            px[i + 2] = target[i + 2] * a + n * (1 - a);
            px[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        if (label) label.textContent = `step ${String(step).padStart(2, '0')} / ${STEPS}`;
    }

    function tick() {
        if (!running) return;
        render();
        if (step < STEPS) {
            step++;
            timer = setTimeout(tick, 90);
        } else {
            timer = setTimeout(() => {
                step = 0;
                target = paintScene(Math.random());
                tick();
            }, 1800);
        }
    }

    if (reducedMotion) {
        step = STEPS;
        render();
        return;
    }
    step = 0;
    render();
    whenVisible(canvas, (visible) => {
        if (visible && !running) {
            running = true;
            tick();
        } else if (!visible) {
            running = false;
            clearTimeout(timer);
        }
    });
}

// ---------- Demo video: plays only while on screen ----------

function startDemoVideo(video) {
    if (reducedMotion) return;
    whenVisible(video, (visible) => {
        if (visible) {
            const p = video.play();
            if (p && p.catch) p.catch(() => {});
        } else {
            video.pause();
        }
    }, '100px');
}

// ---------- Depth: tiles drift at different speeds as the board scrolls past ----------

function startDepth(root) {
    if (reducedMotion) return;
    const wide = window.matchMedia('(min-width: 1024px)');
    const tiles = [...root.querySelectorAll('[data-depth]')];
    let active = false, pending = false;

    function update() {
        pending = false;
        if (!wide.matches) {
            tiles.forEach((t) => t.style.removeProperty('--py'));
            return;
        }
        const r = root.getBoundingClientRect();
        const progress = (window.innerHeight / 2 - (r.top + r.height / 2)) / window.innerHeight;
        tiles.forEach((t) => {
            const depth = parseFloat(t.dataset.depth) || 0;
            t.style.setProperty('--py', `${(-progress * depth * 320).toFixed(1)}px`);
        });
    }
    whenVisible(root, (visible) => { active = visible; if (visible) update(); }, '200px');
    window.addEventListener('scroll', () => {
        if (!active || pending) return;
        pending = true;
        requestAnimationFrame(update);
    }, { passive: true });
    wide.addEventListener('change', update);
}

if (collage) {
    const latentTile = collage.querySelector('.tile--latent');
    const latentCanvas = document.getElementById('latent-canvas');
    if (latentTile && latentCanvas) {
        const io = whenVisible(latentTile, (visible) => {
            if (!visible) return;
            io.disconnect();
            startLatentField(latentTile, latentCanvas);
        }, '400px');
    }
    const denoise = document.getElementById('denoise-canvas');
    if (denoise) startDenoise(denoise, document.getElementById('denoise-step'));
    const video = document.getElementById('demo-video');
    if (video) startDemoVideo(video);
    startDepth(collage);
}
