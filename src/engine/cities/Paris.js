import * as THREE from 'three';

export function buildParis(scene, trackCurve, sampledTrackPoints) {
    const countBuildings = 800;
    const countTrees = 1200; 

    const matWall = new THREE.MeshStandardMaterial({ color: 0xecdcb9, roughness: 0.9, metalness: 0.1 });
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x5b616a, roughness: 0.8, metalness: 0.2 });
    const matTree = new THREE.MeshStandardMaterial({ color: 0x2b5921, roughness: 0.9, metalness: 0.0 }); 

    const meshWall = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matWall, countBuildings);
    const meshRoof = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matRoof, countBuildings);
    const meshTree = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 8), matTree, countTrees);

    const dummy = new THREE.Object3D();
    let bIdx = 0, tIdx = 0;

    for (let i = 0; i < countBuildings + countTrees; i++) {
        const x = (Math.random() - 0.5) * 16000;
        const z = (Math.random() - 0.5) * 16000;

        let minTrackDist = Infinity;
        for(let p of sampledTrackPoints) {
            const dist = Math.hypot(p.x - x, p.z - z);
            if (dist < minTrackDist) minTrackDist = dist;
        }

        if (i < countBuildings) {
            if (minTrackDist < 300) continue;
            const width = 120 + Math.random() * 100;
            const depth = 120 + Math.random() * 100;
            const height = 150 + Math.random() * 100; 

            dummy.scale.set(width, height, depth);
            dummy.position.set(x, height / 2, z);
            dummy.updateMatrix();
            meshWall.setMatrixAt(bIdx, dummy.matrix);

            dummy.scale.set(width + 10, 30, depth + 10);
            dummy.position.set(x, height + 15, z);
            dummy.updateMatrix();
            meshRoof.setMatrixAt(bIdx, dummy.matrix);
            bIdx++;
        } else {
            if (minTrackDist < 150) continue;
            const r = 30 + Math.random() * 40;
            dummy.scale.set(r, r, r);
            dummy.position.set(x, r / 2, z);
            dummy.updateMatrix();
            meshTree.setMatrixAt(tIdx++, dummy.matrix);
        }
    }
    meshWall.instanceMatrix.needsUpdate = true;
    meshRoof.instanceMatrix.needsUpdate = true;
    meshTree.instanceMatrix.needsUpdate = true;
    scene.add(meshWall, meshRoof, meshTree);

    // Eyfel Kulesi
    const eiffelGroup = new THREE.Group();
    const eiffelColor = 0x8a6b52;
    const trussMat = new THREE.MeshStandardMaterial({ color: eiffelColor, metalness: 0.6, roughness: 0.7, wireframe: true });
    const solidMat = new THREE.MeshStandardMaterial({ color: 0x5a4b42, metalness: 0.5, roughness: 0.9 });

    const baseGeo = new THREE.CylinderGeometry(90, 220, 350, 4, 15);
    const baseMesh = new THREE.Mesh(baseGeo, trussMat);
    baseMesh.position.y = 175;
    baseMesh.rotation.y = Math.PI / 4; 
    eiffelGroup.add(baseMesh);

    const archGeo = new THREE.TorusGeometry(120, 10, 8, 30, Math.PI); 
    const archMat = new THREE.MeshStandardMaterial({ color: eiffelColor, metalness: 0.4, roughness: 0.8 });
    for(let i=0; i<4; i++) {
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.y = -10;
        arch.rotation.y = (i * Math.PI) / 2;
        arch.position.x = Math.sin((i * Math.PI) / 2) * 110;
        arch.position.z = Math.cos((i * Math.PI) / 2) * 110;
        eiffelGroup.add(arch);
    }

    const plat1 = new THREE.Mesh(new THREE.BoxGeometry(210, 15, 210), solidMat);
    plat1.position.y = 350;
    eiffelGroup.add(plat1);

    const midGeo = new THREE.CylinderGeometry(40, 85, 400, 4, 15);
    const midMesh = new THREE.Mesh(midGeo, trussMat);
    midMesh.position.y = 557.5; 
    midMesh.rotation.y = Math.PI / 4;
    eiffelGroup.add(midMesh);

    const plat2 = new THREE.Mesh(new THREE.BoxGeometry(105, 12, 105), solidMat);
    plat2.position.y = 760;
    eiffelGroup.add(plat2);

    const topGeo = new THREE.CylinderGeometry(5, 38, 500, 4, 20);
    const topMesh = new THREE.Mesh(topGeo, trussMat);
    topMesh.position.y = 1017.5; 
    topMesh.rotation.y = Math.PI / 4;
    eiffelGroup.add(topMesh);
    
    const obsGeo = new THREE.CylinderGeometry(15, 15, 25, 8);
    const obsMesh = new THREE.Mesh(obsGeo, solidMat);
    obsMesh.position.y = 1275;
    eiffelGroup.add(obsMesh);

    const spireGeo = new THREE.CylinderGeometry(1, 2, 80, 4);
    const spireMesh = new THREE.Mesh(spireGeo, solidMat);
    spireMesh.position.y = 1325;
    eiffelGroup.add(spireMesh);

    const towerPos = trackCurve.getPointAt(0.20); 
    eiffelGroup.position.set(towerPos.x, 10, towerPos.z);
    eiffelGroup.scale.set(6, 6, 6); 
    scene.add(eiffelGroup);
}