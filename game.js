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

// Deer variables
let deer = null; // The deer object
let deerGroup = null; // Group containing all deer parts
let deerLegs = []; // Array to store deer legs
let deerHead = null; // Deer head
let deerBody = null; // Deer body
let deerTail = null; // Deer tail
let deerEyes = []; // Deer eyes
let deerEars = []; // Deer ears
let deerAntlers = null; // Deer antlers
let deerMovementTime = 0; // Time for deer movement animation
let deerTargetPosition = new THREE.Vector3(0, 0, 0); // Target position for deer
let deerCurrentTarget = 0; // Current target waypoint
let deerWaypoints = []; // Array of waypoints for deer movement
let deerSpeed = 0.02; // Deer movement speed
let deerRotationSpeed = 0.05; // Deer rotation speed
let deerLegAnimationTime = 0; // Time for leg animation
let deerIsMoving = false; // Whether deer is currently moving
let deerSpitCooldown = 0; // Cooldown for deer spitting
let deerSpitProjectiles = []; // Array to store spit projectiles
let deerSpitSpeed = 0.8; // Increased from 0.5 to 0.8 for faster and more accurate projectiles
let deerSpitRange = 35; // Increased from 20 to 35 for longer range
let deerSpitDamage = 100; // Points deducted when spit hits car
let deerHealth = 30; // Deer health (30 hits to kill)
let deerIsDead = false; // Whether deer is currently dead
let deerDeathAnimation = false; // Whether deer is in death animation
let deerRespawnTime = 0; // Time until deer respawns

// Mouse lock variables
let isMouseLocked = false;
let mouseLockEnabled = true; // Can be toggled
let mouseSensitivity = 0.002;

// Car shooting variables
let carBullets = []; // Array to store car bullets
let carShootCooldown = 0; // Cooldown for car shooting
let carShootSpeed = 0.8; // Increased from 0.5 to 0.8 for faster bullets
let carShootDamage = 50; // Points awarded for each hit
let carShootRange = 50; // Maximum range for car bullets
let isShooting = false; // Track if shoot key is pressed
let shootHeatLevel = 0; // Heat level for shooting (0-100)
let shootHeatIncrease = 2; // Reduced from 5 to 2 for slower overheating
let shootHeatDecay = 3; // Increased from 2 to 3 for faster heat decay when not shooting
let shootOverheated = false; // Whether shooting is overheated
let shootOverheatCooldown = 0; // Cooldown when overheated

// Multiplayer variables
let isMultiplayer = false;
let playerId = null;
let otherPlayers = new Map(); // Map of other players by ID
let socket = null;
let multiplayerConnected = false;
let playerName = 'Player' + Math.floor(Math.random() * 1000);
let playerColors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c]; // Different car colors

// Lobby management variables
let lobbyCode = null;
let isHost = false;
let lobbyPlayers = new Map(); // All players in the lobby
let lobbyState = 'menu'; // 'menu', 'creating', 'joining', 'playing'
let joinCodeInput = '';
let playerPositions = new Map(); // Store real player positions
let playerRotations = new Map(); // Store real player rotations

// Socket.IO connection
let serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;

function init() {
    // Ensure start menu is visible by default
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.style.display = 'flex';
    }
    
    // Hide all other menus by default
    const multiplayerOptions = document.getElementById('multiplayerOptions');
    const lobbyUI = document.getElementById('lobbyUI');
    const joinUI = document.getElementById('joinUI');
    
    if (multiplayerOptions) multiplayerOptions.style.display = 'none';
    if (lobbyUI) lobbyUI.style.display = 'none';
    if (joinUI) joinUI.style.display = 'none';
    
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

    // Create deer
    createDeer();

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
    setupMultiplayerEventListeners();

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
        case 'x':
        case 'X': // X key for shooting
            isShooting = true;
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
        case 'Escape': // Exit mouse lock
            if (isMouseLocked) {
                document.exitPointerLock();
            }
            break;
    }
}

function onDocumentMouseMove(event) {
    if (!isMouseLookEnabled || !isMouseLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    // Update camera angle based on mouse movement
    cameraAngle -= movementX * mouseSensitivity;
    
    // Limit camera angle to prevent over-rotation
    cameraAngle = Math.max(-Math.PI, Math.min(Math.PI, cameraAngle));
}

function onDocumentClick(event) {
    if (!mouseLockEnabled) return;
    
    // Only handle clicks on the game canvas
    if (event.target === renderer.domElement) {
        if (!isMouseLocked) {
            // Request pointer lock
            renderer.domElement.requestPointerLock();
        } else {
            // Exit pointer lock
            document.exitPointerLock();
        }
    }
}

// Mouse lock event listeners
document.addEventListener('pointerlockchange', onPointerLockChange, false);
document.addEventListener('pointerlockerror', onPointerLockError, false);

function onPointerLockChange() {
    if (document.pointerLockElement === renderer.domElement) {
        isMouseLocked = true;
        isMouseLookEnabled = true;
        document.body.style.cursor = 'none';
    } else {
        isMouseLocked = false;
        isMouseLookEnabled = false;
        document.body.style.cursor = 'default';
    }
}

function onPointerLockError() {
    console.log('Pointer lock failed');
    isMouseLocked = false;
    isMouseLookEnabled = false;
    document.body.style.cursor = 'default';
}

// Mouse event listeners
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('click', onDocumentClick, false);

function setupMobileControls() {
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const driftBtn = document.getElementById('driftBtn');
    const shootBtn = document.getElementById('shootBtn');

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
    
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isShooting = true;
        shootBtn.classList.add('active');
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
    
    shootBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        isShooting = false;
        shootBtn.classList.remove('active');
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
    
    shootBtn.addEventListener('mousedown', () => { 
        isShooting = true;
        shootBtn.classList.add('active'); 
    });
    shootBtn.addEventListener('mouseup', () => { 
        isShooting = false;
        shootBtn.classList.remove('active'); 
    });

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
        case 'x':
        case 'X': // X key for shooting
            isShooting = false;
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
        updateDeer();
        updateDeerSpitProjectiles();
        updateCarBullets();
        updateCornerNotices();
        updateUI();
        
        // Send player updates in multiplayer
        if (isMultiplayer && multiplayerConnected) {
            sendPlayerUpdate();
        }
        
        // Update cooldowns
        carShootCooldown = Math.max(0, carShootCooldown - 0.016);
        
        // Handle continuous shooting
        if (isShooting && carShootCooldown <= 0 && !shootOverheated) {
            createCarBullet();
            carShootCooldown = 0.1; // Reduced from 0.5 to 0.1 for more continuous shooting
            
            // Increase heat level
            shootHeatLevel = Math.min(100, shootHeatLevel + shootHeatIncrease);
            
            // Check if overheated
            if (shootHeatLevel >= 100) {
                shootOverheated = true;
                shootOverheatCooldown = 8; // Increased back to 8 seconds of cooldown
            }
        }
        
        // Handle heat decay when not shooting
        if (!isShooting && shootHeatLevel > 0) {
            shootHeatLevel = Math.max(0, shootHeatLevel - shootHeatDecay);
        }
        
        // Handle overheat cooldown
        if (shootOverheated) {
            shootOverheatCooldown = Math.max(0, shootOverheatCooldown - 0.016);
            if (shootOverheatCooldown <= 0) {
                shootOverheated = false;
                shootHeatLevel = 0; // Reset heat when cooldown is done
            }
        }
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
             tallGrassPatch.position.set(x, (tallGrassHeight / 2) - 0.2, z); // Moved down by 0.2 units
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
    
    // Update heat bar
    const heatBarFill = document.getElementById('heatBarFill');
    const heatBarText = document.getElementById('heatBarText');
    if (heatBarFill && heatBarText) {
        heatBarFill.style.width = shootHeatLevel + '%';
        
        if (shootOverheated) {
            const remainingTime = shootOverheatCooldown.toFixed(1);
            heatBarText.innerText = `OVERHEATED! ${remainingTime}s`;
            heatBarFill.style.background = '#ff0000';
            heatBarText.style.color = '#ff4444';
            heatBarText.style.textShadow = '0 0 10px #ff4444';
        } else {
            const heatPercent = Math.round(shootHeatLevel);
            heatBarText.innerText = `HEAT: ${heatPercent}%`;
            heatBarText.style.color = 'white';
            heatBarText.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';
            
            // Change color based on heat level
            if (shootHeatLevel < 50) {
                heatBarFill.style.background = '#00ff00'; // Green
            } else if (shootHeatLevel < 80) {
                heatBarFill.style.background = '#ffff00'; // Yellow
            } else {
                heatBarFill.style.background = '#ff0000'; // Red
            }
        }
    }
    
    // Update multiplayer status
    updateMultiplayerUI();
    
    // Show deer spit warning when deer is spitting
    const deerSpitWarning = document.getElementById('deerSpitWarning');
    if (deer && deerGroup && !deerIsDead) {
        const distanceToCar = deerGroup.position.distanceTo(car.position);
        if (distanceToCar < deerSpitRange && distanceToCar > 5 && deerSpitCooldown <= 0) {
            if (deerSpitWarning) {
                deerSpitWarning.style.display = 'block';
                deerSpitWarning.innerText = 'DEER SPITTING! -100 points if hit!';
            }
        } else {
            if (deerSpitWarning) {
                deerSpitWarning.style.display = 'none';
            }
        }
    } else {
        if (deerSpitWarning) {
            deerSpitWarning.style.display = 'none';
        }
    }
    
    // Show deer health if deer exists and is not dead
    const deerHealthDisplay = document.getElementById('deerHealth');
    if (deerHealthDisplay && deer && !deerIsDead) {
        deerHealthDisplay.style.display = 'block';
        deerHealthDisplay.innerText = `Deer Health: ${deerHealth}/30`;
    } else if (deerHealthDisplay) {
        deerHealthDisplay.style.display = 'none';
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
    // Reset shooting variables
    isShooting = false;
    carShootCooldown = 0;
    carBullets = [];
    shootHeatLevel = 0;
    shootOverheated = false;
    shootOverheatCooldown = 0;
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
            
            const trunkHeight = treeSize * 0.4;
            trunk.position.set(0, trunkHeight / 2, 0); // base at y=0
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            trunk.userData = { type: 'tree', height: trunkHeight };
            treeGroup.add(trunk);
            obstacles.push(trunk);

            // Branch
            const branchHeight = 0.15 * treeSize;
            const branchGeometry = new THREE.CylinderGeometry(0.08 * treeSize, 0.06 * treeSize, branchHeight, 8);
            const branchMaterial = new THREE.MeshPhongMaterial({ color: 0x8b5c2a });
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.set(0, trunkHeight + branchHeight / 2, 0);
            branch.castShadow = true;
            branch.receiveShadow = true;
            treeGroup.add(branch);

            // Foliage
            foliage.position.set(0, trunkHeight + branchHeight + (treeSize * 0.4) / 2, 0);
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            treeGroup.add(foliage);

            // Place tree group on ground
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
        

        const trunkHeight = treeSize * 0.5;
        trunk.position.set(0, trunkHeight / 2, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.userData = { type: 'boundaryTree', height: trunkHeight };
        treeGroup.add(trunk);
        obstacles.push(trunk);

        // Branch
        const branchHeight = 0.15 * treeSize;
        const branchGeometry = new THREE.CylinderGeometry(0.08 * treeSize, 0.06 * treeSize, branchHeight, 8);
        const branchMaterial = new THREE.MeshPhongMaterial({ color: 0x8b5c2a });
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.set(0, trunkHeight + branchHeight / 2, 0);
        branch.castShadow = true;
        branch.receiveShadow = true;
        treeGroup.add(branch);

        // Foliage
        foliage.position.set(0, trunkHeight + branchHeight + (treeSize * 0.7) / 2, 0);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);

        // Place tree group on ground
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
        
        const trunkHeight = treeSize * 0.6;
        trunk.position.set(0, trunkHeight / 2, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.userData = { type: 'mountainTree', height: trunkHeight };
        treeGroup.add(trunk);
        obstacles.push(trunk);

        // Branch
        const branchHeight = 0.15 * treeSize;
        const branchGeometry = new THREE.CylinderGeometry(0.08 * treeSize, 0.06 * treeSize, branchHeight, 8);
        const branchMaterial = new THREE.MeshPhongMaterial({ color: 0x8b5c2a });
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.set(0, trunkHeight + branchHeight / 2, 0);
        branch.castShadow = true;
        branch.receiveShadow = true;
        treeGroup.add(branch);

        // Foliage
        foliage.position.set(0, trunkHeight + branchHeight + (treeSize * 0.8) / 2, 0);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);

        // Place tree group on ground
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

    // Multiplayer button - shows multiplayer options
    multiplayerBtn.addEventListener('click', () => {
        showMultiplayerOptions();
    });

    multiplayerBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showMultiplayerOptions();
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

function showMultiplayerOptions() {
    // Hide start menu
    const startMenu = document.getElementById('startMenu');
    startMenu.style.display = 'none';
    
    // Show multiplayer options
    const multiplayerOptions = document.getElementById('multiplayerOptions');
    if (multiplayerOptions) {
        multiplayerOptions.style.display = 'flex';
    }
    
    // Connect to multiplayer server
    connectToMultiplayer();
}

function startMultiplayerGame() {
    // Add fade-out animation to start menu
    const startMenu = document.getElementById('startMenu');
    startMenu.classList.add('fade-out');
    
    // Start the game after animation
    setTimeout(() => {
        isMultiplayer = true;
        gameStarted = true;
        startMenu.style.display = 'none';
        
        // Show UI elements
        document.getElementById('ui').style.display = 'block';
        document.getElementById('heatBar').style.display = 'block';
        if (window.innerWidth <= 1024) {
            document.getElementById('mobileControls').style.display = 'flex';
            document.getElementById('driftBtn').style.display = 'block';
            document.getElementById('shootBtn').style.display = 'block';
        }
        
        // Update multiplayer UI to show lobby code
        updateMultiplayerUI();
    }, 500); // Match the CSS transition duration
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
        document.getElementById('heatBar').style.display = 'block';
        if (window.innerWidth <= 1024) {
            document.getElementById('mobileControls').style.display = 'flex';
            document.getElementById('driftBtn').style.display = 'block';
            document.getElementById('shootBtn').style.display = 'block';
        }
        
        // Hide lobby code display for single player
        const lobbyCodeDisplay = document.getElementById('lobbyCodeDisplay');
        if (lobbyCodeDisplay) {
            lobbyCodeDisplay.style.display = 'none';
        }
    }, 500); // Match the CSS transition duration
}

function createDeer() {
    // Create deer group to hold all parts
    deerGroup = new THREE.Group();
    
    // Deer body (main body) - using cylinder instead of capsule
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
    deerBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    deerBody.position.set(0, 0.8, 0);
    deerBody.rotation.x = Math.PI / 2; // Rotate 90 degrees to make it horizontal
    deerBody.castShadow = true;
    deerBody.receiveShadow = true;
    deerGroup.add(deerBody);
    
    // Deer head - using sphere instead of capsule
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    deerHead = new THREE.Mesh(headGeometry, headMaterial);
    deerHead.position.set(0, 1.1, -0.8);
    deerHead.rotation.x = Math.PI / 6; // Tilt head slightly down
    deerHead.castShadow = true;
    deerHead.receiveShadow = true;
    deerGroup.add(deerHead);
    
    // Deer eyes
    const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 6);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black eyes
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 0.05, -0.25);
    deerHead.add(leftEye);
    deerEyes.push(leftEye);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 0.05, -0.25);
    deerHead.add(rightEye);
    deerEyes.push(rightEye);
    
    // Deer ears
    const earGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
    const earMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    
    // Left ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.12, 0.2, -0.2);
    leftEar.rotation.x = -Math.PI / 6;
    leftEar.rotation.z = -Math.PI / 8;
    deerHead.add(leftEar);
    deerEars.push(leftEar);
    
    // Right ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.12, 0.2, -0.2);
    rightEar.rotation.x = -Math.PI / 6;
    rightEar.rotation.z = Math.PI / 8;
    deerHead.add(rightEar);
    deerEars.push(rightEar);
    
    // Deer antlers (simple branched antlers)
    const antlerGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4);
    const antlerMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 }); // Dark brown
    
    deerAntlers = new THREE.Group();
    
    // Main antler branches
    for (let i = 0; i < 3; i++) {
        const antler = new THREE.Mesh(antlerGeometry, antlerMaterial);
        antler.position.set(0, 0.2 + i * 0.15, 0);
        antler.rotation.x = Math.PI / 2;
        antler.rotation.z = (i - 1) * Math.PI / 6;
        deerAntlers.add(antler);
    }
    
    deerAntlers.position.set(0, 0.3, -0.1);
    deerHead.add(deerAntlers);
    
    // Deer tail - using cylinder instead of capsule
    const tailGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    deerTail = new THREE.Mesh(tailGeometry, tailMaterial);
    deerTail.position.set(0, 0.8, 0.7);
    deerTail.rotation.x = Math.PI / 4; // Tilt tail up
    deerTail.castShadow = true;
    deerTail.receiveShadow = true;
    deerGroup.add(deerTail);
    
    // Deer legs (4 legs)
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    
    const legPositions = [
        { x: -0.25, z: -0.4, name: 'frontLeft' },   // Front left
        { x: 0.25, z: -0.4, name: 'frontRight' },   // Front right
        { x: -0.25, z: 0.4, name: 'rearLeft' },     // Rear left
        { x: 0.25, z: 0.4, name: 'rearRight' }      // Rear right
    ];
    
    legPositions.forEach(legData => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(legData.x, 0.4, legData.z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        leg.name = legData.name;
        deerGroup.add(leg);
        deerLegs.push(leg);
    });
    
    // Position deer at a random location on the farm
    const deerX = (Math.random() - 0.5) * 100;
    const deerZ = (Math.random() - 0.5) * 100;
    deerGroup.position.set(deerX, 0, deerZ);
    
    // Create waypoints for deer movement
    createDeerWaypoints();
    
    // Set initial target
    deerTargetPosition.copy(deerWaypoints[0]);
    
    scene.add(deerGroup);
    deer = deerGroup;
}

function createDeerWaypoints() {
    // Create waypoints around the farm for deer to move between
    deerWaypoints = [
        new THREE.Vector3(-30, 0, -20),
        new THREE.Vector3(20, 0, -40),
        new THREE.Vector3(40, 0, 10),
        new THREE.Vector3(10, 0, 30),
        new THREE.Vector3(-20, 0, 40),
        new THREE.Vector3(-50, 0, 0),
        new THREE.Vector3(0, 0, -50),
        new THREE.Vector3(50, 0, 20),
        new THREE.Vector3(-40, 0, 30),
        new THREE.Vector3(30, 0, -30)
    ];
}

function updateDeer() {
    if (!deer || !deerGroup || deerIsDead) return;
    
    deerMovementTime += 0.016; // Approximate 60fps
    deerLegAnimationTime += 0.016;
    deerSpitCooldown = Math.max(0, deerSpitCooldown - 0.016); // Reduce cooldown
    
    // Calculate distance to current target
    const currentPosition = deerGroup.position;
    const distanceToTarget = currentPosition.distanceTo(deerTargetPosition);
    
    // If close to target, move to next waypoint
    if (distanceToTarget < 2) {
        deerCurrentTarget = (deerCurrentTarget + 1) % deerWaypoints.length;
        deerTargetPosition.copy(deerWaypoints[deerCurrentTarget]);
        
        // Add some randomness to movement
        deerTargetPosition.x += (Math.random() - 0.5) * 10;
        deerTargetPosition.z += (Math.random() - 0.5) * 10;
    }
    
    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(deerTargetPosition, currentPosition);
    direction.y = 0; // Keep movement on ground plane
    direction.normalize();
    
    // Move deer towards target
    if (distanceToTarget > 1) {
        deerIsMoving = true;
        
        // Move deer position
        const movement = direction.clone().multiplyScalar(deerSpeed);
        deerGroup.position.add(movement);
        
        // Rotate deer to face movement direction
        const targetRotation = Math.atan2(direction.x, direction.z) + Math.PI; // Add PI to face the correct direction
        const currentRotation = deerGroup.rotation.y;
        
        // Smooth rotation
        let rotationDiff = targetRotation - currentRotation;
        if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
        if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
        
        deerGroup.rotation.y += rotationDiff * deerRotationSpeed;
        
        // Animate legs when moving
        animateDeerLegs();
        
        // Animate tail wagging
        deerTail.rotation.x = Math.PI / 4 + Math.sin(deerMovementTime * 3) * 0.1;
        
        // Animate ears slightly
        deerEars[0].rotation.x = -Math.PI / 6 + Math.sin(deerMovementTime * 2) * 0.05;
        deerEars[1].rotation.x = -Math.PI / 6 + Math.sin(deerMovementTime * 2) * 0.05;
        
    } else {
        deerIsMoving = false;
        
        // Reset leg positions when not moving
        deerLegs.forEach(leg => {
            leg.rotation.x = 0;
        });
        
        // Gentle tail movement when idle
        deerTail.rotation.x = Math.PI / 4 + Math.sin(deerMovementTime * 0.5) * 0.05;
    }
    
    // Check if car is nearby and make deer run away
    const distanceToCar = currentPosition.distanceTo(car.position);
    if (distanceToCar < 15) {
        // Deer gets scared and runs away from car
        const awayFromCar = new THREE.Vector3();
        awayFromCar.subVectors(currentPosition, car.position);
        awayFromCar.y = 0;
        awayFromCar.normalize();
        
        // Move deer away from car faster
        const escapeMovement = awayFromCar.clone().multiplyScalar(deerSpeed * 8); // Increased from 3 to 8 for much faster escape
        deerGroup.position.add(escapeMovement);
        
        // Rotate deer to face escape direction
        const escapeRotation = Math.atan2(awayFromCar.x, awayFromCar.z) + Math.PI; // Add PI to face the correct direction
        deerGroup.rotation.y = escapeRotation;
        
        // Animate legs faster when escaping
        animateDeerLegs(4); // Increased from 2 to 4 for faster leg movement when escaping
        
        // Animate tail more when scared
        deerTail.rotation.x = Math.PI / 4 + Math.sin(deerMovementTime * 5) * 0.15;
    }
    
    // Deer spit attack when car is in range and cooldown is ready
    if (distanceToCar < deerSpitRange && distanceToCar > 5 && deerSpitCooldown <= 0) {
        // Deer spits at the car with improved accuracy
        createDeerSpitProjectile();
        deerSpitCooldown = 2; // Reduced from 3 to 2 seconds for more frequent spitting
    }
    
    // Keep deer within map boundaries
    if (Math.abs(deerGroup.position.x) > 80) {
        deerGroup.position.x = Math.sign(deerGroup.position.x) * 80;
    }
    if (Math.abs(deerGroup.position.z) > 80) {
        deerGroup.position.z = Math.sign(deerGroup.position.z) * 80;
    }
}

function createDeerSpitProjectile() {
    if (!deerGroup) return;
    
    // Create spit projectile (larger sphere with glow effect)
    const spitGeometry = new THREE.SphereGeometry(0.15, 8, 6); // Increased size from 0.1 to 0.15
    const spitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x90EE90, // Light green spit
        transparent: true,
        opacity: 0.9, // Increased opacity
        emissive: 0x45EE45, // Add glow effect
        emissiveIntensity: 0.3
    });
    const spitProjectile = new THREE.Mesh(spitGeometry, spitMaterial);
    
    // Add a glow ring around the spit projectile
    const glowGeometry = new THREE.RingGeometry(0.2, 0.25, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x90EE90,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
    glowRing.rotation.x = Math.PI / 2; // Make it horizontal
    spitProjectile.add(glowRing);
    
    // Position spit at deer's mouth (head position)
    const deerHeadPosition = new THREE.Vector3();
    deerHead.getWorldPosition(deerHeadPosition);
    deerHeadPosition.y += 0.2; // Raise the starting position slightly
    spitProjectile.position.copy(deerHeadPosition);
    
    // Calculate direction to car with better targeting
    const directionToCar = new THREE.Vector3();
    directionToCar.subVectors(car.position, deerHeadPosition);
    
    // Adjust target to aim at car's center height
    const carCenterHeight = car.position.y + 0.3; // Aim at car's center
    directionToCar.y = carCenterHeight - deerHeadPosition.y;
    
    directionToCar.normalize();
    
    // Add minimal randomness to the spit trajectory for better accuracy
    directionToCar.x += (Math.random() - 0.5) * 0.05; // Reduced from 0.1 to 0.05
    directionToCar.y += (Math.random() - 0.5) * 0.02; // Reduced from 0.05 to 0.02
    directionToCar.z += (Math.random() - 0.5) * 0.05; // Reduced from 0.1 to 0.05
    directionToCar.normalize();
    
    // Ensure the projectile aims at the car's height level
    directionToCar.y = Math.max(0, directionToCar.y); // Keep it horizontal or slightly upward
    
    // Store projectile data
    spitProjectile.userData = {
        velocity: directionToCar.clone().multiplyScalar(deerSpitSpeed),
        life: 0,
        maxLife: 90, // Increased from 60 to 90 for longer travel distance
        damage: deerSpitDamage
    };
    
    scene.add(spitProjectile);
    deerSpitProjectiles.push(spitProjectile);
    
    // Add spit animation to deer head
    animateDeerSpit();
}

function animateDeerSpit() {
    if (!deerHead) return;
    
    // Store original head position
    const originalPosition = deerHead.position.clone();
    const originalRotation = deerHead.rotation.clone();
    
    // Spit animation sequence
    let animationStep = 0;
    const totalSteps = 10;
    
    const spitAnimation = () => {
        if (animationStep >= totalSteps) {
            // Reset head position
            deerHead.position.copy(originalPosition);
            deerHead.rotation.copy(originalRotation);
            return;
        }
        
        const progress = animationStep / totalSteps;
        const spitMotion = Math.sin(progress * Math.PI * 2) * 0.1; // Back and forth motion
        
        // Move head back and forth like spitting
        deerHead.position.z = originalPosition.z + spitMotion;
        deerHead.rotation.x = originalRotation.x + spitMotion * 0.5;
        
        animationStep++;
        requestAnimationFrame(spitAnimation);
    };
    
    spitAnimation();
}

function updateDeerSpitProjectiles() {
    // Update all spit projectiles
    for (let i = deerSpitProjectiles.length - 1; i >= 0; i--) {
        const projectile = deerSpitProjectiles[i];
        
        if (!projectile.userData) continue;
        
        // Update projectile life
        projectile.userData.life += 1;
        
        // Move projectile
        projectile.position.add(projectile.userData.velocity);
        
        // Apply gravity to projectile
        projectile.userData.velocity.y -= 0.01;
        
        // Check collision with car
        const distanceToCar = projectile.position.distanceTo(car.position);
        if (distanceToCar < 1) {
            // Hit the car!
            score -= projectile.userData.damage;
            
            // Create hit effect (small explosion)
            createSpitHitEffect(projectile.position);
            
            // Remove projectile
            scene.remove(projectile);
            deerSpitProjectiles.splice(i, 1);
            continue;
        }
        
        // Remove projectile if it hits ground or times out
        if (projectile.position.y < 0 || projectile.userData.life >= projectile.userData.maxLife) {
            scene.remove(projectile);
            deerSpitProjectiles.splice(i, 1);
        }
    }
}

function createSpitHitEffect(position) {
    // Create a small explosion effect when spit hits the car
    for (let i = 0; i < 12; i++) { // Increased from 8 to 12 particles
        const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x90EE90, // Light green
            transparent: true,
            opacity: 0.7
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Position particles around hit point
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.5 + Math.random() * 0.5;
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + Math.random() * 0.5,
            position.z + Math.sin(angle) * radius
        );
        
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3, // Increased velocity
                Math.random() * 0.4, // More upward movement
                (Math.random() - 0.5) * 0.3
            ),
            life: 0,
            maxLife: 40 // Increased life
        };
        
        scene.add(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parent) {
                scene.remove(particle);
            }
        }, 700); // Increased duration
    }
    
    // Add screen flash effect
    createScreenFlash();
}

function createScreenFlash() {
    // Create a temporary flash overlay
    const flashOverlay = document.createElement('div');
    flashOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 68, 68, 0.3);
        z-index: 1000;
        pointer-events: none;
        transition: opacity 0.2s ease;
    `;
    
    document.body.appendChild(flashOverlay);
    
    // Flash effect
    setTimeout(() => {
        flashOverlay.style.opacity = '0';
        setTimeout(() => {
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
            }
        }, 200);
    }, 100);
}

function animateDeerLegs(speedMultiplier = 1) {
    if (!deerLegs.length) return;
    
    const legSpeed = deerLegAnimationTime * 4 * speedMultiplier;
    
    // Animate front legs (opposite phase)
    deerLegs[0].rotation.x = Math.sin(legSpeed) * 0.3; // Front left
    deerLegs[1].rotation.x = Math.sin(legSpeed + Math.PI) * 0.3; // Front right
    
    // Animate rear legs (opposite phase from front)
    deerLegs[2].rotation.x = Math.sin(legSpeed + Math.PI) * 0.3; // Rear left
    deerLegs[3].rotation.x = Math.sin(legSpeed) * 0.3; // Rear right
}

function createCarBullet() {
    if (!car) return;
    
    // Create bullet projectile (small sphere)
    const bulletGeometry = new THREE.SphereGeometry(0.08, 6, 4);
    const bulletMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700, // Gold bullet
        transparent: true,
        opacity: 0.9,
        emissive: 0xFFA500, // Orange glow
        emissiveIntensity: 0.4
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at car's front (headlight position)
    const bulletPosition = new THREE.Vector3();
    bulletPosition.copy(car.position);
    bulletPosition.y += 0.3; // Slightly above car
    
    // Calculate forward direction based on car rotation
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    forwardDirection.applyQuaternion(car.quaternion);
    forwardDirection.y = 0; // Keep bullet horizontal
    forwardDirection.normalize();
    
    // Add less spread to bullets for more accurate shooting
    forwardDirection.x += (Math.random() - 0.5) * 0.05; // Reduced from 0.1 to 0.05
    forwardDirection.z += (Math.random() - 0.5) * 0.05; // Reduced from 0.1 to 0.05
    forwardDirection.normalize();
    
    bullet.position.copy(bulletPosition);
    
    // Store bullet data
    bullet.userData = {
        velocity: forwardDirection.clone().multiplyScalar(carShootSpeed),
        life: 0,
        maxLife: 120, // 2 seconds at 60fps
        damage: carShootDamage
    };
    
    scene.add(bullet);
    carBullets.push(bullet);
    
    // Send shooting event to server in multiplayer
    if (isMultiplayer && socket) {
        socket.emit('playerShoot', {
            position: bulletPosition,
            direction: forwardDirection,
            speed: carShootSpeed
        });
    }
}

function updateCarBullets() {
    // Update all car bullets
    for (let i = carBullets.length - 1; i >= 0; i--) {
        const bullet = carBullets[i];
        
        if (!bullet.userData) continue;
        
        // Update bullet life
        bullet.userData.life += 1;
        
        // Move bullet
        bullet.position.add(bullet.userData.velocity);
        
        // Check collision with deer
        if (deer && deerGroup && !deerIsDead) {
            const distanceToDeer = bullet.position.distanceTo(deerGroup.position);
            if (distanceToDeer < 1) {
                // Hit the deer!
                hitDeer();
                
                // Create hit effect
                createBulletHitEffect(bullet.position);
                
                // Remove bullet
                scene.remove(bullet);
                carBullets.splice(i, 1);
                continue;
            }
        }
        
        // Remove bullet if it hits ground or times out
        if (bullet.position.y < 0 || bullet.userData.life >= bullet.userData.maxLife) {
            scene.remove(bullet);
            carBullets.splice(i, 1);
        }
    }
}

function hitDeer() {
    if (deerIsDead || deerDeathAnimation) return;
    
    // Reduce deer health
    deerHealth--;
    
    // Award points
    score += carShootDamage;
    
    // Send deer hit event to server in multiplayer
    if (isMultiplayer && socket) {
        socket.emit('playerHitDeer', {
            deerHealth: deerHealth,
            damage: carShootDamage
        });
    }
    
    // Check if deer is dead
    if (deerHealth <= 0) {
        killDeer();
    }
}

function killDeer() {
    if (deerIsDead || deerDeathAnimation) return;
    
    deerIsDead = true;
    deerDeathAnimation = true;
    
    // Start death animation (folding like grass)
    animateDeerDeath();
}

function animateDeerDeath() {
    if (!deerGroup) return;
    
    // Store original positions and rotations
    const originalPositions = [];
    const originalRotations = [];
    
    // Store all deer parts
    const deerParts = [deerBody, deerHead, deerTail, ...deerLegs, ...deerEars, deerAntlers];
    deerParts.forEach(part => {
        if (part) {
            originalPositions.push(part.position.clone());
            originalRotations.push(part.rotation.clone());
        }
    });
    
    // Death animation sequence
    let animationStep = 0;
    const totalSteps = 30;
    
    const deathAnimation = () => {
        if (animationStep >= totalSteps) {
            // Animation complete, respawn deer
            respawnDeer();
            return;
        }
        
        const progress = animationStep / totalSteps;
        const fallProgress = Math.sin(progress * Math.PI / 2); // Smooth fall
        
        // Animate each part falling
        deerParts.forEach((part, index) => {
            if (part && originalPositions[index]) {
                // Rotate part to fall over
                part.rotation.z = originalRotations[index].z + fallProgress * Math.PI / 2;
                
                // Move part down as it falls
                const originalY = originalPositions[index].y;
                part.position.y = originalY - fallProgress * 0.5;
            }
        });
        
        animationStep++;
        requestAnimationFrame(deathAnimation);
    };
    
    deathAnimation();
}

function respawnDeer() {
    // Reset deer state
    deerIsDead = false;
    deerDeathAnimation = false;
    deerHealth = 30;
    deerRespawnTime = 5; // 5 seconds until respawn
    
    // Remove old deer
    if (deerGroup && deerGroup.parent) {
        scene.remove(deerGroup);
    }
    
    // Clear arrays
    deerLegs = [];
    deerEyes = [];
    deerEars = [];
    deerSpitProjectiles = [];
    
    // Create new deer at random location
    setTimeout(() => {
        createDeer();
    }, 5000); // 5 second delay
}

function createBulletHitEffect(position) {
    // Create a small explosion effect when bullet hits deer
    for (let i = 0; i < 6; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700, // Gold
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Position particles around hit point
        const angle = (i / 6) * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.3;
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + Math.random() * 0.3,
            position.z + Math.sin(angle) * radius
        );
        
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.2
            ),
            life: 0,
            maxLife: 20
        };
        
        scene.add(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parent) {
                scene.remove(particle);
            }
        }, 400);
    }
}

function createOtherPlayerBullet(otherPlayer, bulletData) {
    // Create bullet for other player's shooting
    const bulletGeometry = new THREE.SphereGeometry(0.08, 6, 4);
    const bulletMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700, // Gold bullet
        transparent: true,
        opacity: 0.9,
        emissive: 0xFFA500, // Orange glow
        emissiveIntensity: 0.4
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at other player's car
    bullet.position.copy(otherPlayer.position);
    bullet.position.y += 0.3;
    
    // Calculate direction from bullet data
    const direction = new THREE.Vector3(
        bulletData.direction.x,
        bulletData.direction.y,
        bulletData.direction.z
    );
    
    // Store bullet data
    bullet.userData = {
        velocity: direction.clone().multiplyScalar(bulletData.speed),
        life: 0,
        maxLife: 120,
        damage: carShootDamage
    };
    
    scene.add(bullet);
    carBullets.push(bullet);
}

function connectToMultiplayer() {
    if (socket) {
        socket.disconnect();
    }
    
    console.log('Connecting to multiplayer server...');
    
    // Connect to Socket.IO server
    socket = io(serverUrl);
    
    socket.on('connect', () => {
        multiplayerConnected = true;
        playerId = socket.id;
        console.log('Connected to multiplayer server! Player ID:', playerId);
        updateMultiplayerUI();
    });
    
    socket.on('disconnect', () => {
        multiplayerConnected = false;
        console.log('Disconnected from multiplayer server');
        updateMultiplayerUI();
    });
    
    // Handle lobby creation response
    socket.on('lobbyCreated', (data) => {
        lobbyCode = data.code;
        console.log('Lobby created:', lobbyCode);
        
        // Add all players to lobby
        data.players.forEach(player => {
            lobbyPlayers.set(player.id, player);
            if (player.id !== playerId) {
                createOtherPlayer(player.id, player.name, player.color);
            }
        });
        
        updateLobbyPlayerList();
        showLobbyCreationUI();
    });
    
    // Handle lobby join response
    socket.on('playerJoined', (data) => {
        console.log('Player joined:', data.player.name);
        
        // Add new player to lobby
        lobbyPlayers.set(data.player.id, data.player);
        
        // Create other player car if not self
        if (data.player.id !== playerId) {
            createOtherPlayer(data.player.id, data.player.name, data.player.color);
        }
        
        updateLobbyPlayerList();
    });
    
    // Handle lobby errors
    socket.on('lobbyError', (data) => {
        console.log('Lobby error:', data.message);
        alert('Lobby error: ' + data.message);
    });
    
    // Handle late join (when game has already started)
    socket.on('lateJoin', (data) => {
        console.log('Late join:', data.message);
        
        // Create other players that are already in the game
        data.players.forEach(player => {
            if (player.id !== playerId) {
                createOtherPlayer(player.id, player.name, player.color);
            }
        });
        
        // Hide lobby UI and start game immediately
        const lobbyUI = document.getElementById('lobbyUI');
        if (lobbyUI) {
            lobbyUI.style.display = 'none';
        }
        
        // Start the multiplayer game
        startMultiplayerGame();
        
        // Show a notification
        alert('Game already started! Joining as late player.');
    });
    
    // Handle game start
    socket.on('gameStarted', (data) => {
        console.log('Game started with players:', data.players);
        
        // Create other players
        data.players.forEach(player => {
            if (player.id !== playerId) {
                createOtherPlayer(player.id, player.name, player.color);
            }
        });
        
        // Hide lobby UI and start game
        const lobbyUI = document.getElementById('lobbyUI');
        if (lobbyUI) {
            lobbyUI.style.display = 'none';
        }
        
        startMultiplayerGame();
    });
    
    // Handle player movement updates
    socket.on('playerMoved', (data) => {
        const otherPlayer = otherPlayers.get(data.id);
        if (otherPlayer) {
            // Smoothly interpolate to new position
            const targetPosition = new THREE.Vector3(
                data.position.x,
                data.position.y,
                data.position.z
            );
            
            otherPlayer.position.lerp(targetPosition, 0.1);
            otherPlayer.rotation.y = data.rotation;
            
            // Update player data
            otherPlayer.userData.speed = data.speed;
            otherPlayer.userData.isShooting = data.isShooting;
        }
    });
    
    // Handle player shooting
    socket.on('playerShot', (data) => {
        const otherPlayer = otherPlayers.get(data.id);
        if (otherPlayer) {
            // Create bullet effect for other player
            createOtherPlayerBullet(otherPlayer, data.bulletData);
        }
    });
    
    // Handle deer hit by other player
    socket.on('deerHit', (data) => {
        // Update deer state for all players
        if (deer && !deerIsDead) {
            hitDeer();
        }
    });
    
    // Handle player leaving
    socket.on('playerLeft', (data) => {
        console.log('Player left:', data.id);
        
        // Remove player from lobby
        lobbyPlayers.delete(data.id);
        
        // Remove other player car
        const otherPlayer = otherPlayers.get(data.id);
        if (otherPlayer) {
            scene.remove(otherPlayer);
            otherPlayers.delete(data.id);
        }
        
        updateLobbyPlayerList();
    });
    
    // Handle new host assignment
    socket.on('newHost', (data) => {
        console.log('New host assigned:', data.hostId);
        if (data.hostId === playerId) {
            isHost = true;
            console.log('You are now the host!');
        }
    });
}

// Mock players function removed - now using real Socket.IO multiplayer

function createOtherPlayer(id, name, color = null) {
    // Create car for other player
    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carColor = color || playerColors[Math.floor(Math.random() * playerColors.length)];
    const carMaterial = new THREE.MeshPhongMaterial({
        color: carColor,
        shininess: 80,
        specular: 0x5dade2
    });
    const otherCar = new THREE.Mesh(carGeometry, carMaterial);
    otherCar.castShadow = true;
    otherCar.receiveShadow = true;
    otherCar.position.set(0, 0.25, 0);
    
    // Add headlights
    const headlightGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const headlightMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffcc,
        shininess: 200,
        specular: 0xffffff,
        emissive: 0x333300
    });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.3, 0.15, -1.1);
    leftHeadlight.castShadow = true;
    otherCar.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.3, 0.15, -1.1);
    rightHeadlight.castShadow = true;
    otherCar.add(rightHeadlight);
    
    // Add wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12);
    const wheelMaterial = new THREE.MeshPhongMaterial({
        color: 0x2e2e2e,
        shininess: 30
    });
    
    const wheelPositions = [
        {pos: [-0.5, -0.1, 0.7], name: 'frontLeft'},
        {pos: [0.5, -0.1, 0.7], name: 'frontRight'},
        {pos: [-0.5, -0.1, -0.7], name: 'rearLeft'},
        {pos: [0.5, -0.1, -0.7], name: 'rearRight'}
    ];
    
    wheelPositions.forEach(wheelData => {
        const wheelGroup = new THREE.Group();
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheelGroup.add(wheel);
        
        // Add wheel patterns
        for (let i = 0; i < 8; i++) {
            const patternGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.02);
            const patternMaterial = new THREE.MeshPhongMaterial({
                color: 0x1a1a1a,
                shininess: 20
            });
            const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
            pattern.position.set(0, 0.2, 0);
            pattern.rotation.z = (i * Math.PI) / 4;
            pattern.castShadow = true;
            wheelGroup.add(pattern);
        }
        
        wheelGroup.position.set(wheelData.pos[0], wheelData.pos[1], wheelData.pos[2]);
        wheelGroup.name = wheelData.name;
        otherCar.add(wheelGroup);
    });
    
    // Add player name label
    const nameLabel = createPlayerNameLabel(name);
    otherCar.add(nameLabel);
    
    // Store player data
    otherCar.userData = {
        id: id,
        name: name,
        speed: 0,
        rotation: 0
    };
    
    scene.add(otherCar);
    otherPlayers.set(id, otherCar);
    return otherCar;
}

function createPlayerNameLabel(name) {
    // Create a simple text label (using a plane with text)
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const labelMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 1.5, 0);
    label.userData = { text: name };
    return label;
}

function updateMultiplayerUI() {
    const multiplayerStatus = document.getElementById('multiplayerStatus');
    if (multiplayerStatus) {
        if (multiplayerConnected && isMultiplayer) {
            multiplayerStatus.style.display = 'block';
            if (lobbyCode) {
                const playerCount = lobbyPlayers.size;
                multiplayerStatus.innerHTML = `Multiplayer: ${playerCount} player${playerCount > 1 ? 's' : ''} online<br><span style="color: #00ff88; font-size: 12px;">Lobby Code: ${lobbyCode}</span>`;
            } else {
                multiplayerStatus.innerText = `Multiplayer: Connected (Waiting for lobby)`;
            }
        } else if (multiplayerConnected) {
            multiplayerStatus.style.display = 'block';
            multiplayerStatus.innerText = `Multiplayer: Connected to server`;
        } else {
            multiplayerStatus.style.display = 'none';
        }
    }
}

// updateOtherPlayers function removed - now handled by Socket.IO events

function generateLobbyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Client-side lobby management functions removed - these are handled by the server

function createLobby() {
    if (!socket || !multiplayerConnected) {
        alert('Not connected to multiplayer server!');
        return;
    }
    
    isHost = true;
    lobbyState = 'creating';
    
    // Send create lobby request to server
    socket.emit('createLobby', playerName);
    
    console.log('Creating lobby...');
}

function joinLobby(code) {
    console.log('joinLobby function called with code:', code);
    
    if (!socket || !multiplayerConnected) {
        alert('Not connected to multiplayer server!');
        return;
    }
    
    // Validate lobby code format
    if (code.length !== 6) {
        alert('Invalid lobby code! Please enter a 6-character code.');
        return;
    }
    
    // Check if code contains only valid characters (letters and numbers)
    const validCodePattern = /^[A-Z0-9]{6}$/;
    if (!validCodePattern.test(code.toUpperCase())) {
        alert('Invalid lobby code! Code must contain only letters and numbers.');
        return;
    }
    
    lobbyCode = code.toUpperCase();
    isHost = false;
    lobbyState = 'joining';
    
    // Hide join UI
    const joinUI = document.getElementById('joinUI');
    if (joinUI) {
        joinUI.style.display = 'none';
        console.log('Join UI hidden');
    }
    
    // Send join lobby request to server
    socket.emit('joinLobby', {
        lobbyCode: lobbyCode,
        playerName: playerName
    });
    
    console.log('Attempting to join lobby with code:', lobbyCode);
}

function showLobbyCreationUI() {
    // Hide start menu
    const startMenu = document.getElementById('startMenu');
    startMenu.style.display = 'none';
    
    // Show lobby creation UI
    const lobbyUI = document.getElementById('lobbyUI');
    if (lobbyUI) {
        lobbyUI.style.display = 'block';
        
        // Update lobby code display in lobby UI
        const lobbyCodeDisplay = document.getElementById('lobbyCodeDisplay');
        if (lobbyCodeDisplay) {
            lobbyCodeDisplay.innerText = `Lobby Code: ${lobbyCode}`;
        }
        
        // Update player list
        updateLobbyPlayerList();
    }
}

function showLobbyJoinUI() {
    // Hide start menu
    const startMenu = document.getElementById('startMenu');
    startMenu.style.display = 'none';
    
    // Show lobby join UI
    const joinUI = document.getElementById('joinUI');
    if (joinUI) {
        joinUI.style.display = 'block';
        
        // Focus the input field after a short delay
        setTimeout(() => {
            const joinCodeInput = document.getElementById('joinCodeInput');
            if (joinCodeInput) {
                joinCodeInput.focus();
                console.log('Auto-focused join code input field');
            }
        }, 100);
    }
}

function updateLobbyPlayerList() {
    const playerList = document.getElementById('lobbyPlayerList');
    if (playerList) {
        playerList.innerHTML = '';
        lobbyPlayers.forEach((player, id) => {
            const playerItem = document.createElement('div');
            playerItem.style.cssText = `
                padding: 8px;
                margin: 4px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                color: white;
                font-size: 14px;
            `;
            playerItem.innerText = `${player.name} ${id === playerId ? '(You)' : ''}`;
            playerList.appendChild(playerItem);
        });
    }
}

function startLobbyGame() {
    console.log('startLobbyGame function called');
    
    if (!socket || !multiplayerConnected) {
        alert('Not connected to multiplayer server!');
        return;
    }
    
    // Send start game request to server
    socket.emit('startGame');
    
    console.log('Requesting to start game...');
}

// Function to clean up lobby when game ends
function cleanupLobby() {
    // Lobby cleanup is handled by the server when players disconnect
    lobbyCode = null;
    isHost = false;
    lobbyPlayers.clear();
    lobbyState = 'menu';
}

function sendPlayerUpdate() {
    if (!multiplayerConnected || !isMultiplayer || !socket) return;
    
    // Send player position and rotation to server
    socket.emit('playerUpdate', {
        position: {
            x: car.position.x,
            y: car.position.y,
            z: car.position.z
        },
        rotation: car.rotation.y,
        speed: speed,
        isShooting: isShooting
    });
}

// simulateOtherPlayerUpdates function removed - now handled by Socket.IO events

function updateRealPlayerPositions() {
    if (!multiplayerConnected) return;
    
    // Update other players based on received data
    playerPositions.forEach((playerData, id) => {
        if (id === playerId) return; // Skip self
        
        const otherPlayer = otherPlayers.get(id);
        if (otherPlayer) {
            // Smoothly interpolate to new position
            const targetPosition = new THREE.Vector3(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            );
            
            otherPlayer.position.lerp(targetPosition, 0.1);
            otherPlayer.rotation.y = playerData.rotation;
            
            // Update player data
            otherPlayer.userData.speed = playerData.speed;
            otherPlayer.userData.isShooting = playerData.isShooting;
        }
    });
}

function setupMultiplayerEventListeners() {
    // Create Lobby Button
    const createLobbyBtn = document.getElementById('createLobbyBtn');
    if (createLobbyBtn) {
        createLobbyBtn.addEventListener('click', () => {
            createLobby();
        });
        createLobbyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            createLobby();
        });
    }
    
    // Join Lobby Button
    const joinLobbyBtn = document.getElementById('joinLobbyBtn');
    if (joinLobbyBtn) {
        joinLobbyBtn.addEventListener('click', () => {
            showLobbyJoinUI();
        });
        joinLobbyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showLobbyJoinUI();
        });
    }
    
    // Back to Menu Button
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            document.getElementById('multiplayerOptions').style.display = 'none';
            document.getElementById('startMenu').style.display = 'flex';
        });
        backToMenuBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            document.getElementById('multiplayerOptions').style.display = 'none';
            document.getElementById('startMenu').style.display = 'flex';
        });
    }
    
    // Start Lobby Game Button
    const startLobbyGameBtn = document.getElementById('startLobbyGameBtn');
    if (startLobbyGameBtn) {
        startLobbyGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Start Lobby Game button clicked');
            startLobbyGame();
        });
        startLobbyGameBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('Start Lobby Game button touched');
            startLobbyGame();
        });
    }
    
    // Cancel Lobby Button
    const cancelLobbyBtn = document.getElementById('cancelLobbyBtn');
    if (cancelLobbyBtn) {
        cancelLobbyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Cancel Lobby button clicked');
            // Lobby cleanup is handled by the server when players disconnect
            document.getElementById('lobbyUI').style.display = 'none';
            document.getElementById('startMenu').style.display = 'flex';
        });
        cancelLobbyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('Cancel Lobby button touched');
            // Lobby cleanup is handled by the server when players disconnect
            document.getElementById('lobbyUI').style.display = 'none';
            document.getElementById('startMenu').style.display = 'flex';
        });
    }
    
    // Join Game Button
    const joinGameBtn = document.getElementById('joinGameBtn');
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Join Game button clicked');
            const joinCodeInput = document.getElementById('joinCodeInput');
            if (joinCodeInput) {
                const code = joinCodeInput.value.toUpperCase();
                console.log('Attempting to join lobby with code:', code);
                if (code.length === 6) {
                    joinLobby(code);
                    document.getElementById('joinUI').style.display = 'none';
                } else {
                    alert('Please enter a valid 6-character lobby code!');
                }
            }
        });
        joinGameBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('Join Game button touched');
            const joinCodeInput = document.getElementById('joinCodeInput');
            if (joinCodeInput) {
                const code = joinCodeInput.value.toUpperCase();
                console.log('Attempting to join lobby with code:', code);
                if (code.length === 6) {
                    joinLobby(code);
                    document.getElementById('joinUI').style.display = 'none';
                } else {
                    alert('Please enter a valid 6-character lobby code!');
                }
            }
        });
    }
    
    // Back to Multiplayer Button
    const backToMultiplayerBtn = document.getElementById('backToMultiplayerBtn');
    if (backToMultiplayerBtn) {
        backToMultiplayerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Back to Multiplayer button clicked');
            document.getElementById('joinUI').style.display = 'none';
            document.getElementById('multiplayerOptions').style.display = 'block';
        });
        backToMultiplayerBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('Back to Multiplayer button touched');
            document.getElementById('joinUI').style.display = 'none';
            document.getElementById('multiplayerOptions').style.display = 'block';
        });
    }
    
    // Join Code Input Field
    const joinCodeInput = document.getElementById('joinCodeInput');
    if (joinCodeInput) {
        console.log('Join code input field found and event listeners added');
        
        // Test click event
        joinCodeInput.addEventListener('click', (e) => {
            console.log('Input field clicked');
            e.stopPropagation();
        });
        
        // Test focus event
        joinCodeInput.addEventListener('focus', (e) => {
            console.log('Input field focused');
            e.stopPropagation();
        });
        
        // Test input event
        joinCodeInput.addEventListener('input', (e) => {
            console.log('Input field value:', e.target.value);
            e.stopPropagation();
        });
        
        // Test keypress event
        joinCodeInput.addEventListener('keypress', (e) => {
            console.log('Key pressed in input field:', e.key);
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                console.log('Enter pressed in input field');
                const code = e.target.value.toUpperCase();
                if (code.length === 6) {
                    joinLobby(code);
                    document.getElementById('joinUI').style.display = 'none';
                } else {
                    alert('Please enter a valid 6-character lobby code!');
                }
            }
        });
        
        // Test mousedown event
        joinCodeInput.addEventListener('mousedown', (e) => {
            console.log('Input field mousedown');
            e.stopPropagation();
        });
        
        // Test touchstart event for mobile
        joinCodeInput.addEventListener('touchstart', (e) => {
            console.log('Input field touchstart');
            e.stopPropagation();
        });
        
        // Add a test function to manually focus the input
        window.testInputFocus = function() {
            joinCodeInput.focus();
            console.log('Manually focused input field');
        };
        
        // Add a test function to set a test value
        window.testInputValue = function() {
            joinCodeInput.value = 'ABC123';
            console.log('Set test value in input field');
        };
        
        // Debug functions removed - lobby management is handled by the server
        
    } else {
        console.log('Join code input field NOT found!');
    }
}

init();
