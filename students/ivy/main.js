import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Create scene, camera, and renderer as globals
let scene, camera, renderer, controls;

// At the top level of your code, declare a variable to store the GUI instance
let gui = null;

// Only add these if they don't already exist in your code
let statsDiv, logDiv;

// Add these global variables at the top with other globals
let startTime = 0;
let elapsedTime = 0;
let isTimerRunning = false;

// Add at the top with other global variables
let backgroundMusic = null;

// UI Manager Object
const UIManager = {
    statsDiv: null,
    logDiv: null,
    timerDiv: null,
    populationDiv: null,

    initialize() {
        if (!document.getElementById('infection-stats')) {
            const htmlOverlay = `
                <div id="simulation-timer" style="position: absolute; top: 10px; left: 20px;
                    background: rgba(0,0,0,0.7); color: white; padding: 8px;
                    border-radius: 3px; font-family: Arial; min-width: 180px; font-size: 16px;
                    text-align: center; z-index: 10000;">
                    <div style="margin-bottom: 3px; font-size: 12px; font-weight: bold;">Simulation Time</div>
                    <div id="timer-display">00M 00W 00D 00m</div>
                </div>
                <div id="zombie-population" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
                    background: rgba(0,0,0,0.7); color: white; padding: 8px;
                    border-radius: 5px; font-family: Arial; min-width: 220px; font-size: 10px;
                    text-align: center; z-index: 1000;">
                    <div style="margin-bottom: 4px; font-size: 12px; font-weight: bold; color: #ff0000;">Zombie Population</div>
                    <div style="margin-bottom: 6px;">
                        <div style="font-size: 10px; margin-bottom: 2px;">Human Zombies:</div>
                        <div id="human-zombies" style="font-size: 10px; font-weight: bold;">0</div>
                    </div>
                    <div style="margin-bottom: 6px;">
                        <div style="font-size: 10px; margin-bottom: 2px;">Zombie Dogs:</div>
                        <div id="dog-zombies" style="font-size: 10px; font-weight: bold;">0</div>
                    </div>
                    <div style="margin-bottom: 6px;">
                        <div style="font-size: 10px; margin-bottom: 2px;">Zombie Cats:</div>
                        <div id="cat-zombies" style="font-size: 10px; font-weight: bold;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; margin-bottom: 2px;">Zombie Politicians:</div>
                        <div id="politician-zombies" style="font-size: 10px; font-weight: bold;">1,255,984</div>
                    </div>
                </div>
                <div id="infection-stats" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
                    background: rgba(0,0,0,0.7); color: white; padding: 12px; 
                    border-radius: 5px; font-family: Arial; min-width: 200px; font-size: 14px;
                    text-align: center; z-index: 1000;">
                    <div style="margin-bottom: 5px; font-size: 16px; font-weight: bold;">Global Infection Statistics</div>
                    <div id="global-stats"></div>
                </div>
                <div id="infection-log" style="position: absolute; bottom: 10px; left: 10px; 
                    background: rgba(0,0,0,0.7); color: white; padding: 8px; 
                    border-radius: 3px; font-family: Arial; max-width: 300px; 
                    max-height: 150px; overflow-y: auto; font-size: 10px;">
                    <div style="margin-bottom: 6px; font-size: 12px; font-weight: bold; color: #ff0000; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">Super Spreader Events</div>
                    <div id="log-messages" style="line-height: 1.2;"></div>
                </div>
                <div id="event-messages" style="position: fixed; bottom: 20px; right: 20px;
                    background: rgba(0,0,0,0.7); color: white; padding: 8px;
                    border-radius: 3px; font-family: Arial; max-width: 300px;
                    max-height: 200px; overflow-y: auto; font-size: 10px;">
                    <div style="margin-bottom: 6px; font-size: 12px; font-weight: bold; color: #ff0000; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">News Feed</div>
                    <div id="event-messages-container" style="line-height: 1.2;"></div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', htmlOverlay);

            // Add black cover for upper left corner
            const coverDiv = document.createElement('div');
            coverDiv.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 264px;
                height: 132px;
                background-color: black;
                z-index: 9999;
            `;
            document.body.appendChild(coverDiv);

            // Add custom scrollbar styling for both windows
            const style = document.createElement('style');
            style.textContent = `
                #infection-log::-webkit-scrollbar,
                #event-messages::-webkit-scrollbar {
                    width: 4px;
                }
                #infection-log::-webkit-scrollbar-track,
                #event-messages::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                #infection-log::-webkit-scrollbar-thumb,
                #event-messages::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                }
                #infection-log::-webkit-scrollbar-thumb:hover,
                #event-messages::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.4);
                }
                /* Firefox scrollbar styling */
                #infection-log,
                #event-messages {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.3) rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(style);
        }
        
        this.statsDiv = document.getElementById('global-stats');
        this.logDiv = document.getElementById('log-messages');
        this.timerDiv = document.getElementById('timer-display');
        this.populationDiv = document.getElementById('zombie-population');
    },

    updateStats(totalInfected, totalPopulation, infectedCities) {
        if (this.statsDiv) {
            const infectionRate = (totalInfected / totalPopulation) * 100;
            this.statsDiv.innerHTML = `
                <div style="margin-bottom: 2px;">
                    Global Infection: ${infectionRate.toFixed(1)}%
                </div>
                <div>
                    Infected Cities: ${infectedCities}/${cities.length}
                </div>
            `;
        }
    },

    addLogMessage(message) {
        if (this.logDiv) {
            const newMessage = document.createElement('div');
            newMessage.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            newMessage.style.padding = '2px 0';
            newMessage.style.fontSize = '10px';
            newMessage.innerHTML = message;
            
            this.logDiv.insertBefore(newMessage, this.logDiv.firstChild);
            
            while (this.logDiv.children.length > 10) {
                this.logDiv.removeChild(this.logDiv.lastChild);
            }
        }
    },

    showVictoryMessage() {
        // Create victory message if it doesn't exist
        if (!document.getElementById('victory-message')) {
            const victoryDiv = document.createElement('div');
            victoryDiv.id = 'victory-message';
            victoryDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: #ff0000;
                padding: 20px 40px;
                border-radius: 10px;
                font-family: Arial;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                z-index: 9999;
                border: 2px solid #ff0000;
                text-shadow: 0 0 10px #ff0000;
            `;
            victoryDiv.innerHTML = 'Zombies Rule the World!';
            document.body.appendChild(victoryDiv);
        }
    },

    updateTimer(seconds) {
        if (this.timerDiv) {
            // Convert real seconds to simulation time
            // 1 real second = 1.68 simulation days (7 days / 60 seconds)
            const simulationDays = seconds * 1.68;
            
            // Calculate months, weeks, and remaining days
            const months = Math.floor(simulationDays / 30);
            const remainingDays = simulationDays % 30;
            const weeks = Math.floor(remainingDays / 7);
            const days = Math.floor(remainingDays % 7);
            
            // Calculate minutes from milliseconds
            const minutes = Math.floor((seconds % 1) * 60);
            
            this.timerDiv.textContent = 
                `${months.toString().padStart(2, '0')}M ${weeks.toString().padStart(2, '0')}W ${days.toString().padStart(2, '0')}D ${minutes.toString().padStart(2, '0')}m`;
        }
    },

    updatePopulationStats(infectionRate) {
        const totalPopulation = 7900000000;
        const humanZombies = Math.floor(totalPopulation * infectionRate);
        const dogZombies = Math.floor(humanZombies * 0.1); // Assuming 10% of human zombies have zombie pets
        const catZombies = Math.floor(humanZombies * 0.15); // Cats are more independent, so slightly higher rate
        
        // Politician zombies remain static at 1,255,984
        const politicianZombies = 1255984;

        document.getElementById('human-zombies').textContent = humanZombies.toLocaleString();
        document.getElementById('dog-zombies').textContent = dogZombies.toLocaleString();
        document.getElementById('cat-zombies').textContent = catZombies.toLocaleString();
        document.getElementById('politician-zombies').textContent = politicianZombies.toLocaleString();
    }
};

// Add EventManager object after UIManager
const EventManager = {
    events: [
        { threshold: 0.005, message: "Breaking News: First celebrity zombie sighting! Kanye West spotted biting a paparazzi. 'It's not a phase, mom!'" },
        { threshold: 0.01, message: "TikTok trend alert: #ZombieDanceChallenge goes viral. 'It's not a medical condition, it's a lifestyle choice!'" },
        { threshold: 0.015, message: "Fast food chains introduce 'Brain Burgers' - sales surprisingly good among non-zombie population" },
        { threshold: 0.02, message: "Zombie dating app 'Zomber' launches: 'Swipe right for brains!'" },
        { threshold: 0.025, message: "Breaking: Zombie influencers start 'Brainfluencer' marketing agency" },
        { threshold: 0.03, message: "Local gyms report increased membership: 'People want to outrun zombies'" },
        { threshold: 0.035, message: "Pet stores sell out of zombie-proof hamster balls" },
        { threshold: 0.04, message: "Breaking: Zombie food delivery service 'Brains on Demand' launches" },
        { threshold: 0.045, message: "Fashion industry launches 'Ripped by Zombies' clothing line" },
        { threshold: 0.05, message: "Zombie rights activists demand equal treatment: 'Brains are a human right!'" },
        { threshold: 0.06, message: "Zombie dating reality show 'The Walking Dead Bachelor' becomes #1" },
        { threshold: 0.07, message: "Zombie fitness apps go viral: '1000 steps a day keeps the humans away'" },
        { threshold: 0.08, message: "Breaking: Zombie cooking shows debut: 'How to prepare human brains 5 ways'" },
        { threshold: 0.09, message: "Zombie fashion week: 'Ripped and torn is the new black'" },
        { threshold: 0.10, message: "WHO declares global emergency: 'We're not saying it's zombies... but it's zombies.'" },
        { threshold: 0.15, message: "Stock markets crash: 'Zombie stocks are the only ones going up!'" },
        { threshold: 0.20, message: "Farmers stop working: 'Can't farm when you're being chased by zombies!'" },
        { threshold: 0.25, message: "Food delivery companies run out of drivers: 'Too many drivers became the delivery!'" },
        { threshold: 0.30, message: "Divorce rate hits 80%: 'Turns out 'in sickness and in health' didn't cover zombification.'" },
        { threshold: 0.35, message: "Humans start hunting wild animals: 'Deer population: Finally, we're not the ones being hunted!'" },
        { threshold: 0.40, message: "Gyms close down: 'No one wants to be the fittest person in a zombie apocalypse.'" },
        { threshold: 0.45, message: "Social media influencers switch to zombie makeup tutorials" },
        { threshold: 0.50, message: "Fast food chains introduce 'Brain Burgers' to attract zombie customers" },
        { threshold: 0.55, message: "Dating apps add 'Zombie Mode' for undead singles" },
        { threshold: 0.60, message: "Pet stores report record sales of zombie-proof hamster balls" },
        { threshold: 0.65, message: "Movie theaters only showing zombie films: 'For educational purposes'" },
        { threshold: 0.70, message: "Fashion industry launches 'Ripped by Zombies' clothing line" },
        { threshold: 0.75, message: "Zombie rights activists demand equal treatment: 'Brains are a human right!'" },
        { threshold: 0.80, message: "Zombie dating reality show 'The Walking Dead Bachelor' becomes #1" },
        { threshold: 0.82, message: "Zombie fitness apps go viral: '1000 steps a day keeps the humans away'" },
        { threshold: 0.84, message: "Zombie food delivery service 'Brains on Demand' launches" },
        { threshold: 0.86, message: "Zombie influencers start 'Brainfluencer' marketing agency" },
        { threshold: 0.88, message: "Zombie dating app 'Zomber' hits 1 million users" },
        { threshold: 0.90, message: "Zombie cooking shows debut: 'How to prepare human brains 5 ways'" },
        { threshold: 0.92, message: "Zombie fashion week: 'Ripped and torn is the new black'" },
        { threshold: 0.94, message: "Zombie Olympics announced: 'Slow walking and moaning competitions'" },
        { threshold: 0.95, message: "Zombie government formed: 'First order of business: More brains!'" },
        { threshold: 0.96, message: "Zombie stock market hits all-time high: 'Brains futures looking good!'" },
        { threshold: 0.97, message: "Zombies Rule the World!" }
    ],
    triggeredEvents: new Set(),

    checkEvents(infectionRate) {
        this.events.forEach(event => {
            if (infectionRate >= event.threshold && !this.triggeredEvents.has(event.threshold)) {
                this.triggeredEvents.add(event.threshold);
                this.displayEvent(event.message);
            }
        });
    },

    displayEvent(message) {
        // Create event message element if it doesn't exist
        if (!document.getElementById('event-messages')) {
            const eventDiv = document.createElement('div');
            eventDiv.id = 'event-messages';
            eventDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 6px;
                border-radius: 3px;
                font-family: Arial;
                max-width: 210px;
                max-height: 280px;
                overflow-y: auto;
                font-size: 10px;
                z-index: 1000;
                margin: 0;
                padding: 6px;
            `;

            // Create and add the title
            const titleDiv = document.createElement('div');
            titleDiv.style.cssText = `
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 6px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            `;
            titleDiv.textContent = 'News Feed';
            eventDiv.appendChild(titleDiv);

            // Create container for messages
            const messagesContainer = document.createElement('div');
            messagesContainer.id = 'event-messages-container';
            eventDiv.appendChild(messagesContainer);

            // Remove any existing event messages div first
            const existingDiv = document.getElementById('event-messages');
            if (existingDiv) {
                existingDiv.remove();
            }

            document.body.appendChild(eventDiv);
        }

        const messagesContainer = document.getElementById('event-messages-container');
        const eventMessage = document.createElement('div');
        eventMessage.style.cssText = `
            margin-bottom: 6px;
            padding: 6px;
            background: rgba(255,0,0,0.2);
            border-left: 2px solid #ff0000;
            border-radius: 2px;
            font-size: 10px;
            line-height: 1.2;
        `;
        eventMessage.textContent = message;
        messagesContainer.insertBefore(eventMessage, messagesContainer.firstChild);

        // Also add to log
        UIManager.addLogMessage(`EVENT: ${message}`);
    },

    reset() {
        this.triggeredEvents.clear();
        const eventDiv = document.getElementById('event-messages');
        if (eventDiv) {
            const messagesContainer = document.getElementById('event-messages-container');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
        }
    }
};

// Add ExplosionManager class after the EventManager
class ExplosionManager {
    constructor() {
        this.explosions = [];
        this.explosionTexture = null;
        this.explosionMaterial = null;
        this.maxExplosions = 50;
        this.explosionDuration = 1500;
        this.initialized = false;
        this.debugMode = true;
    }

    async initialize() {
        try {
            // Load explosion texture
            const textureLoader = new THREE.TextureLoader();
            this.explosionTexture = await new Promise((resolve, reject) => {
                textureLoader.load('assets/explode.png', 
                    (texture) => {
                        console.log('Explosion texture loaded successfully');
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading explosion texture:', error);
                        reject(error);
                    }
                );
            });
            
            // Create a more visible material
            this.explosionMaterial = new THREE.SpriteMaterial({
                map: this.explosionTexture,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending,
                color: 0xff0000,
                depthWrite: false
            });
            
            this.initialized = true;
            console.log('ExplosionManager initialized successfully');
            
            // Create a test explosion
            this.createTestExplosion();
        } catch (error) {
            console.error('Failed to initialize ExplosionManager:', error);
            displayError('Failed to initialize explosion effects', error);
        }
    }

    createTestExplosion() {
        // Create a test explosion at a random city's position
        if (cities.length > 0) {
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            const position = latLonToVector3(randomCity.lat, randomCity.lon, 1.02); // Slightly above surface
            this.createExplosion(position);
            console.log(`Created test explosion at ${randomCity.name}:`, position);
        }
    }

    createExplosion(position, cityName = 'unknown') {
        if (!this.initialized) {
            console.warn('ExplosionManager not initialized');
            return;
        }

        if (this.explosions.length >= this.maxExplosions) {
            if (this.debugMode) console.log('Max explosions reached, skipping new explosion');
            return;
        }

        try {
            const sprite = new THREE.Sprite(this.explosionMaterial);
            sprite.position.copy(position);
            
            // Reduced initial size by 50%
            const initialSize = 0.06 + Math.random() * 0.03; // Was 0.12 + Math.random() * 0.06
            sprite.scale.set(initialSize, initialSize, 1);
            
            const hue = 0.0 + (Math.random() * 0.1);
            sprite.material.color.setHSL(hue, 1.0, 0.5);
            
            scene.add(sprite);

            const explosion = {
                sprite,
                startTime: Date.now(),
                position: position.clone(),
                scale: initialSize,
                // Reduced maximum scale by 50%
                maxScale: 0.125 + Math.random() * 0.075, // Was 0.25 + Math.random() * 0.15
                cityName: cityName
            };

            this.explosions.push(explosion);
            if (this.debugMode) {
                console.log(`Created explosion in ${cityName} at position:`, position);
                console.log(`Total active explosions: ${this.explosions.length}`);
            }
        } catch (error) {
            console.error('Error creating explosion:', error);
        }
    }

    update() {
        const currentTime = Date.now();
        let removedCount = 0;
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const elapsed = currentTime - explosion.startTime;
            const progress = elapsed / this.explosionDuration;

            if (progress >= 1) {
                scene.remove(explosion.sprite);
                this.explosions.splice(i, 1);
                removedCount++;
                continue;
            }

            explosion.scale = explosion.maxScale * (1 - progress);
            explosion.sprite.scale.set(explosion.scale, explosion.scale, 1);
            explosion.sprite.material.opacity = 1 - progress;
            explosion.sprite.lookAt(camera.position);
        }

        if (this.debugMode && removedCount > 0) {
            console.log(`Removed ${removedCount} explosions. Remaining: ${this.explosions.length}`);
        }
    }
}

// Add explosion manager to the global scope
let explosionManager;

// Add MissileManager class after ExplosionManager
class MissileManager {
    constructor() {
        this.missiles = [];
        this.trailMaterial = null;
        this.leadingDotMaterial = null;
        this.maxMissiles = 10;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Create trail material - white with high opacity
            this.trailMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                linewidth: 2
            });

            // Create material for the leading dot
            this.leadingDotMaterial = new THREE.PointsMaterial({
                color: 0xff0000,
                size: 0.02,
                transparent: true,
                opacity: 1.0,
                sizeAttenuation: true
            });

            this.initialized = true;
            console.log('MissileManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MissileManager:', error);
            displayError('Failed to initialize missile effects', error);
        }
    }

    createMissile(sourceCity, targetCity) {
        if (!this.initialized || this.missiles.length >= this.maxMissiles) {
            return;
        }

        try {
            const maxTrailPoints = 200;
            // Create trail geometry
            const trailGeometry = new THREE.BufferGeometry();
            const trailPositions = new Float32Array(maxTrailPoints * 3);
            trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
            // Initialize draw range to 0
            trailGeometry.setDrawRange(0, 0);
            const trail = new THREE.Line(trailGeometry, this.trailMaterial);
            
            // Create leading dot
            const dotGeometry = new THREE.BufferGeometry();
            const dotPositions = new Float32Array(3);
            dotGeometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
            const leadingDot = new THREE.Points(dotGeometry, this.leadingDotMaterial);
            
            // Ensure trail and dot render on top
            trail.renderOrder = 1;
            leadingDot.renderOrder = 2;

            // Calculate initial position and direction
            const startPos = sourceCity.position.clone();
            const endPos = targetCity.position.clone();
            
            // Position slightly above the surface
            startPos.multiplyScalar(1.02);

            // Calculate distance for dynamic arc height
            const distance = startPos.distanceTo(endPos);
            
            // Add to scene
            scene.add(trail);
            scene.add(leadingDot);

            // Create missile object
            const missileObj = {
                trail: trail,
                leadingDot: leadingDot,
                startPos: startPos,
                endPos: endPos,
                speed: 0.008,
                progress: 0,
                sourceCity: sourceCity,
                targetCity: targetCity,
                distance: distance, // Store the distance
                trailPositions: trailPositions,
                trailPointCount: 0,
                maxTrailPoints: maxTrailPoints
            };

            this.missiles.push(missileObj);
        } catch (error) {
            console.error('Error creating missile:', error);
        }
    }

    update() {
        const currentTime = Date.now();
        
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            
            // Update missile position
            missile.progress += missile.speed;
            if (missile.progress >= 1) {
                // Missile reached target
                explosionManager.createExplosion(missile.endPos, missile.targetCity.name);
                scene.remove(missile.trail);
                scene.remove(missile.leadingDot);
                this.missiles.splice(i, 1);
                continue;
            }

            // Calculate current position along curved trajectory
            const currentPos = missile.startPos.clone().lerp(missile.endPos, missile.progress);
            
            // Calculate dynamic arc height based on distance
            const arcHeightFactor = 0.25; // Adjust this factor to control arc height
            const dynamicArcHeight = missile.distance * arcHeightFactor;
            const height = Math.sin(missile.progress * Math.PI) * dynamicArcHeight;
            
            const direction = missile.endPos.clone().sub(missile.startPos).normalize();
            const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
            const up = direction.clone().cross(right).normalize();
            const arcOffset = up.multiplyScalar(height);
            currentPos.add(arcOffset);
            
            // Update leading dot position
            const dotPositions = missile.leadingDot.geometry.attributes.position.array;
            dotPositions[0] = currentPos.x;
            dotPositions[1] = currentPos.y;
            dotPositions[2] = currentPos.z;
            missile.leadingDot.geometry.attributes.position.needsUpdate = true;
            
            // Update trail geometry using shifting buffer
            const positions = missile.trailPositions;
            const maxPoints = missile.maxTrailPoints;
            let pointCount = missile.trailPointCount;

            if (pointCount < maxPoints) {
                // Add point if buffer is not full
                positions[pointCount * 3] = currentPos.x;
                positions[pointCount * 3 + 1] = currentPos.y;
                positions[pointCount * 3 + 2] = currentPos.z;
                pointCount++;
            } else {
                // Shift points back if buffer is full
                for (let j = 0; j < maxPoints - 1; j++) {
                    positions[j * 3] = positions[(j + 1) * 3];
                    positions[j * 3 + 1] = positions[(j + 1) * 3 + 1];
                    positions[j * 3 + 2] = positions[(j + 1) * 3 + 2];
                }
                // Add new point at the end
                positions[(maxPoints - 1) * 3] = currentPos.x;
                positions[(maxPoints - 1) * 3 + 1] = currentPos.y;
                positions[(maxPoints - 1) * 3 + 2] = currentPos.z;
            }
            
            missile.trailPointCount = pointCount;
            
            // Update draw range and mark attribute for update
            missile.trail.geometry.setDrawRange(0, pointCount);
            missile.trail.geometry.attributes.position.needsUpdate = true;
            
            // Ensure trail material is visible
            missile.trail.material.opacity = 0.8;
            missile.trail.material.needsUpdate = true;
        }
    }
}

// Add missile manager to global scope
let missileManager;

// Update simulation parameters with new default infection rate
const simulationParams = {
    running: false,
    infectionRate: 0.12,
    recoveryRate: 0.5,
    internationalFlights: 2,
    showLabels: true,
    maxR0: 3.0,
    flightTransmissionMultiplier: 0.08,
    musicVolume: 2  // Changed default to 2
};

// City data structure
class City {
    constructor(lat, lon, population, name) {
        this.lat = lat;
        this.lon = lon;
        this.population = population;
        this.name = name;
        this.infected = 0;
        this.mesh = null;
        this.label = null;
        this.position = latLonToVector3(lat, lon, 1.01);
        this.fullyInfected = false;
        this.hasBeenInfected = false;
        this.lastExplosionTime = 0; // Track when the last explosion occurred
        this.explosionCooldown = 0; // Track cooldown between explosions
        this.lastMissileTime = 0;
        this.missileCooldown = 0;
    }

    updateInfection(deltaTime) {
        if (this.infected > 0 && !this.fullyInfected) {
            // More aggressive infection growth model
            const infectionRate = simulationParams.R0 * simulationParams.infectionSpeed;
            const newInfected = Math.min(
                this.population - this.infected,
                Math.ceil(this.infected * infectionRate * deltaTime)
            );
            
            if (newInfected > 0) {
                this.infected += newInfected;
                
                // Check if city is effectively fully infected
                if (this.infected >= this.population * simulationParams.maxInfectionRate) {
                    this.infected = this.population;
                    this.fullyInfected = true;
                    console.log(`${this.name} is fully infected!`);
                }
                
                this.updateVisualization();
                console.log(`${this.name}: ${this.infected.toLocaleString()} infected (${((this.infected/this.population)*100).toFixed(2)}%)`);
            }
        }

        // Update explosion cooldown
        if (this.explosionCooldown > 0) {
            this.explosionCooldown -= deltaTime;
            return;
        }

        // Check for explosion with reduced frequency and added randomness
        if (this.infected > 0) {
            const infectionRate = this.infected / this.population;
            // Only consider explosion if infection rate is very high (95% or more)
            if (infectionRate > 0.95) {
                // Reduced base chance and added randomness
                const baseChance = 0.01; // 1% base chance per frame
                const randomFactor = Math.random() * 0.02; // Add up to 2% random chance
                const explosionChance = baseChance + randomFactor;
                
                if (Math.random() < explosionChance) {
                    const position = latLonToVector3(this.lat, this.lon, 1.02);
                    explosionManager.createExplosion(position, this.name);
                    
                    // Set a random cooldown between 1-3 seconds
                    this.explosionCooldown = 1 + Math.random() * 2;
                }
            }
        }

        // Update missile cooldown
        if (this.missileCooldown > 0) {
            this.missileCooldown -= deltaTime;
            return;
        }

        // Check for missile launch
        if (this.infected > 0) {
            const infectionRate = this.infected / this.population;
            if (infectionRate > 0.95) {
                const missileChance = 0.005; // 0.5% chance per frame
                if (Math.random() < missileChance) {
                    // Find a target city
                    const possibleTargets = cities.filter(city => 
                        city !== this && 
                        city.infected > 0 &&
                        city.infected < city.population * 0.95
                    );

                    if (possibleTargets.length > 0) {
                        const targetCity = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                        missileManager.createMissile(this, targetCity);
                        
                        // Set cooldown between 5-10 seconds
                        this.missileCooldown = 5 + Math.random() * 5;
                        
                        // Log the missile launch
                        UIManager.addLogMessage(`MISSILE LAUNCH: ${this.name} ➜ ${targetCity.name}`);
                    }
                }
            }
        }
    }

    updateVisualization() {
        const infectionRate = this.infected / this.population;
        const material = this.mesh.material;
        
        // Keep dots large
        const baseSize = 0.15;
        this.mesh.scale.setScalar(baseSize);

        // Enhanced color transition
        material.color.setRGB(
            Math.min(1, infectionRate * 1.5),     // More red
            Math.max(0, 1 - infectionRate * 1.2), // Less green
            0                                     // No blue
        );

        // Stronger emissive glow
        material.emissive.setRGB(
            Math.min(0.8, infectionRate * 1.2),
            Math.max(0, 0.3 - infectionRate * 0.3),
            0
        );

        // Update label color
        if (this.label) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;

            context.font = 'bold 32px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            context.strokeStyle = 'black';
            context.lineWidth = 6;
            context.strokeText(this.name, canvas.width/2, canvas.height/2);
            
            // Set label color based on infection status
            if (this.infected > 0) {
                const red = 255;
                const green = Math.max(0, Math.floor(255 * (1 - infectionRate * 1.2)));
                context.fillStyle = `rgb(${red}, ${green}, 0)`;
            } else {
                // Reset to white when no infection
                context.fillStyle = 'white';
            }
            context.fillText(this.name, canvas.width/2, canvas.height/2);

            this.label.material.map.dispose();
            this.label.material.map = new THREE.CanvasTexture(canvas);
            this.label.material.needsUpdate = true;
        }
    }

    resetVisualization() {
        // Reset mesh color to green
        if (this.mesh) {
            const material = this.mesh.material;
            material.color.setRGB(0, 1, 0); // Green
            material.emissive.setRGB(0, 0.2, 0);
        }

        // Reset label to white
        if (this.label) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;

            context.font = 'bold 32px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            context.strokeStyle = 'black';
            context.lineWidth = 6;
            context.strokeText(this.name, canvas.width/2, canvas.height/2);
            
            context.fillStyle = 'white';
            context.fillText(this.name, canvas.width/2, canvas.height/2);

            this.label.material.map.dispose();
            this.label.material.map = new THREE.CanvasTexture(canvas);
            this.label.material.needsUpdate = true;
        }
    }

    startInfection() {
        // Increase initial infection from 1% to 5% of population
        this.infected = Math.ceil(this.population * 0.05);
        this.hasBeenInfected = true;
        this.updateVisualization();
    }
}

// Global variables
let cities = [];
let clock = new THREE.Clock();
let totalInfected = 0;
const WORLD_POPULATION = 7900000000;

// Convert lat/lon to 3D position
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Simplified text sprite creation
function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Strong outline for better visibility
    context.strokeStyle = 'black';
    context.lineWidth = 6;
    context.strokeText(text, canvas.width/2, canvas.height/2);
    context.fillStyle = 'white';
    context.fillText(text, canvas.width/2, canvas.height/2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthWrite: false // This helps with visibility
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.25, 1);
    return sprite;
}

// Simplified visibility check
function isPointVisible(position, camera) {
    // Get direction from camera to point
    const directionToPoint = position.clone().sub(camera.position).normalize();
    // Get camera's forward direction
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    // If dot product is negative, point is in front of camera
    return directionToPoint.dot(cameraDirection) < 0;
}

// Initialize major cities data
function initializeCities() {
    const majorCities = [
        { lat: 31.2304, lon: 121.4737, pop: 24.9, name: "Shanghai" },
        { lat: 40.7128, lon: -74.0060, pop: 18.8, name: "New York" },
        { lat: 51.5074, lon: -0.1278, pop: 14.0, name: "London" },
        { lat: -23.5505, lon: -46.6333, pop: 22.3, name: "Sao Paulo" },
        { lat: 35.6762, lon: 139.6503, pop: 37.4, name: "Tokyo" },
        { lat: 19.4326, lon: -99.1332, pop: 21.8, name: "Mexico City" },
        { lat: 28.6139, lon: 77.2090, pop: 30.3, name: "Delhi" },
        { lat: -33.8688, lon: 151.2093, pop: 15.3, name: "Sydney" },
        { lat: 55.7558, lon: 37.6173, pop: 22.5, name: "Moscow" },
        { lat: 30.0444, lon: 31.2357, pop: 20.9, name: "Cairo" },
        { lat: 39.9042, lon: 116.4074, pop: 20.4, name: "Beijing" },
        { lat: 37.5665, lon: 126.9780, pop: 25.6, name: "Seoul" },
        { lat: 22.3193, lon: 114.1694, pop: 7.5, name: "Hong Kong" },
        { lat: 1.3521, lon: 103.8198, pop: 5.7, name: "Singapore" },
        { lat: -6.2088, lon: 106.8456, pop: 10.5, name: "Jakarta" },
        // New USA cities
        { lat: 34.0522, lon: -118.2437, pop: 12.4, name: "Los Angeles" },
        { lat: 41.8781, lon: -87.6298, pop: 8.9, name: "Chicago" },
        { lat: 29.7604, lon: -95.3698, pop: 6.7, name: "Houston" },
        // New African cities
        { lat: -26.2041, lon: 28.0473, pop: 4.4, name: "Johannesburg" },
        { lat: 6.5244, lon: 3.3792, pop: 14.9, name: "Lagos" },
        { lat: -1.2921, lon: 36.8219, pop: 4.4, name: "Nairobi" },
        // New European cities
        { lat: 48.8566, lon: 2.3522, pop: 11.0, name: "Paris" },
        { lat: 52.5200, lon: 13.4050, pop: 3.6, name: "Berlin" },
        { lat: 41.9028, lon: 12.4964, pop: 2.8, name: "Rome" },
        { lat: 48.2082, lon: 16.3738, pop: 1.9, name: "Vienna" },
        // New Middle East cities
        { lat: 25.2048, lon: 55.2708, pop: 3.3, name: "Dubai" },
        { lat: 24.7136, lon: 46.6753, pop: 7.7, name: "Riyadh" },
        { lat: 32.0853, lon: 34.7818, pop: 4.0, name: "Tel Aviv" },
        { lat: 33.5138, lon: 36.2765, pop: 2.1, name: "Damascus" },
        { lat: 33.8938, lon: 35.5018, pop: 2.4, name: "Beirut" },
        { lat: 31.9521, lon: 35.2332, pop: 1.6, name: "Amman" },
        // New South American cities
        { lat: -34.6037, lon: -58.3816, pop: 15.2, name: "Buenos Aires" },
        { lat: -12.0464, lon: -77.0428, pop: 10.7, name: "Lima" },
        { lat: -33.4489, lon: -70.6693, pop: 6.8, name: "Santiago" },
        { lat: -0.1807, lon: -78.4678, pop: 2.7, name: "Quito" },
        { lat: 4.7110, lon: -74.0721, pop: 7.4, name: "Bogota" }
    ];

    cities = majorCities.map(city => {
        const newCity = new City(city.lat, city.lon, city.pop * 1000000, city.name);
        
        // Create city dot
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x002000,
            shininess: 30
        });
        newCity.mesh = new THREE.Mesh(geometry, material);
        
        // Position slightly above the globe surface
        const position = latLonToVector3(city.lat, city.lon, 1.01); // Note the 1.01 instead of 1.0
        newCity.mesh.position.copy(position);
        newCity.position.copy(position);
        newCity.mesh.scale.setScalar(0.15);
        
        // Create and position label
        newCity.label = createTextSprite(city.name);
        newCity.label.position.copy(position);
        newCity.label.position.multiplyScalar(1.15);
        
        scene.add(newCity.mesh);
        scene.add(newCity.label);
        
        return newCity;
    });
    
    console.log(`Initialized ${cities.length} cities`);
}

// Simulation control functions
function startSimulation() {
    if (!simulationParams.running) {
        simulationParams.running = true;
        clock.start();
        
        // Start or resume timer
        if (!isTimerRunning) {
            if (elapsedTime === 0) {
                startTime = Date.now();
            } else {
                startTime = Date.now() - (elapsedTime * 1000);
            }
            isTimerRunning = true;
        }
        
        if (totalInfected === 0) {
            // Start with more infected in the initial city
            const startCity = cities[Math.floor(Math.random() * cities.length)];
            startCity.infected = startCity.population * 0.05; // Start with 5% infected
            startCity.updateVisualization();
            console.log(`Starting infection in ${startCity.name} with ${startCity.infected.toLocaleString()} people`);
            updateStats();
        }
    } else {
        // Pause the simulation
        simulationParams.running = false;
        clock.stop();
        isTimerRunning = false;
    }
}

function pauseSimulation() {
    simulationParams.running = false;
    clock.stop();
}

function resetSimulation() {
    pauseSimulation();
    totalInfected = 0;
    cities.forEach(city => {
        city.infected = 0;
        city.updateVisualization();
    });
    updateStats();
}

function updateStats() {
    totalInfected = cities.reduce((sum, city) => sum + city.infected, 0);
    document.getElementById('infected-count').textContent = Math.floor(totalInfected).toLocaleString();
    const infectionRate = (totalInfected / WORLD_POPULATION) * 100;
    document.getElementById('infection-rate').textContent = infectionRate.toFixed(4) + '%';
}

// Updated GUI initialization with button and new label
function initGUI() {
    gui = new dat.GUI();
    
    // Create button controller
    const simulationController = {
        running: false,
        startStop: function() {
            this.running = !this.running;
            simulationParams.running = this.running;
            
            if (this.running) {
                if (!isTimerRunning) {
                    if (elapsedTime === 0) {
                        startTime = Date.now();
                    } else {
                        startTime = Date.now() - (elapsedTime * 1000);
                    }
                    isTimerRunning = true;
                }
                
                if (backgroundMusic) {
                    backgroundMusic.play();
                }
            } else {
                isTimerRunning = false;
                if (backgroundMusic) {
                    backgroundMusic.pause();
                }
            }
            
            startStopButton.name(this.running ? 'Pause Simulation' : 'Start Simulation');
        },
        reset: function() {
            resetSimulation();
        },
        testMissile: function() {
            if (cities.length >= 2) {
                // Get two random different cities
                const sourceIndex = Math.floor(Math.random() * cities.length);
                let targetIndex;
                do {
                    targetIndex = Math.floor(Math.random() * cities.length);
                } while (targetIndex === sourceIndex);

                const sourceCity = cities[sourceIndex];
                const targetCity = cities[targetIndex];

                // Create missile
                missileManager.createMissile(sourceCity, targetCity);
                
                // Log the test missile
                UIManager.addLogMessage(`TEST MISSILE: ${sourceCity.name} ➜ ${targetCity.name}`);
            }
        }
    };

    // Add controls
    const startStopButton = gui.add(simulationController, 'startStop').name('Start Simulation');
    gui.add(simulationController, 'reset').name('Reset Simulation');
    
    // Create a folder for simulation parameters
    const simFolder = gui.addFolder('Simulation Parameters');
    simFolder.add(simulationParams, 'infectionRate', 0, 1, 0.01).name('Infection Rate');
    simFolder.add(simulationParams, 'recoveryRate', 0, 1, 0.01).name('Recovery Rate');
    simFolder.add(simulationParams, 'internationalFlights', 0, 100, 1).name('Daily Flights (000)');
    simFolder.add(simulationParams, 'showLabels').name('Show Labels');
    simFolder.add(simulationParams, 'musicVolume', 0, 10, 1).name('Music Volume')
        .onChange(function(value) {
            if (backgroundMusic) {
                backgroundMusic.volume = value / 10;
            }
        });
    simFolder.open();

    // Add test missile button
    const testFolder = gui.addFolder('Test Tools');
    testFolder.add(simulationController, 'testMissile').name('Test Missile Launch');
    testFolder.open();
}

// Initialize Three.js scene
async function init() {
    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Add Earth
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2233ff,
        shininess: 0.5
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Add OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Initialize cities
    initializeCities();

    // Setup GUI
    initGUI();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Initialize UI after Three.js scene setup
    UIManager.initialize();

    // Initialize background music
    backgroundMusic = new Audio('assets/music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = simulationParams.musicVolume / 10; // Convert 0-10 range to 0-1

    // Updated camera positioning function with more precise coordinates
    function positionCameraOverCity(cityName) {
        const city = cities.find(c => c.name === cityName);
        if (city) {
            // Convert the city's position to spherical coordinates and add 180 degrees
            const phi = (90 - city.lat) * (Math.PI / 180);
            const theta = (city.lon + 360) * (Math.PI / 180); // Added 180 degrees by using 360 instead of 180
            
            // Position camera at a good viewing distance
            const distance = 2;
            
            // Calculate camera position with flipped coordinates
            camera.position.set(
                -distance * Math.sin(phi) * Math.cos(theta), // Note the negative sign
                distance * Math.cos(phi),
                -distance * Math.sin(phi) * Math.sin(theta)  // Note the negative sign
            );
            
            // Ensure we're looking at the correct spot on the globe
            const targetPosition = new THREE.Vector3();
            targetPosition.copy(city.position);
            
            camera.lookAt(targetPosition);
            controls.target.copy(targetPosition);
            controls.update();
        }
    }

    // Call this after cities are initialized
    setTimeout(() => {
        positionCameraOverCity("Wuhan");
    }, 100);

    // Add this after your camera and controls initialization, but before the animation loop
    function setInitialCameraPosition() {
        // Position for viewing Asia (these are approximate coordinates)
        camera.position.set(-3, 1.5, -1.5);  // Middle ground between original (-2,1,-1) and last (-4,2,-2)
        
        // Look at the center of the globe
        camera.lookAt(0, 0, 0);
        
        // Update controls
        controls.target.set(0, 0, 0);
        controls.update();
    }

    // Call this after your scene is set up
    setInitialCameraPosition();

    // Initialize explosion manager
    explosionManager = new ExplosionManager();
    await explosionManager.initialize();

    // Initialize missile manager
    missileManager = new MissileManager();
    await missileManager.initialize();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add frameCount to track frames for logging
let frameCount = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    frameCount++;
    
    // Update timer if running
    if (isTimerRunning) {
        elapsedTime = (Date.now() - startTime) / 1000;
        UIManager.updateTimer(elapsedTime);
    }
    
    if (simulationParams.running) {
        updateInfection();
    }

    // Update labels visibility with corrected logic
    cities.forEach(city => {
        if (city.label) {
            city.label.lookAt(camera.position);
            
            // Get vector from camera to label
            const camToLabel = new THREE.Vector3().subVectors(
                city.label.position,
                camera.position
            );
            
            // Get dot product with label's position vector
            const dotProduct = camToLabel.dot(city.label.position.clone().normalize());
            
            // Show label only when on the visible side (when dot product is negative)
            city.label.visible = dotProduct < 0;
        }
    });

    controls.update();

    // Update explosions
    if (explosionManager) {
        explosionManager.update();
    }

    // Update missiles
    if (missileManager) {
        missileManager.update();
    }

    renderer.render(scene, camera);
}

// Initialize and start
init();
animate();

// Update the displayError function with better clipboard handling
function displayError(userMessage, error) {
    console.error(userMessage, error);

  errorMessageElement.textContent = userMessage;

  let detailText = 'No further details available.';
  if (error instanceof Error) {
    detailText = `Error Type: ${error.name}\nMessage: ${error.message}\nStack: ${error.stack || 'Not available'}`;
  } else if (typeof error === 'string') {
    detailText = error;
  } else if (error && typeof error === 'object') {
        detailText = JSON.stringify(error, null, 2);
        if (error.type && error.target && error.target.src) {
        detailText = `Error Type: ${error.type}\nResource: ${error.target.src}\nStatus: Failed to load resource`;
    }
  }

  errorDetailsElement.textContent = detailText;
    errorContainer.style.display = 'block';

    // Updated clipboard handling
    copyErrorButton.onclick = async () => {
        try {
            // Check if clipboard API is available
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(detailText);
                copyStatusElement.textContent = '已复制!';
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = detailText;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    copyStatusElement.textContent = '已复制!';
                } catch (err) {
                    copyStatusElement.textContent = '复制失败 - 请手动复制';
                    console.error('Fallback clipboard copy failed:', err);
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            copyStatusElement.textContent = '复制失败 - 请手动复制';
            console.error('Clipboard copy failed:', err);
        }

        // Clear the status message after 2 seconds
        setTimeout(() => {
            copyStatusElement.textContent = '';
        }, 2000);
    };
}

// Updated infection spread logic
function updateInfection() {
    // Monitor and log global infection stats
    if (frameCount % 60 === 0) {
        const totalInfected = cities.reduce((sum, city) => sum + city.infected, 0);
        const totalPopulation = cities.reduce((sum, city) => sum + city.population, 0);
        const infectedCityCount = cities.filter(city => city.infected > 0).length;
        const globalInfectionRate = (totalInfected/totalPopulation) * 100;
        
        // Update both the population stats and global infection stats
        UIManager.updatePopulationStats(globalInfectionRate / 100);
        UIManager.updateStats(totalInfected, totalPopulation, infectedCityCount);
        
        // Check for events
        EventManager.checkEvents(globalInfectionRate / 100);

        // Changed condition to check if infection rate is greater than 97%
        if (globalInfectionRate > 97) {
            // Stop the simulation
            simulationParams.running = false;
            
            // Show victory message
            UIManager.showVictoryMessage();
            
            // Log final statistics
            UIManager.addLogMessage(`GAME OVER - Global infection reached ${globalInfectionRate.toFixed(1)}%`);
            
            // Optional: Update GUI button state if needed
            if (typeof updateGUIButton === 'function') {
                updateGUIButton();
            }
        }
    }

    // Flight spread with proper logging
    const flightsPerFrame = (simulationParams.internationalFlights * 30) / 60;
    const flightsThisFrame = Math.floor(flightsPerFrame) + (Math.random() < (flightsPerFrame % 1) ? 1 : 0);

    for (let i = 0; i < flightsThisFrame; i++) {
        const infectedCities = cities.filter(city => city.infected > 0);
        if (infectedCities.length === 0) continue;

        const sourceCity = infectedCities[Math.floor(Math.random() * infectedCities.length)];
        const possibleDestinations = cities.filter(city => 
            city !== sourceCity && 
            city.infected < city.population * 0.95
        );

        if (possibleDestinations.length === 0) continue;

        const baseTransmissionRate = simulationParams.infectionRate;
        const transmissionProb = baseTransmissionRate * (sourceCity.infected / sourceCity.population) * 1.5;
        
        if (Math.random() < transmissionProb) {
            // Store destination city reference
            const destinationCity = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
            const previousInfected = destinationCity.infected;
            const newInfections = Math.ceil(destinationCity.population * 0.03);
            
            destinationCity.infected = Math.min(
                destinationCity.population,
                destinationCity.infected + newInfections
            );

            // Log significant changes (more than 1% change in infection)
            if ((destinationCity.infected - previousInfected) / destinationCity.population > 0.01) {
                const message = `${sourceCity.name} ➜ ${destinationCity.name}: ${newInfections.toLocaleString()} new cases (${((destinationCity.infected/destinationCity.population) * 100).toFixed(1)}% infected)`;
                UIManager.addLogMessage(message);
                console.log("Transmission:", message); // Debug log
            }
        }
    }

    // Local spread with logging
    cities.forEach(city => {
        if (city.infected > 0) {
            const nearbyCities = cities.filter(otherCity => {
                if (city === otherCity) return false;
                const distance = city.position.distanceTo(otherCity.position);
                return distance < 0.35;
            });

            nearbyCities.forEach(nearbyCity => {
                const baseTransmissionRate = simulationParams.infectionRate * 0.8;
                const infectionPressure = (city.infected / city.population) * baseTransmissionRate * 0.5;
                
                if (Math.random() < infectionPressure) {
                    const previousInfected = nearbyCity.infected;
                    const newInfections = Math.ceil(nearbyCity.population * 0.02);
                    
                    nearbyCity.infected = Math.min(
                        nearbyCity.population,
                        nearbyCity.infected + newInfections
                    );

                    // Log significant local spread
                    if ((nearbyCity.infected - previousInfected) / nearbyCity.population > 0.02) {
                        const message = `Local spread: ${city.name} ➜ ${nearbyCity.name}: ${newInfections.toLocaleString()} new cases (${((nearbyCity.infected/nearbyCity.population) * 100).toFixed(1)}% infected)`;
                        UIManager.addLogMessage(message);
                    }
                }
            });
        }
    });

    // Initial infection logging
    if (!cities.some(city => city.infected > 0)) {
        const startingCity = cities.find(city => city.name === "Wuhan") || cities[0];
        startingCity.startInfection();
        UIManager.addLogMessage(`Outbreak started in ${startingCity.name}`);
    }

    // Call updateInfection on each city to handle explosions
    const deltaTime = clock.getDelta();
    cities.forEach(city => {
        if (city.infected > 0) {
            city.updateInfection(deltaTime);
        }
    });

    // Reduced recovery rate to maintain infection momentum
    cities.forEach(city => {
        if (city.infected > 0) {
            if (Math.random() < simulationParams.recoveryRate * 0.2) { // Reduced to 0.2
                const recovered = Math.ceil(city.infected * 0.02); // Reduced to 0.02
                city.infected = Math.max(0, city.infected - recovered);
            }
            city.updateVisualization();
        }
    });
}

// Add this with your other Three.js initialization code
function createGlobe() {
    // Load the Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('assets/earth.jpg');
    
    // Create the globe geometry
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Create material with the earth texture
    const globeMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        transparent: true,
        opacity: 0.8  // Make it slightly transparent to see the infection colors better
    });
    
    // Create the globe mesh
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    
    return globe;
}

// Update your existing sphere creation code
// Replace your current blue sphere with this:
const globe = createGlobe();

// You might also want to adjust the lighting to better show the texture
function setupLighting() {
    // Add ambient light for better texture visibility
    const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

    // Adjust your existing directional light if needed
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);
}
