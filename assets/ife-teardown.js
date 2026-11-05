/**
 * IFE & Clean Architecture 3D Interactive Teardown Rig
 * Atharva Mahamuni Portfolio · Panasonic Avionics MTS-2 Showcase
 * 
 * Renders an interactive 3D seat-back In-Flight Entertainment (IFE) unit
 * with live avionics telemetry and an exploded Clean Architecture wafer stack.
 * Driven by mouse drag, hover tilt, and scroll-craft scrub progress (--sc-p).
 */

(function () {
  'use strict';

  var canvas = document.getElementById('ife-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var container = canvas.parentElement;
  var isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  var state = {
    rotX: 0.35,      // isometric elevation
    rotY: -0.45,     // isometric azimuth
    targetRotX: 0.35,
    targetRotY: -0.45,
    explode: 0,      // 0 = assembled IFE screen, 1 = fully exploded wafers
    targetExplode: 0,
    hoveredLayer: -1,
    activeLayer: -1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    time: 0,
    isVisible: true,
    rafId: null,
    manualToggle: false
  };

  // Layer Architecture Definitions (DESIGN.md timeline tokens)
  var LAYERS = [
    {
      id: 'hal',
      name: 'Hardware & Media3 HAL',
      color: '#c08532', // Gold
      badge: 'ExoPlayer / Media3',
      sub: 'Hardware decoding, audio sinks, seat-back display driver',
      tech: ['Media3', 'ExoPlayer', 'AudioTrack', 'DRM Widevine', 'JNI / NDK']
    },
    {
      id: 'data',
      name: 'Data & Networking',
      color: '#9fc9a2', // Mint
      badge: 'Room + Retrofit',
      sub: 'Offline-first caching, REST APIs, JSON serialization',
      tech: ['Room DB', 'Retrofit', 'OkHttp', 'Kotlinx Serialization', 'DataStore']
    },
    {
      id: 'domain',
      name: 'Domain & Clean Architecture',
      color: '#c0a8dd', // Lavender
      badge: 'UseCases & Business Logic',
      sub: 'Pure Kotlin business rules, Repository interfaces, SOLID principles',
      tech: ['Clean Architecture', 'SOLID', 'UseCases', 'Result Monad', 'Unit Tests']
    },
    {
      id: 'viewmodel',
      name: 'Async & State Orchestration',
      color: '#9fbbe0', // Blue
      badge: 'Coroutines & StateFlow',
      sub: 'Reactive state emissions, concurrency, lifecycle-aware models',
      tech: ['Coroutines', 'StateFlow', 'SharedFlow', 'ViewModel', 'Hilt DI']
    },
    {
      id: 'ui',
      name: 'Jetpack Compose UI',
      color: '#dfa88f', // Peach
      badge: 'Declarative Presentation',
      sub: 'Seat-back touch UI, smooth animations, baseline profiles',
      tech: ['Jetpack Compose', 'Material 3', 'Custom Layouts', 'Baseline Profiles']
    }
  ];

  // Sizing & DPI
  var width = 0;
  var height = 0;
  var dpr = 1;

  function resize() {
    var rect = container.getBoundingClientRect();
    width = rect.width || 480;
    height = rect.height || 480;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    render(true);
  }

  // 3D Matrix Math (Isometric projection & rotation)
  function project(x, y, z, cx, cy, rx, ry, scale) {
    // Rotate Y (azimuth)
    var cosY = Math.cos(ry);
    var sinY = Math.sin(ry);
    var x1 = x * cosY + z * sinY;
    var z1 = -x * sinY + z * cosY;

    // Rotate X (elevation)
    var cosX = Math.cos(rx);
    var sinX = Math.sin(rx);
    var y2 = y * cosX - z1 * sinX;
    var z2 = y * sinX + z1 * cosX;

    // Isometric perspective scaling
    var persp = 1 / (1 + z2 * 0.0018);
    var px = cx + x1 * scale * persp;
    var py = cy + y2 * scale * persp;

    return { x: px, y: py, z: z2, persp: persp };
  }

  // Draw 3D Box (Wafer or Chassis)
  function drawBox(ctx, cx, cy, rx, ry, scale, bx, by, bz, bw, bh, bd, style) {
    // Corners:
    // Front face: z = bz + bd/2
    // Back face:  z = bz - bd/2
    var hw = bw / 2;
    var hh = bh / 2;
    var hd = bd / 2;

    var pts = [
      project(bx - hw, by - hh, bz - hd, cx, cy, rx, ry, scale), // 0: back top left
      project(bx + hw, by - hh, bz - hd, cx, cy, rx, ry, scale), // 1: back top right
      project(bx + hw, by + hh, bz - hd, cx, cy, rx, ry, scale), // 2: back btm right
      project(bx - hw, by + hh, bz - hd, cx, cy, rx, ry, scale), // 3: back btm left
      project(bx - hw, by - hh, bz + hd, cx, cy, rx, ry, scale), // 4: front top left
      project(bx + hw, by - hh, bz + hd, cx, cy, rx, ry, scale), // 5: front top right
      project(bx + hw, by + hh, bz + hd, cx, cy, rx, ry, scale), // 6: front btm right
      project(bx - hw, by + hh, bz + hd, cx, cy, rx, ry, scale)  // 7: front btm left
    ];

    // Compute surface normal for top face (4, 5, 1, 0)
    // Top face is illuminated
    ctx.save();

    // Side: Right face (1, 5, 6, 2)
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[5].x, pts[5].y);
    ctx.lineTo(pts[6].x, pts[6].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = style.sideColor || '#22211c';
    ctx.fill();
    ctx.strokeStyle = style.borderColor || '#3a3830';
    ctx.lineWidth = style.borderWidth || 1;
    ctx.stroke();

    // Side: Bottom face (7, 6, 2, 3)
    ctx.beginPath();
    ctx.moveTo(pts[7].x, pts[7].y);
    ctx.lineTo(pts[6].x, pts[6].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();
    ctx.fillStyle = style.bottomColor || '#181714';
    ctx.fill();
    ctx.stroke();

    // Top face (0, 1, 5, 4)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[5].x, pts[5].y);
    ctx.lineTo(pts[4].x, pts[4].y);
    ctx.closePath();
    ctx.fillStyle = style.topColor || '#2c2a24';
    ctx.fill();
    ctx.stroke();

    // Front Face (4, 5, 6, 7) - Main Screen / Wafer Face
    ctx.beginPath();
    ctx.moveTo(pts[4].x, pts[4].y);
    ctx.lineTo(pts[5].x, pts[5].y);
    ctx.lineTo(pts[6].x, pts[6].y);
    ctx.lineTo(pts[7].x, pts[7].y);
    ctx.closePath();
    ctx.fillStyle = style.frontColor || '#26251e';
    ctx.fill();
    ctx.strokeStyle = style.accentColor || style.borderColor || '#3a3830';
    ctx.lineWidth = style.accentWidth || style.borderWidth || 1;
    ctx.stroke();

    ctx.restore();

    return {
      pts: pts,
      center: project(bx, by, bz, cx, cy, rx, ry, scale)
    };
  }

  // Draw Screen UI (Flight Telemetry & Media3 Player)
  function drawScreenContent(ctx, p4, p5, p6, p7, t, isExploded) {
    ctx.save();
    // Clip to screen quad (p4, p5, p6, p7)
    ctx.beginPath();
    ctx.moveTo(p4.x, p4.y);
    ctx.lineTo(p5.x, p5.y);
    ctx.lineTo(p6.x, p6.y);
    ctx.lineTo(p7.x, p7.y);
    ctx.closePath();
    ctx.clip();

    // Screen backdrop (deep obsidian canvas with subtle gradient)
    ctx.fillStyle = '#1c1b17';
    ctx.fill();

    // Center coordinates & vectors
    var topMidX = (p4.x + p5.x) * 0.5;
    var topMidY = (p4.y + p5.y) * 0.5;
    var btmMidX = (p7.x + p6.x) * 0.5;
    var btmMidY = (p7.y + p6.y) * 0.5;
    var midX = (topMidX + btmMidX) * 0.5;
    var midY = (topMidY + btmMidY) * 0.5;

    var dx = p5.x - p4.x;
    var dy = p5.y - p4.y;
    var screenWidth = Math.sqrt(dx * dx + dy * dy);

    // Subtle grid lines on screen
    ctx.strokeStyle = 'rgba(230, 229, 224, 0.08)';
    ctx.lineWidth = 1;
    for (var i = 0.2; i < 1; i += 0.2) {
      var lx1 = p4.x + (p7.x - p4.x) * i;
      var ly1 = p4.y + (p7.y - p4.y) * i;
      var lx2 = p5.x + (p6.x - p5.x) * i;
      var ly2 = p5.y + (p6.y - p5.y) * i;
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();
    }

    // Flight route telemetry line (Curved vector)
    var r1x = p4.x + (p5.x - p4.x) * 0.15 + (p7.x - p4.x) * 0.65;
    var r1y = p4.y + (p5.y - p4.y) * 0.15 + (p7.y - p4.y) * 0.65;
    var r2x = p4.x + (p5.x - p4.x) * 0.85 + (p7.x - p4.x) * 0.35;
    var r2y = p4.y + (p5.y - p4.y) * 0.85 + (p7.y - p4.y) * 0.35;
    var cpx = midX;
    var cpy = midY - 24 * dpr;

    ctx.strokeStyle = '#f54e00'; // Cursor Orange route line
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(r1x, r1y);
    ctx.quadraticCurveTo(cpx, cpy, r2x, r2y);
    ctx.stroke();

    // Aircraft position along route
    var routeProg = (t * 0.08) % 1;
    var curX = (1 - routeProg) * (1 - routeProg) * r1x + 2 * (1 - routeProg) * routeProg * cpx + routeProg * routeProg * r2x;
    var curY = (1 - routeProg) * (1 - routeProg) * r1y + 2 * (1 - routeProg) * routeProg * cpy + routeProg * routeProg * r2y;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(curX, curY, 3.5 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Telemetry text badge
    ctx.fillStyle = '#dfa88f';
    ctx.font = 'bold ' + Math.round(9 * dpr) + 'px "JetBrains Mono", monospace';
    ctx.fillText('PNQ → SFO · FL380', r1x - 8 * dpr, r1y + 14 * dpr);

    // Media3 Playback status scrubber at bottom
    var b1x = p7.x + (p6.x - p7.x) * 0.1;
    var b1y = p7.y + (p6.y - p7.y) * 0.1 - 14 * dpr;
    var b2x = p7.x + (p6.x - p7.x) * 0.9;
    var b2y = p7.y + (p6.y - p7.y) * 0.9 - 14 * dpr;

    ctx.strokeStyle = 'rgba(247, 247, 244, 0.2)';
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.lineTo(b2x, b2y);
    ctx.stroke();

    // Active scrubber fill
    var scrubProg = (t * 0.15) % 1;
    var sX = b1x + (b2x - b1x) * scrubProg;
    var sY = b1y + (b2y - b1y) * scrubProg;
    ctx.strokeStyle = '#f54e00';
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.lineTo(sX, sY);
    ctx.stroke();

    ctx.fillStyle = '#f54e00';
    ctx.beginPath();
    ctx.arc(sX, sY, 3.5 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Status LED top right
    var ledX = p5.x - 14 * dpr;
    var ledY = p5.y + 14 * dpr;
    var pulse = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.fillStyle = 'rgba(25, 182, 138, ' + (0.4 + 0.6 * pulse) + ')';
    ctx.beginPath();
    ctx.arc(ledX, ledY, 3 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Exploded Architecture Wafer
  function drawWafer(ctx, cx, cy, rx, ry, scale, index, total, explodeProg, t) {
    var layer = LAYERS[index];
    // Z-offset separation along isometric normal
    // When explodeProg is 1, wafers spread out generously
    var maxSep = 56; // separation distance per layer
    var zOffset = (index - 2) * maxSep * explodeProg;
    var yOffset = (index - 2) * -18 * explodeProg; // subtle elevation stagger

    // Base dimensions of the wafer
    var bw = 170;
    var bh = 115;
    var bd = 7;

    // Hover / active highlights
    var isHovered = (state.hoveredLayer === index);
    var isSelected = (state.activeLayer === index);

    var waferStyle = {
      frontColor: isSelected ? '#333128' : (isHovered ? '#2d2b24' : '#26251e'),
      topColor: isSelected ? '#423f35' : (isHovered ? '#3a372e' : '#2f2d26'),
      sideColor: isSelected ? '#2a2822' : '#21201b',
      bottomColor: '#171613',
      accentColor: layer.color,
      accentWidth: (isSelected || isHovered) ? 2.5 * dpr : 1.2 * dpr,
      borderColor: isSelected ? layer.color : (isHovered ? '#a09c92' : '#45433a'),
      borderWidth: 1 * dpr
    };

    var box = drawBox(ctx, cx, cy + yOffset, rx, ry, scale, 0, 0, zOffset, bw, bh, bd, waferStyle);
    var pts = box.pts;

    // Wafer front surface decoration (Tech labels and Clean Arch circuit lines)
    ctx.save();
    var p4 = pts[4], p5 = pts[5], p6 = pts[6], p7 = pts[7];

    // If fully or partially exploded, render layer badge & bus traces on each wafer
    if (explodeProg > 0.15) {
      // Bounding polygon
      ctx.beginPath();
      ctx.moveTo(p4.x, p4.y);
      ctx.lineTo(p5.x, p5.y);
      ctx.lineTo(p6.x, p6.y);
      ctx.lineTo(p7.x, p7.y);
      ctx.closePath();
      ctx.clip();

      // Colored bus line along left edge of wafer
      var busX1 = p4.x + (p5.x - p4.x) * 0.08;
      var busY1 = p4.y + (p5.y - p4.y) * 0.08;
      var busX2 = p7.x + (p6.x - p7.x) * 0.08;
      var busY2 = p7.y + (p6.y - p7.y) * 0.08;

      ctx.strokeStyle = layer.color;
      ctx.lineWidth = 3.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(busX1, busY1);
      ctx.lineTo(busX2, busY2);
      ctx.stroke();

      // Printed badge on wafer
      var textX = busX1 + (p5.x - p4.x) * 0.08;
      var textY = busY1 + (p7.y - p4.y) * 0.28;

      ctx.fillStyle = layer.color;
      ctx.font = 'bold ' + Math.round(10.5 * dpr) + 'px "JetBrains Mono", monospace';
      ctx.fillText('L' + (index + 1) + ' · ' + layer.name, textX, textY);

      // Sub-label
      ctx.fillStyle = '#cfcdc4';
      ctx.font = Math.round(8.5 * dpr) + 'px "JetBrains Mono", monospace';
      ctx.fillText(layer.badge, textX, textY + 13 * dpr);
    } else if (index === 4) {
      // Topmost wafer when assembled is the live seat-back screen
      drawScreenContent(ctx, p4, p5, p6, p7, t, false);
    }
    ctx.restore();

    // Callout Leader Lines (when exploded and hovered/selected)
    if (explodeProg > 0.6) {
      drawLeaderLine(ctx, box.center, layer, index, isHovered || isSelected);
    }

    return {
      index: index,
      center: box.center,
      pts: pts
    };
  }

  // Draw Callout Leader Line
  function drawLeaderLine(ctx, center, layer, index, isHighlighted) {
    var lineAlpha = isHighlighted ? 1 : 0.65;
    var side = (index % 2 === 0) ? -1 : 1; // alternate left/right callouts
    var anchorX = center.x + (side === 1 ? 55 * dpr : -55 * dpr);
    var anchorY = center.y;
    var targetX = center.x + (side === 1 ? 120 * dpr : -120 * dpr);
    var targetY = anchorY + (index - 2) * 14 * dpr;

    ctx.save();
    ctx.strokeStyle = isHighlighted ? layer.color : 'rgba(128, 125, 114, ' + lineAlpha + ')';
    ctx.lineWidth = isHighlighted ? 1.5 * dpr : 1 * dpr;

    // Leader line
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(anchorX, anchorY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Dot at anchor
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 2.5 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Label pill
    ctx.fillStyle = '#26251e';
    var text = 'L' + (index + 1) + ': ' + layer.badge;
    ctx.font = 'bold ' + Math.round(9 * dpr) + 'px "JetBrains Mono", monospace';
    var textMetrics = ctx.measureText(text);
    var pad = 6 * dpr;
    var pillW = textMetrics.width + pad * 2;
    var pillH = 16 * dpr;
    var pillX = side === 1 ? targetX + 4 * dpr : targetX - pillW - 4 * dpr;
    var pillY = targetY - pillH * 0.5;

    // Pill background
    ctx.fillStyle = isHighlighted ? '#ffffff' : '#f7f7f4';
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 3 * dpr);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#26251e';
    ctx.fillText(text, pillX + pad, pillY + pillH - 4.5 * dpr);

    ctx.restore();
  }

  // Main Render Loop
  function render(force) {
    if (!state.isVisible && !force) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Easing interpolation for smooth rotation & explosion
    if (!isReduced) {
      state.rotX += (state.targetRotX - state.rotX) * 0.08;
      state.rotY += (state.targetRotY - state.rotY) * 0.08;
      state.explode += (state.targetExplode - state.explode) * 0.07;
      state.time += 0.02;
    } else {
      state.rotX = state.targetRotX;
      state.rotY = state.targetRotY;
      state.explode = state.targetExplode;
    }

    var cx = (width * 0.5) * dpr;
    var cy = (height * 0.52) * dpr;
    var baseScale = Math.min(width, height) / 380;
    var scale = baseScale * dpr;

    // Ambient floating shadow beneath rig
    var shadowW = 190 * scale;
    var shadowH = 70 * scale;
    var shadowY = cy + 120 * scale;
    var shadowGrad = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, shadowW * 0.5);
    shadowGrad.addColorStop(0, 'rgba(38, 37, 30, 0.16)');
    shadowGrad.addColorStop(0.5, 'rgba(38, 37, 30, 0.06)');
    shadowGrad.addColorStop(1, 'rgba(38, 37, 30, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, shadowY, shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Back seat-back bezel & mounting housing
    var housingStyle = {
      frontColor: '#201f1b',
      topColor: '#292823',
      sideColor: '#171613',
      bottomColor: '#0f0e0c',
      borderColor: '#3a3830',
      borderWidth: 1 * dpr
    };
    var housingZ = -45 - (state.explode * 65);
    drawBox(ctx, cx, cy, state.rotX, state.rotY, scale, 0, 0, housingZ, 194, 138, 18, housingStyle);

    // Draw the 5 Architecture Wafers (from bottom L1 to top L5)
    for (var i = 0; i < LAYERS.length; i++) {
      drawWafer(ctx, cx, cy, state.rotX, state.rotY, scale, i, LAYERS.length, state.explode, state.time);
    }

    // Schedule next frame unless reduced-motion
    if (!isReduced) {
      state.rafId = requestAnimationFrame(function () { render(); });
    }
  }

  // Pointer & Drag Interaction (Inertial orbit)
  container.addEventListener('pointerdown', function (e) {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('pointermove', function (e) {
    if (state.isDragging) {
      var dx = e.clientX - state.lastMouseX;
      var dy = e.clientY - state.lastMouseY;
      state.targetRotY += dx * 0.008;
      state.targetRotX += dy * 0.008;
      // Clamp elevation
      state.targetRotX = Math.max(-0.2, Math.min(0.85, state.targetRotX));
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    } else {
      // Subtle tilt towards cursor when hovering
      var rect = container.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width - 0.5;
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      if (nx >= -0.5 && nx <= 0.5 && ny >= -0.5 && ny <= 0.5) {
        state.targetRotY = -0.45 + nx * 0.35;
        state.targetRotX = 0.35 + ny * 0.25;
      }
    }
  });

  window.addEventListener('pointerup', function () {
    state.isDragging = false;
    container.style.cursor = 'grab';
  });

  // Mode Toggle Button & Chips
  var toggleBtn = document.getElementById('teardown-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      state.manualToggle = !state.manualToggle;
      state.targetExplode = state.manualToggle ? 1 : 0;
      toggleBtn.textContent = state.manualToggle ? 'Assemble Screen' : 'Explode Architecture';
      toggleBtn.setAttribute('aria-pressed', state.manualToggle ? 'true' : 'false');
      if (isReduced) render(true);
    });
  }

  // Scroll-craft integration: read --sc-p from parent act if present
  var actElement = container.closest('[data-sc-act]') || container.closest('.hero');
  if (actElement) {
    var checkScroll = function () {
      if (state.manualToggle) return; // manual override
      var p = parseFloat(getComputedStyle(actElement).getPropertyValue('--sc-p'));
      if (!isNaN(p)) {
        // Map progress: 0..0.2 = assembled, 0.2..0.85 = explode 0..1, 0.85..1 = hold
        var ep = Math.max(0, Math.min(1, (p - 0.15) / 0.65));
        state.targetExplode = ep;
      }
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
  }

  // Visibility Optimization (Pause RAF when offscreen)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        state.isVisible = entry.isIntersecting;
        if (state.isVisible && !isReduced && !state.rafId) {
          state.rafId = requestAnimationFrame(function () { render(); });
        }
      });
    }, { threshold: 0.05 });
    io.observe(container);
  }

  window.addEventListener('resize', resize, { passive: true });
  container.style.cursor = 'grab';
  resize();

  // Expose API for testing
  window.__ifeRig = {
    state: state,
    render: render,
    resize: resize
  };
})();
