// src/engine/cities/Venice.js
import * as THREE from 'three';

export function buildVenice(scene, trackCurve, sampledTrackPoints) {
    // --- 1. VENEDİK LAGÜNÜ VE SU ZEMİNİ ---
    const lagoonGeo = new THREE.PlaneGeometry(50000, 50000);
    const lagoonMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a6b7d, // Turkuaz/Yeşilimsi Venedik suyu
        roughness: 0.1, 
        metalness: 0.8 
    });
    const lagoon = new THREE.Mesh(lagoonGeo, lagoonMat);
    lagoon.rotation.x = -Math.PI / 2;
    lagoon.position.y = 0;
    scene.add(lagoon);

    // --- 2. VENEDİK SARAYLARI (Palazzo) ---
    const countBuildings = 700;
    const palazzColors = [0xdfb18b, 0xd47a55, 0xe2cbb2, 0xc27867, 0xefd9c1]; // Pastel terracotta, somon, krem
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x8b3a2b, roughness: 0.8 }); // Kırmızı kiremit

    const meshRoofs = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 1, 4), matRoof, countBuildings);
    const palaceMeshes = palazzColors.map(c => 
        new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), countBuildings / 5)
    );

    const dummy = new THREE.Object3D();
    let rIdx = 0;
    const palaceIdx = [0, 0, 0, 0, 0];

    for (let i = 0; i < countBuildings; i++) {
        const x = (Math.random() - 0.5) * 16000;
        const z = (Math.random() - 0.5) * 16000;

        let minTrackDist = Infinity;
        for(let p of sampledTrackPoints) {
            const dist = Math.hypot(p.x - x, p.z - z);
            if (dist < minTrackDist) minTrackDist = dist;
        }

        if (minTrackDist < 250 || minTrackDist > 3000) continue;
        
        const width = 100 + Math.random() * 80;
        const depth = 100 + Math.random() * 80;
        const height = 140 + Math.random() * 120; 

        dummy.scale.set(width, height, depth);
        dummy.position.set(x, height / 2, z);
        dummy.updateMatrix();
        
        const colorGroup = i % 5;
        palaceMeshes[colorGroup].setMatrixAt(palaceIdx[colorGroup]++, dummy.matrix);

        dummy.scale.set(width * 1.1, 30, depth * 1.1); 
        dummy.position.set(x, height + 15, z);
        dummy.rotation.y = Math.PI / 4; 
        dummy.updateMatrix();
        meshRoofs.setMatrixAt(rIdx++, dummy.matrix);
    }
    
    palaceMeshes.forEach(mesh => {
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
    });
    meshRoofs.instanceMatrix.needsUpdate = true;
    scene.add(meshRoofs);


    // --- 3. SANTA MARIA DELLA SALUTE BAZİLİKASI ---
    const basilicaGroup = new THREE.Group();
    const whiteStoneMat = new THREE.MeshStandardMaterial({ color: 0xf0ece1, roughness: 0.8, metalness: 0.1 }); 
    const leadRoofMat = new THREE.MeshStandardMaterial({ color: 0x5a6b6c, roughness: 0.6, metalness: 0.4 }); 
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.8 });

    const baseGeo = new THREE.CylinderGeometry(180, 180, 160, 8);
    const baseMesh = new THREE.Mesh(baseGeo, whiteStoneMat);
    baseMesh.position.y = 80;
    basilicaGroup.add(baseMesh);

    const domeGeo = new THREE.SphereGeometry(120, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const mainDome = new THREE.Mesh(domeGeo, leadRoofMat);
    mainDome.position.y = 220;
    basilicaGroup.add(mainDome);

    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(20, 25, 40, 16), whiteStoneMat);
    lantern.position.y = 360;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(6, 30, 6), goldMat);
    cross.position.y = 395;
    basilicaGroup.add(lantern, cross);

    for(let i = 0; i < 8; i++) {
        if(i % 2 === 0) {
            const angle = (i / 8) * Math.PI * 2;
            const smallDome = new THREE.Mesh(new THREE.SphereGeometry(45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), leadRoofMat);
            smallDome.position.set(Math.sin(angle) * 130, 160, Math.cos(angle) * 130);
            basilicaGroup.add(smallDome);
        }
    }

    const basPos = trackCurve.getPointAt(0.30); 
    basilicaGroup.position.set(basPos.x + 500, 0, basPos.z - 500);
    basilicaGroup.rotation.y = Math.PI / 4;
    basilicaGroup.scale.set(2.5, 2.5, 2.5); 
    scene.add(basilicaGroup);
}