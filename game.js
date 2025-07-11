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

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Player (Car) - Improved colors and materials
    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshPhongMaterial({
        color: 0x1e88e5,
        shininess: 100,
        specular: 0x4fc3f7
    });
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.castShadow = true;
    car.receiveShadow = true;
    car.position.set(0, 0.25, 0); // Position car on ground
    scene.add(car);

    // Add wheels to the car - Hexagonal for realistic tire look
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 6); // 6 sides for hexagonal
    const wheelMaterial = new THREE.MeshPhongMaterial({
        color: 0x2e2e2e,
        shininess: 30
    });
    
    // Create 4 wheels
    const wheelPositions = [
        {pos: [-0.5, -0.1, 0.7], name: 'frontLeft'},   // Front left
        {pos: [0.5, -0.1, 0.7], name: 'frontRight'},   // Front right
        {pos: [-0.5, -0.1, -0.7], name: 'rearLeft'},   // Rear left
        {pos: [0.5, -0.1, -0.7], name: 'rearRight'}    // Rear right
    ];
    
    wheelPositions.forEach(wheelData => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2; // Rotate wheel to be vertical
        wheel.position.set(wheelData.pos[0], wheelData.pos[1], wheelData.pos[2]);
        wheel.name = wheelData.name;
        car.add(wheel); // Add wheel as child of car
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheels.push(wheel);
    });

    // Wheat Farm Sky - Golden hour lighting
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffa726, // Golden sunset sky
        side: THREE.BackSide 
    });
    const skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyBox);

    // Fluffy white clouds
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            const cloudGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 6);
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                i * 25 - 100 + Math.random() * 10, 
                40 + Math.random() * 15, 
                j * 25 - 50 + Math.random() * 10
            );
            cloud.scale.set(1, 0.6, 1);
            scene.add(cloud);
        }
    }

    // Create wheat farm environment
    createWheatFarm();

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

    updateCar();
    updateTrailFade();
    updateUI();
}

function createWheatFarm() {
    // Create wheat stalks throughout the field
    const wheatMaterial = new THREE.MeshPhongMaterial({ color: 0xffc107 }); // Golden wheat color
    
    for (let i = 0; i < 500; i++) {
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
            scene.add(wheatStalk);
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
    } else {
        isDrifting = false;
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
    let maxHeight = 0.25; // Default ground height

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
    camera.lookAt(car.position);

    score += Math.floor(speed * 10 + driftScore);
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
        if (lastCarPosition.distanceTo(car.position) > 0.1) {
            // Create new trail segments with more realistic tire marks
            const leftTrailSegment = new THREE.Mesh(
                new THREE.PlaneGeometry(0.15, 0.8), 
                new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.8 })
            );
            leftTrailSegment.position.copy(rearLeftPos);
            leftTrailSegment.rotation.x = -Math.PI / 2;
            leftTrailSegment.userData.age = 0; // Track age for fading
            driftTrailMesh.add(leftTrailSegment);

            const rightTrailSegment = new THREE.Mesh(
                new THREE.PlaneGeometry(0.15, 0.8), 
                new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.8 })
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
        segment.material.opacity = Math.max(0, 0.8 - (segment.userData.age * 0.001));
            
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
    
    // Limit trail segments to avoid memory overflow
    if (driftTrailMesh.children.length > 50) {
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
    car.position.set(0, 0.25, 0); // Position car on ground
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

init();
