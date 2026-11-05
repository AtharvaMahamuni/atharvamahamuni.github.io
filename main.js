/**
 * Atharva Mahamuni Portfolio — Orchestration, 3D Spatial Depth & Micro-Interactions
 * Handles 3D spatial card tilt, interactive device tabs, Clean Architecture code inspector,
 * stats count-up, active nav tracking, and card spotlight coordinates.
 */

(function () {
  'use strict';

  window.__anim = true;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Hero Stagger Entrance Choreography
  var heroKids = document.querySelectorAll('.hero-text > *');
  heroKids.forEach(function (el, i) {
    el.style.transitionDelay = (i * 45) + 'ms';
  });

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      root.classList.add('ready');
    });
  });

  // 2. 3D Spatial Hero Card Tilt (Tactile, hardware-accelerated, mobile-friendly)
  var heroCard = document.getElementById('hero-card');
  if (heroCard && !reduce) {
    var heroArt = heroCard.closest('.hero-art') || heroCard;
    var targetTiltX = 0;
    var targetTiltY = 0;
    var currentTiltX = 0;
    var currentTiltY = 0;
    var sheenX = 50;
    var sheenY = 50;
    var isHovered = false;

    var updateTilt = function () {
      currentTiltX += (targetTiltX - currentTiltX) * 0.12;
      currentTiltY += (targetTiltY - currentTiltY) * 0.12;

      heroCard.style.setProperty('--tilt-x', currentTiltX.toFixed(2) + 'deg');
      heroCard.style.setProperty('--tilt-y', currentTiltY.toFixed(2) + 'deg');
      heroCard.style.setProperty('--sheen-x', sheenX.toFixed(1) + '%');
      heroCard.style.setProperty('--sheen-y', sheenY.toFixed(1) + '%');

      if (Math.abs(targetTiltX - currentTiltX) > 0.05 || Math.abs(targetTiltY - currentTiltY) > 0.05) {
        requestAnimationFrame(updateTilt);
      }
    };

    var onPointerMove = function (e) {
      var rect = heroCard.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var nx = (x / rect.width) - 0.5;
      var ny = (y / rect.height) - 0.5;

      // Max tilt: +/- 12 degrees
      targetTiltY = nx * 14;
      targetTiltX = -ny * 14;
      sheenX = Math.max(10, Math.min(90, (x / rect.width) * 100));
      sheenY = Math.max(10, Math.min(90, (y / rect.height) * 100));

      if (!isHovered) {
        isHovered = true;
        requestAnimationFrame(updateTilt);
      }
    };

    var onPointerLeave = function () {
      targetTiltX = 0;
      targetTiltY = 0;
      sheenX = 50;
      sheenY = 50;
      isHovered = false;
      requestAnimationFrame(updateTilt);
    };

    heroArt.addEventListener('pointermove', onPointerMove, { passive: true });
    heroArt.addEventListener('pointerleave', onPointerLeave, { passive: true });
  }

  // 3. Interactive Android IFE Device Simulator & Tabs
  var tabButtons = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.panel-content');

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(function (b) {
        var isTarget = (b === btn);
        b.classList.toggle('active', isTarget);
        b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });

      panels.forEach(function (p) {
        var panelTab = p.id.replace('panel-', '');
        p.classList.toggle('active', panelTab === targetTab);
      });
    });
  });

  // Play/Pause button in IFE view
  var playBtn = document.getElementById('play-btn');
  var eqBars = document.querySelectorAll('.eq-bar');
  if (playBtn) {
    var isPlaying = true;
    playBtn.addEventListener('click', function () {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '▶' : '❚❚';
      eqBars.forEach(function (bar) {
        bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
      });
    });
  }

  // Clean Architecture Layer Inspector (Code Switcher)
  var CODE_SNIPPETS = {
    compose: `// Jetpack Compose Seat-Back UI Layer
@Composable
fun SeatBackScreen(
    viewModel: FlightViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    FlightTelemetryHUD(
        altitude = state.altitude,
        speed = state.groundSpeed,
        route = state.route
    )
}`,
    viewmodel: `// StateFlow & Coroutines Orchestration
@HiltViewModel
class FlightViewModel @Inject constructor(
    private val getFlightTelemetryUseCase: GetFlightTelemetryUseCase
) : ViewModel() {
    val uiState: StateFlow<TelemetryUiState> = getFlightTelemetryUseCase()
        .map { it.toUiState() }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = TelemetryUiState.Loading
        )
}`,
    domain: `// Clean Architecture Domain Layer (Pure Kotlin)
class GetFlightTelemetryUseCase @Inject constructor(
    private val flightRepository: FlightRepository
) {
    operator fun invoke(): Flow<FlightTelemetry> {
        return flightRepository.observeTelemetry()
            .filter { it.isValid() }
            .distinctUntilChanged()
    }
}`,
    data: `// Data Repository & Offline-First Caching
@Singleton
class FlightRepositoryImpl @Inject constructor(
    private val flightApi: FlightApiService,
    private val telemetryDao: TelemetryDao
) : FlightRepository {
    override fun observeTelemetry(): Flow<FlightTelemetry> = flow {
        emitAll(telemetryDao.getLatestTelemetry().map { it.toDomain() })
    }
}`,
    hal: `// Android HAL & Media3 ExoPlayer Hardware Pipeline
val exoPlayer = ExoPlayer.Builder(context)
    .setRenderersFactory(
        DefaultRenderersFactory(context)
            .setExtensionRendererMode(EXTENSION_RENDERER_MODE_PREFER)
    )
    .setMediaSourceFactory(DefaultMediaSourceFactory(dataSourceFactory))
    .build()`
  };

  var archLayerButtons = document.querySelectorAll('.arch-layer-btn');
  var codeDisplay = document.getElementById('arch-code-display');

  archLayerButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var layerKey = btn.getAttribute('data-layer');
      archLayerButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (codeDisplay && CODE_SNIPPETS[layerKey]) {
        codeDisplay.textContent = CODE_SNIPPETS[layerKey];
      }
    });
  });

  // 4. Scroll Reveal Observers
  var targets = document.querySelectorAll(
    '.section .eyebrow, .section h2, .job, .card, .edu, .band .eyebrow, .skills > div, .contact > *, .discovery-panel > *, .simulator-section > *'
  );

  targets.forEach(function (el) {
    el.classList.add('reveal');
    var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(sib, 5) * 55 + 'ms';
  });

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) {
      el.classList.add('in');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in');
          io.unobserve(el);
          el.addEventListener('transitionend', function clr(ev) {
            if (ev.target !== el || ev.propertyName !== 'opacity') return;
            el.style.transitionDelay = '';
            el.removeEventListener('transitionend', clr);
          });
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  // 5. Header Shadow + Active Nav Highlight
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var links = {};
  document.querySelectorAll('.nav nav a[href^="#"]').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = links[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          Object.keys(links).forEach(function (k) {
            links[k].classList.remove('active');
          });
          a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -45% 0px' });

    document.querySelectorAll('main section[id]').forEach(function (s) {
      so.observe(s);
    });
  }

  // 6. Pointer-following spotlight on cards
  var cards = document.querySelectorAll('.card');
  cards.forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });

  // 7. Statistics Count-up Spring Physics
  // DOM text remains exact final value (4, 10, 3) for screen readers and test assertions.
  if (!reduce) {
    document.querySelectorAll('.stats dt').forEach(function (dt) {
      var end = parseInt(dt.textContent, 10);
      if (!end) return;
      var t0 = null;
      dt.setAttribute('data-count', '0');
      dt.classList.add('counting');

      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 950, 1);
        var val = Math.round(end * (1 - Math.pow(1 - p, 3)));
        dt.setAttribute('data-count', String(val));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          dt.classList.remove('counting');
          dt.removeAttribute('data-count');
        }
      }

      setTimeout(function () {
        requestAnimationFrame(step);
      }, 350);
    });
  }
})();
