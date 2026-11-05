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

  // 3. Interactive Android Architecture Studio & MVI Dataflow Reactor
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

  // MVI Dataflow Reactor State Machine
  var ACTION_FLOWS = {
    ife: [
      {
        node: 'node-1',
        status: 'DISPATCHING',
        badge: 'MVI Intent Emitted',
        code: `// 01. Jetpack Compose UI Layer
val intent = UiIntent.StartPlayback(
    aircraftId = 702,
    mediaId = "4K_HEVC_STREAM",
    quality = Resolution.P2160
)
viewModel.handleIntent(intent)`
      },
      {
        node: 'node-2',
        status: 'REDUCING',
        badge: 'ViewModel Processing',
        code: `// 02. StateFlow & Reducer Dispatch
private fun reduce(intent: UiIntent.StartPlayback) = viewModelScope.launch {
    _uiState.update { it.copy(playbackState = PlaybackState.Buffering) }
    val uri = getStreamUriUseCase(intent.mediaId)
    // Pipeline proceeds to Domain Layer...
}`
      },
      {
        node: 'node-3',
        status: 'VALIDATING',
        badge: 'Clean Domain Logic',
        code: `// 03. Pure Kotlin UseCase Execution
class GetStreamUriUseCase @Inject constructor(
    private val flightRepo: FlightRepository
) {
    suspend operator fun invoke(mediaId: String): Result<MediaSource> {
        return flightRepo.resolveMediaSource(mediaId) // No Android SDK dependency
    }
}`
      },
      {
        node: 'node-4',
        status: 'READING CACHE',
        badge: 'Offline SQLite Query',
        code: `// 04. Data Layer & Room Caching
@Query("SELECT local_uri FROM seat_back_cache WHERE media_id = :id")
suspend fun getCachedUri(id: String): String? = roomDatabase.withTransaction {
    // 0ms network latency; local seat-back flash storage hit
    telemetryDao.queryMedia(id)
}`
      },
      {
        node: 'node-5',
        status: 'HARDWARE DECODE',
        badge: 'Hardware Surface 60fps',
        code: `// 05. Android HAL & Media3 Output
val player = ExoPlayer.Builder(context).build().apply {
    setVideoSurface(surfaceView.holder.surface)
    prepare()
    play()
}
// Final Immutable State Emitted back to Compose UI:
_uiState.update { UiState.Playing(position = 0L, buffering = false) }`
      }
    ],
    auth: [
      {
        node: 'node-1',
        status: 'TOUCH CAPTURE',
        badge: 'Biometric Intent',
        code: `// 01. User Triggers Biometric Login
val intent = UiIntent.AuthenticateBiometric(cipher = CipherMode.AES256_GCM)
viewModel.handleIntent(intent)`
      },
      {
        node: 'node-2',
        status: 'CHALLENGE GEN',
        badge: 'StateFlow Challenging',
        code: `// 02. ViewModel Generates Security Challenge
_uiState.update { it.copy(authStatus = AuthStatus.Challenging) }
val cryptoObject = biometricManager.createCryptoObject()`
      },
      {
        node: 'node-3',
        status: 'RULE CHECK',
        badge: 'Domain Security Rules',
        code: `// 03. Domain Business Validation
class ValidateBiometricTokenUseCase @Inject constructor() {
    operator fun invoke(challenge: ByteArray): Boolean =
        challenge.isNotEmpty() && !isDeviceCompromised()
}`
      },
      {
        node: 'node-4',
        status: 'KEYSTORE READ',
        badge: 'Android Keystore',
        code: `// 04. Secure Hardware Storage
val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
val secretKey = keyStore.getKey("NSE_PRIVATE_KEY", null) as SecretKey`
      },
      {
        node: 'node-5',
        status: 'VERIFIED',
        badge: 'Token Emitted',
        code: `// 05. Hardware Enclave Authentication Result
BiometricPrompt.AuthenticationCallback().onAuthenticationSucceeded {
    _uiState.update { UiState.Authenticated(authToken = "jwt_valid_24h") }
}`
      }
    ],
    sync: [
      {
        node: 'node-1',
        status: 'SYNC REQUEST',
        badge: 'User Refresh',
        code: `// 01. UI Request: Synchronize Offline Fleet Data
viewModel.handleIntent(UiIntent.SyncOfflineDatabase(strategy = Strategy.CacheFirst))`
      },
      {
        node: 'node-2',
        status: 'DISPATCH WORK',
        badge: 'WorkManager Bound',
        code: `// 02. ViewModel Schedules Background Coroutines
viewModelScope.launch(Dispatchers.IO) {
    _uiState.update { it.copy(isSyncing = true) }
    syncRepository.performDeltaSync()
}`
      },
      {
        node: 'node-3',
        status: 'RESOLVE MERGE',
        badge: 'Clean Conflict Policy',
        code: `// 03. Conflict Resolution Business Logic
fun resolveConflicts(serverList: List<Telemetry>, localList: List<Telemetry>) =
    serverList.union(localList).distinctBy { it.id }`
      },
      {
        node: 'node-4',
        status: 'SQLITE UPSERT',
        badge: 'Room DB Transaction',
        code: `// 04. Batch Upsert to Local SQLite
@Transaction
suspend fun upsertAll(records: List<TelemetryEntity>) {
    records.forEach { dao.upsert(it) }
}`
      },
      {
        node: 'node-5',
        status: 'SYNC COMPLETE',
        badge: '1420 Entries Updated',
        code: `// 05. Immutable SyncState Rendered in UI
_uiState.update { UiState.Idle(lastSyncTime = System.currentTimeMillis()) }`
      }
    ]
  };

  var actionButtons = document.querySelectorAll('.action-trigger-btn');
  var codeDisplay = document.getElementById('arch-code-display');
  var terminalStatus = document.getElementById('terminal-status-badge');
  var flowNodes = document.querySelectorAll('.flow-node');
  var isReactorRunning = false;
  var reactorTimer = null;

  function runReactorFlow(actionKey) {
    if (isReactorRunning) clearTimeout(reactorTimer);
    isReactorRunning = true;

    var steps = ACTION_FLOWS[actionKey] || ACTION_FLOWS.ife;
    var stepIndex = 0;

    function executeStep() {
      if (stepIndex >= steps.length) {
        isReactorRunning = false;
        if (terminalStatus) {
          terminalStatus.textContent = 'MVI Event Pipeline · Completed ✓ (UiState Emitted)';
        }
        return;
      }

      var current = steps[stepIndex];

      // Highlight active node
      flowNodes.forEach(function (n) {
        var isActive = (n.id === current.node);
        n.classList.toggle('active-stage', isActive);
        var statusTxt = n.querySelector('.status-txt');
        if (statusTxt) {
          statusTxt.textContent = isActive ? current.status : (parseInt(n.id.replace('node-', ''), 10) < stepIndex + 1 ? 'DONE ✓' : 'STANDBY');
        }
      });

      // Update terminal & code
      if (codeDisplay) codeDisplay.textContent = current.code;
      if (terminalStatus) terminalStatus.textContent = 'Stage 0' + (stepIndex + 1) + ' · ' + current.badge;

      stepIndex++;
      reactorTimer = setTimeout(executeStep, reduce ? 100 : 700);
    }

    executeStep();
  }

  actionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      actionButtons.forEach(function (b) { b.classList.remove('active-action'); });
      btn.classList.add('active-action');
      var actionKey = btn.getAttribute('data-action');
      runReactorFlow(actionKey);
    });
  });

  // Layer Inspector Buttons (UI, VM, Domain, Data, HAL)
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

  // OS & Phone Internals Layer Switcher
  var OS_DETAILS = {
    ui: {
      role: 'Panasonic Avionics · Seat-Back Display',
      title: '05 · Jetpack Compose & UI Toolkit',
      desc: 'Fine-grained recomposition boundaries guarantee seat-back displays run at a stable 60/120fps with zero frame drops during passenger interaction or turbulence telemetry updates.',
      specs: [
        { name: 'Smart Recomposition', desc: 'Immutable data classes prevent unneeded layout calculations across passenger screens.' },
        { name: 'Baseline Profiles', desc: 'Pre-compiled Ahead-Of-Time code delivers 320ms cold starts on aircraft reboot cycles.' }
      ]
    },
    framework: {
      role: 'National Stock Exchange · Performance Testing App',
      title: '04 · Android Framework & ART Runtime',
      desc: 'Utilizes Google Android Runtime (ART) with generational garbage collection and optimized Coroutine dispatchers (Dispatchers.IO) to run thousands of simulated market load tests.',
      specs: [
        { name: 'Zygote Pre-warming', desc: 'Core system classes preloaded into memory before app fork.' },
        { name: 'Coroutines Flow', desc: 'Cooperative multi-tasking without thread starvation during heavy JMeter API polling.' }
      ]
    },
    native: {
      role: 'Panasonic Avionics · Fleet Entertainment',
      title: '03 · Native C++ & Media HAL',
      desc: 'Direct interaction with Android Hardware Abstraction Layer (HAL) through Media3 / ExoPlayer C++ decoders, SurfaceFlinger compositor, and hardware Widevine L1 DRM decryption.',
      specs: [
        { name: 'SurfaceFlinger', desc: 'Zero-copy hardware buffer passing to the seat-back panel.' },
        { name: 'Widevine L1 DRM', desc: 'Hardware-protected media pipeline for premium Hollywood in-flight streaming.' }
      ]
    },
    kernel: {
      role: 'Embedded Android & System Security',
      title: '02 · Linux Kernel & Binder IPC',
      desc: 'The backbone of Android multitasking. High-speed inter-process communication (IPC) through Binder driver channels, low-memory killer (LMK), and CPU power governor tuning.',
      specs: [
        { name: 'Binder IPC Bus', desc: 'Sub-millisecond remote procedure calls between SystemServer and app processes.' },
        { name: 'Ashmem Shared Memory', desc: 'Zero-copy frame sharing between media decoding services and UI.' }
      ]
    },
    soc: {
      role: 'Panasonic Avionics & Embedded Hardware',
      title: '01 · SoC Silicon & Hardware Engines',
      desc: 'Octa-core ARM 64-bit architecture with dedicated Adreno GPU and specialized Hardware Video Processing Units (VPU) optimized for continuous 4K HEVC playback.',
      specs: [
        { name: 'Hardware VPU', desc: 'Consumes less than 4W power while decoding dual 4K video feeds.' },
        { name: 'Bluetooth LE Radio', desc: 'Low-latency wireless passenger headphone pairing.' }
      ]
    }
  };

  var osLayerCards = document.querySelectorAll('.internals-layer-card');
  var internalsTitle = document.getElementById('internals-title');
  var internalsRoleTag = document.getElementById('internals-role-tag');
  var internalsDesc = document.getElementById('internals-desc');
  var internalsSpecs = document.getElementById('internals-specs');

  osLayerCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var layerKey = card.getAttribute('data-os-layer');
      osLayerCards.forEach(function (c) { c.classList.remove('active-layer'); });
      card.classList.add('active-layer');

      var data = OS_DETAILS[layerKey];
      if (!data) return;

      if (internalsTitle) internalsTitle.textContent = data.title;
      if (internalsRoleTag) internalsRoleTag.textContent = data.role;
      if (internalsDesc) internalsDesc.textContent = data.desc;

      if (internalsSpecs) {
        internalsSpecs.innerHTML = data.specs.map(function (s) {
          return '<div class="internals-spec-item"><strong>' + s.name + '</strong><p>' + s.desc + '</p></div>';
        }).join('');
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
