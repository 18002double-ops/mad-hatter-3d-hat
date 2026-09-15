// Three.js Scene Setup
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setClearColor(0x000000, 0);
camera.position.z = 5;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Music and Audio Context
let audioContext;
let analyser;
let dataArray;
let audioSource;
let isPlaying = false;
let audio = new Audio();
audio.crossOrigin = "anonymous";

// Hat object group
const hatGroup = new THREE.Group();
scene.add(hatGroup);

// Create 3D Mad Hatter Hat
function createHat() {
    hatGroup.clear();

    // Main cone (hat body)
    const coneGeometry = new THREE.ConeGeometry(1.5, 2.5, 32);
    const coneMaterial = new THREE.MeshStandardMaterial({
        color: 0xff1493,
        metalness: 0.4,
        roughness: 0.6,
        emissive: 0x330066
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 0.5;
    cone.scale.z = 0.8;
    hatGroup.add(cone);

    // Brim
    const brimGeometry = new THREE.CylinderGeometry(2, 2.2, 0.3, 32);
    const brimMaterial = new THREE.MeshStandardMaterial({
        color: 0xff69b4,
        metalness: 0.3,
        roughness: 0.7,
        emissive: 0x440088
    });
    const brim = new THREE.Mesh(brimGeometry, brimMaterial);
    brim.position.y = -0.8;
    hatGroup.add(brim);

    // Decoration band
    const bandGeometry = new THREE.TorusGeometry(1.5, 0.15, 16, 32);
    const bandMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xffaa00
    });
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.position.y = 0;
    band.rotation.x = Math.PI / 2;
    hatGroup.add(band);

    // Feathers/Decorations
    for (let i = 0; i < 3; i++) {
        const featherGeometry = new THREE.ConeGeometry(0.2, 1, 8);
        const featherMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            metalness: 0.2,
            roughness: 0.8,
            emissive: new THREE.Color().setHSL(Math.random(), 0.9, 0.5)
        });
        const feather = new THREE.Mesh(featherGeometry, featherMaterial);
        
        const angle = (i / 3) * Math.PI * 2;
        feather.position.x = Math.cos(angle) * 1.2;
        feather.position.z = Math.sin(angle) * 1.2;
        feather.position.y = 1.5;
        feather.rotation.z = angle;
        feather.scale.set(1, 1.5, 1);
        
        hatGroup.add(feather);
    }

    // Top pom-pom
    const pomGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const pomMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0xff0088
    });
    const pom = new THREE.Mesh(pomGeometry, pomMaterial);
    pom.position.y = 2.2;
    hatGroup.add(pom);
}

createHat();

// Animation variables
let rotation = { x: 0, y: 0, z: 0 };
let scale = 1;
let beatIntensity = 0;
let targetScale = 1;
let isRotating = true;
let isScaling = false;
let colorMode = false;

// Initialize Audio
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        audioSource = audioContext.createMediaElementAudioSource(audio);
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
    }
}

// File Upload
document.getElementById('musicFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        audio.src = url;
        audio.load();
    }
});

// Play Button
document.getElementById('playBtn').addEventListener('click', () => {
    if (!isPlaying) {
        initAudio();
        audio.play();
        isPlaying = true;
        document.getElementById('playBtn').style.background = 'rgba(255, 100, 150, 0.7)';
    } else {
        audio.pause();
        isPlaying = false;
        document.getElementById('playBtn').style.background = 'rgba(255, 255, 255, 0.3)';
    }
});

// Control Buttons
document.getElementById('rotateBtn').addEventListener('click', function() {
    isRotating = !isRotating;
    this.classList.toggle('active');
});

document.getElementById('scaleBtn').addEventListener('click', function() {
    isScaling = !isScaling;
    this.classList.toggle('active');
});

document.getElementById('colorBtn').addEventListener('click', function() {
    colorMode = !colorMode;
    this.classList.toggle('active');
});

document.getElementById('resetBtn').addEventListener('click', () => {
    hatGroup.rotation.set(0, 0, 0);
    hatGroup.scale.set(1, 1, 1);
    rotation = { x: 0, y: 0, z: 0 };
    scale = 1;
    targetScale = 1;
    isRotating = true;
    isScaling = false;
    colorMode = false;
    document.getElementById('rotateBtn').classList.add('active');
    document.getElementById('scaleBtn').classList.remove('active');
    document.getElementById('colorBtn').classList.remove('active');
    createHat();
});

// Get Beat from Audio
function updateBeat() {
    if (isPlaying && analyser) {
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average frequency
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        beatIntensity = (sum / dataArray.length) / 255;
        
        // Update beat indicators
        const beatDots = document.querySelectorAll('.beat-dot');
        beatDots.forEach((dot, index) => {
            if (beatIntensity > 0.3 + (index * 0.1)) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    updateBeat();
    
    // Rotation
    if (isRotating) {
        rotation.x += 0.005 + beatIntensity * 0.01;
        rotation.y += 0.01 + beatIntensity * 0.02;
        rotation.z += beatIntensity * 0.005;
    }
    
    // Scaling (beat effect)
    if (isScaling) {
        targetScale = 1 + beatIntensity * 0.3;
    } else {
        targetScale = 1;
    }
    scale += (targetScale - scale) * 0.1;
    
    // Apply transformations
    hatGroup.rotation.x = rotation.x;
    hatGroup.rotation.y = rotation.y;
    hatGroup.rotation.z = rotation.z;
    hatGroup.scale.set(scale, scale, scale);
    
    // Color mode - change colors based on beat
    if (colorMode && beatIntensity > 0.3) {
        hatGroup.children.forEach(child => {
            if (child.material) {
                const hue = (Date.now() / 10000 + beatIntensity) % 1;
                child.material.color.setHSL(hue, 0.8, 0.5);
                child.material.emissive.setHSL(hue, 0.9, 0.3);
            }
        });
    }
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});