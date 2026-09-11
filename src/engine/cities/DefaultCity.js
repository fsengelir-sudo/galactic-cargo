import * as THREE from 'three';

function createWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#cccccc'; 
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#87CEEB'; 
    ctx.fillRect(4, 4, 24, 56);
    ctx.fillRect(36, 4, 24, 56);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

export function buildDefaultCity(scene, sampledTrackPoints) {
    const winTex = createWindowTexture();

    const countNormal = 300, countTowers = 150, countCranes = 100;
    const totalBuildings = countNormal + countTowers + countCranes;

    const matNormal = new THREE.MeshStandardMaterial({ map: winTex, metalness: 0.3, roughness: 0.7 });
    const matTower = new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.9, roughness: 0.1 }); 
    const matCrane = new THREE.MeshStandardMaterial({ color: 0xff8800, metalness: 0.8, roughness: 0.2 }); 
    const matFoundation = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.9 }); 

    const meshNormal = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matNormal, countNormal);
    const meshTower = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), matTower, countTowers);
    const meshCraneBody = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matCrane, countCranes);
    const meshCraneArm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matCrane, countCranes);
    const meshFoundation = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matFoundation, totalBuildings);

    const dummy = new THREE.Object3D(); 
    let idxNormal = 0, idxTower = 0, idxCrane = 0, idxFoundation = 0;

    for(let i = 0; i < totalBuildings; i++) {
        const x = (Math.random() - 0.5) * 16000;
        const z = (Math.random() - 0.5) * 16000;

        let minTrackDist = Infinity;
        let trackYAtClosest = Infinity;
        for(let p of sampledTrackPoints) {
            const dist = Math.hypot(p.x - x, p.z - z);
            if (dist < minTrackDist) {
                minTrackDist = dist;
                trackYAtClosest = p.y;
            }
        }

        let height = 400 + Math.random() * 2000; 
        if (minTrackDist < 450) {
            height = Math.min(height, trackYAtClosest - 200);
            if (height < 50) continue; 
        }

        const width = 100 + Math.random() * 200;
        const depth = 100 + Math.random() * 200;
        
        dummy.scale.set(width + 60, 40, depth + 60);
        dummy.position.set(x, 10, z); 
        dummy.updateMatrix();
        meshFoundation.setMatrixAt(idxFoundation++, dummy.matrix);
        
        let type = Math.random();
        
        if (type < 0.6 && idxNormal < countNormal) {
            dummy.scale.set(width, height, depth);
            dummy.position.set(x, height / 2 + 20, z); 
            dummy.updateMatrix();
            meshNormal.setMatrixAt(idxNormal++, dummy.matrix);
        } 
        else if (type < 0.85 && idxTower < countTowers) {
            dummy.scale.set(width * 0.8, height, depth * 0.8);
            dummy.position.set(x, height / 2 + 20, z);
            dummy.updateMatrix();
            meshTower.setMatrixAt(idxTower++, dummy.matrix);
        } 
        else if (idxCrane < countCranes) {
            dummy.scale.set(20, height, 20);
            dummy.position.set(x, height / 2 + 20, z);
            dummy.updateMatrix();
            meshCraneBody.setMatrixAt(idxCrane, dummy.matrix);
            
            dummy.scale.set(300, 15, 15);
            dummy.position.set(x + 100, height + 20, z);
            dummy.updateMatrix();
            meshCraneArm.setMatrixAt(idxCrane, dummy.matrix);
            
            idxCrane++;
        }
    }
    
    meshNormal.instanceMatrix.needsUpdate = true;
    meshTower.instanceMatrix.needsUpdate = true;
    meshCraneBody.instanceMatrix.needsUpdate = true;
    meshCraneArm.instanceMatrix.needsUpdate = true;
    meshFoundation.instanceMatrix.needsUpdate = true;
    
    scene.add(meshNormal, meshTower, meshCraneBody, meshCraneArm, meshFoundation);
}