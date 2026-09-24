// zombie_web/audio.js - Procedural 8-Bit Web Audio API Sound Synthesizer & Chiptune BGM Engine
// Zero external audio files required!

class RetroAudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.4;
        this.bgmVolume = 0.22;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.stepIndex = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.bgmPlaying) {
            this.stopBGM();
        }
        return this.enabled;
    }

    createNoiseBuffer(duration = 0.2) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // ================= CHIPTUNE RETRO BGM SEQUENCER =================
    toggleBGM() {
        this.init();
        if (this.bgmPlaying) {
            this.stopBGM();
            return false;
        } else {
            this.startBGM();
            return true;
        }
    }

    startBGM() {
        if (this.bgmPlaying || !this.enabled) return;
        this.init();
        this.bgmPlaying = true;
        this.stepIndex = 0;

        // 135 BPM Bass & Arp notes (A Minor: A, C, D, E, G)
        const bassLine = [
            110.0, 110.0, 130.81, 110.0, 146.83, 110.0, 164.81, 130.81,
            98.0, 98.0, 123.47, 98.0, 130.81, 98.0, 146.83, 123.47
        ];
        const arpLine = [
            440.0, 523.25, 659.25, 523.25, 783.99, 659.25, 880.0, 659.25,
            392.0, 493.88, 587.33, 493.88, 659.25, 587.33, 783.99, 587.33
        ];

        const stepTime = 60 / 135 / 4; // 16th notes

        this.bgmTimer = setInterval(() => {
            if (!this.bgmPlaying || !this.enabled || !this.ctx) return;
            const t = this.ctx.currentTime;
            const step = this.stepIndex % 16;

            // Bass Note (every 2nd 16th note)
            if (step % 2 === 0) {
                const freq = bassLine[step];
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(this.bgmVolume * 0.45, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 1.6);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + stepTime * 1.6);
            }

            // Arpeggio Lead (sparkly 16th note square)
            if (Math.random() < 0.85) {
                const freq = arpLine[step];
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(this.bgmVolume * 0.22, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 0.9);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + stepTime * 0.9);
            }

            // Hi-Hat / Snare Drum
            if (step % 4 === 2) {
                // Retro Snare Noise
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.createNoiseBuffer(0.06);
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2200, t);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(this.bgmVolume * 0.35, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(t);
                noise.stop(t + 0.06);
            } else if (step % 2 === 0) {
                // Soft Hi-Hat Noise
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.createNoiseBuffer(0.03);
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(7000, t);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(this.bgmVolume * 0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(t);
                noise.stop(t + 0.03);
            }

            this.stepIndex++;
        }, stepTime * 1000);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    // ================= SOUND EFFECTS =================
    play(soundName) {
        if (!this.enabled) return;
        this.init();
        const t = this.ctx.currentTime;

        try {
            switch (soundName) {
                case 'ui_hover': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, t);
                    gain.gain.setValueAtTime(this.volume * 0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.04);
                    break;
                }

                case 'ui_click': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(440, t);
                    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
                    gain.gain.setValueAtTime(this.volume * 0.35, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.05);
                    break;
                }

                case 'knife_throw': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(650, t);
                    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
                    gain.gain.setValueAtTime(this.volume * 0.5, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.12);
                    break;
                }

                case 'gun_shot': {
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = this.createNoiseBuffer(0.15);
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(3000, t);
                    filter.frequency.exponentialRampToValueAtTime(400, t + 0.15);
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(this.volume * 0.9, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

                    const osc = this.ctx.createOscillator();
                    const oscGain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(160, t);
                    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
                    oscGain.gain.setValueAtTime(this.volume * 0.8, t);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.connect(oscGain);
                    oscGain.connect(this.ctx.destination);

                    noise.start(t);
                    osc.start(t);
                    noise.stop(t + 0.15);
                    osc.stop(t + 0.1);
                    break;
                }

                case 'shotgun_blast': {
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = this.createNoiseBuffer(0.28);
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(1400, t);
                    filter.frequency.exponentialRampToValueAtTime(150, t + 0.28);
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(this.volume * 1.0, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

                    const osc = this.ctx.createOscillator();
                    const oscGain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(110, t);
                    osc.frequency.exponentialRampToValueAtTime(25, t + 0.22);
                    oscGain.gain.setValueAtTime(this.volume * 1.1, t);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.connect(oscGain);
                    oscGain.connect(this.ctx.destination);

                    noise.start(t);
                    osc.start(t);
                    noise.stop(t + 0.28);
                    osc.stop(t + 0.22);
                    break;
                }

                case 'machinegun_fire': {
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = this.createNoiseBuffer(0.08);
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(1800, t);
                    filter.Q.value = 3;
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(this.volume * 0.7, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

                    const osc = this.ctx.createOscillator();
                    const oscGain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(180, t);
                    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
                    oscGain.gain.setValueAtTime(this.volume * 0.4, t);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.connect(oscGain);
                    oscGain.connect(this.ctx.destination);

                    noise.start(t);
                    osc.start(t);
                    noise.stop(t + 0.08);
                    osc.stop(t + 0.06);
                    break;
                }

                case 'empty_click': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(1400, t);
                    osc.frequency.exponentialRampToValueAtTime(700, t + 0.03);
                    gain.gain.setValueAtTime(this.volume * 0.4, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.03);
                    break;
                }

                case 'hit': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(160, t);
                    osc.frequency.exponentialRampToValueAtTime(40, t + 0.09);
                    gain.gain.setValueAtTime(this.volume * 0.5, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.09);
                    break;
                }

                case 'zombie_death': {
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = this.createNoiseBuffer(0.2);
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(450, t);
                    filter.frequency.exponentialRampToValueAtTime(80, t + 0.2);
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(this.volume * 0.6, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    noise.start(t);
                    noise.stop(t + 0.2);
                    break;
                }

                case 'level_up': {
                    const notes = [523.25, 659.25, 783.99, 1046.50];
                    notes.forEach((freq, idx) => {
                        const noteTime = t + idx * 0.09;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(freq, noteTime);
                        gain.gain.setValueAtTime(this.volume * 0.5, noteTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(noteTime);
                        osc.stop(noteTime + 0.15);
                    });
                    break;
                }

                case 'dodge_roll': {
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = this.createNoiseBuffer(0.2);
                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(600, t);
                    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.1);
                    filter.frequency.exponentialRampToValueAtTime(300, t + 0.2);
                    filter.Q.value = 2;
                    const gain = this.ctx.createGain();
                    gain.gain.setValueAtTime(this.volume * 0.4, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    noise.start(t);
                    noise.stop(t + 0.2);
                    break;
                }

                case 'coin_pickup': {
                    const notes = [987.77, 1318.51];
                    notes.forEach((freq, idx) => {
                        const noteTime = t + idx * 0.07;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, noteTime);
                        gain.gain.setValueAtTime(this.volume * 0.4, noteTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.08);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(noteTime);
                        osc.stop(noteTime + 0.08);
                    });
                    break;
                }

                case 'boss_alert': {
                    [0, 0.25, 0.5].forEach(offset => {
                        const alertTime = t + offset;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(110, alertTime);
                        osc.frequency.linearRampToValueAtTime(90, alertTime + 0.2);
                        gain.gain.setValueAtTime(this.volume * 0.7, alertTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, alertTime + 0.2);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(alertTime);
                        osc.stop(alertTime + 0.2);
                    });
                    break;
                }

                case 'cleaver_throw': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, t);
                    osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);
                    gain.gain.setValueAtTime(this.volume * 0.6, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.25);
                    break;
                }

                case 'player_hurt': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(190, t);
                    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
                    gain.gain.setValueAtTime(this.volume * 0.7, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.15);
                    break;
                }
            }
        } catch (e) {
            console.warn("Audio playback error:", e);
        }
    }
}

// Global audio singleton
const Sound = new RetroAudioEngine();
