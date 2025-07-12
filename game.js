let scene, camera, renderer, car, wheels = [], ground, roadDeformations = [];
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let speed = 0;
let score = 0;
let gameOver = false;
let cameraAngle = 0; // Track camera rotation angle
let mouseX = 0, mouseY = 0;
let isMouseLookEnabled = false;
let gravity = -0.02;
let velocityY = 0;
let groundLevel = 0;
let obstacles = []; // Array to store all obstacles for collision detection
let grassPatches = []; // Array to store all grass patches for folding effect

// Drift variables
let isDrifting = false;
let driftKey = false;
let driftAngle = 0; // Current drift angle
let driftVelocity = new THREE.Vector3(0, 0, 0); // Drift velocity vector
let carVelocity = new THREE.Vector3(0, 0, 0); // Car's actual velocity
let driftScore = 0;
let driftTime = 0;
let driftTrail = []; // Array to store drift trail points
let driftTrailMesh = null;
let wheelRotation = 0; // Track wheel rotation for visual effects
let lastCarPosition = new THREE.Vector3(0, 0, 0);
let carBodyWiggle = 0; // Car body wiggle from hexagonal wheels
let wiggleDirection = 1; // Direction of wiggle
let wiggleIntensity = 0.002; // How much the car wiggles
let cameraShake = 0; // Camera shake intensity
let cameraShakeOffset = new THREE.Vector3(0, 0, 0); // Camera shake offset
let isLowEndDevice = false; // Flag for low-end device detection
let gameStarted = false; // Flag to track if game has started
let birds = []; // Array to store bird objects
let birdAnimationTime = 0; // Time for bird animation
let trees = []; // Array to store tree objects for animation
let treeAnimationTime = 0; // Time for tree animation
let windParticles = []; // Array to store wind particle objects
let windAnimationTime = 0; // Time for wind animation

function init() {
    // Detect low-end device
    detectLowEndDevice();
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Player (Car) - Simple and friendly car
    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshPhongMaterial({
        color: 0x3498db, // Nice blue color
        shininess: 80,
        specular: 0x5dade2
    });
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.castShadow = true;
    car.receiveShadow = true;
    car.position.set(0, 0.25, 0); // Position car on ground
    scene.add(car);

    // Add headlights (two spheres at front)
    const headlightGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const headlightMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffcc, // Bright yellow-white
        shininess: 200,
        specular: 0xffffff,
        emissive: 0x333300 // Slight glow
    });
    
    // Left headlight
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.3, 0.15, -1.1);
    leftHeadlight.castShadow = true;
    car.add(leftHeadlight);
    
    // Right headlight
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.3, 0.15, -1.1);
    rightHeadlight.castShadow = true;
    car.add(rightHeadlight);

    // Add wheels to the car - with pattern for spinning effect
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12); // 12 sides for smoother look
    const wheelMaterial = new THREE.MeshPhongMaterial({
        color: 0x2e2e2e,
        shininess: 30
    });
    
    // Create wheel pattern material for spinning effect
    const wheelPatternMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a, // Darker for pattern
        shininess: 20
    });
    
    // Create 4 wheels - positioned for simple car
    const wheelPositions = [
        {pos: [-0.5, -0.1, 0.7], name: 'frontLeft'},   // Front left
        {pos: [0.5, -0.1, 0.7], name: 'frontRight'},   // Front right
        {pos: [-0.5, -0.1, -0.7], name: 'rearLeft'},   // Rear left
        {pos: [0.5, -0.1, -0.7], name: 'rearRight'}    // Rear right
    ];
    
    wheelPositions.forEach(wheelData => {
        // Create wheel group
        const wheelGroup = new THREE.Group();
        
        // Main wheel
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2; // Rotate wheel to be vertical
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheelGroup.add(wheel);
        
        // Add pattern elements to show spinning
        for (let i = 0; i < 8; i++) {
            const patternGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.02);
            const pattern = new THREE.Mesh(patternGeometry, wheelPatternMaterial);
            pattern.position.set(0, 0.2, 0);
            pattern.rotation.z = (i * Math.PI) / 4; // Distribute patterns around wheel
            pattern.castShadow = true;
            wheelGroup.add(pattern);
        }
        
        // Add two intersecting lines (X pattern) - thicker and more visible
        const lineGeometry = new THREE.BoxGeometry(0.05, 0.25, 0.05);
        const lineMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff, // Bright white for visibility
            shininess: 50
        });
        
        // First line (horizontal)
        const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
        line1.position.set(0, 0.125, 0);
        line1.castShadow = true;
        wheelGroup.add(line1);
        
        // Second line (vertical)
        const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
        line2.position.set(0, 0.125, 0);
        line2.rotation.z = Math.PI / 2; // Rotate 90 degrees to intersect
        line2.castShadow = true;
        wheelGroup.add(line2);
        
        wheelGroup.position.set(wheelData.pos[0], wheelData.pos[1], wheelData.pos[2]);
        wheelGroup.name = wheelData.name;
        car.add(wheelGroup);
        wheels.push(wheelGroup);
    });

    // Wheat Farm Sky - Golden hour lighting
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffa726, // Golden sunset sky
        side: THREE.BackSide 
    });
    const skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyBox);

    // Fluffy white clouds all over the map boundary
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    // Create clouds around the entire map boundary
    for (let i = 0; i < 20; i++) {
        const cloudGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 6);
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Position clouds around the entire map boundary (above mountains)
        let x, y, z;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(side) {
            case 0: // Top boundary
                x = (Math.random() - 0.5) * 200;
                y = 25 + Math.random() * 15; // Above mountains
                z = -150 - Math.random() * 20;
                break;
            case 1: // Right boundary
                x = 150 + Math.random() * 20;
                y = 25 + Math.random() * 15; // Above mountains
                z = (Math.random() - 0.5) * 200;
                break;
            case 2: // Bottom boundary
                x = (Math.random() - 0.5) * 200;
                y = 25 + Math.random() * 15; // Above mountains
                z = 150 + Math.random() * 20;
                break;
            case 3: // Left boundary
                x = -150 - Math.random() * 20;
                y = 25 + Math.random() * 15; // Above mountains
                z = (Math.random() - 0.5) * 200;
                break;
        }
        
        cloud.position.set(x, y, z);
        cloud.scale.set(1, 0.6, 1);
        scene.add(cloud);
    }

    // Create wheat farm environment
    createWheatFarm();
    
    // Create mountains around map boundary
    createMountains();
    
    // Create birds in the sky
    createBirds();
    
    // Create visible wind particles around map boundary
    createWindParticles();

    // Create wheat field ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8bc34a, // Wheat field green
        shininess: 10
    });
    
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = - Math.PI / 2;
    ground.position.y = groundLevel;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add road features like bumps and obstacles
    createRoadObstacles();

    camera.position.set(0, 2, 5);
    
    // Initialize car position properly
    velocityY = 0;

    // Create drift trail system
    createDriftTrail();

    // Golden hour lighting setup
    const ambientLight = new THREE.AmbientLight(0xffd54f, 0.4); // Warm ambient light
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffb74d, 0.8); // Golden directional light
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Additional warm fill light
    const fillLight = new THREE.DirectionalLight(0xffe0b2, 0.3);
    fillLight.position.set(-10, 10, -5);
    scene.add(fillLight);

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    
    // Mobile control event listeners
    setupMobileControls();
    
    // Start menu event listeners
    setupStartMenu();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 's':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'a':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'd':
            moveRight = true;
            break;
        case ' ': // Spacebar for drift
            driftKey = true;
            break;
        case 'r':
            if (gameOver) restartGame();
            break;
        case 'q': // Look left
            cameraAngle = Math.min(cameraAngle + 0.1, Math.PI); // Limit to 180 degrees
            break;
        case 'e': // Look right
            cameraAngle = Math.max(cameraAngle - 0.1, -Math.PI); // Limit to 180 degrees
            break;
    }
}

function onDocumentMouseMove(event) {
    if (!isMouseLookEnabled) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    // Update camera angle based on mouse movement
    cameraAngle -= movementX * 0.002;
}

function onDocumentClick(event) {
    isMouseLookEnabled = !isMouseLookEnabled;
    if (isMouseLookEnabled) {
        document.body.style.cursor = 'none';
    } else {
        document.body.style.cursor = 'default';
    }
}

document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('click', onDocumentClick, false);

function setupMobileControls() {
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const driftBtn = document.getElementById('driftBtn');

    // Touch start events
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveForward = true;
        upBtn.classList.add('active');
    });
    
    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveBackward = true;
        downBtn.classList.add('active');
    });
    
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveLeft = true;
        leftBtn.classList.add('active');
    });
    
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveRight = true;
        rightBtn.classList.add('active');
    });
    
    driftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        driftKey = true;
        driftBtn.classList.add('active');
    });

    // Touch end events
    upBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        moveForward = false;
        upBtn.classList.remove('active');
    });
    
    downBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        moveBackward = false;
        downBtn.classList.remove('active');
    });
    
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        moveLeft = false;
        leftBtn.classList.remove('active');
    });
    
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        moveRight = false;
        rightBtn.classList.remove('active');
    });
    
    driftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        driftKey = false;
        driftBtn.classList.remove('active');
    });

    // Mouse events for desktop testing
    upBtn.addEventListener('mousedown', () => { moveForward = true; upBtn.classList.add('active'); });
    upBtn.addEventListener('mouseup', () => { moveForward = false; upBtn.classList.remove('active'); });
    
    downBtn.addEventListener('mousedown', () => { moveBackward = true; downBtn.classList.add('active'); });
    downBtn.addEventListener('mouseup', () => { moveBackward = false; downBtn.classList.remove('active'); });
    
    leftBtn.addEventListener('mousedown', () => { moveLeft = true; leftBtn.classList.add('active'); });
    leftBtn.addEventListener('mouseup', () => { moveLeft = false; leftBtn.classList.remove('active'); });
    
    rightBtn.addEventListener('mousedown', () => { moveRight = true; rightBtn.classList.add('active'); });
    rightBtn.addEventListener('mouseup', () => { moveRight = false; rightBtn.classList.remove('active'); });
    
    driftBtn.addEventListener('mousedown', () => { driftKey = true; driftBtn.classList.add('active'); });
    driftBtn.addEventListener('mouseup', () => { driftKey = false; driftBtn.classList.remove('active'); });

    // Drag-based look around for mobile
    let isDragging = false;
    let lastTouchX = 0;
    let lastTouchY = 0;

    // Touch events for drag look around
    document.addEventListener('touchstart', (e) => {
        // Only handle drag if not touching control buttons
        const target = e.target;
        if (!target.closest('.control-btn') && !target.closest('#ui') && !target.closest('#instructions')) {
            isDragging = true;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            e.preventDefault();
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const deltaX = touchX - lastTouchX;
            const deltaY = touchY - lastTouchY;
            
            // Update camera angle based on horizontal drag
            cameraAngle -= deltaX * 0.005;
            cameraAngle = Math.max(-Math.PI, Math.min(Math.PI, cameraAngle));
            
            lastTouchX = touchX;
            lastTouchY = touchY;
            e.preventDefault();
        }
    });

    document.addEventListener('touchend', (e) => {
        isDragging = false;
    });

    // Mouse events for drag look around (desktop testing)
    document.addEventListener('mousedown', (e) => {
        const target = e.target;
        if (!target.closest('.control-btn') && !target.closest('#ui') && !target.closest('#instructions')) {
            isDragging = true;
            lastTouchX = e.clientX;
            lastTouchY = e.clientY;
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            const deltaX = mouseX - lastTouchX;
            const deltaY = mouseY - lastTouchY;
            
            // Update camera angle based on horizontal mouse movement
            cameraAngle -= deltaX * 0.005;
            cameraAngle = Math.max(-Math.PI, Math.min(Math.PI, cameraAngle));
            
            lastTouchX = mouseX;
            lastTouchY = mouseY;
        }
    });

    document.addEventListener('mouseup', (e) => {
        isDragging = false;
    });
}

function onKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 's':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'a':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'd':
            moveRight = false;
            break;
        case ' ': // Spacebar for drift
            driftKey = false;
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    if (gameOver) {
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').innerText = score;
        return;
    }

    // Only update game logic if game has started
    if (gameStarted) {
        updateCar();
        updateTrailFade();
        updateBirds();
        updateTrees();
        updateWindParticles();
        updateCornerNotices();
        updateUI();
    }
}

function createWheatFarm() {
    // Create wheat stalks throughout the field
    const wheatMaterial = new THREE.MeshPhongMaterial({ color: 0xffc107 }); // Golden wheat color
    
    // Adjust wheat count based on device performance
    const wheatCount = isLowEndDevice ? 300 : 1200;
    
    for (let i = 0; i < wheatCount; i++) {
        const wheatHeight = 1 + Math.random() * 0.5;
        const wheatGeometry = new THREE.CylinderGeometry(0.02, 0.05, wheatHeight, 4);
        const wheatStalk = new THREE.Mesh(wheatGeometry, wheatMaterial);
        
        // Random position across the field
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Don't place wheat too close to spawn point
        if (Math.sqrt(x * x + z * z) > 15) {
            wheatStalk.position.set(x, wheatHeight / 2, z);
            wheatStalk.castShadow = true;
            wheatStalk.receiveShadow = true;
            wheatStalk.userData = { type: 'wheat', originalHeight: wheatHeight, isFolded: false };
            scene.add(wheatStalk);
            grassPatches.push(wheatStalk);
        }
    }
    
    // Add some grass at spawn point for natural starting area
    const spawnGrassMaterial = new THREE.MeshPhongMaterial({ color: 0x7cb342 });
    for (let i = 0; i < 20; i++) {
        const spawnGrassHeight = 0.2 + Math.random() * 0.3;
        const spawnGrassGeometry = new THREE.CylinderGeometry(0.01, 0.02, spawnGrassHeight, 3);
        const spawnGrassPatch = new THREE.Mesh(spawnGrassGeometry, spawnGrassMaterial);
        
        // Random position within spawn area (closer to center)
        const x = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        
        spawnGrassPatch.position.set(x, spawnGrassHeight / 2, z);
        spawnGrassPatch.castShadow = true;
        spawnGrassPatch.receiveShadow = true;
        spawnGrassPatch.userData = { type: 'spawnGrass', originalHeight: spawnGrassHeight, isFolded: false };
        scene.add(spawnGrassPatch);
        grassPatches.push(spawnGrassPatch);
    }
    
    // Add additional grass patches
    const grassMaterial = new THREE.MeshPhongMaterial({ color: 0x7cb342 }); // Green grass color
    
    // Adjust grass count based on device performance
    const grassCount = isLowEndDevice ? 150 : 800;
    
    for (let i = 0; i < grassCount; i++) {
        const grassHeight = 0.3 + Math.random() * 0.4;
        const grassGeometry = new THREE.CylinderGeometry(0.01, 0.02, grassHeight, 3);
        const grassPatch = new THREE.Mesh(grassGeometry, grassMaterial);
        
        // Random position across the field
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Don't place grass too close to spawn point
        if (Math.sqrt(x * x + z * z) > 10) {
            grassPatch.position.set(x, grassHeight / 2, z);
            grassPatch.castShadow = true;
            grassPatch.receiveShadow = true;
            grassPatch.userData = { type: 'grass', originalHeight: grassHeight, isFolded: false };
            scene.add(grassPatch);
            grassPatches.push(grassPatch);
        }
    }
    

    
    // Add micro grass patches for even more detail
    const microGrassMaterial = new THREE.MeshPhongMaterial({ color: 0x558b2f }); // Even darker green for micro grass
    
    // Adjust micro grass count based on device performance
    const microGrassCount = isLowEndDevice ? 200 : 1200;
    
    for (let i = 0; i < microGrassCount; i++) {
        const microGrassHeight = 0.05 + Math.random() * 0.1;
        const microGrassGeometry = new THREE.CylinderGeometry(0.003, 0.006, microGrassHeight, 3);
        const microGrassPatch = new THREE.Mesh(microGrassGeometry, microGrassMaterial);
        
        // Random position across the field
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Don't place micro grass too close to spawn point
        if (Math.sqrt(x * x + z * z) > 6) {
            microGrassPatch.position.set(x, microGrassHeight / 2, z);
            microGrassPatch.castShadow = true;
            microGrassPatch.receiveShadow = true;
            microGrassPatch.userData = { type: 'microGrass', originalHeight: microGrassHeight, isFolded: false };
            scene.add(microGrassPatch);
            grassPatches.push(microGrassPatch);
        }
    }
    
    // Add tall grass patches
    const tallGrassMaterial = new THREE.MeshPhongMaterial({ color: 0x689f38 }); // Darker green for tall grass
    
    // Adjust tall grass count based on device performance
    const tallGrassCount = isLowEndDevice ? 200 : 1000;
    
    for (let i = 0; i < tallGrassCount; i++) {
        const tallGrassHeight = 0.8 + Math.random() * 0.6;
        const tallGrassGeometry = new THREE.CylinderGeometry(0.015, 0.03, tallGrassHeight, 4);
        const tallGrassPatch = new THREE.Mesh(tallGrassGeometry, tallGrassMaterial);
        
        // Random position across the field
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Don't place tall grass too close to spawn point
        if (Math.sqrt(x * x + z * z) > 12) {
            tallGrassPatch.position.set(x, tallGrassHeight / 2, z);
            tallGrassPatch.castShadow = true;
            tallGrassPatch.receiveShadow = true;
            tallGrassPatch.userData = { type: 'tallGrass', originalHeight: tallGrassHeight, isFolded: false };
            scene.add(tallGrassPatch);
            grassPatches.push(tallGrassPatch);
        }
    }
    
    // Add farm buildings
    createFarmBuildings();
    
    // Add fence around parts of the field
    createFarmFences();
}

function createFarmBuildings() {
    // Barn
    const barnGeometry = new THREE.BoxGeometry(8, 6, 12);
    const barnMaterial = new THREE.MeshPhongMaterial({ color: 0x8d4e2a }); // Brown barn
    const barn = new THREE.Mesh(barnGeometry, barnMaterial);
    barn.position.set(-40, 3, -30);
    barn.castShadow = true;
    barn.receiveShadow = true;
    scene.add(barn);
    
    // Barn roof
    const roofGeometry = new THREE.ConeGeometry(7, 3, 4);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 }); // Dark brown roof
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-40, 7.5, -30);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);
    
    // Silo
    const siloGeometry = new THREE.CylinderGeometry(2, 2, 8, 12);
    const siloMaterial = new THREE.MeshPhongMaterial({ color: 0xc0c0c0 }); // Silver silo
    const silo = new THREE.Mesh(siloGeometry, siloMaterial);
    silo.position.set(-50, 4, -25);
    silo.castShadow = true;
    silo.receiveShadow = true;
    scene.add(silo);
    
    // Silo top
    const siloTopGeometry = new THREE.ConeGeometry(2.2, 2, 12);
    const siloTop = new THREE.Mesh(siloTopGeometry, roofMaterial);
    siloTop.position.set(-50, 9, -25);
    siloTop.castShadow = true;
    scene.add(siloTop);
}

function createFarmFences() {
    const fenceMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown fence
    
    // Create fence posts and rails
    for (let i = 0; i < 20; i++) {
        // Fence post
        const postGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
        const post = new THREE.Mesh(postGeometry, fenceMaterial);
        post.position.set(30 + i * 2, 1, 40);
        post.castShadow = true;
        scene.add(post);
        
        // Fence rail
        const railGeometry = new THREE.BoxGeometry(2, 0.1, 0.1);
        const rail = new THREE.Mesh(railGeometry, fenceMaterial);
        rail.position.set(31 + i * 2, 1.2, 40);
        rail.castShadow = true;
        scene.add(rail);
    }
}

function createDriftTrail() {
    // Create trail using plane geometry for better visibility
    const trailGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });

    // We'll create trail segments dynamically
    driftTrailMesh = new THREE.Group();
    scene.add(driftTrailMesh);
}

function updateCar() {
    // Handle acceleration and deceleration with better speed control
    if (moveForward) speed += 0.005;
    if (moveBackward) speed -= 0.005;
    
    // Apply friction to slow down the car when no input
    if (!moveForward && !moveBackward) {
        speed *= 0.95;
    }
    
    // Limit maximum speed (more reasonable values)
    speed = Math.max(-0.2, Math.min(0.3, speed));

    // Check if drifting
    if (driftKey && (moveLeft || moveRight) && Math.abs(speed) > 0.02) {
        if (!isDrifting) {
            isDrifting = true;
            driftTime = 0;
            driftScore = 0;
        }
        // Add camera shake when drifting
        cameraShake = Math.min(cameraShake + 0.08, 0.25); // Reduced build-up and max shake
    } else {
        isDrifting = false;
        // Reduce camera shake when not drifting
        cameraShake = Math.max(cameraShake - 0.04, 0); // Reduced decay rate
    }

    // Handle steering and drift mechanics
    let turnAmount = 0;
    if (moveLeft || moveRight) {
        turnAmount = isDrifting ? 0.08 : 0.05; // Increased turn rate when drifting
        if (moveLeft) car.rotation.y += turnAmount;
        if (moveRight) car.rotation.y -= turnAmount;
    }

    // Calculate forward direction
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    forwardDirection.applyQuaternion(car.quaternion);
    forwardDirection.y = 0;
    forwardDirection.normalize();

    // Calculate intended velocity (where car wants to go)
    const intendedVelocity = forwardDirection.clone().multiplyScalar(speed);

    if (isDrifting) {
        driftTime += 1;
        driftScore += Math.abs(speed) * 0.1;
        
        // Drift physics: blend between current velocity and intended velocity
        const driftFactor = 0.85; // How much the car slides (0 = no slide, 1 = full slide)
        carVelocity.lerp(intendedVelocity, 1 - driftFactor);
        
        // Add some lateral velocity during drift
        const lateralDirection = new THREE.Vector3(1, 0, 0);
        lateralDirection.applyQuaternion(car.quaternion);
        lateralDirection.y = 0;
        lateralDirection.normalize();
        
        const lateralForce = (moveLeft ? -1 : 1) * speed * 0.3;
        carVelocity.add(lateralDirection.multiplyScalar(lateralForce * 0.1));
        
        // Update drift trail
        updateDriftTrail();
    } else {
        // Normal driving: car goes where it's pointing
        carVelocity.lerp(intendedVelocity, 0.8);
    }

    // Apply velocity to car position
    if (carVelocity.length() > 0.001) {
        car.position.add(carVelocity);
    }

    // Apply friction to drift velocity
    carVelocity.multiplyScalar(0.92);
    
    // Tire rolling animation
    const speedFactor = Math.abs(speed) * 50;
    wheelRotation += speedFactor * 0.1;
    
    wheels.forEach(wheel => {
        wheel.rotation.x = wheelRotation;
    });
    
    // Car body wiggle from hexagonal wheels
    if (Math.abs(speed) > 0.01) {
        carBodyWiggle += 0.3;
        const wiggleAmount = Math.sin(carBodyWiggle) * wiggleIntensity * speedFactor;
        car.position.y += wiggleAmount;
    }

    // Apply gravity to the car
    velocityY += gravity;
    car.position.y += velocityY;

    // Check collision with obstacles and adjust car height accordingly
    let maxHeight = 0.25; // Default ground height for simple car

    obstacles.forEach(obstacle => {
        if (checkCollision(car, obstacle)) {
            const obstacleHeight = obstacle.userData.height || 0.5;
            const obstacleTop = obstacle.position.y + obstacleHeight;

            if (obstacleTop > maxHeight) {
                maxHeight = obstacleTop;

                // Apply effects based on obstacle type - only when initially hitting
                if (obstacle.userData.type === 'bump' && !obstacle.userData.hasHit) {
                    // Small bounce when hitting bump
                    velocityY = 0.05;
                    obstacle.userData.hasHit = true;
                    setTimeout(() => { obstacle.userData.hasHit = false; }, 1000);
                } else if (obstacle.userData.type === 'breaker' && !obstacle.userData.hasHit) {
                    // Small bounce for speed breaker
                    velocityY = 0.03;
                    obstacle.userData.hasHit = true;
                    setTimeout(() => { obstacle.userData.hasHit = false; }, 1000);
                } else if (obstacle.userData.type === 'step' && !obstacle.userData.hasHit) {
                    // Small bounce for stairs
                    velocityY = 0.02;
                    obstacle.userData.hasHit = true;
                    setTimeout(() => { obstacle.userData.hasHit = false; }, 500);
                } else if (obstacle.userData.type === 'mountain') {
                    // For mountains, let the car climb smoothly without jumping
                    const mountainCenter = obstacle.position;
                    const carToMountain = new THREE.Vector3();
                    carToMountain.subVectors(car.position, mountainCenter);
                    carToMountain.y = 0; // Keep it horizontal
                    
                    // Calculate distance from mountain center
                    const distanceFromCenter = carToMountain.length();
                    const mountainRadius = obstacle.geometry.parameters.radiusTop || 8;
                    
                    if (distanceFromCenter < mountainRadius) {
                        // Car is on the mountain slope
                        const slopeHeight = obstacleHeight * (1 - distanceFromCenter / mountainRadius);
                        const mountainTop = obstacle.position.y + slopeHeight;
                        
                        if (mountainTop > maxHeight) {
                            maxHeight = mountainTop;
                        }
                        
                        // Smoothly adjust car height to follow mountain contour
                        // No jumping, just gradual height adjustment
                        if (car.position.y < mountainTop) {
                            // Smoothly move car up to mountain surface
                            car.position.y = Math.min(car.position.y + 0.1, mountainTop);
                            velocityY = 0; // Stop any vertical movement
                        }
                        
                        // Reduce speed on steep slopes for realistic climbing
                        if (slopeHeight > obstacleHeight * 0.3) {
                            speed *= 0.9; // More speed reduction on steep slopes
                        }
                    }
                }
            }
        }
    });

    // Apply the calculated height
    if (car.position.y < maxHeight) {
        car.position.y = maxHeight;
        velocityY = 0;
    }

    // Check if car has fallen off the world (safety check)
    if (car.position.y < -10) {
        gameOver = true;
        speed = 0;
    }

    // Simple stable camera system
    const cameraDistance = 6;
    const cameraHeight = 3;

    // Calculate camera position behind the car
    const angle = car.rotation.y + cameraAngle;
    const cameraX = car.position.x + Math.sin(angle) * cameraDistance;
    const cameraZ = car.position.z + Math.cos(angle) * cameraDistance;

    // Set camera position with smooth following
    const targetPos = new THREE.Vector3(cameraX, car.position.y + cameraHeight, cameraZ);
    camera.position.lerp(targetPos, 0.1);
    
    // Apply camera shake if drifting
    if (cameraShake > 0) {
        // Generate random shake offset with reduced intensity
        cameraShakeOffset.x = (Math.random() - 0.5) * cameraShake * 0.6; // Reduced from 1.2 to 0.6
        cameraShakeOffset.y = (Math.random() - 0.5) * cameraShake * 0.4; // Reduced from 0.8 to 0.4
        cameraShakeOffset.z = (Math.random() - 0.5) * cameraShake * 0.6; // Reduced from 1.2 to 0.6
        
        // Apply shake offset to camera position
        camera.position.add(cameraShakeOffset);
    }
    
    camera.lookAt(car.position);

    // Only increase score when car is actually moving - slower scoring
    if (Math.abs(speed) > 0.01 || isDrifting) {
        const scoreIncrement = Math.floor(speed * 2 + driftScore * 0.1);
        if (scoreIncrement > 0) {
            score += scoreIncrement;
        } else if (Math.abs(speed) > 0.05) {
            // Ensure minimum score increment for visible progress
            score += 1;
        }
    }
    
    // Check for grass folding when car moves
    if (Math.abs(speed) > 0.01) {
        checkGrassFolding();
    }
}

function createRoadDeformations(geometry) {
    const vertices = geometry.attributes.position.array;
    
    // Add random height variations to create bumps and dips
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Create potholes
        if (Math.random() < 0.08) { // Increased probability
            const distance = Math.sqrt(x * x + z * z);
            if (distance > 10) { // Don't put holes near spawn
                vertices[i + 1] = -0.5 - Math.random() * 0.3; // Make deeper holes
            }
        }
        
        // Create bumps
        else if (Math.random() < 0.05) { // Increased probability
            vertices[i + 1] = 0.2 + Math.random() * 0.3; // Make higher bumps
        }
        
        // Add subtle noise for realistic surface
        else {
            vertices[i + 1] += (Math.random() - 0.5) * 0.08; // More variation
        }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
}

function createRoadFeatures() {
    // Create puddles
    for (let i = 0; i < 8; i++) {
        const puddleGeometry = new THREE.CircleGeometry(2 + Math.random() * 2, 16);
        const puddleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0066aa, 
            transparent: true, 
            opacity: 0.7,
            reflectivity: 0.8
        });
        
        const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(
            (Math.random() - 0.5) * 80,
            0.01, // Slightly above ground
            (Math.random() - 0.5) * 80
        );
        scene.add(puddle);
        roadDeformations.push(puddle);
    }
    
    // Create road cracks (dark lines)
    for (let i = 0; i < 12; i++) {
        const crackGeometry = new THREE.PlaneGeometry(0.2, 5 + Math.random() * 10);
        const crackMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x222222,
            transparent: true,
            opacity: 0.8
        });
        
        const crack = new THREE.Mesh(crackGeometry, crackMaterial);
        crack.rotation.x = -Math.PI / 2;
        crack.rotation.z = Math.random() * Math.PI;
        crack.position.set(
            (Math.random() - 0.5) * 90,
            0.005, // Just above ground
            (Math.random() - 0.5) * 90
        );
        scene.add(crack);
        roadDeformations.push(crack);
    }
    
    // Create oil stains
    for (let i = 0; i < 6; i++) {
        const stainGeometry = new THREE.CircleGeometry(1 + Math.random(), 12);
        const stainMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a1a,
            transparent: true,
            opacity: 0.6
        });
        
        const stain = new THREE.Mesh(stainGeometry, stainMaterial);
        stain.rotation.x = -Math.PI / 2;
        stain.position.set(
            (Math.random() - 0.5) * 85,
            0.003, // Just above ground
            (Math.random() - 0.5) * 85
        );
        scene.add(stain);
        roadDeformations.push(stain);
    }
    
    // Create small rocks/debris
    for (let i = 0; i < 15; i++) {
        const rockGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 6, 4);
        const rockMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(
            (Math.random() - 0.5) * 95,
            0.1,
            (Math.random() - 0.5) * 95
        );
        rock.castShadow = true;
        scene.add(rock);
        roadDeformations.push(rock);
    }
}

function getGroundHeightAt(x, z) {
    let height = groundLevel;
    
    // Check if position is near any deformed area
    // For better collision, we'd need to sample the actual geometry
    // This is a simplified approximation
    
    // Sample the ground geometry at this position
    if (ground && ground.geometry) {
        // Convert world position to local geometry coordinates
        const localX = (x + 50) / 100 * 50; // Map to 0-50 range
        const localZ = (z + 50) / 100 * 50; // Map to 0-50 range
        
        // Find nearest vertex in the deformed geometry
        const vertices = ground.geometry.attributes.position.array;
        let closestHeight = groundLevel;
        let minDistance = Infinity;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const vx = (vertices[i] + 50) / 100 * 50;
            const vz = (vertices[i + 2] + 50) / 100 * 50;
            const distance = Math.sqrt((localX - vx) ** 2 + (localZ - vz) ** 2);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestHeight = vertices[i + 1];
            }
        }
        
        if (minDistance < 2) { // Within reasonable distance
            height = closestHeight;
        }
    }
    
    // Check for road features (puddles, etc.)
    roadDeformations.forEach(deformation => {
        const distance = Math.sqrt(
            Math.pow(x - deformation.position.x, 2) + 
            Math.pow(z - deformation.position.z, 2)
        );
        
        if (distance < 2) {
            if (deformation.geometry.type === 'CircleGeometry' && deformation.material.color.getHex() === 0x0066aa) {
                // Puddle - slightly lower
                height -= 0.05;
            } else if (deformation.geometry.type === 'SphereGeometry') {
                // Rock - slightly higher
                height += 0.1;
            }
        }
    });
    
    return height;
}

function createRoadObstacles() {
    // Farm-themed obstacles
    
    // Hay bales
    for (let i = 0; i < 8; i++) {
        const hayGeometry = new THREE.CylinderGeometry(1, 1, 0.8, 8);
        const hayMaterial = new THREE.MeshPhongMaterial({ color: 0xdaa520 }); // Golden hay
        const hayBale = new THREE.Mesh(hayGeometry, hayMaterial);
        hayBale.rotation.z = Math.PI / 2; // Lay it on its side
        hayBale.position.set((Math.random() - 0.5) * 120, 0.4, (Math.random() - 0.5) * 120);
        hayBale.castShadow = true;
        hayBale.receiveShadow = true;
        hayBale.userData = { type: 'hay', height: 0.8 };
        scene.add(hayBale);
        obstacles.push(hayBale);
    }
    
    // Create variety of huts
    createHuts();
    
    // Create trees with different colors
    createTrees();
    
    // Wooden crates
    for (let i = 0; i < 6; i++) {
        const crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const crateMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown wood
        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set((Math.random() - 0.5) * 100, 0.75, (Math.random() - 0.5) * 100);
        crate.castShadow = true;
        crate.receiveShadow = true;
        crate.userData = { type: 'crate', height: 1.5 };
        scene.add(crate);
        obstacles.push(crate);
    }
    
    // Farm equipment - Tractor
    const tractorBodyGeometry = new THREE.BoxGeometry(3, 2, 6);
    const tractorMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 }); // Green tractor
    const tractor = new THREE.Mesh(tractorBodyGeometry, tractorMaterial);
    tractor.position.set(25, 1, -20);
    tractor.castShadow = true;
    tractor.receiveShadow = true;
    tractor.userData = { type: 'tractor', height: 2 };
    scene.add(tractor);
    obstacles.push(tractor);
    
    // Tractor wheels
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.3, 12);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x2e2e2e });
    
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(26.5, 0.5, -18);
    frontWheel.castShadow = true;
    scene.add(frontWheel);
    
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(26.5, 0.5, -22);
    rearWheel.castShadow = true;
    scene.add(rearWheel);
    
    // Water troughs
    for (let i = 0; i < 3; i++) {
        const troughGeometry = new THREE.BoxGeometry(3, 0.5, 1);
        const troughMaterial = new THREE.MeshPhongMaterial({ color: 0x708090 }); // Slate gray
        const trough = new THREE.Mesh(troughGeometry, troughMaterial);
        trough.position.set((Math.random() - 0.5) * 80, 0.25, (Math.random() - 0.5) * 80);
        trough.castShadow = true;
        trough.receiveShadow = true;
        trough.userData = { type: 'trough', height: 0.5 };
        scene.add(trough);
        obstacles.push(trough);
    }
    
    // Rock piles
    for (let i = 0; i < 10; i++) {
        const rockGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 6, 4);
        const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 }); // Dark gray
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set((Math.random() - 0.5) * 140, 0.3, (Math.random() - 0.5) * 140);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { type: 'rock', height: 0.6 };
        scene.add(rock);
        obstacles.push(rock);
    }
    
    // Dirt mounds
    for (let i = 0; i < 5; i++) {
        const moundGeometry = new THREE.SphereGeometry(2, 8, 6);
        const moundMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 }); // Sandy brown
        const mound = new THREE.Mesh(moundGeometry, moundMaterial);
        mound.scale.set(1, 0.3, 1); // Flatten it
        mound.position.set((Math.random() - 0.5) * 100, 0.3, (Math.random() - 0.5) * 100);
        mound.castShadow = true;
        mound.receiveShadow = true;
        mound.userData = { type: 'mound', height: 0.6 };
        scene.add(mound);
        obstacles.push(mound);
    }
}

function checkCollision(car, obstacle) {
    // Simple bounding box collision detection
    const carBox = new THREE.Box3().setFromObject(car);
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    
    return carBox.intersectsBox(obstacleBox);
}

function checkGrassFolding() {
    // Check each grass patch for collision with car
    grassPatches.forEach(grassPatch => {
        if (!grassPatch.userData.isFolded) {
            const distance = car.position.distanceTo(grassPatch.position);
            
            // If car is close enough to the grass patch
            if (distance < 1.5) {
                // Fold the grass
                grassPatch.userData.isFolded = true;
                
                // Calculate fall direction based on car position
                const directionToCar = new THREE.Vector3();
                directionToCar.subVectors(car.position, grassPatch.position);
                directionToCar.y = 0; // Keep it horizontal
                directionToCar.normalize();
                
                // Animate the grass falling over from the root
                const fallAnimation = () => {
                    if (grassPatch.rotation.z < Math.PI / 2) {
                        // Rotate the grass to fall over from the base
                        grassPatch.rotation.z += 0.1;
                        
                        // Move the grass down as it falls, keeping the base at ground level
                        const fallProgress = grassPatch.rotation.z / (Math.PI / 2);
                        const originalHeight = grassPatch.userData.originalHeight;
                        const currentHeight = originalHeight * Math.cos(grassPatch.rotation.z);
                        
                        grassPatch.position.y = currentHeight / 2;
                        
                        requestAnimationFrame(fallAnimation);
                    } else {
                        // Ensure it's fully fallen and lying flat
                        grassPatch.rotation.z = Math.PI / 2;
                        grassPatch.position.y = 0.01;
                    }
                };
                
                fallAnimation();
                
                // Reset grass after some time (optional)
                setTimeout(() => {
                    if (grassPatch.userData.isFolded) {
                        grassPatch.userData.isFolded = false;
                        
                        // Animate grass standing back up from the root
                        const standUpAnimation = () => {
                            if (grassPatch.rotation.z > 0) {
                                grassPatch.rotation.z -= 0.05;
                                
                                // Calculate position as grass stands back up
                                const originalHeight = grassPatch.userData.originalHeight;
                                const currentHeight = originalHeight * Math.cos(grassPatch.rotation.z);
                                grassPatch.position.y = currentHeight / 2;
                                
                                requestAnimationFrame(standUpAnimation);
                            } else {
                                // Reset to original position
                                grassPatch.rotation.z = 0;
                                grassPatch.position.y = grassPatch.userData.originalHeight / 2;
                            }
                        };
                        
                        standUpAnimation();
                    }
                }, 15000); // Reset after 15 seconds
            }
        }
    });
}

function updateDriftTrail() {
    // Create new trail segments for the rear wheels
    const rearLeftWheel = car.getObjectByName('rearLeft');
    const rearRightWheel = car.getObjectByName('rearRight');

    if (rearLeftWheel && rearRightWheel) {
        const rearLeftPos = new THREE.Vector3();
        const rearRightPos = new THREE.Vector3();

        rearLeftWheel.getWorldPosition(rearLeftPos);
        rearRightWheel.getWorldPosition(rearRightPos);

        // Set trail position on ground
        rearLeftPos.y = 0.01;
        rearRightPos.y = 0.01;

        // Only add trail segments if car has moved enough
        if (lastCarPosition.distanceTo(car.position) > 0.03) { // Further reduced distance for even more frequent trail segments
            // Create new trail segments with larger, more visible tire marks
            const leftTrailSegment = new THREE.Mesh(
                new THREE.PlaneGeometry(0.2, 1.2), // Increased size from 0.15x0.8 to 0.2x1.2
                new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.9 }) // Increased opacity from 0.8 to 0.9
            );
            leftTrailSegment.position.copy(rearLeftPos);
            leftTrailSegment.rotation.x = -Math.PI / 2;
            leftTrailSegment.userData.age = 0; // Track age for fading
            driftTrailMesh.add(leftTrailSegment);

            const rightTrailSegment = new THREE.Mesh(
                new THREE.PlaneGeometry(0.2, 1.2), // Increased size from 0.15x0.8 to 0.2x1.2
                new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.9 }) // Increased opacity from 0.8 to 0.9
            );
            rightTrailSegment.position.copy(rearRightPos);
            rightTrailSegment.rotation.x = -Math.PI / 2;
            rightTrailSegment.userData.age = 0; // Track age for fading
            driftTrailMesh.add(rightTrailSegment);

            lastCarPosition.copy(car.position);
        }
    }

}

function updateTrailFade() {
    if (!driftTrailMesh) return;
    
    // Update existing trail segments (fade them out)
    const segmentsToRemove = [];
    driftTrailMesh.children.forEach((segment, index) => {
        if (segment.userData.age !== undefined) {
            segment.userData.age += 1;
            // Much slower fade rate - reduced from 0.0003 to 0.0001
            segment.material.opacity = Math.max(0, 0.8 - (segment.userData.age * 0.0001));
            
            // Mark for removal if completely faded
            if (segment.material.opacity <= 0) {
                segmentsToRemove.push(segment);
            }
        }
    });
    
    // Remove faded segments
    segmentsToRemove.forEach(segment => {
        driftTrailMesh.remove(segment);
    });
    
    // Increase trail segment limit from 150 to 300 for much longer trails
    if (driftTrailMesh.children.length > 300) {
        driftTrailMesh.remove(driftTrailMesh.children[0]);
        if (driftTrailMesh.children.length > 0) {
            driftTrailMesh.remove(driftTrailMesh.children[0]);
        }
    }
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('speed').innerText = (speed * 50).toFixed(0);
    document.getElementById('driftScore').innerText = Math.floor(driftScore);
    
    const driftStatus = document.getElementById('driftStatus');
    if (isDrifting) {
        driftStatus.style.display = 'block';
    } else {
        driftStatus.style.display = 'none';
    }
}

function restartGame() {
    car.position.set(0, 0.25, 0); // Position car on ground for simple car
    car.rotation.set(0, 0, 0);
    camera.position.set(0, 3, 6);
    cameraAngle = 0;
    speed = 0;
    score = 0;
    velocityY = 0;
    gameOver = false;
    isMouseLookEnabled = false;
    // Reset drift variables
    isDrifting = false;
    driftKey = false;
    driftAngle = 0;
    driftVelocity.set(0, 0, 0);
    carVelocity.set(0, 0, 0);
    driftScore = 0;
    driftTime = 0;
    driftTrail = []; // Clear drift trail
    cameraShake = 0; // Reset camera shake
    cameraShakeOffset.set(0, 0, 0); // Reset camera shake offset
    if (driftTrailMesh) {
        // Clear all trail segments
        while (driftTrailMesh.children.length > 0) {
            driftTrailMesh.remove(driftTrailMesh.children[0]);
        }
    }
    document.body.style.cursor = 'default';
    document.getElementById('gameOver').style.display = 'none';
}

// Force landscape orientation on mobile
function forceLandscape() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
            // Fallback if orientation lock is not supported
            console.log('Landscape orientation lock not supported');
        });
    }
}

    // Check if device supports orientation and try to lock
if ('orientation' in screen) {
    forceLandscape();
}

function createMountains() {
    // Create mountains around the entire map boundary
    const mountainColors = [0x8b4513, 0x696969, 0x708090, 0x556b2f]; // Brown and gray variations
    
    // Create mountains along the ground plane boundary (first layer)
    for (let i = 0; i < 40; i++) { // Reduced to 40 mountains
        const mountainColor = mountainColors[Math.floor(Math.random() * mountainColors.length)];
        
        // Create mountain base (large cone)
        const mountainHeight = 15 + Math.random() * 20; // 15-35 units tall
        const mountainRadius = 8 + Math.random() * 12; // 8-20 units wide
        const mountainGeometry = new THREE.ConeGeometry(mountainRadius, mountainHeight, 8);
        const mountainMaterial = new THREE.MeshPhongMaterial({ color: mountainColor });
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Position mountains exactly at ground plane boundary
        let x, y, z;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(side) {
            case 0: // Top boundary - ground plane edge
                x = (Math.random() - 0.5) * 200; // Exactly ground plane width
                y = mountainHeight / 2;
                z = -100 - Math.random() * 20; // At ground plane boundary
                break;
            case 1: // Right boundary - ground plane edge
                x = 100 + Math.random() * 20; // At ground plane boundary
                y = mountainHeight / 2;
                z = (Math.random() - 0.5) * 200; // Exactly ground plane length
                break;
            case 2: // Bottom boundary - ground plane edge
                x = (Math.random() - 0.5) * 200; // Exactly ground plane width
                y = mountainHeight / 2;
                z = 100 + Math.random() * 20; // At ground plane boundary
                break;
            case 3: // Left boundary - ground plane edge
                x = -100 - Math.random() * 20; // At ground plane boundary
                y = mountainHeight / 2;
                z = (Math.random() - 0.5) * 200; // Exactly ground plane length
                break;
        }
        
        mountain.position.set(x, y, z);
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        mountain.userData = { type: 'mountain', height: mountainHeight };
        scene.add(mountain);
        obstacles.push(mountain);
    }
    
    // Create second layer of mountains for complete boundary coverage
    for (let i = 0; i < 30; i++) { // Reduced to 30 mountains
        const mountainColor = mountainColors[Math.floor(Math.random() * mountainColors.length)];
        
        // Create smaller mountains for gaps
        const mountainHeight = 12 + Math.random() * 18; // 12-30 units tall
        const mountainRadius = 6 + Math.random() * 10; // 6-16 units wide
        const mountainGeometry = new THREE.ConeGeometry(mountainRadius, mountainHeight, 8);
        const mountainMaterial = new THREE.MeshPhongMaterial({ color: mountainColor });
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Position mountains to fill gaps at ground plane boundary
        let x, y, z;
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
            case 0: // Top boundary - fill gaps
                x = (Math.random() - 0.5) * 220;
                y = mountainHeight / 2;
                z = -110 - Math.random() * 20;
                break;
            case 1: // Right boundary - fill gaps
                x = 110 + Math.random() * 20;
                y = mountainHeight / 2;
                z = (Math.random() - 0.5) * 220;
                break;
            case 2: // Bottom boundary - fill gaps
                x = (Math.random() - 0.5) * 220;
                y = mountainHeight / 2;
                z = 110 + Math.random() * 20;
                break;
            case 3: // Left boundary - fill gaps
                x = -110 - Math.random() * 20;
                y = mountainHeight / 2;
                z = (Math.random() - 0.5) * 220;
                break;
        }
        
        mountain.position.set(x, y, z);
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        mountain.userData = { type: 'mountain', height: mountainHeight };
        scene.add(mountain);
        obstacles.push(mountain);
    }
    
    // Create waterfall at connecting point (top-right corner)
    createWaterfall();
    
    // Add humorous notices behind corner mountains
    createCornerNotices();
}

function createWaterfall() {
    // Create waterfall at the top-right mountain connecting point
    const waterfallX = 120;
    const waterfallZ = -120;
    const waterfallHeight = 25;
    
    // Waterfall base structure (rock formation)
    const rockGeometry = new THREE.ConeGeometry(6, waterfallHeight, 8);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(waterfallX, waterfallHeight / 2, waterfallZ);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.userData = { type: 'waterfallRock', height: waterfallHeight };
    scene.add(rock);
    obstacles.push(rock);
    
    // Waterfall stream (multiple water particles)
    for (let i = 0; i < 15; i++) {
        const waterGeometry = new THREE.CylinderGeometry(0.1, 0.1, waterfallHeight * 0.8, 6);
        const waterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0066cc,
            transparent: true,
            opacity: 0.7
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        
        // Position water streams around the waterfall
        const angle = (i / 15) * Math.PI * 2;
        const radius = 2 + Math.random() * 2;
        const x = waterfallX + Math.cos(angle) * radius;
        const z = waterfallZ + Math.sin(angle) * radius;
        
        water.position.set(x, waterfallHeight * 0.4, z);
        water.castShadow = true;
        water.userData = { type: 'waterfall', height: waterfallHeight * 0.8 };
        scene.add(water);
    }
    
    // Water pool at bottom of waterfall
    const poolGeometry = new THREE.CylinderGeometry(8, 8, 1, 12);
    const poolMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0066cc,
        transparent: true,
        opacity: 0.8
    });
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.set(waterfallX, 0.5, waterfallZ + 10);
    pool.castShadow = true;
    pool.receiveShadow = true;
    pool.userData = { type: 'waterPool', height: 1 };
    scene.add(pool);
    obstacles.push(pool);
}

function createCornerNotices() {
    // Create text notices behind corner mountains
    const noticeText = "Why are you here, you curious gay?";
    const noticePositions = [
        { x: -120, z: -120, rotation: 0 }, // Top-left corner
        { x: 120, z: -120, rotation: 0 },  // Top-right corner
        { x: 120, z: 120, rotation: Math.PI }, // Bottom-right corner
        { x: -120, z: 120, rotation: Math.PI } // Bottom-left corner
    ];
    
    noticePositions.forEach((pos, index) => {
        // Create a simple text geometry (using a plane with text texture)
        const noticeGeometry = new THREE.PlaneGeometry(8, 2);
        const noticeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, // Bright yellow
            transparent: true,
            opacity: 0.9
        });
        const notice = new THREE.Mesh(noticeGeometry, noticeMaterial);
        
        // Position notice behind corner mountains
        notice.position.set(pos.x, 5, pos.z);
        notice.rotation.y = pos.rotation;
        notice.userData = { type: 'notice', text: noticeText };
        scene.add(notice);
        
        // Add a small sign post
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(pos.x, 2, pos.z);
        post.castShadow = true;
        scene.add(post);
        
        // Add a small flag or banner
        const flagGeometry = new THREE.PlaneGeometry(1, 0.5);
        const flagMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Red flag
            transparent: true,
            opacity: 0.8
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(pos.x + 1, 4, pos.z);
        flag.rotation.y = pos.rotation;
        scene.add(flag);
        
        // Create hidden HTML overlay for text (only visible when very close)
        createHiddenNoticeOverlay(pos, noticeText, index);
    });
}

function createHiddenNoticeOverlay(position, text, index) {
    // Create hidden HTML element for the notice text (only visible when very close)
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'hidden-corner-notice';
    noticeDiv.textContent = text;
    noticeDiv.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 0, 0.9);
        color: #000;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        border: 2px solid #ff0000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 50;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s ease;
        transform: translate(-50%, -50%);
    `;
    
    document.body.appendChild(noticeDiv);
    
    // Store reference for updating position
    noticeDiv.userData = { 
        worldPosition: new THREE.Vector3(position.x, 5, position.z),
        index: index,
        isHidden: true
    };
    
    // Add to global notices array for position updates
    if (!window.cornerNotices) window.cornerNotices = [];
    window.cornerNotices.push(noticeDiv);
}

function createWindParticles() {
    // Create visible wind particles around the map boundary
    const windParticleCount = 50; // Number of wind particles
    
    for (let i = 0; i < windParticleCount; i++) {
        // Create small wind particle (small sphere)
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, // White
            transparent: true,
            opacity: 0.6
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Position particles around the map boundary
        let x, y, z;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(side) {
            case 0: // Top boundary
                x = (Math.random() - 0.5) * 200;
                y = 5 + Math.random() * 10; // Above ground
                z = -100 - Math.random() * 20;
                break;
            case 1: // Right boundary
                x = 100 + Math.random() * 20;
                y = 5 + Math.random() * 10; // Above ground
                z = (Math.random() - 0.5) * 200;
                break;
            case 2: // Bottom boundary
                x = (Math.random() - 0.5) * 200;
                y = 5 + Math.random() * 10; // Above ground
                z = 100 + Math.random() * 20;
                break;
            case 3: // Left boundary
                x = -100 - Math.random() * 20;
                y = 5 + Math.random() * 10; // Above ground
                z = (Math.random() - 0.5) * 200;
                break;
        }
        
        particle.position.set(x, y, z);
        particle.userData = {
            originalPosition: new THREE.Vector3(x, y, z),
            windSpeed: 0.3 + Math.random() * 0.4,
            windDirection: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 2
            ).normalize(),
            life: 0,
            maxLife: 100 + Math.random() * 50
        };
        
        scene.add(particle);
        windParticles.push(particle);
    }
}

function createBirds() {
    // Create birds only for high-end devices
    if (isLowEndDevice) return;
    
    const birdColors = [0x8b4513, 0x2f4f4f, 0x696969, 0x708090]; // Brown and gray variations
    
    // Create birds all over the map boundary
    for (let i = 0; i < 15; i++) {
        const birdColor = birdColors[Math.floor(Math.random() * birdColors.length)];
        
        // Create bird body (simple triangle shape)
        const birdGeometry = new THREE.ConeGeometry(0.3, 0.8, 3);
        const birdMaterial = new THREE.MeshPhongMaterial({ color: birdColor });
        const bird = new THREE.Mesh(birdGeometry, birdMaterial);
        
        // Position birds around the entire map boundary (above mountains)
        let x, y, z;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(side) {
            case 0: // Top boundary
                x = (Math.random() - 0.5) * 200;
                y = 20 + Math.random() * 15; // Above mountains
                z = -140 - Math.random() * 20;
                break;
            case 1: // Right boundary
                x = 140 + Math.random() * 20;
                y = 20 + Math.random() * 15; // Above mountains
                z = (Math.random() - 0.5) * 200;
                break;
            case 2: // Bottom boundary
                x = (Math.random() - 0.5) * 200;
                y = 20 + Math.random() * 15; // Above mountains
                z = 140 + Math.random() * 20;
                break;
            case 3: // Left boundary
                x = -140 - Math.random() * 20;
                y = 20 + Math.random() * 15; // Above mountains
                z = (Math.random() - 0.5) * 200;
                break;
        }
        
        bird.position.set(x, y, z);
        bird.castShadow = true;
        bird.userData = {
            type: 'boundaryBird',
            originalPosition: new THREE.Vector3(x, y, z),
            flightSpeed: 0.3 + Math.random() * 0.4,
            flightDirection: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 1.5
            ).normalize(),
            wingFlapSpeed: 0.1 + Math.random() * 0.1,
            wingFlapTime: Math.random() * Math.PI * 2
        };
        
        scene.add(bird);
        birds.push(bird);
    }
    
    // Create birds above the entire ground area
    for (let i = 0; i < 10; i++) {
        const birdColor = birdColors[Math.floor(Math.random() * birdColors.length)];
        
        // Create bird body (simple triangle shape)
        const birdGeometry = new THREE.ConeGeometry(0.4, 1.0, 3);
        const birdMaterial = new THREE.MeshPhongMaterial({ color: birdColor });
        const bird = new THREE.Mesh(birdGeometry, birdMaterial);
        
        // Position birds above the entire ground area (above mountains)
        const x = (Math.random() - 0.5) * 180;
        const y = 25 + Math.random() * 15; // Much higher above mountains
        const z = (Math.random() - 0.5) * 180;
        
        bird.position.set(x, y, z);
        bird.castShadow = true;
        bird.userData = {
            type: 'skyBird',
            originalPosition: new THREE.Vector3(x, y, z),
            flightSpeed: 0.2 + Math.random() * 0.3,
            flightDirection: new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 1
            ).normalize(),
            wingFlapSpeed: 0.08 + Math.random() * 0.08,
            wingFlapTime: Math.random() * Math.PI * 2
        };
        
        scene.add(bird);
        birds.push(bird);
    }
}

function updateBirds() {
    // Only update birds if camera can look around (not in portrait mode)
    if (window.innerWidth < window.innerHeight) return; // Portrait mode check
    
    birdAnimationTime += 0.016; // Approximate 60fps
    
    birds.forEach(bird => {
        if (!bird.userData) return;
        
        // Update wing flapping animation
        bird.userData.wingFlapTime += bird.userData.wingFlapSpeed;
        const wingFlap = Math.sin(bird.userData.wingFlapTime) * 0.2;
        bird.rotation.z = wingFlap;
        
        // Move bird in flight direction
        const movement = bird.userData.flightDirection.clone().multiplyScalar(bird.userData.flightSpeed * 0.02);
        bird.position.add(movement);
        
        // Rotate bird to face flight direction
        bird.lookAt(bird.position.clone().add(bird.userData.flightDirection));
        
        // Keep birds within map boundaries
        if (Math.abs(bird.position.x) > 110 || Math.abs(bird.position.z) > 110) {
            // Reverse direction when reaching bounds
            bird.userData.flightDirection.multiplyScalar(-1);
        }
        
        // Keep birds at appropriate height based on type
        if (bird.userData.type === 'boundaryBird') {
            // Boundary birds stay above mountains
            if (bird.position.y < 15 || bird.position.y > 40) {
                bird.userData.flightDirection.y *= -1;
            }
        } else if (bird.userData.type === 'skyBird') {
            // Sky birds stay much higher above mountains
            if (bird.position.y < 20 || bird.position.y > 45) {
                bird.userData.flightDirection.y *= -1;
            }
        }
        
        // Add slight random movement
        if (Math.random() < 0.01) {
            bird.userData.flightDirection.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.1
            )).normalize();
        }
    });
}

function updateTrees() {
    treeAnimationTime += 0.016; // Approximate 60fps
    
    trees.forEach(tree => {
        if (!tree.foliage || !tree.originalPosition || !tree.treeGroup) return;
        
        // Update wind time for this tree
        tree.windTime += tree.windSpeed * 0.02;
        
        // Calculate wind sway effect
        const windSway = Math.sin(tree.windTime) * tree.swayIntensity;
        const windSwayZ = Math.cos(tree.windTime * 0.7) * tree.swayIntensity * 0.5; // Slight Z-axis sway
        
        // Apply wind sway to the entire tree group (trunk and foliage move together)
        tree.treeGroup.rotation.z = windSway * 0.3; // Gentle sway for the whole tree
        tree.treeGroup.rotation.x = windSwayZ * 0.1;
        
        // Add additional foliage-specific sway (more movement for foliage)
        tree.foliage.rotation.z = windSway * 0.2; // Extra foliage sway
        tree.foliage.rotation.x = windSwayZ * 0.1;
    });
}

function updateWindParticles() {
    windAnimationTime += 0.016; // Approximate 60fps
    
    windParticles.forEach((particle, index) => {
        if (!particle.userData) return;
        
        // Update particle life
        particle.userData.life += 1;
        
        // Move particle in wind direction
        const movement = particle.userData.windDirection.clone().multiplyScalar(particle.userData.windSpeed * 0.05);
        particle.position.add(movement);
        
        // Fade out particle as it ages
        const lifeProgress = particle.userData.life / particle.userData.maxLife;
        particle.material.opacity = 0.6 * (1 - lifeProgress);
        
        // Scale particle down as it ages
        const scale = 1 - lifeProgress * 0.5;
        particle.scale.set(scale, scale, scale);
        
        // Remove old particles and create new ones
        if (particle.userData.life >= particle.userData.maxLife) {
            scene.remove(particle);
            windParticles.splice(index, 1);
            
            // Create new particle at boundary
            createNewWindParticle();
        }
    });
}

function createNewWindParticle() {
    // Create a new wind particle at the boundary
    const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, // White
        transparent: true,
        opacity: 0.6
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Position at random boundary location
    let x, y, z;
    const side = Math.floor(Math.random() * 4);
    
    switch(side) {
        case 0: // Top boundary
            x = (Math.random() - 0.5) * 200;
            y = 5 + Math.random() * 10;
            z = -100 - Math.random() * 20;
            break;
        case 1: // Right boundary
            x = 100 + Math.random() * 20;
            y = 5 + Math.random() * 10;
            z = (Math.random() - 0.5) * 200;
            break;
        case 2: // Bottom boundary
            x = (Math.random() - 0.5) * 200;
            y = 5 + Math.random() * 10;
            z = 100 + Math.random() * 20;
            break;
        case 3: // Left boundary
            x = -100 - Math.random() * 20;
            y = 5 + Math.random() * 10;
            z = (Math.random() - 0.5) * 200;
            break;
    }
    
    particle.position.set(x, y, z);
    particle.userData = {
        originalPosition: new THREE.Vector3(x, y, z),
        windSpeed: 0.3 + Math.random() * 0.4,
        windDirection: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 2
        ).normalize(),
        life: 0,
        maxLife: 100 + Math.random() * 50
    };
    
    scene.add(particle);
    windParticles.push(particle);
}

function updateCornerNotices() {
    if (!window.cornerNotices) return;
    
    window.cornerNotices.forEach(noticeDiv => {
        if (!noticeDiv.userData) return;
        
        // Convert 3D world position to screen position
        const worldPosition = noticeDiv.userData.worldPosition;
        const screenPosition = new THREE.Vector3();
        screenPosition.copy(worldPosition);
        screenPosition.project(camera);
        
        // Convert to screen coordinates
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;
        
        // Calculate distance from car to notice
        const distanceToCar = car.position.distanceTo(worldPosition);
        
        // Only show notice if very close to car (hidden easter egg)
        const isVeryClose = distanceToCar < 8; // Only visible within 8 units
        
        // Check if notice is visible on screen and close to car
        const isVisible = x >= -100 && x <= window.innerWidth + 100 && 
                         y >= -50 && y <= window.innerHeight + 50 &&
                         screenPosition.z < 1 && // In front of camera
                         isVeryClose; // Very close to car
        
        // Update notice position and visibility
        if (isVisible) {
            noticeDiv.style.left = x + 'px';
            noticeDiv.style.top = y + 'px';
            noticeDiv.style.opacity = '1';
        } else {
            noticeDiv.style.opacity = '0';
        }
    });
}

function createHuts() {
    // Create variety of small huts with more types
    const hutColors = [0x8b4513, 0xa0522d, 0xcd853f, 0xdaa520, 0x8b7355, 0x6b4423]; // More brown variations
    const hutSizes = [1.5, 2, 2.5, 3, 3.5, 4]; // More size variations
    
    // Create huts all over the map
    for (let i = 0; i < 25; i++) { // Increased from 12 to 25
        const hutSize = hutSizes[Math.floor(Math.random() * hutSizes.length)];
        const hutColor = hutColors[Math.floor(Math.random() * hutColors.length)];
        
        // Random position across the entire map
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Don't place too close to spawn
        if (Math.sqrt(x * x + z * z) > 15) {
            // Hut body
            const hutGeometry = new THREE.BoxGeometry(hutSize, hutSize * 0.8, hutSize);
            const hutMaterial = new THREE.MeshPhongMaterial({ color: hutColor });
            const hut = new THREE.Mesh(hutGeometry, hutMaterial);
            
            hut.position.set(x, hutSize * 0.4, z);
            hut.castShadow = true;
            hut.receiveShadow = true;
            hut.userData = { type: 'hut', height: hutSize * 0.8 };
            scene.add(hut);
            obstacles.push(hut);
            
            // Add roof
            const roofGeometry = new THREE.ConeGeometry(hutSize * 0.8, hutSize * 0.6, 4);
            const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 }); // Dark brown roof
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(x, hutSize * 0.8 + hutSize * 0.3, z);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            scene.add(roof);
            
            // Add door
            const doorWidth = hutSize * 0.3;
            const doorHeight = hutSize * 0.6;
            const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.05);
            const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a }); // Dark brown door
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(x, hutSize * 0.3, z + hutSize * 0.51); // Front of hut
            door.castShadow = true;
            scene.add(door);
            
            // Add door handle
            const handleGeometry = new THREE.SphereGeometry(0.02, 8, 6);
            const handleMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 }); // Gold handle
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(x + doorWidth * 0.3, hutSize * 0.3, z + hutSize * 0.56);
            scene.add(handle);
            
            // Add window
            const windowSize = hutSize * 0.2;
            const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.05);
            const windowMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x87ceeb, // Sky blue
                transparent: true,
                opacity: 0.7
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(x + hutSize * 0.3, hutSize * 0.5, z + hutSize * 0.51);
            window.castShadow = true;
            scene.add(window);
            
            // Add window frame
            const frameGeometry = new THREE.BoxGeometry(windowSize + 0.1, windowSize + 0.1, 0.02);
            const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 }); // Dark brown frame
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(x + hutSize * 0.3, hutSize * 0.5, z + hutSize * 0.52);
            scene.add(frame);
        }
    }
    
    // Create some larger farm buildings
    for (let i = 0; i < 8; i++) {
        const buildingSize = 4 + Math.random() * 3; // 4-7 units
        const buildingColor = hutColors[Math.floor(Math.random() * hutColors.length)];
        
        // Random position
        const x = (Math.random() - 0.5) * 160;
        const z = (Math.random() - 0.5) * 160;
        
        if (Math.sqrt(x * x + z * z) > 25) {
            // Building body
            const buildingGeometry = new THREE.BoxGeometry(buildingSize, buildingSize * 1.2, buildingSize);
            const buildingMaterial = new THREE.MeshPhongMaterial({ color: buildingColor });
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            
            building.position.set(x, buildingSize * 0.6, z);
            building.castShadow = true;
            building.receiveShadow = true;
            building.userData = { type: 'building', height: buildingSize * 1.2 };
            scene.add(building);
            obstacles.push(building);
            
            // Add larger roof
            const roofGeometry = new THREE.ConeGeometry(buildingSize * 1.1, buildingSize * 0.8, 4);
            const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a }); // Darker roof
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(x, buildingSize * 1.2 + buildingSize * 0.4, z);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            scene.add(roof);
            
            // Add large door for farm building
            const doorWidth = buildingSize * 0.4;
            const doorHeight = buildingSize * 0.8;
            const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.05);
            const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x2f2f2f }); // Very dark brown door
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(x, buildingSize * 0.4, z + buildingSize * 0.51);
            door.castShadow = true;
            scene.add(door);
            
            // Add door handle for farm building
            const handleGeometry = new THREE.SphereGeometry(0.03, 8, 6);
            const handleMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 }); // Gold handle
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(x + doorWidth * 0.3, buildingSize * 0.4, z + buildingSize * 0.56);
            scene.add(handle);
            
            // Add multiple windows for farm building
            for (let j = 0; j < 2; j++) {
                const windowSize = buildingSize * 0.15;
                const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.05);
                const windowMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x87ceeb, // Sky blue
                    transparent: true,
                    opacity: 0.7
                });
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(x + (j - 0.5) * buildingSize * 0.4, buildingSize * 0.7, z + buildingSize * 0.51);
                window.castShadow = true;
                scene.add(window);
                
                // Add window frame
                const frameGeometry = new THREE.BoxGeometry(windowSize + 0.1, windowSize + 0.1, 0.02);
                const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a }); // Dark brown frame
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                frame.position.set(x + (j - 0.5) * buildingSize * 0.4, buildingSize * 0.7, z + buildingSize * 0.52);
                scene.add(frame);
            }
        }
    }
}

function createTrees() {
    // Create trees with different colors and sizes
    const treeColors = [0x228b22, 0x32cd32, 0x006400, 0x90ee90, 0x98fb98, 0x228b22, 0x556b2f, 0x6b8e23]; // More green variations
    const treeSizes = [3, 4, 5, 6, 7, 8]; // More size variations
    
    // Create regular trees all over the map
    for (let i = 0; i < 30; i++) { // Increased from 15 to 30
        const treeSize = treeSizes[Math.floor(Math.random() * treeSizes.length)];
        const treeColor = treeColors[Math.floor(Math.random() * treeColors.length)];
        
        // Random position across the entire map
        const x = (Math.random() - 0.5) * 170;
        const z = (Math.random() - 0.5) * 170;
        
        // Don't place too close to spawn
        if (Math.sqrt(x * x + z * z) > 20) {
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, treeSize * 0.4, 8);
            const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown trunk
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            
            // Tree foliage (cone shape)
            const foliageGeometry = new THREE.ConeGeometry(treeSize * 0.6, treeSize * 0.8, 8);
            const foliageMaterial = new THREE.MeshPhongMaterial({ color: treeColor });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            
            // Create tree group to keep trunk and foliage together
            const treeGroup = new THREE.Group();
            
            // Position trunk
            trunk.position.set(0, treeSize * 0.2, 0);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            trunk.userData = { type: 'tree', height: treeSize * 0.4 };
            treeGroup.add(trunk);
            obstacles.push(trunk);
            
            // Position foliage on top of trunk (attached to trunk)
            foliage.position.set(0, treeSize * 0.2 + treeSize * 0.4, 0);
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            treeGroup.add(foliage);
            
            // Position the entire tree group
            treeGroup.position.set(x, 0, z);
            scene.add(treeGroup);
            
            // Store tree for animation
            trees.push({
                trunk: trunk,
                foliage: foliage,
                treeGroup: treeGroup,
                originalPosition: new THREE.Vector3(x, treeSize * 0.2 + treeSize * 0.4, z),
                windSpeed: 0.5 + Math.random() * 0.5,
                windTime: Math.random() * Math.PI * 2,
                swayIntensity: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    // Create tall boundary trees around the map edges (reduced count)
    for (let i = 0; i < 20; i++) { // Reduced from 40 to 20
        const treeSize = 8 + Math.random() * 6; // 8-14 units tall (much taller)
        const treeColor = treeColors[Math.floor(Math.random() * treeColors.length)];
        
        // Position around the map boundary
        let x, z;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(side) {
            case 0: // Top boundary
                x = (Math.random() - 0.5) * 200;
                z = -90 - Math.random() * 20;
                break;
            case 1: // Right boundary
                x = 90 + Math.random() * 20;
                z = (Math.random() - 0.5) * 200;
                break;
            case 2: // Bottom boundary
                x = (Math.random() - 0.5) * 200;
                z = 90 + Math.random() * 20;
                break;
            case 3: // Left boundary
                x = -90 - Math.random() * 20;
                z = (Math.random() - 0.5) * 200;
                break;
        }
        
        // Boundary tree trunk (thicker)
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, treeSize * 0.5, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 }); // Darker brown trunk
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        // Boundary tree foliage (smaller and higher)
        const foliageGeometry = new THREE.ConeGeometry(treeSize * 0.4, treeSize * 0.6, 8); // Smaller foliage
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: treeColor });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        
        // Create boundary tree group
        const treeGroup = new THREE.Group();
        
        // Position trunk
        trunk.position.set(0, treeSize * 0.25, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.userData = { type: 'boundaryTree', height: treeSize * 0.5 };
        treeGroup.add(trunk);
        obstacles.push(trunk);
        
        // Position foliage higher up on trunk (attached to trunk)
        foliage.position.set(0, treeSize * 0.25 + treeSize * 0.7, 0); // Higher position
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);
        
        // Position the entire tree group
        treeGroup.position.set(x, 0, z);
        scene.add(treeGroup);
        
        // Store boundary tree for animation
        trees.push({
            trunk: trunk,
            foliage: foliage,
            treeGroup: treeGroup,
            originalPosition: new THREE.Vector3(x, treeSize * 0.25 + treeSize * 0.7, z),
            windSpeed: 0.6 + Math.random() * 0.6, // Slightly faster for boundary trees
            windTime: Math.random() * Math.PI * 2,
            swayIntensity: 0.03 + Math.random() * 0.04 // More sway for taller trees
        });
    }
    
    // Create tall mountain trees near mountains (reduced count)
    for (let i = 0; i < 10; i++) { // Reduced from 20 to 10
        const treeSize = 10 + Math.random() * 8; // 10-18 units tall (very tall)
        const treeColor = treeColors[Math.floor(Math.random() * treeColors.length)];
        
        // Position near mountain areas
        let x, z;
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
            case 0: // Near top mountains
                x = (Math.random() - 0.5) * 180;
                z = -80 - Math.random() * 30;
                break;
            case 1: // Near right mountains
                x = 80 + Math.random() * 30;
                z = (Math.random() - 0.5) * 180;
                break;
            case 2: // Near bottom mountains
                x = (Math.random() - 0.5) * 180;
                z = 80 + Math.random() * 30;
                break;
            case 3: // Near left mountains
                x = -80 - Math.random() * 30;
                z = (Math.random() - 0.5) * 180;
                break;
        }
        
        // Mountain tree trunk (very thick)
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, treeSize * 0.6, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a }); // Very dark brown trunk
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        // Mountain tree foliage (smaller and higher)
        const foliageGeometry = new THREE.ConeGeometry(treeSize * 0.5, treeSize * 0.8, 8); // Smaller foliage
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: treeColor });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        
        // Create mountain tree group
        const treeGroup = new THREE.Group();
        
        // Position trunk
        trunk.position.set(0, treeSize * 0.3, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.userData = { type: 'mountainTree', height: treeSize * 0.6 };
        treeGroup.add(trunk);
        obstacles.push(trunk);
        
        // Position foliage higher up on trunk (attached to trunk)
        foliage.position.set(0, treeSize * 0.3 + treeSize * 0.8, 0); // Higher position
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);
        
        // Position the entire tree group
        treeGroup.position.set(x, 0, z);
        scene.add(treeGroup);
        
        // Store mountain tree for animation
        trees.push({
            trunk: trunk,
            foliage: foliage,
            treeGroup: treeGroup,
            originalPosition: new THREE.Vector3(x, treeSize * 0.3 + treeSize * 0.8, z),
            windSpeed: 0.7 + Math.random() * 0.7, // Faster for mountain trees
            windTime: Math.random() * Math.PI * 2,
            swayIntensity: 0.04 + Math.random() * 0.05 // Most sway for mountain trees
        });
    }
}

function detectLowEndDevice() {
    // Detect low-end devices based on various factors
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    
    // Consider device low-end if it meets multiple criteria
    isLowEndDevice = isMobile && (isSmallScreen || hasLowMemory || hasLowCores);
    
    // Log for debugging
    console.log('Device detection:', {
        isMobile,
        isSmallScreen,
        hasLowMemory,
        hasLowCores,
        isLowEndDevice
    });
}

function setupStartMenu() {
    const startBtn = document.getElementById('startBtn');
    const multiplayerBtn = document.getElementById('multiplayerBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const startMenu = document.getElementById('startMenu');

    // Start button - starts the game
    startBtn.addEventListener('click', () => {
        startGame();
    });

    startBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startGame();
    });

    // Multiplayer button - placeholder for future feature
    multiplayerBtn.addEventListener('click', () => {
        alert('Multiplayer feature coming soon!');
    });

    multiplayerBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        alert('Multiplayer feature coming soon!');
    });

    // Settings button - placeholder for future feature
    settingsBtn.addEventListener('click', () => {
        alert('Settings feature coming soon!');
    });

    settingsBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        alert('Settings feature coming soon!');
    });
}

function startGame() {
    // Add fade-out animation to start menu
    const startMenu = document.getElementById('startMenu');
    startMenu.classList.add('fade-out');
    
    // Start the game after animation
    setTimeout(() => {
        gameStarted = true;
        startMenu.style.display = 'none';
        
        // Show UI elements
        document.getElementById('ui').style.display = 'block';
        if (window.innerWidth <= 1024) {
            document.getElementById('mobileControls').style.display = 'flex';
            document.getElementById('driftBtn').style.display = 'block';
        }
    }, 500); // Match the CSS transition duration
}

init();
