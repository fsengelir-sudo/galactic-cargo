// src/engine/ThreeRenderer.js
import * as THREE from 'three';
import { sfx } from './SoundFX';
import { buildParis } from './cities/Paris';
import { buildLondon } from './cities/London';
import { buildRome } from './cities/Rome';
import { buildBarcelona } from './cities/Barcelona';
import { buildVenice } from './cities/Venice'; 
import { buildDefaultCity } from './cities/DefaultCity';

const keys = {};

export const mobileInput = { gas: false, brake: false };
export const setMobileInput = (action, isPressed) => {
    mobileInput[action] = isPressed;
};

export const camOffsetTweak = { x: 0, y: 15, z: 16 };
export const CAM_STEP = 1; 

const safeT = (t) => {
    if (isNaN(t) || !isFinite(t)) return 0;
    let res = t % 1.0;
    if (res < 0) res += 1.0;
    return res; 
};

export function initRenderer(container, levelData, upgradesOrCallback, maybeCallback, maybeOnComplete) {
    let animationId;
    
    // GÜVENLİ KÖPRÜ: Arayüzden gelen parametre eksikliklerini tolere eder
    let upgrades = { engine: 1, brakes: 1, grip: 1, cargo: 1 };
    let onUIUpdate = () => {}; 
    let onLevelComplete = () => {};

    if (typeof upgradesOrCallback === 'function') {
        onUIUpdate = upgradesOrCallback;
        if (typeof maybeCallback === 'function') onLevelComplete = maybeCallback;
    } else {
        if (upgradesOrCallback) upgrades = upgradesOrCallback;
        if (typeof maybeCallback === 'function') onUIUpdate = maybeCallback;
        if (typeof maybeOnComplete === 'function') onLevelComplete = maybeOnComplete;
    }

    const scene = new THREE.Scene();
    
    const engineMult = 1.0 + (upgrades.engine - 1) * 0.18; 
    const brakeMult = 1.0 + (upgrades.brakes - 1) * 0.25;  
    const gripMult = 1.0 / (1.0 + (upgrades.grip - 1) * 0.3); 
    const maxCargoHeight = 5.5 + (upgrades.cargo - 1) * 1.5; 

    const currentId = levelData ? levelData.id : 0;
    const isParis = currentId === 1;
    const isLondon = currentId === 2;
    const isRome = currentId === 3;
    const isBarcelona = currentId === 4;
    const isVenice = currentId === 5; 

    let skyColor, fogDensity, groundColor, ambientIntensity, sunColor;

    if (isParis) { skyColor = 0x2a75d3; fogDensity = 0.00005; groundColor = 0x3d7028; ambientIntensity = 1.0; sunColor = 0xffffff; }
    else if (isLondon) { skyColor = 0x8a9ba8; fogDensity = 0.0002; groundColor = 0x4a5b6b; ambientIntensity = 0.8; sunColor = 0xe0e6ed; }
    else if (isRome) { skyColor = 0xc87d7b; fogDensity = 0.00015; groundColor = 0x6e5c4f; ambientIntensity = 0.9; sunColor = 0xffa07a; }
    else if (isBarcelona) { skyColor = 0x3399ff; fogDensity = 0.0001; groundColor = 0xc2a66b; ambientIntensity = 1.2; sunColor = 0xffcc44; }
    else if (isVenice) { skyColor = 0x4ba3e3; fogDensity = 0.0001; groundColor = 0x1a6b7d; ambientIntensity = 1.2; sunColor = 0xffffee; }
    else { skyColor = 0x87CEEB; fogDensity = 0.00015; groundColor = 0x004477; ambientIntensity = 0.7; sunColor = 0xffffff; }

    scene.fog = new THREE.FogExp2(skyColor, fogDensity); 
    scene.background = new THREE.Color(skyColor); 

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 20000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.useLegacyLights = false; 
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(sunColor, 2.5); 
    sunLight.position.set(2000, 3000, 1000);
    scene.add(sunLight);

    const globalUp = new THREE.Vector3(0, 1, 0);

    const groundGeo = new THREE.PlaneGeometry(50000, 50000);
    const groundMat = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.8, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const basePoints = [];
    const numBase = 120; 

    for(let i = 0; i < numBase; i++) {
        const a = (i / numBase) * Math.PI * 2; 
        let x, y, z;

        if (isParis) { x = Math.sin(a) * 6000; z = Math.sin(a) * Math.cos(a) * 6000; y = 1200 + Math.sin(a * 2) * 300; } 
        else if (isLondon) { x = Math.sin(a * 2) * 1500 + Math.sin(a) * 2000; z = Math.cos(a) * 7000; y = 800 + Math.cos(a * 2) * 150; } 
        else if (isRome) { x = Math.cos(a) * 4500; z = Math.sin(a) * 4500; y = 1200 + Math.sin(a * 7) * 400; } 
        else if (isBarcelona) { x = Math.cos(a) * 4000 + Math.sin(a * 4) * 1200; z = Math.sin(a) * 4000 + Math.cos(a * 3) * 1200; y = 1400 + Math.sin(a * 5) * 500; } 
        else if (isVenice) { x = Math.cos(a) * 3500 + Math.sin(a * 4) * 1500; z = Math.sin(a) * 3500 + Math.cos(a * 4) * 1500; y = 700 + Math.sin(a * 8) * 150; } 
        else { const R = 3500; x = Math.cos(a) * R + Math.cos(a * 2) * 1500; z = Math.sin(a) * R + Math.sin(a * 3) * 1500; const hump = Math.sin(a * 2) + Math.cos(a * 3); y = 1400 + hump * 450; }
        
        basePoints.push(new THREE.Vector3(x, y, z));
    }
    
    const trackCurve = new THREE.CatmullRomCurve3(basePoints, true);
    const trackFrames = trackCurve.computeFrenetFrames(1500, true);
    
    for(let i = 0; i <= 1500; i++) {
        const t = i / 1500;
        const tangent = trackFrames.tangents[i];
        let up = new THREE.Vector3(0, 1, 0);
        
        if (Math.abs(tangent.y) > 0.95) up.set(0.01, 1, 0.01).normalize();
        let binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        if (binormal.lengthSq() < 0.001) binormal.set(1, 0, 0);
        let normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

        let rollAngle = Math.sin(t * Math.PI * 8) * 0.25; 
        if (t > 0.3 && t < 0.4) rollAngle += ((t - 0.3) / 0.1) * Math.PI * 2;
        else if (t > 0.7 && t < 0.8) rollAngle -= ((t - 0.7) / 0.1) * Math.PI * 2;

        normal.applyAxisAngle(tangent, rollAngle);
        binormal.applyAxisAngle(tangent, rollAngle);
        trackFrames.normals[i].copy(normal);
        trackFrames.binormals[i].copy(binormal);
    }

    const sampledTrackPoints = trackCurve.getPoints(200);

    if (isParis) buildParis(scene, trackCurve, sampledTrackPoints);
    else if (isLondon) buildLondon(scene, trackCurve, sampledTrackPoints);
    else if (isRome) buildRome(scene, trackCurve, sampledTrackPoints);
    else if (isBarcelona) buildBarcelona(scene, trackCurve, sampledTrackPoints);
    else if (isVenice) buildVenice(scene, trackCurve, sampledTrackPoints); 
    else buildDefaultCity(scene, sampledTrackPoints);

    let railBedColor = 0xeeeeee; let trackColors = [0x0055ff, 0xff2222, 0xffaa00];
    if (isParis) { railBedColor = 0xffffff; trackColors = [0x0055ff, 0xaaaaaa, 0xff2222]; }
    else if (isLondon) { railBedColor = 0x333333; trackColors = [0xff2222, 0xffffff, 0x0022bb]; }
    else if (isRome) { railBedColor = 0xddccaa; trackColors = [0x009246, 0xffffff, 0xce2b37]; }
    else if (isBarcelona) { railBedColor = 0xffcc00; trackColors = [0xffffff, 0xff0000, 0xffcc00]; }
    else if (isVenice) { railBedColor = 0xf5f5f0; trackColors = [0x008080, 0xd4af37, 0x8b3a2b]; }

    const channelGeo = new THREE.TubeGeometry(trackCurve, 1200, 100, 24, true);
    scene.add(new THREE.Mesh(channelGeo, new THREE.MeshStandardMaterial({ color: railBedColor, roughness: 0.8, metalness: 0.2 })));

    const curves = [];
    const curvesFrenet = []; 
    const railRadius = 4;
    
    for (let trackIdx = 0; trackIdx < 3; trackIdx++) {
        const tPoints = [];
        for (let i = 0; i <= 1500; i++) {
            const t = i / 1500;
            const bPos = trackCurve.getPoint(t);
            const norm = trackFrames.normals[i];
            const bnorm = trackFrames.binormals[i];
            const laneOffset = (trackIdx - 1) * 35; 
            const p = bPos.clone().add(bnorm.clone().multiplyScalar(laneOffset)).add(norm.clone().multiplyScalar(102)); 
            tPoints.push(p);
        }
        const laneCurve = new THREE.CatmullRomCurve3(tPoints, true);
        curves.push(laneCurve);
        curvesFrenet.push({ normals: trackFrames.normals, binormals: trackFrames.binormals }); 
        
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(laneCurve, 1200, railRadius, 6, true), new THREE.MeshBasicMaterial({ color: trackColors[trackIdx] })));
    }

    // TRAFİK LEVHALARI 
    function generateTrafficSigns() {
        const numSigns = 35;
        for (let i = 0; i < numSigns; i++) {
            const tVal = i / numSigns;
            const checkT = safeT(tVal - 0.015);
            const currentPos = trackCurve.getPointAt(safeT(checkT));
            const nextPos = trackCurve.getPointAt(safeT(checkT - 0.005));
            const slopeForce = currentPos.y - nextPos.y; 
            
            const currentTan = trackCurve.getTangentAt(safeT(checkT));
            const nextTan = trackCurve.getTangentAt(safeT(checkT - 0.01));
            const turnSeverity = currentTan.angleTo(nextTan);
            
            let maxLim = 180;
            if (turnSeverity > 0.035) maxLim = 75;
            else if (turnSeverity > 0.02) maxLim = 120;
            if (slopeForce > 3.0) maxLim = Math.min(maxLim, 85);
            
            const pNorm = trackFrames.normals[Math.floor(checkT * 1500) % 1500];
            const dotUp = pNorm ? pNorm.dot(globalUp) : 1;
            let minLim = 30;
            if (dotUp < -0.1) minLim = 80;
            else if (slopeForce > 2.0) minLim = 0;

            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
            ctx.fillRect(0, 0, 256, 128);
            
            ctx.strokeStyle = maxLim <= 85 ? '#ff0055' : '#00ffcc';
            ctx.lineWidth = 12;
            ctx.strokeRect(6, 6, 244, 116);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 38px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`MAX: ${Math.floor(maxLim)}`, 128, 55);
            
            ctx.fillStyle = minLim > 40 ? '#ffaa00' : '#00ffcc';
            ctx.fillText(`MIN: ${Math.floor(minLim)}`, 128, 105);

            const tex = new THREE.CanvasTexture(canvas);
            const signGroup = new THREE.Group();
            
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 25, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
            pole.position.y = 12.5;
            signGroup.add(pole);

            const board = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 1.5), new THREE.MeshStandardMaterial({ map: tex }));
            board.position.set(0, 25, 0.75);
            signGroup.add(board);

            const pos = trackCurve.getPointAt(tVal);
            const norm = trackFrames.normals[Math.floor(tVal * 1500) % 1500];
            const binorm = trackFrames.binormals[Math.floor(tVal * 1500) % 1500];
            const tan = trackCurve.getTangentAt(tVal);

            pos.add(binorm.clone().multiplyScalar(45)); 
            pos.add(norm.clone().multiplyScalar(104)); // Levhaların yüksekliği düzeltildi

            signGroup.position.copy(pos);
            signGroup.up.copy(norm);
            signGroup.lookAt(pos.clone().sub(tan)); // Gemiye bakması sağlandı

            scene.add(signGroup);
        }
    }
    generateTrafficSigns();

    const crystalCount = 150;
    const crystalGeo = new THREE.SphereGeometry(6, 16, 16); 
    const colors = [0x00ffff, 0xff0055, 0x00ffcc];
    const collectibles = [];
    
    for (let i = 0; i < crystalCount; i++) {
        const t = Math.random();
        const trackIdx = Math.floor(Math.random() * 3); 
        const p = curves[trackIdx].getPointAt(t);
        const n = curvesFrenet[trackIdx].normals[Math.floor(t * 1500) % 1500];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const mesh = new THREE.Mesh(crystalGeo, new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.1 }));
        if (n) p.add(n.clone().multiplyScalar(10));
        mesh.position.copy(p);
        scene.add(mesh);
        collectibles.push({ mesh: mesh, trackId: trackIdx, t: t, active: true, points: color === 0x00ffff ? 100 : (color === 0x00ffcc ? 200 : 500), color: color });
    }

    // --- HATALI KISIM ÇÖZÜLDÜ (Mesh position readonly hatası temizlendi) ---
    function buildCargoShip() {
        const shipGroup = new THREE.Group();
        const matHull = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.2 });
        const centerBody = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 20, 16), matHull);
        centerBody.rotation.x = Math.PI / 2;
        centerBody.position.set(0, 4, 0);

        const mainWing = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 10), matHull);
        mainWing.position.set(0, 2, -2);
        
        const leftWheel = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), matHull);
        leftWheel.position.set(-35, 0, 0); 
        const rightWheel = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), matHull);
        rightWheel.position.set(35, 0, 0); 

        const boxMat = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.8, side: THREE.DoubleSide, metalness: 0.3 });
        const cargoBox = new THREE.Group();
        
        const bBase = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 7.5), boxMat);
        const bLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 7.5), boxMat); bLeft.position.set(-3, 3, 0);
        const bRight = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 7.5), boxMat); bRight.position.set(3, 3, 0);
        const bFront = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1), boxMat); bFront.position.set(0, 3, -3.75);
        const bBack = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1), boxMat); bBack.position.set(0, 3, 3.75);
        
        cargoBox.add(bBase, bLeft, bRight, bFront, bBack);
        cargoBox.position.set(0, 5, 6); 
        
        shipGroup.add(centerBody, mainWing, leftWheel, rightWheel, cargoBox);
        shipGroup.cargoBox = cargoBox; 
        return shipGroup;
    }

    const playerShip = buildCargoShip();
    scene.add(playerShip);
    
    const initCamPos = playerShip.localToWorld(new THREE.Vector3(0, 15, 16));
    camera.position.copy(initCamPos);
    camera.up.copy(playerShip.up);
    camera.lookAt(playerShip.localToWorld(new THREE.Vector3(0, 1, -60)));

    const pData = { throttle: 0, t: 0.001, distanceTraveled: 0, lap: 1, cargo: [], exactScore: 0 }; 

    const gameState = { active: true, lap: 1, speed: 0, limit: 180, minSpeed: 30, driveStatus: 'PERFECT', warning: "", score: 0 };
    let cameraShake = 0;
    let lastUIUpdate = 0; 
    let hasCompletedLevel = false;
    let isAutopilot = false;

    let overspeedSlip = 0; 
    let lowspeedSlip = 0;  

    const crashState = { isCrashed: false, timer: 0, velocity: new THREE.Vector3(), angularVelocity: new THREE.Vector3(), detachedCargo: [], lastCamPos: new THREE.Vector3(), lastCamUp: new THREE.Vector3() };

    function triggerCrash(reason) {
        if (crashState.isCrashed) return; 
        crashState.isCrashed = true; crashState.timer = 0;
        sfx.playCrash();

        const tVal = safeT(pData.t);
        const newTangent = curves[1].getTangentAt(tVal).normalize(); // Eksi çarpanı silindi!
        const newBinormal = trackFrames.binormals[Math.floor(tVal * 1500) % 1500].clone();
        
        crashState.velocity.copy(newTangent).multiplyScalar(Math.abs(pData.throttle) * 0.15);

        if (reason === "sharp_turn") {
            gameState.warning = "FATAL: MISSED SHARP TURN!";
            crashState.velocity.add(newBinormal.multiplyScalar(Math.random() > 0.5 ? 20 : -20)); crashState.velocity.y += 2; 
        } else if (reason === "steep_downhill") {
            gameState.warning = "FATAL: DOWNHILL JUMP!"; crashState.velocity.y += 12; 
        } else if (reason === "overspeed") {
            gameState.warning = "FATAL: DERAILED!";
            crashState.velocity.add(newBinormal.multiplyScalar(Math.random() > 0.5 ? 10 : -10)); crashState.velocity.y += 5;
        } else { 
            gameState.warning = "FATAL: GRAVITY LOST!"; crashState.velocity.set(0, -10, 0); 
        }

        cameraShake = 30;
        crashState.angularVelocity.set((Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3);

        pData.cargo.forEach(c => {
            const worldPos = new THREE.Vector3(); c.mesh.getWorldPosition(worldPos);
            playerShip.cargoBox.remove(c.mesh); scene.add(c.mesh); 
            c.mesh.position.copy(worldPos); c.mesh.scale.set(1, 1, 1); 
            crashState.detachedCargo.push({
                mesh: c.mesh, velocity: crashState.velocity.clone().add(new THREE.Vector3((Math.random()-0.5)*15, Math.random()*15, (Math.random()-0.5)*15)),
                angularVelocity: new THREE.Vector3(Math.random()*0.5, Math.random()*0.5, Math.random()*0.5)
            });
        });
        
        pData.cargo = [];
        pData.exactScore = Math.max(0, pData.exactScore - 1500); 
    }

    function resetToStart() {
        crashState.isCrashed = false; crashState.timer = 0; pData.throttle = 0; 
        overspeedSlip = 0; lowspeedSlip = 0;
        crashState.detachedCargo.forEach(c => scene.remove(c.mesh));
        crashState.detachedCargo = []; gameState.warning = "";
        playerShip.up.copy(globalUp); 
        
        pData.t = 0.001; 
        pData.distanceTraveled = Math.floor(pData.distanceTraveled); 
    }

    const onKeyDown = (e) => {
        if (e.key === '+' || e.code === 'NumpadAdd' || e.key === '=') enginePower = Math.min(3.0, enginePower + 0.1); 
        if (e.key === '-' || e.code === 'NumpadSubtract') enginePower = Math.max(0.2, enginePower - 0.1); 
        
        if ((e.code === 'KeyA' || e.key === 'a' || e.key === 'A') && !keys[e.code]) {
            isAutopilot = !isAutopilot;
        }

        if (e.ctrlKey) {
            let handled = true;
            switch (e.code) {
                case 'ArrowUp':    camOffsetTweak.y += CAM_STEP; break; 
                case 'ArrowDown':  camOffsetTweak.y -= CAM_STEP; break; 
                case 'ArrowLeft':  camOffsetTweak.x -= CAM_STEP; break; 
                case 'ArrowRight': camOffsetTweak.x += CAM_STEP; break; 
                default: handled = false;
            }
            if (handled) { e.preventDefault(); return; }
        }
        keys[e.code] = true;
    };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function renderLoop() {
        animationId = requestAnimationFrame(renderLoop);

        if (gameState.active) {
            const safeTVal = safeT(pData.t);
            const pCurve = curves[1]; 
            
            let currentLimit = 180.0;
            let currentMinSpeed = 30.0;
            let uiWarning = "";
            let isExtreme = false;
            let dangerType = "";

            if (!crashState.isCrashed) {
                const currentPos = pCurve.getPointAt(safeTVal);
                const nextPos = pCurve.getPointAt(safeT(safeTVal + 0.005)); 
                const gravityForce = (currentPos.y - nextPos.y) * 0.015; 
                
                const currentTan = pCurve.getTangentAt(safeTVal);
                const nextTan = pCurve.getTangentAt(safeT(safeTVal + 0.01));
                const turnSeverity = currentTan.angleTo(nextTan); 
                const slopeForce = currentPos.y - nextPos.y; 

                if (turnSeverity > 0.035) { currentLimit = 75.0; isExtreme = true; dangerType = "turn"; uiWarning = "SHARP TURN! BRAKE!"; }
                else if (turnSeverity > 0.02) { currentLimit = 120.0; uiWarning = "CURVE AHEAD"; }
                
                if (slopeForce > 3.0) { currentLimit = Math.min(currentLimit, 85.0); isExtreme = true; dangerType = "downhill"; uiWarning = "STEEP DOWNHILL! BRAKE!"; }

                const safeIndex = Math.floor(safeTVal * 1500) % 1500;
                const pNorm = trackFrames.normals[safeIndex];
                const dotUp = pNorm ? pNorm.dot(globalUp) : 1;
                
                if (dotUp < -0.1) currentMinSpeed = 80.0;
                else if (slopeForce > 2.0) currentMinSpeed = 0.0;

                const currentMaxSpeed = 350.0 * engineMult;
                const currentSpeed = Math.abs(pData.throttle);

                if (isAutopilot) {
                    uiWarning = "AUTOPILOT ENGAGED";
                    const targetSpeed = Math.max(currentMinSpeed + 10, currentLimit - 15);
                    if (currentSpeed < targetSpeed - 5) pData.throttle += (2.0 * engineMult); 
                    else if (currentSpeed > currentLimit - 5) pData.throttle -= 3.0; 
                    else pData.throttle *= 0.98;
                    
                    if (pData.throttle < 0) pData.throttle = 0; 
                } else {
                    const isGasPressed = keys['KeyW'] || keys['ArrowUp'] || mobileInput.gas;
                    const isBrakePressed = keys['KeyS'] || keys['ArrowDown'] || mobileInput.brake;

                    if (isGasPressed) pData.throttle += (2.0 * engineMult); 
                    else if (isBrakePressed) pData.throttle -= (3.0 * brakeMult); 
                    else pData.throttle *= 0.98; 
                }

                pData.throttle += gravityForce;
                if (pData.throttle < -currentMaxSpeed) pData.throttle = -currentMaxSpeed; 
                if (pData.throttle > currentMaxSpeed) pData.throttle = currentMaxSpeed; 

                pData.exactScore += (currentSpeed * 0.005); 
                gameState.score = Math.floor(pData.exactScore);

                if (!isAutopilot && currentSpeed > currentLimit) {
                    const excessSpeed = currentSpeed - currentLimit;
                    if (isExtreme && excessSpeed > 35) {
                        triggerCrash(dangerType === "turn" ? "sharp_turn" : "steep_downhill");
                    } else {
                        overspeedSlip += (excessSpeed * 0.06 * gripMult); 
                        const isGasPressed = keys['KeyW'] || keys['ArrowUp'] || mobileInput.gas;
                        if (isGasPressed) overspeedSlip += 1; else overspeedSlip -= 4; 

                        if (overspeedSlip > 0) {
                            cameraShake = (overspeedSlip / 100) * 8;
                            uiWarning = "CRITICAL DRIFT! RELEASE GAS!";
                            sfx.playAlarm();
                        }
                        if (overspeedSlip > 100) triggerCrash("overspeed");
                    }
                } else {
                    overspeedSlip = Math.max(0, overspeedSlip - 4);
                }

                if (!crashState.isCrashed) {
                    const deltaT = pData.throttle * 0.00008;
                    pData.t += deltaT;
                    
                    pData.distanceTraveled += Math.abs(deltaT); 
                    pData.lap = Math.max(1, 1 + Math.floor(pData.distanceTraveled));
                    
                    if (pData.lap > 3) {
                        gameState.active = false;
                        if (!hasCompletedLevel) {
                            hasCompletedLevel = true;
                            sfx.playVictory();
                            if (typeof onLevelComplete === 'function') onLevelComplete(Math.floor(pData.exactScore));
                        }
                    }

                    if (pData.t >= 1.0) pData.t -= 1.0;
                    if (pData.t < 0.0) pData.t += 1.0;
                    
                    const newTVal = safeT(pData.t);
                    const pPos = pCurve.getPointAt(newTVal);
                    const newTangent = pCurve.getTangentAt(newTVal).normalize();
                    
                    if (pNorm) {
                        pPos.add(pNorm.clone().multiplyScalar(railRadius + 4)); 

                        if (overspeedSlip > 0) {
                            const sideVector = trackFrames.binormals[safeIndex].clone();
                            const wobbleOffset = Math.sin(Date.now() * 0.02) * ((overspeedSlip / 100) * 20);
                            pPos.add(sideVector.multiplyScalar(wobbleOffset));
                        }

                        if (!isAutopilot && dotUp < 0.0 && currentSpeed < 90) {
                            const speedDeficit = 90 - currentSpeed;
                            lowspeedSlip += (speedDeficit * 0.1);
                            const isGasPressed = keys['KeyW'] || keys['ArrowUp'] || mobileInput.gas;
                            if (isGasPressed) lowspeedSlip -= 2; else lowspeedSlip += 2;
                            
                            if (lowspeedSlip > 0) {
                                cameraShake = (lowspeedSlip / 100) * 8;
                                uiWarning = "GRAVITY LOSS! PRESS GAS!";
                                pPos.add(pNorm.clone().multiplyScalar(-1).multiplyScalar((lowspeedSlip / 100) * 15));
                                sfx.playAlarm();
                            }
                            if (lowspeedSlip > 100) triggerCrash("low");
                        } else {
                            lowspeedSlip = Math.max(0, lowspeedSlip - 4);
                        }
                        playerShip.up.copy(pNorm); 
                    }
                    
                    playerShip.position.copy(pPos);
                    playerShip.lookAt(pPos.clone().add(newTangent));

                    if(pData.lap <= 3 && overspeedSlip === 0 && lowspeedSlip === 0) gameState.warning = uiWarning; 
                    else if (pData.lap <= 3) gameState.warning = uiWarning;

                    collectibles.forEach(c => {
                        if (c.active && Math.abs(safeT(pData.t) - safeT(c.t)) < 0.008) {
                            c.active = false; pData.exactScore += c.points;
                            sfx.playCollect();
                            const stackY = 0.8 + pData.cargo.length * 0.35;
                            if (stackY > maxCargoHeight) scene.remove(c.mesh); 
                            else {
                                c.mesh.scale.set(0.35, 0.35, 0.35); playerShip.cargoBox.add(c.mesh);
                                c.mesh.position.set((Math.random() - 0.5) * 3.5, stackY, (Math.random() - 0.5) * 5);
                                pData.cargo.push(c);
                            }
                        }
                    });

                    pData.cargo.forEach((c, index) => {
                        if (Math.random() > 0.8) c.mesh.position.y = 0.8 + (index * 0.35) + (Math.random() * (Math.abs(pData.throttle) * 0.02));
                    });

                    camera.position.copy(playerShip.localToWorld(new THREE.Vector3(camOffsetTweak.x, camOffsetTweak.y, camOffsetTweak.z)));
                    camera.up.copy(playerShip.up);
                    camera.lookAt(playerShip.localToWorld(new THREE.Vector3(0, 1, -60)));
                    camera.fov = 75 + (currentSpeed * 0.08);

                    crashState.lastCamPos.copy(camera.position);
                    crashState.lastCamUp.copy(camera.up);
                }
            } 
            
            if (crashState.isCrashed) {
                crashState.velocity.y -= 3.0; 
                playerShip.position.add(crashState.velocity);
                playerShip.rotateX(crashState.angularVelocity.x);
                playerShip.rotateY(crashState.angularVelocity.y);
                playerShip.rotateZ(crashState.angularVelocity.z);

                crashState.detachedCargo.forEach(c => {
                    c.velocity.y -= 3.0; c.mesh.position.add(c.velocity);
                    c.mesh.rotateX(c.angularVelocity.x); c.mesh.rotateY(c.angularVelocity.y); c.mesh.rotateZ(c.angularVelocity.z);
                });

                camera.position.copy(playerShip.position.clone().add(new THREE.Vector3(camOffsetTweak.x, camOffsetTweak.y + 20, camOffsetTweak.z + 40)));
                camera.up.copy(globalUp); 
                camera.lookAt(playerShip.position);
                camera.fov = Math.min(100, camera.fov + 0.5); 

                if (playerShip.position.y <= 0 || crashState.timer > 150) resetToStart(); else crashState.timer++;
            }

            camera.updateProjectionMatrix();
            if (cameraShake > 0) {
                camera.position.x += (Math.random() - 0.5) * cameraShake; camera.position.y += (Math.random() - 0.5) * cameraShake;
                cameraShake *= 0.8; if (cameraShake < 0.1) cameraShake = 0;
            }

            gameState.speed = Math.floor(Math.abs(pData.throttle) * 10); 
            gameState.limit = Math.floor(currentLimit * 10);
            gameState.minSpeed = Math.floor(currentMinSpeed * 10);
            gameState.lap = pData.lap;
            
            if (crashState.isCrashed) {
                gameState.limit = 0; 
                gameState.minSpeed = 0;
            }

            if (pData.lap > 3) gameState.driveStatus = 'FINISHED';
            else if (crashState.isCrashed) gameState.driveStatus = 'CRASHED';
            else if (gameState.speed > gameState.limit && gameState.limit > 0) gameState.driveStatus = 'TOO_FAST';
            else if (gameState.speed < gameState.minSpeed) gameState.driveStatus = 'TOO_SLOW';
            else gameState.driveStatus = 'PERFECT';

            const now = Date.now();
            if (now - lastUIUpdate > 100) {
                if (typeof onUIUpdate === 'function') {
                    onUIUpdate({ ...gameState }); 
                }
                lastUIUpdate = now;
            }
        }

        renderer.render(scene, camera);
    }

    renderLoop();

    return function cleanup() {
        cancelAnimationFrame(animationId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        if (container && renderer.domElement) container.removeChild(renderer.domElement);
        renderer.dispose();
    };
}