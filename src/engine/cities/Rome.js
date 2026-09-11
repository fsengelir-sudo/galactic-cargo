// src/engine/cities/Rome.js
import * as THREE from 'three';

export function buildRome(scene, trackCurve, sampledTrackPoints) {
    const countBuildings = 700;
    const countCypress = 600; 
    const countDomes = 100; // Skyline için tarihi kubbeler

    // Akdeniz Mimarisi Renkleri
    const wallColors = [0xd28a52, 0xe5b67a, 0xc06941, 0xdfc29b];
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x8b3a2b, roughness: 0.9, metalness: 0.1 }); 
    const matTree = new THREE.MeshStandardMaterial({ color: 0x1d3822, roughness: 1.0, metalness: 0.0 }); 
    const matDome = new THREE.MeshStandardMaterial({ color: 0x5f6e69, roughness: 0.7, metalness: 0.3 }); // Oksitlenmiş bakır/kurşun kubbeler

    const meshRoofs = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 1, 4), matRoof, countBuildings);
    const meshTrees = new THREE.InstancedMesh(new THREE.ConeGeometry(5, 60, 8), matTree, countCypress); 
    
    // Yarım küre (Dome) geometrisi
    const domeGeo = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const meshDomes = new THREE.InstancedMesh(domeGeo, matDome, countDomes);

    const wallMeshes = wallColors.map(c => 
        new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }), countBuildings / 4)
    );

    const dummy = new THREE.Object3D();
    let rIdx = 0, tIdx = 0, dIdx = 0;
    const wallIdx = [0, 0, 0, 0];

    for (let i = 0; i < countBuildings + countCypress; i++) {
        const x = (Math.random() - 0.5) * 16000;
        const z = (Math.random() - 0.5) * 16000;

        let minTrackDist = Infinity;
        for(let p of sampledTrackPoints) {
            const dist = Math.hypot(p.x - x, p.z - z);
            if (dist < minTrackDist) minTrackDist = dist;
        }

        if (i < countBuildings) {
            if (minTrackDist < 400) continue;
            
            const width = 80 + Math.random() * 80;
            const depth = 80 + Math.random() * 80;
            const height = 80 + Math.random() * 100; 

            dummy.scale.set(width, height, depth);
            dummy.position.set(x, height / 2, z);
            dummy.updateMatrix();
            
            const colorGroup = i % 4;
            wallMeshes[colorGroup].setMatrixAt(wallIdx[colorGroup]++, dummy.matrix);

            // Binaların bazılarına normal çatı, bazılarına devasa tarihi Kubbe (Cupola) ekle
            if (Math.random() > 0.85 && dIdx < countDomes) {
                const domeRadius = (width + depth) / 4;
                dummy.scale.set(domeRadius, domeRadius, domeRadius);
                dummy.position.set(x, height, z);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                meshDomes.setMatrixAt(dIdx++, dummy.matrix);
                
                // Kubbe tepesine küçük kule (Lantern)
                dummy.scale.set(domeRadius * 1.5, 40, depth * 1.5); 
            } else {
                dummy.scale.set(width * 1.3, 40, depth * 1.3); 
                dummy.position.set(x, height + 20, z);
                dummy.rotation.y = Math.PI / 4; 
                dummy.updateMatrix();
                meshRoofs.setMatrixAt(rIdx++, dummy.matrix);
            }
            
        } else {
            if (minTrackDist < 200) continue;
            dummy.scale.set(1, 1 + Math.random() * 0.5, 1);
            dummy.position.set(x, 30, z);
            dummy.updateMatrix();
            meshTrees.setMatrixAt(tIdx++, dummy.matrix);
        }
    }
    
    wallMeshes.forEach(mesh => {
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
    });
    meshRoofs.instanceMatrix.needsUpdate = true;
    meshTrees.instanceMatrix.needsUpdate = true;
    meshDomes.instanceMatrix.needsUpdate = true;
    scene.add(meshRoofs, meshTrees, meshDomes);

    // --- 1. DEVASA KOLEZYUM (Detaylı Kemer ve Katman Yapısı) ---
    const colosseumGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd4b88e, roughness: 1.0, metalness: 0.1, side: THREE.DoubleSide });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x9a805c, roughness: 1.0, metalness: 0.1 });

    // Dış Yıkık Duvar (270 Derece)
    const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(500, 500, 300, 64, 1, true, 0, Math.PI * 1.4), stoneMat);
    outerWall.position.y = 150;
    colosseumGroup.add(outerWall);

    // İç Duvar (Tam Daire, Daha Alçak, Kemer Zeminini Temsil Eder)
    const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(450, 450, 200, 64, 1, false), darkStoneMat);
    innerWall.position.y = 100;
    colosseumGroup.add(innerWall);

    // Yatay Kornişler (Katmanları ayıran dairesel çıkıntılar)
    const corniceGeo = new THREE.TorusGeometry(500, 5, 8, 64, Math.PI * 1.4);
    for(let h of [100, 200, 300]) {
        const cornice = new THREE.Mesh(corniceGeo, stoneMat);
        cornice.position.y = h;
        cornice.rotation.x = Math.PI / 2;
        colosseumGroup.add(cornice);
    }

    // Dikey Sütunlar (Kemerleri oluşturan ızgara yapısı)
    const pillarGeo = new THREE.BoxGeometry(15, 300, 25);
    for(let i = 0; i < 45; i++) {
        const angle = (i / 45) * (Math.PI * 1.4);
        const pillar = new THREE.Mesh(pillarGeo, stoneMat);
        pillar.position.set(Math.cos(angle) * 500, 150, Math.sin(angle) * 500);
        pillar.rotation.y = -angle;
        colosseumGroup.add(pillar);
    }

    // Arena Zemin
    const arenaFloor = new THREE.Mesh(new THREE.CylinderGeometry(440, 440, 10, 64), stoneMat);
    arenaFloor.position.y = 5;
    colosseumGroup.add(arenaFloor);

    // Kolezyum Konumlandırma
    const colPos = trackCurve.getPointAt(0.35); 
    colosseumGroup.position.set(colPos.x - 700, 0, colPos.z + 500);
    colosseumGroup.rotation.y = Math.PI / 3; 
    colosseumGroup.scale.set(2.5, 2.5, 2.5); 
    scene.add(colosseumGroup);


    // --- 2. TREVİ ÇEŞMESİ (Barok Cephe ve Turkuaz Havuz) ---
    const treviGroup = new THREE.Group();
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.7, metalness: 0.1 }); // Beyaz/Krem Mermer
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x2ab7ca, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.9 }); // Turkuaz Su
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xb5b5b5, roughness: 1.0 }); // Gri Kayalar

    // Arka Saray Cephesi
    const facade = new THREE.Mesh(new THREE.BoxGeometry(400, 250, 40), marbleMat);
    facade.position.set(0, 125, -20);
    treviGroup.add(facade);

    // Merkez Kemer (Heykelin durduğu devasa niş)
    const nicheGeo = new THREE.CylinderGeometry(60, 60, 50, 32, 1, false, 0, Math.PI);
    const niche = new THREE.Mesh(nicheGeo, darkStoneMat);
    niche.rotation.x = Math.PI / 2;
    niche.position.set(0, 120, 0);
    treviGroup.add(niche);

    // Cephe Sütunları
    const treviPillarGeo = new THREE.CylinderGeometry(10, 10, 250, 16);
    const pillarPositions = [-120, -60, 60, 120];
    pillarPositions.forEach(px => {
        const p = new THREE.Mesh(treviPillarGeo, marbleMat);
        p.position.set(px, 125, 5);
        treviGroup.add(p);
    });

    // Merkez Heykel Temsili (Mermer Silindir)
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(15, 20, 70, 8), marbleMat);
    statue.position.set(0, 80, 20);
    treviGroup.add(statue);

    // Turkuaz Havuz
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(180, 180, 15, 32), waterMat);
    pool.position.set(0, 7.5, 100);
    treviGroup.add(pool);

    // Havuz Çevresi Doğal Kayalar (DodecahedronGeometry ile asimetrik kayalar)
    const rockGeo = new THREE.DodecahedronGeometry(25);
    for(let i = 0; i < 40; i++) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        const angle = (i / 40) * Math.PI;
        const radius = 170 + Math.random() * 20;
        rock.position.set(Math.cos(angle) * radius, Math.random() * 20, 100 + Math.sin(angle) * radius);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.setScalar(0.5 + Math.random());
        treviGroup.add(rock);
        
        // Şelale dökülen merkez kayalar
        if(i < 15) {
            const centerRock = new THREE.Mesh(rockGeo, rockMat);
            centerRock.position.set((Math.random() - 0.5) * 100, Math.random() * 50, 40 + Math.random() * 30);
            centerRock.rotation.set(Math.random(), Math.random(), Math.random());
            centerRock.scale.setScalar(1 + Math.random());
            treviGroup.add(centerRock);
        }
    }

    // Trevi Çeşmesini Konumlandırma
    const treviPos = trackCurve.getPointAt(0.65); // Parkurun %65'i
    treviGroup.position.set(treviPos.x + 600, 0, treviPos.z - 400);
    treviGroup.lookAt(treviPos.x, 0, treviPos.z); // Yüzü raylara dönsün
    treviGroup.scale.set(2, 2, 2); 
    scene.add(treviGroup);
}