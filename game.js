const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let isModalOpen = false;

// Set canvas size to fill the window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Input Handling ---
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// --- Car Class ---
class Car {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 35;
        this.speed = 0;
        this.maxSpeed = 5;
        this.acceleration = 0.2;
        this.friction = 0.05;
        this.angle = 0;
        this.turnSpeed = 0.06;

        // Status
        this.color = '#ff0000'; // Default red
        this.gas = 100;
        this.cleanliness = 100;
        this.wheels = 'standard';
    }

    update() {
        // Only move if we have gas!
        if (this.gas <= 0) {
            this.speed = 0;
            return;
        }

        // Acceleration
        const isAccelerating = keys.ArrowUp || keys.w;
        const isReversing = keys.ArrowDown || keys.s;

        if (isAccelerating) {
            this.speed += this.acceleration;
        } else if (isReversing) {
            this.speed -= this.acceleration;
        } else {
            // Friction
            if (this.speed > 0) {
                this.speed -= this.friction;
            } else if (this.speed < 0) {
                this.speed += this.friction;
            }
            if (Math.abs(this.speed) < this.friction) this.speed = 0;
        }

        // Cap speed
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

        // Turning
        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (keys.ArrowLeft || keys.a) {
                this.angle -= this.turnSpeed * flip * (Math.abs(this.speed)/this.maxSpeed);
            }
            if (keys.ArrowRight || keys.d) {
                this.angle += this.turnSpeed * flip * (Math.abs(this.speed)/this.maxSpeed);
            }
        }

        // Update position
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Decrease gas slowly when moving
        if (Math.abs(this.speed) > 0.1) {
            this.gas -= 0.02;
            if (this.gas < 0) this.gas = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-this.width/2 + 2, -this.height/2 + 2, this.width, this.height);

        // Car Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);

        // Windows (Windshield)
        ctx.fillStyle = '#87CEFA'; // Light sky blue
        ctx.fillRect(-this.width/2 + 35, -this.height/2 + 4, 15, this.height - 8);
        ctx.strokeRect(-this.width/2 + 35, -this.height/2 + 4, 15, this.height - 8);

        // Rear window
        ctx.fillRect(-this.width/2 + 5, -this.height/2 + 4, 10, this.height - 8);
        ctx.strokeRect(-this.width/2 + 5, -this.height/2 + 4, 10, this.height - 8);

        // Wheels
        ctx.fillStyle = '#111';
        let wheelW = 12;
        let wheelH = 6;

        // If upgraded, maybe make wheels slightly bigger/different color
        if (this.wheels === 'upgraded') {
            ctx.fillStyle = '#444';
            wheelW = 14;
            wheelH = 8;
        }

        // Top left
        ctx.fillRect(-this.width/2 + 10, -this.height/2 - wheelH/2, wheelW, wheelH);
        // Top right
        ctx.fillRect(this.width/2 - 20, -this.height/2 - wheelH/2, wheelW, wheelH);
        // Bottom left
        ctx.fillRect(-this.width/2 + 10, this.height/2 - wheelH/2, wheelW, wheelH);
        // Bottom right
        ctx.fillRect(this.width/2 - 20, this.height/2 - wheelH/2, wheelW, wheelH);

        // Draw dirt if cleanliness is low
        if (this.cleanliness < 50) {
            ctx.fillStyle = 'rgba(101, 67, 33, 0.6)'; // Dirt color
            ctx.beginPath();
            ctx.arc(-this.width/4, 0, 10, 0, Math.PI * 2);
            ctx.arc(this.width/4, -5, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

const playerCar = new Car(200, 360);

// --- NPC Cars ---
const npcCars = [
    new Car(150, 60),  // Vertical road 1, top
    new Car(460, 800), // Vertical road 1, bottom
    new Car(1060, 150), // Vertical road 2
    new Car(1400, 360), // Horizontal road, right
    new Car(800, 310)  // Horizontal road, middle
];

// Give them different colors and angles
npcCars[0].color = '#2196F3'; // Blue
npcCars[0].angle = Math.PI / 2; // Facing down

npcCars[1].color = '#FFEB3B'; // Yellow
npcCars[1].angle = -Math.PI / 2; // Facing up

npcCars[2].color = '#9C27B0'; // Purple
npcCars[2].angle = Math.PI / 2; // Facing down

npcCars[3].color = '#4CAF50'; // Green
npcCars[3].angle = Math.PI; // Facing left

npcCars[4].color = '#E91E63'; // Pink
npcCars[4].angle = 0; // Facing right


// --- Map Data ---
const roadWidth = 120;

// Define zones (x, y, width, height)
const mapFeatures = {
    roads: [
        { x: 0, y: 300, w: 2000, h: roadWidth }, // Horizontal main road
        { x: 400, y: 0, w: roadWidth, h: 2000 }, // Vertical road 1
        { x: 1000, y: 0, w: roadWidth, h: 2000 } // Vertical road 2
    ],
    stations: [
        {
            id: 'carWash',
            name: 'Car Wash',
            x: 550, y: 150, w: 200, h: 120,
            color: '#03A9F4', // Light blue
            emoji: '🧼'
        },
        {
            id: 'serviceStation',
            name: 'Service Station',
            x: 1150, y: 450, w: 220, h: 140,
            color: '#FF5722', // Deep orange
            emoji: '⛽'
        }
    ]
};

function drawMap() {
    // Background (Grass)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Roads
    ctx.fillStyle = '#757575'; // Grey asphalt
    mapFeatures.roads.forEach(road => {
        ctx.fillRect(road.x, road.y, road.w, road.h);
    });

    // Draw Road Lines (dashed)
    ctx.strokeStyle = '#FFEB3B'; // Yellow lines
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);

    // Horiz line
    ctx.beginPath();
    ctx.moveTo(0, 300 + roadWidth / 2);
    ctx.lineTo(canvas.width, 300 + roadWidth / 2);
    ctx.stroke();

    // Vert line 1
    ctx.beginPath();
    ctx.moveTo(400 + roadWidth / 2, 0);
    ctx.lineTo(400 + roadWidth / 2, canvas.height);
    ctx.stroke();

    // Vert line 2
    ctx.beginPath();
    ctx.moveTo(1000 + roadWidth / 2, 0);
    ctx.lineTo(1000 + roadWidth / 2, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash

    // Draw Stations
    mapFeatures.stations.forEach(station => {
        // Driveway/lot
        ctx.fillStyle = '#BDBDBD';
        ctx.fillRect(station.x - 20, station.y - 20, station.w + 40, station.h + 40);

        // Building
        ctx.fillStyle = station.color;
        ctx.fillRect(station.x, station.y, station.w, station.h);

        // Roof border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.strokeRect(station.x, station.y, station.w, station.h);

        // Text and Emoji
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add shadow for readability
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(station.name, station.x + station.w / 2, station.y + station.h / 2 - 15);

        ctx.font = '40px Arial';
        ctx.fillText(station.emoji, station.x + station.w / 2, station.y + station.h / 2 + 25);
        ctx.shadowBlur = 0; // Reset shadow
    });
}


// --- UI Updating ---
function updateUI() {
    document.getElementById('gas-level').innerText = Math.round(playerCar.gas);
    document.getElementById('clean-level').innerText = Math.round(playerCar.cleanliness);
}

// --- Message System ---
function showMessage(msg) {
    const overlay = document.getElementById('message-overlay');
    const text = document.getElementById('message-text');
    text.innerText = msg;
    overlay.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 2000);
}

// --- Station Actions ---
// Car Wash
window.washInside = function() {
    showMessage("Washed Inside!");
    closeModal('car-wash-modal');
};

window.washOutside = function() {
    playerCar.cleanliness = 100;
    showMessage("All Clean!");
    closeModal('car-wash-modal');
};

// Service Station
window.fillGas = function() {
    playerCar.gas = 100;
    showMessage("Tank Full!");
    closeModal('service-station-modal');
};

window.checkTires = function() {
    showMessage("Tires Inflated!");
    closeModal('service-station-modal');
};

window.upgradeWheels = function() {
    playerCar.wheels = 'upgraded';
    showMessage("Cool Wheels Installed!");
    closeModal('service-station-modal');
};

window.paintCar = function() {
    const color = document.getElementById('car-color-picker').value;
    playerCar.color = color;
    showMessage("New Paint Job!");
    closeModal('service-station-modal');
};

let lastInteractedStationId = null;

function checkInteractions() {
    // If modal is open, don't trigger again
    if (isModalOpen) return;

    let interacting = false;

    for (const station of mapFeatures.stations) {
        // Simple bounding box collision for interaction
        // Make the interaction area slightly larger than the building
        if (
            playerCar.x > station.x - 20 &&
            playerCar.x < station.x + station.w + 20 &&
            playerCar.y > station.y - 20 &&
            playerCar.y < station.y + station.h + 20
        ) {
            interacting = true;
            // Stop the car
            playerCar.speed = 0;

            // Only open if we haven't just closed it while standing here
            if (lastInteractedStationId !== station.id) {
                lastInteractedStationId = station.id;
                if (station.id === 'carWash') {
                    openModal('car-wash-modal');
                } else if (station.id === 'serviceStation') {
                    openModal('service-station-modal');
                }
            }
        }
    }

    // If we are no longer interacting with ANY station, clear the last interacted id
    // so we can interact again next time we visit.
    if (!interacting) {
        lastInteractedStationId = null;
    }
}

// Global modal functions
window.openModal = function(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    isModalOpen = true;
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.add('hidden');

    // Slight delay before allowing game to resume fully
    setTimeout(() => {
        isModalOpen = false;
    }, 100);
};

let outOfGasMessageShown = false;

function update() {
    playerCar.update();

    // Slowly decrease cleanliness over time (very slowly)
    playerCar.cleanliness -= 0.001;
    if (playerCar.cleanliness < 0) playerCar.cleanliness = 0;

    checkInteractions();
    updateUI();

    // Handle out of gas
    if (playerCar.gas <= 0 && !outOfGasMessageShown) {
        outOfGasMessageShown = true;
        showMessage("Out of gas! Calling tow truck...");

        // Auto refill after a short delay so the kid isn't stuck forever
        setTimeout(() => {
            playerCar.gas = 100;
            outOfGasMessageShown = false;
            showMessage("Gas tank refilled!");
        }, 3000);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    drawMap();

    // Draw NPC cars
    npcCars.forEach(car => {
        car.draw(ctx);
    });

    // Draw player car on top
    playerCar.draw(ctx);

    ctx.restore();
}

function gameLoop() {
    if (!isModalOpen) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
