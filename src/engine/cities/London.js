// src/engine/cities/London.js
import * as THREE from 'three';

export function buildLondon(scene, trackCurve, sampledTrackPoints) {
    
    // --- 1. LONDRA ZEMİNİ VE THAMES NEHRİ ---
    const cityGround = new THREE.Mesh(
        new THREE.PlaneGeometry(50000, 50000), 
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }) // Asfalt/Beton zemin
    );
    cityGround.rotation.x = -Math.PI / 2;
    cityGround.position.y = 0;
    scene.add(cityGround);

    // Thames Nehri Su Yüzeyi
    const riverPoints = [];
    for(let i = 0; i <= 100; i++) {
        const p = trackCurve.getPoint(i / 100);
        riverPoints.push(new THREE.Vector3(p.x, 0, p.z)); 
    }
    const riverCurve = new THREE.CatmullRomCurve3(riverPoints, true);
    
    // Nehir Yatağı
    const riverGeo = new THREE.TubeGeometry(riverCurve, 200, 700, 16, true); 
    const riverMat = new THREE.MeshStandardMaterial({ color: 0x2a3b4c, roughness: 0.1, metalness: 0.8 }); 
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.scale.y = 0.01; 
    riverMesh.position.y = 2; // Suyun yüksekliği
    scene.add(riverMesh);

    // Nehir Kenarı Taş Rıhtımlar (Embankment)
    const bankGeo = new THREE.TubeGeometry(riverCurve, 200, 720, 16, true);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    const bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.scale.y = 0.05;
    bankMesh.position.y = 1; // Sudan biraz daha düşük/yüksek kot farkı hissi
    scene.add(bankMesh);


    // --- 2. BİNALAR VE MİMARİ ---
    const countBuildings = 600;
    const matWall = new THREE.MeshStandardMaterial({ color: 0xd4c6a0, roughness: 0.9, metalness: 0.1 });
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x4a4f54, roughness: 0.8, metalness: 0.2 });
    
    const meshWall = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matWall, countBuildings);
    const meshRoof = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 1, 4), matRoof, countBuildings);

    const dummy = new THREE.Object3D();
    let bIdx = 0;

    for (let i = 0; i < countBuildings; i++) {
        const x = (Math.random() - 0.5) * 16000;
        const z = (Math.random() - 0.5) * 16000;

        let minTrackDist = Infinity;
        for(let p of sampledTrackPoints) {
            const dist = Math.hypot(p.x - x, p.z - z);
            if (dist < minTrackDist) minTrackDist = dist;
        }

        // Binaları nehirden uzak tutuyoruz
        if (minTrackDist < 750) continue;
        
        const width = 100 + Math.random() * 80;
        const depth = 100 + Math.random() * 80;
        const height = 120 + Math.random() * 150; 

        dummy.scale.set(width, height, depth);
        dummy.position.set(x, height / 2, z);
        dummy.updateMatrix();
        meshWall.setMatrixAt(bIdx, dummy.matrix);

        dummy.scale.set(width * 1.5, 60, depth * 1.5); 
        dummy.position.set(x, height + 30, z);
        dummy.rotation.y = Math.PI / 4; 
        dummy.updateMatrix();
        meshRoof.setMatrixAt(bIdx, dummy.matrix);
        
        bIdx++;
    }
    meshWall.instanceMatrix.needsUpdate = true;
    meshRoof.instanceMatrix.needsUpdate = true;
    scene.add(meshWall, meshRoof);


    // --- 3. TOWER BRIDGE (Orijinal Detaylı Anatomisiyle) ---
    const bridgeGroup = new THREE.Group();
    
    // Materyaller
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc2b79e, roughness: 0.9 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x8b8374, roughness: 0.9 }); // Su içindeki ayaklar
    const blueMetalMat = new THREE.MeshStandardMaterial({ color: 0x3b83bd, roughness: 0.5, metalness: 0.6 }); // İkonik Mavi
    const whiteMetalMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5, metalness: 0.4 }); // Beyaz kirişler
    const darkRoofMat = new THREE.MeshStandardMaterial({ color: 0x333b42, roughness: 0.8 });

    // 1. Su İçindeki Devasa Ayaklar (Piers)
    const pierGeo = new THREE.BoxGeometry(100, 120, 180);
    const pier1 = new THREE.Mesh(pierGeo, darkStoneMat); pier1.position.set(-250, 60, 0);
    const pier2 = new THREE.Mesh(pierGeo, darkStoneMat); pier2.position.set(250, 60, 0);
    bridgeGroup.add(pier1, pier2);

    // 2. Ana Kule Gövdeleri
    const towerGeo = new THREE.BoxGeometry(80, 250, 80);
    const t1 = new THREE.Mesh(towerGeo, stoneMat); t1.position.set(-250, 245, 0);
    const t2 = new THREE.Mesh(towerGeo, stoneMat); t2.position.set(250, 245, 0);
    bridgeGroup.add(t1, t2);

    // 3. Üst Gotik Süsleme Bölümü (Kulelerin tepe odaları)
    const upperGeo = new THREE.BoxGeometry(90, 60, 90);
    const u1 = new THREE.Mesh(upperGeo, stoneMat); u1.position.set(-250, 400, 0);
    const u2 = new THREE.Mesh(upperGeo, stoneMat); u2.position.set(250, 400, 0);
    bridgeGroup.add(u1, u2);

    // 4. Ana Çatılar (Mavi/Gri Piramit)
    const roofGeo = new THREE.ConeGeometry(65, 120, 4);
    const r1 = new THREE.Mesh(roofGeo, darkRoofMat); r1.position.set(-250, 490, 0); r1.rotation.y = Math.PI / 4;
    const r2 = new THREE.Mesh(roofGeo, darkRoofMat); r2.position.set(250, 490, 0); r2.rotation.y = Math.PI / 4;
    bridgeGroup.add(r1, r2);

    // 5. Köşe Kulecikleri (4 adet küçük minare/spire)
    const spireGeo = new THREE.ConeGeometry(10, 40, 4);
    const offsets = [[40,40], [-40,40], [40,-40], [-40,-40]];
    offsets.forEach(pos => {
        // Sol kule köşe çatıları
        const s1 = new THREE.Mesh(spireGeo, darkRoofMat); 
        s1.position.set(-250 + pos[0], 450, pos[1]); s1.rotation.y = Math.PI/4;
        // Sağ kule köşe çatıları
        const s2 = new THREE.Mesh(spireGeo, darkRoofMat); 
        s2.position.set(250 + pos[0], 450, pos[1]); s2.rotation.y = Math.PI/4;
        bridgeGroup.add(s1, s2);
    });

    // 6. Üst Mavi/Beyaz Yürüyüş Yolları (High Walkways)
    const walkGeo = new THREE.BoxGeometry(420, 25, 15);
    const walk1 = new THREE.Mesh(walkGeo, blueMetalMat); walk1.position.set(0, 380, 25);
    const walk2 = new THREE.Mesh(walkGeo, blueMetalMat); walk2.position.set(0, 380, -25);
    
    const whiteWalkGeo = new THREE.BoxGeometry(420, 5, 16); // Beyaz çelik aksanlar
    const ww1 = new THREE.Mesh(whiteWalkGeo, whiteMetalMat); ww1.position.set(0, 392, 25);
    const ww2 = new THREE.Mesh(whiteWalkGeo, whiteMetalMat); ww2.position.set(0, 368, 25);
    const ww3 = new THREE.Mesh(whiteWalkGeo, whiteMetalMat); ww3.position.set(0, 392, -25);
    const ww4 = new THREE.Mesh(whiteWalkGeo, whiteMetalMat); ww4.position.set(0, 368, -25);
    bridgeGroup.add(walk1, walk2, ww1, ww2, ww3, ww4);

    // 7. Alt Açılır Kanatlar (Bascule Drawbridge) - YUKARI KALKIK POZİSYONDA!
    const basculeGeo = new THREE.BoxGeometry(220, 15, 60);
    const bascule1 = new THREE.Mesh(basculeGeo, stoneMat);
    bascule1.position.set(-130, 180, 0);
    bascule1.rotation.z = Math.PI / 5; // Yukarı kalkık (Yaklaşık 35 derece)
    
    const bascule2 = new THREE.Mesh(basculeGeo, stoneMat);
    bascule2.position.set(130, 180, 0);
    bascule2.rotation.z = -Math.PI / 5; // Yukarı kalkık
    bridgeGroup.add(bascule1, bascule2);

    // 8. Yan Mavi Süspansiyon Halatları (Suspension Cables)
    const cableGeo = new THREE.CylinderGeometry(8, 8, 450);
    const cable1 = new THREE.Mesh(cableGeo, blueMetalMat); 
    cable1.position.set(-450, 250, 0); cable1.rotation.z = Math.PI / 2.5;
    
    const cable2 = new THREE.Mesh(cableGeo, blueMetalMat); 
    cable2.position.set(450, 250, 0); cable2.rotation.z = -Math.PI / 2.5;
    bridgeGroup.add(cable1, cable2);

    // 9. Dikey Asma Halatları (Suspenders)
    const suspenderGeo = new THREE.CylinderGeometry(2, 2, 150);
    for(let i=1; i<=4; i++) {
        const v1 = new THREE.Mesh(suspenderGeo, whiteMetalMat); 
        v1.position.set(-250 - (i*50), 200 - (i*15), 0);
        const v2 = new THREE.Mesh(suspenderGeo, whiteMetalMat); 
        v2.position.set(250 + (i*50), 200 - (i*15), 0);
        bridgeGroup.add(v1, v2);
    }

    // Köprüyü Parkurun %60'ına yerleştir ve devasa yap
    const bridgePos = trackCurve.getPointAt(0.60); 
    const bridgeTan = trackCurve.getTangentAt(0.60);
    bridgeGroup.position.set(bridgePos.x, 0, bridgePos.z);
    bridgeGroup.lookAt(bridgePos.clone().add(bridgeTan));
    bridgeGroup.rotateY(Math.PI / 2); // Nehrin üzerinden dikine geçsin
    bridgeGroup.scale.set(6, 6, 6); 
    scene.add(bridgeGroup);


    // --- 4. BIG BEN KULESİ (Elizabeth Tower) ---
    const bigBenGroup = new THREE.Group();
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 }); 
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.8 }); 

    const bbBody = new THREE.Mesh(new THREE.BoxGeometry(100, 600, 100), matWall);
    bbBody.position.y = 300;
    bigBenGroup.add(bbBody);

    const bbClockSection = new THREE.Mesh(new THREE.BoxGeometry(110, 120, 110), matWall);
    bbClockSection.position.y = 660;
    bigBenGroup.add(bbClockSection);

    for(let i = 0; i < 4; i++) {
        const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 5, 16), clockMat);
        clockFace.rotation.x = Math.PI / 2;
        clockFace.position.y = 660;
        
        const angle = (i * Math.PI) / 2;
        clockFace.position.x = Math.sin(angle) * 56;
        clockFace.position.z = Math.cos(angle) * 56;
        clockFace.rotation.y = angle;
        
        const clockFrame = new THREE.Mesh(new THREE.TorusGeometry(38, 3, 8, 24), goldMat);
        clockFrame.position.copy(clockFace.position);
        clockFrame.rotation.copy(clockFace.rotation);
        
        bigBenGroup.add(clockFace, clockFrame);
    }

    const bbRoof = new THREE.Mesh(new THREE.ConeGeometry(75, 150, 4), matRoof);
    bbRoof.position.y = 795;
    bbRoof.rotation.y = Math.PI / 4;
    bigBenGroup.add(bbRoof);

    const bbSpire = new THREE.Mesh(new THREE.CylinderGeometry(2, 5, 80, 4), goldMat);
    bbSpire.position.y = 910;
    bigBenGroup.add(bbSpire);

    const benPos = trackCurve.getPointAt(0.15); 
    bigBenGroup.position.set(benPos.x + 400, 10, benPos.z - 400);
    bigBenGroup.scale.set(3, 3, 3); 
    scene.add(bigBenGroup);


    // --- 5. LONDON EYE (Dönme Dolap) ---
    const eyeGroup = new THREE.Group();
    const ironMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6, metalness: 0.6, wireframe: true });
    const solidIron = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.6 });
    const podMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 0.9, transparent: true, opacity: 0.8 }); 

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(400, 8, 8, 64), solidIron);
    wheel.position.y = 450;
    eyeGroup.add(wheel);

    const innerWheel = new THREE.Mesh(new THREE.TorusGeometry(380, 4, 8, 64), ironMat);
    innerWheel.position.y = 450;
    eyeGroup.add(innerWheel);

    const podCount = 32;
    for(let i=0; i<podCount; i++) {
        const angle = (i / podCount) * Math.PI * 2;
        
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 400, 4), solidIron);
        cable.position.y = 450 + (Math.sin(angle) * 200);
        cable.position.x = Math.cos(angle) * 200;
        cable.rotation.z = angle + (Math.PI/2);
        eyeGroup.add(cable);

        const pod = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 25, 16), podMat);
        pod.position.y = 450 + (Math.sin(angle) * 410);
        pod.position.x = Math.cos(angle) * 410;
        pod.rotation.x = Math.PI / 2;
        eyeGroup.add(pod);
    }

    const eyeLegGeo = new THREE.CylinderGeometry(10, 20, 500, 8);
    const leg1 = new THREE.Mesh(eyeLegGeo, solidIron);
    leg1.position.set(0, 225, 100);
    leg1.rotation.x = -0.4;
    eyeGroup.add(leg1);

    const leg2 = new THREE.Mesh(eyeLegGeo, solidIron);
    leg2.position.set(0, 225, -100);
    leg2.rotation.x = 0.4;
    eyeGroup.add(leg2);

    const eyeCenter = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 40, 16), solidIron);
    eyeCenter.rotation.x = Math.PI / 2;
    eyeCenter.position.y = 450;
    eyeGroup.add(eyeCenter);

    const eyePos = trackCurve.getPointAt(0.40); 
    eyeGroup.position.set(eyePos.x - 600, 10, eyePos.z + 600);
    eyeGroup.rotation.y = Math.PI / 4; 
    eyeGroup.scale.set(3, 3, 3); 
    scene.add(eyeGroup);
}