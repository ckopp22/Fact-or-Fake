(function () {
  'use strict';
  var FoF = window.FoF = window.FoF || {};

  // All sounds are synthesized with the Web Audio API (no audio files).
  var VOLUME = 0.5;
  var ctx = null, master = null, noiseBuf = null, muted = false;
  var music = null, MUSIC_VOLUME = 0.05, musicOn = true;   // quiet looping background track

  function syncMusic() {
    if (!music) return;
    try {
      if (muted || !musicOn) music.pause();
      else { var p = music.play(); if (p && p.catch) p.catch(function () {}); }
    } catch (e) { /* ignore */ }
  }
  var clips = {};   // audio/fake.mp3 and audio/fact.mp3, played on reveals

  function playClip(name) {
    var c = clips[name];
    if (!c || muted) return;
    try { c.currentTime = 0; c.volume = VOLUME * 2; var p = c.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* ignore */ }
  }

  // iOS Safari only allows audio after a user gesture, so the context is created on the first tap.
  function unlock() {
    if (!music && window.Audio) {
      music = new Audio('audio/music.mp3');
      music.loop = true;
      music.volume = MUSIC_VOLUME;
    }
    syncMusic();
    ['fake', 'fact'].forEach(function (name) {   // prime inside the gesture so iOS lets them play later
      if (clips[name] || !window.Audio) return;
      var c = clips[name] = new Audio('audio/' + name + '.mp3');
      c.preload = 'auto';
      c.muted = true;
      var pr = c.play();
      if (pr && pr.then) pr.then(function () { c.pause(); c.currentTime = 0; c.muted = false; }).catch(function () { c.muted = false; });
    });
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(ctx.destination);
      var len = ctx.sampleRate, data;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      data = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      var kick = ctx.createBufferSource();   // silent blip finishes the iOS unlock
      kick.buffer = ctx.createBuffer(1, 1, 22050);
      kick.connect(ctx.destination);
      kick.start(0);
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {
      ctx = null;
    }
  }

  function setMusic(on) {
    musicOn = !!on;
    syncMusic();
  }

  function setMuted(m) {
    muted = !!m;
    syncMusic();
    if (master) master.gain.setValueAtTime(muted ? 0 : VOLUME, ctx.currentTime);
  }

  function ready() { return ctx && !muted; }

  // Gain envelope: quick attack to peak, exponential decay to silence.
  function env(t, attack, dur, peak) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    return g;
  }

  function tone(type, f0, f1, t, dur, peak, attack) {
    var o = ctx.createOscillator(), g = env(t, attack || 0.008, dur, peak);
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.9);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(t, dur, filterType, f0, f1, q, peak, attack) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = env(t, attack || 0.005, dur, peak);
    s.buffer = noiseBuf;
    s.loop = true;
    f.type = filterType;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    s.connect(f);
    f.connect(g);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  function thump(t) {
    tone('sine', 140, 45, t, 0.22, 0.9, 0.004);
    noise(t, 0.12, 'lowpass', 900, 200, 0.7, 0.35, 0.002);
  }

  var sounds = {
    revealFake: function (t) { thump(t); },
    tick: function (t) {
      noise(t, 0.045, 'bandpass', 3200, 2400, 1.2, 0.28, 0.002);
    },
    whoosh: function (t) {
      noise(t, 0.3, 'bandpass', 350, 2600, 0.9, 0.3, 0.1);
    },

    pop: function (t, score) {
      var base = 480 + Math.min(score || 0, 20) * 30;     // pitch climbs with the player's score
      tone('sine', base, base * 1.6, t, 0.13, 0.4, 0.004);
      tone('triangle', base * 2, base * 3, t, 0.08, 0.1, 0.003);
    },
    undo: function (t) {
      tone('sine', 520, 230, t, 0.16, 0.33, 0.004);
    },
    fanfare: function (t) {
      noise(t, 0.18, 'highpass', 1200, 4000, 0.7, 0.4, 0.002);   // confetti pop
      tone('sine', 220, 60, t, 0.2, 0.5, 0.003);
      [261.63, 329.63, 392.0, 523.25, 659.25].forEach(function (f, i) {  // C major arpeggio
        var at = t + 0.08 + i * 0.1;
        tone('triangle', f, f, at, 0.32, 0.26);
        tone('square', f, f, at, 0.2, 0.05);
      });
      [523.25, 659.25, 783.99].forEach(function (f) {                    // sustained chord
        var at = t + 0.6;
        var o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = env(at, 0.03, 1.5, 0.16);
        o.type = 'sawtooth';
        o.frequency.value = f;
        lp.type = 'lowpass';
        lp.frequency.value = 1800;
        o.connect(lp); lp.connect(g);
        o.start(at); o.stop(at + 1.6);
        tone('sine', f / 2, f / 2, at, 1.5, 0.12, 0.03);
      });
    }
  };

  function play(name, arg) {
    if (!ready()) return;
    try { sounds[name](ctx.currentTime + 0.01, arg); } catch (e) { /* audio must never break the game */ }
  }

  FoF.audio = {
    unlock: unlock,
    setMuted: setMuted,
    setMusic: setMusic,
    tick: function () { play('tick'); },
    whoosh: function () { play('whoosh'); },
    reveal: function (isFact) { if (isFact) playClip('fact'); else play('revealFake'); },
    flipFake: function () { playClip('fake'); },
    pop: function (score) { play('pop', score); },
    undo: function () { play('undo'); },
    fanfare: function () { play('fanfare'); }
  };
})();
