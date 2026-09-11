// src/engine/cities/Barcelona.js
import * as THREE from 'three';

export function buildBarcelona(scene, trackCurve, sampledTrackPoints) {
    const countBuildings = 700;
    const countPalms = 500; // Akdeniz Palmiyeleri

    // Barselona / Modernist Mimari Renkler
    const wallColors = [0xe3dac9, 0xd4bc8b, 0xc49a66, 0xba8c63];
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x993d3d, roughness: 0.8 }); 
    const matPalmTrunk = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const matPalmLeaves = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 });

    const meshRoofs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matRoof, countBuildings);
    const trunkGeo = new THREE.CylinderGeometry(4, 6, 80, 8);
    const leafGeo = new THREE.ConeGeometry(25, 40, 6);
    
    const meshTrunks = new THREE.InstancedMesh(trunkGeo, matPalmTrunk, countPalms);
    const meshLeaves = new THREE.InstancedMesh(leafGeo, matPalmLeaves, countPalms);

    const wallMeshes = wallColors.map(c => 
        new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), countBuildings / 4)
    );

    const dummy = new THREE.Object3D();
    let rIdx = 0, pIdx = 0;
    const wallIdx = [0, 0, 0, 0];

    for (let i = 0; i < countBuildings + countPalms; i++) {
        const x = (Math.random() - 0.5) * 16000;
        const z = (Math.random() - 0.5) * 16000;

        let minTrackDist = Infinity;
        for(let p of sampledTrackPoints) {
            const dist = Math.hypot(p.x - x, p.z - z);
            if (dist < minTrackDist) minTrackDist = dist;
        }

        if (i < countBuildings) {
            if (minTrackDist < 350) continue;
            
            const width = 90 + Math.random() * 90;
            const depth = 90 + Math.random() * 90;
            const height = 100 + Math.random() * 120; 

            dummy.scale.set(width, height, depth);
            dummy.position.set(x, height / 2, z);
            dummy.updateMatrix();
            
            const colorGroup = i % 4;
            wallMeshes[colorGroup].setMatrixAt(wallIdx[colorGroup]++, dummy.matrix);

            dummy.scale.set(width * 1.1, 20, depth * 1.1); 
            dummy.position.set(x, height + 10, z);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            meshRoofs.setMatrixAt(rIdx++, dummy.matrix);
            
        } else {
            // Palmiye Ağaçları
            if (minTrackDist < 200) continue;
            
            dummy.scale.set(1, 1, 1);
            dummy.position.set(x, 40, z);
            dummy.updateMatrix();
            meshTrunks.setMatrixAt(pIdx, dummy.matrix);

            dummy.position.set(x, 85, z);
            dummy.updateMatrix();
            meshLeaves.setMatrixAt(pIdx, dummy.matrix);
            pIdx++;
        }
    }
    
    wallMeshes.forEach(mesh => {
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
    });
    meshRoofs.instanceMatrix.needsUpdate = true;
    meshTrunks.instanceMatrix.needsUpdate = true;
    meshLeaves.instanceMatrix.needsUpdate = true;
    scene.add(meshRoofs, meshTrunks, meshLeaves);

    // --- LA SAGRADA FAMÍLIA (Detaylı Organik Kuleler) ---
    const basilicaGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe6d5b8, roughness: 0.9, metalness: 0.1 });
    const goldSpireMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 }); // Zirvedeki altın Haç ve detaylar

    // Ana Bazilika Gövdesi (Geniş Giriş ve Cephe)
    const baseBody = new THREE.Mesh(new THREE.BoxGeometry(350, 200, 250), stoneMat);
    baseBody.position.y = 100;
    basilicaGroup.add(baseBody);

    // Görseldeki gibi Göğe Yükselen 4 Ana Devasa Kule (Organik/Parabolik Koniler)
    const towerGeo = new THREE.ConeGeometry(35, 600, 16);
    const towerOffsets = [
        [-80, 50], [80, 50], [-80, -50], [80, -50]
    ];

    towerOffsets.forEach(pos => {
        const tower = new THREE.Mesh(towerGeo, stoneMat);
        tower.position.set(pos[0], 400, pos[1]);
        basilicaGroup.add(tower);

        // Kulelerin üzerindeki geometrik/renkli zirveler
        const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(15, 100, 8), goldSpireMat);
        pinnacle.position.set(pos[0], 750, pos[1]);
        basilicaGroup.add(pinnacle);
    });

    // Ortadaki En Yüksek Kule (İsa Kulesi Temsili)
    const centralTower = new THREE.Mesh(new THREE.ConeGeometry(45, 800, 16), stoneMat);
    centralTower.position.set(0, 450, 0);
    basilicaGroup.add(centralTower);

    const centralCross = new THREE.Mesh(new THREE.ConeGeometry(20, 150, 8), goldSpireMat);
    centralCross.position.set(0, 925, 0);
    basilicaGroup.add(centralCross);

    // La Sagrada Família'yı Parkurun %50'sine Konumlandır
    const sagradaPos = trackCurve.getPointAt(0.50); 
    basilicaGroup.position.set(sagradaPos.x, 0, sagradaPos.z - 600);
    basilicaGroup.scale.set(2.5, 2.5, 2.5); 
    scene.add(basilicaGroup);
}