// src/App.jsx
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';

const INITIAL_WORLD_CIRCUIT = [
  { id: 1, tier: 'TIER 1: EUROPE', city: 'Paris, Fransa', landmark: 'Eyfel Kulesi (Demir Kafes)' },
  { id: 2, tier: 'TIER 1: EUROPE', city: 'Londra, İngiltere', landmark: 'Big Ben & London Eye' },
  { id: 3, tier: 'TIER 1: EUROPE', city: 'Roma, İtalya', landmark: 'Kolezyum Yıkıntıları' },
  { id: 4, tier: 'TIER 1: EUROPE', city: 'Barselona, İspanya', landmark: 'La Sagrada Familia' },
  { id: 5, tier: 'TIER 1: EUROPE', city: 'Venedik, İtalya', landmark: 'Büyük Kanal Su Üstü' },
  
  { id: 21, tier: 'TIER 2: AMERICAS', city: 'New York, ABD', landmark: 'Empire State (Dikey Düşüş)' },
  { id: 22, tier: 'TIER 2: AMERICAS', city: 'San Francisco, ABD', landmark: 'Golden Gate Halatları' },
  { id: 23, tier: 'TIER 2: AMERICAS', city: 'Rio de Janeiro, Brezilya', landmark: 'Kurtarıcı İsa (Orman İnişi)' },
  { id: 24, tier: 'TIER 2: AMERICAS', city: 'Las Vegas, ABD', landmark: 'The Strip (Neon İllüzyonu)' },
  { id: 25, tier: 'TIER 2: AMERICAS', city: 'Toronto, Kanada', landmark: 'CN Tower Tırmanışı' },

  { id: 41, tier: 'TIER 3: ASIA & PACIFIC', city: 'Tokyo, Japonya', landmark: 'Shibuya Neon Tünelleri' },
  { id: 42, tier: 'TIER 3: ASIA & PACIFIC', city: 'Dubai, BAE', landmark: 'Burj Khalifa Sarmalı' },
  { id: 43, tier: 'TIER 3: ASIA & PACIFIC', city: 'Şanghay, Çin', landmark: 'Oriental Pearl Küreleri' },
  { id: 44, tier: 'TIER 3: ASIA & PACIFIC', city: 'Agra, Hindistan', landmark: 'Tac Mahal Yansıma Havuzu' },
  { id: 45, tier: 'TIER 3: ASIA & PACIFIC', city: 'Pekin, Çin', landmark: 'Çin Seddi (Dayanıklılık)' },

  { id: 61, tier: 'TIER 4: ANATOLIA & AFRICA', city: 'İstanbul, Türkiye', landmark: 'Boğaziçi Köprüsü & Galata' },
  { id: 62, tier: 'TIER 4: ANATOLIA & AFRICA', city: 'Nevşehir, Türkiye', landmark: 'Kapadokya (Balon Slalom)' },
  { id: 63, tier: 'TIER 4: ANATOLIA & AFRICA', city: 'Adıyaman, Türkiye', landmark: 'Nemrut Dağı Heykelleri' },
  { id: 64, tier: 'TIER 4: ANATOLIA & AFRICA', city: 'Kahire, Mısır', landmark: 'Giza Piramitleri (Kum Fırtınası)' },
  { id: 65, tier: 'TIER 4: ANATOLIA & AFRICA', city: 'Cape Town, G. Afrika', landmark: 'Masa Dağı (Kör Düşüş)' },

  { id: 81, tier: 'TIER 5: EXTREME', city: 'Pasifik Okyanusu', landmark: 'Mariana Çukuru (Klostrofobi)' },
  { id: 82, tier: 'TIER 5: EXTREME', city: 'Antarktika', landmark: 'Buzullar (Sıfır Sürtünme)' },
  { id: 100, tier: 'TIER 5: EXTREME', city: 'Dünya Yörüngesi', landmark: 'Uzay İstasyonu (Sıfır Yerçekimi)' },
];

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isGarageOpen, setIsGarageOpen] = useState(false);

  // 1. Kayıtlı Verileri Yükle (localStorage)
  const [playerGold, setPlayerGold] = useState(() => {
    return parseInt(localStorage.getItem('gce_gold')) || 1500;
  });

  const [unlockedLevels, setUnlockedLevels] = useState(() => {
    const saved = localStorage.getItem('gce_unlocked_levels');
    return saved ? JSON.parse(saved) : [1]; // Sadece Seviye 1 açık başlar
  });

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('gce_upgrades');
    return saved ? JSON.parse(saved) : { engine: 1, brakes: 1, grip: 1, cargo: 1 };
  });

  // 2. Durum Değiştikçe Otomatik Kaydet
  useEffect(() => {
    localStorage.setItem('gce_gold', playerGold.toString());
  }, [playerGold]);

  useEffect(() => {
    localStorage.setItem('gce_unlocked_levels', JSON.stringify(unlockedLevels));
  }, [unlockedLevels]);

  useEffect(() => {
    localStorage.setItem('gce_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  // 3. Bölüm Tamamlama Mantığı (Yeni Seviyeyi Açar ve Altın Verir)
  const handleLevelComplete = (levelId, rewardGold) => {
    setPlayerGold(prev => prev + rewardGold);
    
    // Bir sonraki bölümü bul ve kilidini aç
    const currentIndex = INITIAL_WORLD_CIRCUIT.findIndex(l => l.id === levelId);
    if (currentIndex !== -1 && currentIndex + 1 < INITIAL_WORLD_CIRCUIT.length) {
      const nextLevelId = INITIAL_WORLD_CIRCUIT[currentIndex + 1].id;
      if (!unlockedLevels.includes(nextLevelId)) {
        setUnlockedLevels(prev => [...prev, nextLevelId]);
      }
    }
    setSelectedLevel(null); // Menüye dön
  };

  // 4. Parça Geliştirme Satın Alımı
  const buyUpgrade = (stat) => {
    const currentLevel = upgrades[stat];
    if (currentLevel >= 5) return; // Maks Seviye 5
    const cost = currentLevel * 800; // 800, 1600, 2400, 3200

    if (playerGold >= cost) {
      setPlayerGold(prev => prev - cost);
      setUpgrades(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
    }
  };

  // Oyun Ekranı
  if (selectedLevel) {
    return (
      <>
        <button 
          onClick={() => setSelectedLevel(null)}
          style={{
            position: 'absolute', top: 20, right: 30, zIndex: 9999,
            backgroundColor: 'rgba(255, 0, 85, 0.8)', border: '2px solid #ff0055', color: '#fff',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace',
            fontWeight: 'bold', fontSize: '16px', boxShadow: '0 0 10px #ff0055'
          }}
        >
          ABORT MISSION (EXIT TO MENU)
        </button>
        <GameCanvas 
          levelData={selectedLevel} 
          upgrades={upgrades}
          onFinishLevel={handleLevelComplete}
        />
      </>
    );
  }

  // Ana Menü
  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#05020a', color: '#fff',
      fontFamily: 'monospace', overflowY: 'auto', backgroundImage: 'radial-gradient(circle at 50% 0%, #1a0b2e, #05020a)'
    }}>
      {/* Üst Bar */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '30px 50px', borderBottom: '1px solid #00ffcc', backgroundColor: 'rgba(0,0,0,0.5)' 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '44px', color: '#00ffcc', textShadow: '0 0 20px #00ffcc' }}>
            GALACTIC CARGO EXPRESS
          </h1>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#888' }}>WORLD CIRCUIT TOUR</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', color: '#888' }}>FUNDS</div>
          <div style={{ fontSize: '32px', color: '#ffcc00', textShadow: '0 0 15px #ffcc00' }}>
            {playerGold} GOLD
          </div>
          <button 
            onClick={() => setIsGarageOpen(true)}
            style={{
              marginTop: '10px', backgroundColor: '#ff0055', border: 'none',
              color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 'bold', boxShadow: '0 0 15px rgba(255, 0, 85, 0.5)'
            }}
          >
            ENTER GARAGE (UPGRADES)
          </button>
        </div>
      </div>

      {/* GARAJ MODALI */}
      {isGarageOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#0a0515', border: '2px solid #00ffcc', borderRadius: '15px',
            padding: '35px', width: '550px', boxShadow: '0 0 30px rgba(0,255,204,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#00ffcc' }}>SHIP CUSTOMIZATION</h2>
              <div style={{ color: '#ffcc00', fontSize: '20px', fontWeight: 'bold' }}>{playerGold} GOLD</div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { key: 'engine', name: 'WARP ENGINE (TOP SPEED)', desc: 'İvmelenmeyi ve son hızı artırır' },
                { key: 'brakes', name: 'AERODYNAMIC BRAKES', desc: 'Virajlara girmeden anında duruş sağlar' },
                { key: 'grip', name: 'MAGNETIC RAIL GRIP', desc: 'Aşırı hızda raydan kaymayı geciktirir' },
                { key: 'cargo', name: 'TITANIUM CARGO BAY', desc: 'Kasada daha fazla kristal taşıma alanı' }
              ].map(item => {
                const lvl = upgrades[item.key];
                const cost = lvl * 800;
                const isMax = lvl >= 5;
                const canAfford = playerGold >= cost;

                return (
                  <div key={item.key} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#777', marginTop: '3px' }}>{item.desc}</div>
                        <div style={{ fontSize: '13px', color: '#00ffcc', marginTop: '6px' }}>
                          Level: {'★'.repeat(lvl)}{'☆'.repeat(5 - lvl)} ({lvl}/5)
                        </div>
                      </div>
                      <button
                        onClick={() => buyUpgrade(item.key)}
                        disabled={isMax || !canAfford}
                        style={{
                          backgroundColor: isMax ? '#333' : canAfford ? '#ffcc00' : '#444',
                          color: isMax ? '#777' : '#000',
                          border: 'none', padding: '10px 18px', borderRadius: '5px',
                          fontWeight: 'bold', cursor: (isMax || !canAfford) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isMax ? 'MAXED' : `${cost} G`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsGarageOpen(false)}
              style={{
                marginTop: '30px', width: '100%', backgroundColor: '#ff0055', border: 'none',
                color: '#fff', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              CLOSE GARAGE
            </button>
          </div>
        </div>
      )}

      {/* Seviye Listesi */}
      <div style={{ padding: '40px 50px' }}>
        {[...new Set(INITIAL_WORLD_CIRCUIT.map(item => item.tier))].map(tierName => (
          <div key={tierName} style={{ marginBottom: '50px' }}>
            <h3 style={{ fontSize: '24px', color: '#ff0055', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              {tierName}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {INITIAL_WORLD_CIRCUIT.filter(level => level.tier === tierName).map(level => {
                const isUnlocked = unlockedLevels.includes(level.id);

                return (
                  <div 
                    key={level.id}
                    onClick={() => isUnlocked && setSelectedLevel(level)}
                    style={{
                      backgroundColor: isUnlocked ? 'rgba(0, 255, 204, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isUnlocked ? '#00ffcc' : '#333'}`,
                      borderRadius: '10px', padding: '20px',
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      opacity: isUnlocked ? 1 : 0.4,
                      transition: 'all 0.2s',
                      boxShadow: isUnlocked ? '0 0 15px rgba(0, 255, 204, 0.1)' : 'none'
                    }}
                    onMouseEnter={(e) => isUnlocked && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => isUnlocked && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: isUnlocked ? '#fff' : '#555' }}>
                        #{level.id}
                      </span>
                      {isUnlocked ? (
                        <span style={{ backgroundColor: '#00ffcc', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>PLAY</span>
                      ) : (
                        <span style={{ backgroundColor: '#333', color: '#888', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>LOCKED</span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '20px', color: '#00ffcc', marginTop: '15px' }}>{level.city}</div>
                    <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>{level.landmark}</div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '5px', textAlign: 'center', fontSize: '12px' }}>
                        <div style={{ color: '#888' }}>REWARD</div>
                        <div style={{ color: '#ffcc00' }}>{level.id * 500}G</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}