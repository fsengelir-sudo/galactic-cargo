// src/components/GameCanvas.jsx
import React, { useEffect, useRef, useState } from 'react';
import { initRenderer, setMobileInput } from '../engine/ThreeRenderer';

export default function GameCanvas({ levelData, upgrades, onFinishLevel }) {
    const mountRef = useRef(null);
    const [uiState, setUiState] = useState(null);
    const [finishedScore, setFinishedScore] = useState(null);

    // Müzik Döngüsü
    useEffect(() => {
        const playlist = ['/1.mp3', '/2.mp3'];
        let currentTrackIndex = 0;
        const audio = new Audio(playlist[currentTrackIndex]);
        audio.volume = 0.35;

        const handleEnded = () => {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            audio.src = playlist[currentTrackIndex];
            audio.play().catch(err => console.log("Oynatma hatası:", err));
        };

        audio.addEventListener('ended', handleEnded);
        audio.play().catch(err => console.log("Müzik bekleniyor:", err));

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    // Motor Başlatma
    useEffect(() => {
        if (!mountRef.current) return;
        const cleanup = initRenderer(
            mountRef.current,
            levelData,
            upgrades,
            (state) => setUiState(state),
            (finalScore) => setFinishedScore(finalScore)
        );
        return cleanup;
    }, [levelData, upgrades]);

    if (!uiState) return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;

    const { speed, limit, minSpeed, driveStatus, warning, score, lap } = uiState;

    let speedColor = '#00ffcc'; 
    let directiveText = 'PERFECT SPEED - GO!';
    let gasGlow = false;
    let brakeGlow = false;

    if (driveStatus === 'TOO_FAST') {
        speedColor = '#ff0055'; 
        directiveText = 'TOO FAST! PRESS BRAKE!';
        brakeGlow = true; 
    } else if (driveStatus === 'TOO_SLOW') {
        speedColor = '#ffaa00'; 
        directiveText = 'TOO SLOW! PRESS GAS!';
        gasGlow = true; 
    } else if (driveStatus === 'CRASHED') {
        speedColor = '#555555';
        directiveText = 'SYSTEM FAILURE';
    } else if (driveStatus === 'FINISHED') {
        speedColor = '#00ffcc';
        directiveText = 'MISSION ACCOMPLISHED';
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>

            <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

                {/* Üst Sol Bilgi */}
                <div style={{ position: 'absolute', top: 20, left: 20, fontFamily: 'monospace', textShadow: '0 0 5px #000' }}>
                    <div style={{ fontSize: '32px', color: '#00ffcc', fontWeight: 'bold' }}>LAP {Math.max(1, Math.min(lap, 3))}/3</div>
                    <div style={{ fontSize: '20px', color: '#ffcc00', marginTop: '5px' }}>SCORE: {score}</div>
                </div>

                {/* Uyarı Banner */}
                {warning && driveStatus !== 'FINISHED' && (
                    <div style={{ position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)',
                        color: '#fff', fontSize: '28px', fontWeight: 'bold', textShadow: '0 0 15px #ff0055', 
                        backgroundColor: 'rgba(255, 0, 85, 0.6)', border: '2px solid #ff0055', padding: '10px 20px', borderRadius: '5px' }}>
                        {warning}
                    </div>
                )}

                {/* ZAFER EKRANI (BÖLÜM BİTİNCE ÇIKAR) */}
                {driveStatus === 'FINISHED' && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center',
                        color: '#00ffcc', backgroundColor: 'rgba(5, 2, 10, 0.95)', border: '3px solid #00ffcc', padding: '40px 60px', 
                        borderRadius: '20px', pointerEvents: 'auto', boxShadow: '0 0 40px rgba(0,255,204,0.4)', zIndex: 10000 }}>
                        <h2 style={{ margin: 0, fontSize: '42px', letterSpacing: '2px' }}>MISSION COMPLETED!</h2>
                        <div style={{ fontSize: '20px', color: '#888', marginTop: '10px' }}>{levelData.city}</div>
                        <div style={{ fontSize: '36px', color: '#ffcc00', margin: '20px 0', textShadow: '0 0 15px #ffcc00' }}>
                            +{levelData.id * 500} GOLD REWARD
                        </div>
                        <div style={{ fontSize: '18px', color: '#fff', marginBottom: '25px' }}>
                            Final Score: {finishedScore || score}
                        </div>
                        <button
                            onClick={() => onFinishLevel(levelData.id, levelData.id * 500)}
                            style={{
                                backgroundColor: '#00ffcc', color: '#000', border: 'none', padding: '15px 35px',
                                fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer',
                                boxShadow: '0 0 20px #00ffcc'
                            }}
                        >
                            CLAIM REWARD & CONTINUE
                        </button>
                    </div>
                )}

                {/* Akıllı Hız Göstergesi */}
                <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center',
                    backgroundColor: 'rgba(0,0,0,0.85)', border: `2px solid ${speedColor}`, borderRadius: '15px', padding: '15px 40px', 
                    boxShadow: `0 0 20px ${speedColor}`, transition: 'all 0.2s', minWidth: '320px' }}>
                    
                    <div style={{ color: speedColor, fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {directiveText}
                    </div>
                    <div style={{ color: speedColor, fontSize: '64px', fontWeight: 'bold', textShadow: `0 0 15px ${speedColor}` }}>
                        {speed} <span style={{ fontSize: '20px' }}>KM/H</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '16px', marginTop: '5px', opacity: 0.9 }}>
                        SAFE ZONE: {minSpeed} - {limit}
                    </div>
                </div>

                {/* Fren Butonu */}
                <button
                    onPointerDown={() => setMobileInput('brake', true)}
                    onPointerUp={() => setMobileInput('brake', false)}
                    onPointerLeave={() => setMobileInput('brake', false)}
                    style={{
                        position: 'absolute', bottom: 40, left: 40, width: '100px', height: '100px', borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)', pointerEvents: 'auto', cursor: 'pointer',
                        color: brakeGlow ? '#00ffcc' : '#ff0055', 
                        border: brakeGlow ? '5px solid #00ffcc' : '2px solid #ff0055',
                        boxShadow: brakeGlow ? '0 0 30px #00ffcc' : 'none',
                        fontSize: '18px', fontWeight: 'bold', transition: 'all 0.2s',
                        transform: brakeGlow ? 'scale(1.1)' : 'scale(1)' 
                    }}
                >
                    BRAKE
                </button>

                {/* Gaz Butonu */}
                <button
                    onPointerDown={() => setMobileInput('gas', true)}
                    onPointerUp={() => setMobileInput('gas', false)}
                    onPointerLeave={() => setMobileInput('gas', false)}
                    style={{
                        position: 'absolute', bottom: 40, right: 40, width: '100px', height: '100px', borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)', pointerEvents: 'auto', cursor: 'pointer',
                        color: gasGlow ? '#00ffcc' : '#00ffcc', 
                        border: gasGlow ? '5px solid #00ffcc' : '2px solid rgba(0, 255, 204, 0.4)',
                        boxShadow: gasGlow ? '0 0 30px #00ffcc' : 'none',
                        fontSize: '22px', fontWeight: 'bold', transition: 'all 0.2s',
                        transform: gasGlow ? 'scale(1.1)' : 'scale(1)' 
                    }}
                >
                    GAS
                </button>

            </div>
        </div>
    );
}