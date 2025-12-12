/**
 * ==========================================
 * BOP DROP GAME - IMPROVED VERSION
 * A physics-based merging puzzle game
 * ==========================================
 */

// ==========================================
// Constants & Configuration
// ==========================================

const GAME_CONFIG = {
  // Canvas dimensions
  WIDTH: 768,
  HEIGHT: 960,

  // UI dimensions (should match CSS)
  SIDEBAR_WIDTH: 320,

  // Physics settings
  WALL_THICKNESS: 64,
  LOSE_LINE_HEIGHT: 84,
  BALL_DROP_HEIGHT: 60,

  // Physics properties
  FRICTION: 0.002,
  FRICTION_STATIC: 0.002,
  FRICTION_AIR: 0,
  RESTITUTION: 0.2,
  TIME_SCALE: 2.5,

  // Collision detection
  POSITION_ITERATIONS: 10,
  VELOCITY_ITERATIONS: 8,
  CONSTRAINT_ITERATIONS: 2,

  // Settling detection
  SETTLING_VELOCITY_THRESHOLD: 0.8,
  SETTLING_CHECK_INTERVAL: 100,

  // Ball spawning (only smallest N types can be randomly dropped)
  DROPPABLE_BALL_TYPES: 5,

  // Border rendering
  BORDER_WIDTH: 6,
};

const GAME_STATES = {
  MENU: 'menu',
  READY: 'ready',
  DROPPING: 'dropping',
  GAME_OVER: 'game_over',
};

const BALL_TYPES = [
  { radius: 25,  points: 1,   image: 'ball-0.png',  borderColor: '#FF6B6B' },
  { radius: 35,  points: 3,   image: 'ball-1.png',  borderColor: '#FFA500' },
  { radius: 46,  points: 6,   image: 'ball-2.png',  borderColor: '#FFD700' },
  { radius: 56,  points: 10,  image: 'ball-3.png',  borderColor: '#90EE90' },
  { radius: 67,  points: 15,  image: 'ball-4.png',  borderColor: '#00CED1' },
  { radius: 77,  points: 21,  image: 'ball-5.png',  borderColor: '#4169E1' },
  { radius: 88,  points: 28,  image: 'ball-6.png',  borderColor: '#9370DB' },
  { radius: 89,  points: 36,  image: 'ball-7.png',  borderColor: '#FF69B4' },
  { radius: 108, points: 45,  image: 'ball-8.png',  borderColor: '#FF1493' },
  { radius: 119, points: 55,  image: 'ball-9.png',  borderColor: '#00FF7F' },
  { radius: 129, points: 66,  image: 'ball-10.png', borderColor: '#FFD700' },
  { radius: 140, points: 80,  image: 'ball-11.png', borderColor: '#FF4500' },
  { radius: 150, points: 100, image: 'ball-12.png', borderColor: '#FF0000' },
];

// ==========================================
// Utility Functions
// ==========================================

/**
 * Simple seeded random number generator
 */
function createRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const random = createRandom(Date.now());

/**
 * Generate random ball index (only smallest types can be dropped)
 */
function getRandomBallIndex() {
  return Math.floor(random() * GAME_CONFIG.DROPPABLE_BALL_TYPES);
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate velocity magnitude
 */
function getVelocityMagnitude(velocity) {
  return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
}

// ==========================================
// DOM Manager
// ==========================================

const DOMManager = {
  elements: {},

  init() {
    const elementIds = [
      'canvas-container',
      'current-score',
      'final-score',
      'game-over-modal',
      'game-over-title',
      'next-ball-preview',
      'restart-btn',
      'confetti-container',
      'bop-celebration',
      'bop-count'
    ];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        console.error(`Required DOM element not found: ${id}`);
      }
      this.elements[id] = element;
    });

    return this.elements['canvas-container'] !== null;
  },

  get(id) {
    return this.elements[id];
  }
};

// ==========================================
// Confetti System
// ==========================================

const ConfettiSystem = {
  colors: ['gold', 'burgundy', 'green', 'cream'],
  shapes: ['circle', 'square'],

  createConfetti(x, y, count = 80) {
    const container = DOMManager.get('confetti-container');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';

      // Random color and shape
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
      confetti.classList.add(color, shape);

      // Position at explosion center
      confetti.style.left = `${x}px`;
      confetti.style.top = `${y}px`;

      // Random explosion direction and distance
      const angle = Math.random() * Math.PI * 2; // Random angle in radians
      const velocity = 150 + Math.random() * 250; // Random velocity
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity + (Math.random() * 200); // Add gravity effect

      // Random rotation
      const rotate = Math.random() * 1080 - 540; // -540 to 540 degrees

      // Set CSS custom properties for animation
      confetti.style.setProperty('--tx', `${tx}px`);
      confetti.style.setProperty('--ty', `${ty}px`);
      confetti.style.setProperty('--rotate', `${rotate}deg`);

      // Random animation duration and delay
      const duration = 2 + Math.random() * 1;
      const delay = Math.random() * 0.2;
      confetti.style.animationDuration = `${duration}s`;
      confetti.style.animationDelay = `${delay}s`;

      container.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, (duration + delay) * 1000);
    }
  },

  clearAll() {
    const container = DOMManager.get('confetti-container');
    if (container) {
      container.innerHTML = '';
    }
  }
};

// ==========================================
// Audio System
// ==========================================

const AudioSystem = {
  sounds: {},
  enabled: true,

  init() {
    try {
      // Load click sound
      this.sounds.click = new Audio('./assets/audio/click.mp3');

      // Load pop sounds for each ball type
      BALL_TYPES.forEach((_, index) => {
        this.sounds[`pop${index}`] = new Audio(`./assets/audio/pop${index}.mp3`);
      });
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.enabled = false;
    }
  },

  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;

    try {
      const sound = this.sounds[soundName].cloneNode();
      sound.play().catch(err => console.warn('Audio play failed:', err));
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error);
    }
  },
};

// ==========================================
// Game State Manager
// ==========================================

const GameState = {
  currentState: GAME_STATES.MENU,
  score: 0,
  mergeCount: [],
  currentBallIndex: 0,
  nextBallIndex: 0,
  previewBall: null,
  bopCount: 0,

  init() {
    this.mergeCount = new Array(BALL_TYPES.length).fill(0);
    this.currentBallIndex = getRandomBallIndex();
    this.nextBallIndex = getRandomBallIndex();
    this.score = 0;
    this.bopCount = 0;
    this.updateNextBallPreview();
    this.updateScoreDisplay();
    this.updateBopCountDisplay();
  },

  setState(newState) {
    // Validate state transition
    if (!Object.values(GAME_STATES).includes(newState)) {
      console.error(`Invalid state: ${newState}`);
      return;
    }
    this.currentState = newState;
  },

  isState(state) {
    return this.currentState === state;
  },

  calculateScore() {
    this.score = this.mergeCount.reduce((total, count, index) => {
      return total + (BALL_TYPES[index].points * count);
    }, 0);
    this.updateScoreDisplay();
  },

  updateScoreDisplay() {
    const currentScoreEl = DOMManager.get('current-score');
    const finalScoreEl = DOMManager.get('final-score');

    if (currentScoreEl) currentScoreEl.textContent = this.score;
    if (finalScoreEl) finalScoreEl.textContent = this.score;
  },

  updateNextBallPreview() {
    const previewEl = DOMManager.get('next-ball-preview');
    if (!previewEl) return;

    const ballType = BALL_TYPES[this.nextBallIndex];
    if (ballType) {
      previewEl.src = `./assets/img/${ballType.image}`;
    }
  },

  recordMerge(ballIndex) {
    if (ballIndex >= 0 && ballIndex < this.mergeCount.length) {
      this.mergeCount[ballIndex]++;
      this.calculateScore();
    }
  },

  updateBopCountDisplay() {
    const bopCountEl = DOMManager.get('bop-count');
    if (bopCountEl) {
      bopCountEl.textContent = this.bopCount;
    }
  },

  incrementBopCount() {
    this.bopCount++;
    this.updateBopCountDisplay();

    // Add celebration animation to bop counter
    const bopCounterEl = document.querySelector('.bop-counter-display');
    if (bopCounterEl) {
      bopCounterEl.classList.add('celebrate');
      setTimeout(() => {
        bopCounterEl.classList.remove('celebrate');
      }, 600);
    }
  },
};

// ==========================================
// Physics Engine Setup
// ==========================================

const { Engine, Render, Runner, Composite, Bodies, Body, Events, Mouse, MouseConstraint } = Matter;

const PhysicsEngine = {
  engine: null,
  render: null,
  runner: null,
  mouse: null,
  mouseConstraint: null,

  init() {
    // Create physics engine
    this.engine = Engine.create({
      timing: { timeScale: GAME_CONFIG.TIME_SCALE },
      positionIterations: GAME_CONFIG.POSITION_ITERATIONS,
      velocityIterations: GAME_CONFIG.VELOCITY_ITERATIONS,
      constraintIterations: GAME_CONFIG.CONSTRAINT_ITERATIONS
    });

    // Create renderer
    const canvasContainer = DOMManager.get('canvas-container');
    if (!canvasContainer) {
      console.error('Canvas container not found');
      return false;
    }

    this.render = Render.create({
      element: canvasContainer,
      engine: this.engine,
      options: {
        width: GAME_CONFIG.WIDTH,
        height: GAME_CONFIG.HEIGHT,
        wireframes: false,
        background: '#1a2332'
      }
    });

    // Create runner
    this.runner = Runner.create();

    return true;
  },

  start() {
    if (this.render && this.runner && this.engine) {
      Render.run(this.render);
      Runner.run(this.runner, this.engine);
    }
  },

  stop() {
    if (this.runner) {
      this.runner.enabled = false;
    }
  },

  restart() {
    if (this.runner) {
      this.runner.enabled = true;
    }
  },

  clearWorld() {
    if (this.engine) {
      Composite.clear(this.engine.world, false);
    }
  },

  addToWorld(body) {
    if (this.engine) {
      Composite.add(this.engine.world, body);
    }
  },

  removeFromWorld(body) {
    if (this.engine) {
      Composite.remove(this.engine.world, body);
    }
  },

  getAllBodies() {
    return this.engine ? Composite.allBodies(this.engine.world) : [];
  }
};

// ==========================================
// Physics Bodies Factory
// ==========================================

const PhysicsBodies = {
  createBall(x, y, ballIndex, isStatic = false) {
    if (ballIndex < 0 || ballIndex >= BALL_TYPES.length) {
      console.error(`Invalid ball index: ${ballIndex}`);
      return null;
    }

    const ballType = BALL_TYPES[ballIndex];

    const ball = Bodies.circle(x, y, ballType.radius, {
      isStatic: isStatic,
      friction: GAME_CONFIG.FRICTION,
      frictionStatic: GAME_CONFIG.FRICTION_STATIC,
      frictionAir: GAME_CONFIG.FRICTION_AIR,
      restitution: GAME_CONFIG.RESTITUTION,
      slop: 0.05,
      render: {
        sprite: {
          texture: `./assets/img/${ballType.image}`,
          xScale: ballType.radius / 512,
          yScale: ballType.radius / 512
        }
      }
    });

    ball.ballIndex = ballIndex;
    return ball;
  },

  createWalls() {
    const wallProps = {
      isStatic: true,
      friction: GAME_CONFIG.FRICTION,
      frictionStatic: GAME_CONFIG.FRICTION_STATIC,
      frictionAir: GAME_CONFIG.FRICTION_AIR,
      restitution: GAME_CONFIG.RESTITUTION,
      slop: 0.05,
      render: { fillStyle: '#2d5f3f' }
    };

    const { WIDTH, HEIGHT, WALL_THICKNESS } = GAME_CONFIG;

    return [
      // Left wall
      Bodies.rectangle(
        -(WALL_THICKNESS / 2),
        HEIGHT / 2,
        WALL_THICKNESS,
        HEIGHT,
        wallProps
      ),
      // Right wall
      Bodies.rectangle(
        WIDTH + (WALL_THICKNESS / 2),
        HEIGHT / 2,
        WALL_THICKNESS,
        HEIGHT,
        wallProps
      ),
      // Bottom wall
      Bodies.rectangle(
        WIDTH / 2,
        HEIGHT + (WALL_THICKNESS / 2),
        WIDTH,
        WALL_THICKNESS,
        wallProps
      )
    ];
  }
};

// ==========================================
// Event Handlers (with cleanup support)
// ==========================================

const EventHandlers = {
  handlers: {
    mousemove: null,
    mouseup: null,
    collisionStart: null,
    afterUpdate: null,
    afterRender: null,
  },

  cleanup() {
    // Remove all event listeners
    if (PhysicsEngine.mouseConstraint) {
      if (this.handlers.mousemove) {
        Events.off(PhysicsEngine.mouseConstraint, 'mousemove', this.handlers.mousemove);
      }
      if (this.handlers.mouseup) {
        Events.off(PhysicsEngine.mouseConstraint, 'mouseup', this.handlers.mouseup);
      }
    }

    if (PhysicsEngine.engine) {
      if (this.handlers.collisionStart) {
        Events.off(PhysicsEngine.engine, 'collisionStart', this.handlers.collisionStart);
      }
      if (this.handlers.afterUpdate) {
        Events.off(PhysicsEngine.engine, 'afterUpdate', this.handlers.afterUpdate);
      }
    }

    if (PhysicsEngine.render) {
      if (this.handlers.afterRender) {
        Events.off(PhysicsEngine.render, 'afterRender', this.handlers.afterRender);
      }
    }

    // Clear handler references
    Object.keys(this.handlers).forEach(key => {
      this.handlers[key] = null;
    });
  },

  setupMouseControl() {
    if (!PhysicsEngine.render || !PhysicsEngine.engine) return;

    const mouse = Mouse.create(PhysicsEngine.render.canvas);
    const mouseConstraint = MouseConstraint.create(PhysicsEngine.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    PhysicsEngine.addToWorld(mouseConstraint);
    PhysicsEngine.mouse = mouse;
    PhysicsEngine.mouseConstraint = mouseConstraint;
    PhysicsEngine.render.mouse = mouse;

    // Store handlers for cleanup
    this.handlers.mousemove = (e) => {
      if (!GameState.isState(GAME_STATES.READY)) return;
      if (!GameState.previewBall) return;

      // Clamp position to stay within walls
      const clampedX = clamp(
        e.mouse.position.x,
        GAME_CONFIG.WALL_THICKNESS,
        GAME_CONFIG.WIDTH - GAME_CONFIG.WALL_THICKNESS
      );
      GameState.previewBall.position.x = clampedX;
    };

    this.handlers.mouseup = (e) => {
      const clampedX = clamp(
        e.mouse.position.x,
        GAME_CONFIG.WALL_THICKNESS,
        GAME_CONFIG.WIDTH - GAME_CONFIG.WALL_THICKNESS
      );
      GameLogic.dropBall(clampedX);
    };

    Events.on(mouseConstraint, 'mousemove', this.handlers.mousemove);
    Events.on(mouseConstraint, 'mouseup', this.handlers.mouseup);
  },

  setupCollisionHandling() {
    if (!PhysicsEngine.engine) return;

    this.handlers.collisionStart = (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        if (bodyA.isStatic || bodyB.isStatic) return;

        // Check lose condition
        const aBottom = bodyA.position.y + bodyA.circleRadius;
        const bBottom = bodyB.position.y + bodyB.circleRadius;

        if (aBottom < GAME_CONFIG.LOSE_LINE_HEIGHT || bBottom < GAME_CONFIG.LOSE_LINE_HEIGHT) {
          GameLogic.gameOver();
          return;
        }

        // Check if balls can merge
        if (bodyA.ballIndex !== bodyB.ballIndex) return;
        if (bodyA.ballIndex === undefined || bodyB.ballIndex === undefined) return;

        GameLogic.mergeBalls(bodyA, bodyB);
      });
    };

    Events.on(PhysicsEngine.engine, 'collisionStart', this.handlers.collisionStart);
  },

  setupBoundsChecking() {
    if (!PhysicsEngine.engine) return;

    this.handlers.afterUpdate = () => {
      const bodies = PhysicsEngine.getAllBodies();
      const maxY = GAME_CONFIG.HEIGHT;

      bodies.forEach(body => {
        if (body.isStatic) return;

        const ballBottom = body.position.y + body.circleRadius;

        if (ballBottom > maxY) {
          const newY = maxY - body.circleRadius;
          Body.setPosition(body, { x: body.position.x, y: newY });
          Body.setVelocity(body, {
            x: body.velocity.x * 0.9,
            y: -Math.abs(body.velocity.y) * 0.5
          });
        }
      });
    };

    Events.on(PhysicsEngine.engine, 'afterUpdate', this.handlers.afterUpdate);
  },

  setupBorderRendering() {
    if (!PhysicsEngine.render) return;

    this.handlers.afterRender = () => {
      const ctx = PhysicsEngine.render.context;
      const bodies = PhysicsEngine.getAllBodies();

      bodies.forEach(body => {
        if (body.ballIndex === undefined) return;

        const ballType = BALL_TYPES[body.ballIndex];
        if (!ballType) return;

        const borderColor = ballType.borderColor || '#FFFFFF';

        // Use custom scale if set (for bop celebration animation)
        const scale = body.customScale || 1;
        const radius = body.circleRadius * scale;

        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = GAME_CONFIG.BORDER_WIDTH * scale;
        ctx.stroke();
      });
    };

    Events.on(PhysicsEngine.render, 'afterRender', this.handlers.afterRender);
  }
};

// ==========================================
// Game Logic
// ==========================================

const GameLogic = {
  settlingTimer: null,

  init() {
    // Initialize DOM
    if (!DOMManager.init()) {
      console.error('Failed to initialize DOM');
      return false;
    }

    // Initialize audio
    AudioSystem.init();

    // Initialize physics
    if (!PhysicsEngine.init()) {
      console.error('Failed to initialize physics engine');
      return false;
    }

    // Start physics
    PhysicsEngine.start();

    // Add walls
    const walls = PhysicsBodies.createWalls();
    walls.forEach(wall => PhysicsEngine.addToWorld(wall));

    // Set up event handlers
    EventHandlers.setupMouseControl();
    EventHandlers.setupCollisionHandling();
    EventHandlers.setupBoundsChecking();
    EventHandlers.setupBorderRendering();

    // Start the game
    this.startGame();

    return true;
  },

  startGame() {
    AudioSystem.play('click');

    // Clear any pending settling timers
    this.clearSettlingTimer();

    // Reset game state
    GameState.init();
    GameState.setState(GAME_STATES.READY);

    // Hide game over modal
    const modal = DOMManager.get('game-over-modal');
    if (modal) modal.classList.add('hidden');

    // Create preview ball
    const previewBall = PhysicsBodies.createBall(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.BALL_DROP_HEIGHT,
      GameState.currentBallIndex,
      true
    );

    if (previewBall) {
      GameState.previewBall = previewBall;
      PhysicsEngine.addToWorld(previewBall);
    }
  },

  areBallsSettled() {
    const bodies = PhysicsEngine.getAllBodies();

    for (let body of bodies) {
      if (body.isStatic) continue;

      const velocityMagnitude = getVelocityMagnitude(body.velocity);

      if (velocityMagnitude > GAME_CONFIG.SETTLING_VELOCITY_THRESHOLD) {
        return false;
      }
    }

    return true;
  },

  clearSettlingTimer() {
    if (this.settlingTimer) {
      clearTimeout(this.settlingTimer);
      this.settlingTimer = null;
    }
  },

  waitForSettling() {
    this.clearSettlingTimer();

    const checkSettling = () => {
      if (!GameState.isState(GAME_STATES.DROPPING)) {
        this.clearSettlingTimer();
        return;
      }

      if (this.areBallsSettled()) {
        // Create preview ball
        const mouseX = PhysicsEngine.render?.mouse?.position?.x || GAME_CONFIG.WIDTH / 2;
        const clampedX = clamp(
          mouseX,
          GAME_CONFIG.WALL_THICKNESS,
          GAME_CONFIG.WIDTH - GAME_CONFIG.WALL_THICKNESS
        );

        const previewBall = PhysicsBodies.createBall(
          clampedX,
          GAME_CONFIG.BALL_DROP_HEIGHT,
          GameState.currentBallIndex,
          true
        );

        if (previewBall) {
          GameState.previewBall = previewBall;
          PhysicsEngine.addToWorld(previewBall);
          GameState.setState(GAME_STATES.READY);
        }

        this.clearSettlingTimer();
      } else {
        this.settlingTimer = setTimeout(checkSettling, GAME_CONFIG.SETTLING_CHECK_INTERVAL);
      }
    };

    this.settlingTimer = setTimeout(checkSettling, GAME_CONFIG.SETTLING_CHECK_INTERVAL);
  },

  dropBall(x) {
    if (!GameState.isState(GAME_STATES.READY)) return;

    AudioSystem.play('click');
    GameState.setState(GAME_STATES.DROPPING);

    // Create ball
    const ball = PhysicsBodies.createBall(
      x,
      GAME_CONFIG.BALL_DROP_HEIGHT,
      GameState.currentBallIndex,
      false
    );

    if (!ball) return;

    // Ensure clean drop
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
    Body.setAngle(ball, 0);

    PhysicsEngine.addToWorld(ball);

    // Update ball queue
    GameState.currentBallIndex = GameState.nextBallIndex;
    GameState.nextBallIndex = getRandomBallIndex();
    GameState.updateNextBallPreview();

    // Remove preview
    if (GameState.previewBall) {
      PhysicsEngine.removeFromWorld(GameState.previewBall);
      GameState.previewBall = null;
    }

    // Wait for settling
    this.waitForSettling();
  },

  mergeBalls(ballA, ballB) {
    const ballIndex = ballA.ballIndex;

    // Prevent largest ball (ball-12) from merging
    if (ballIndex >= BALL_TYPES.length - 1) {
      return;
    }

    const newBallIndex = ballIndex + 1;
    const isCreatingBop = (newBallIndex === BALL_TYPES.length - 1);

    // Record merge
    GameState.recordMerge(ballIndex);

    // Play sound
    AudioSystem.play(`pop${ballIndex}`);

    // Calculate merge position
    const mergeX = (ballA.position.x + ballB.position.x) / 2;
    const mergeY = (ballA.position.y + ballB.position.y) / 2;

    // Remove old balls
    PhysicsEngine.removeFromWorld([ballA, ballB]);

    // Create new ball
    const newBall = PhysicsBodies.createBall(mergeX, mergeY, newBallIndex, false);
    if (newBall) {
      PhysicsEngine.addToWorld(newBall);

      // If this creates a bop (largest ball), trigger celebration
      if (isCreatingBop) {
        this.celebrateBop(newBall, mergeX, mergeY);
      }
    }
  },

  celebrateBop(bopBall, x, y) {
    // Increment bop counter
    GameState.incrementBopCount();

    // Convert canvas coordinates to screen coordinates
    const canvas = PhysicsEngine.render?.canvas;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / GAME_CONFIG.WIDTH;
      const scaleY = rect.height / GAME_CONFIG.HEIGHT;
      const screenX = rect.left + (x * scaleX);
      const screenY = rect.top + (y * scaleY);

      // Create confetti explosion at screen coordinates
      ConfettiSystem.createConfetti(screenX, screenY, 100);
    }

    // Show celebration message
    const celebrationEl = DOMManager.get('bop-celebration');
    if (celebrationEl) {
      celebrationEl.classList.remove('hidden');

      // Hide celebration after 2 seconds
      setTimeout(() => {
        celebrationEl.classList.add('hidden');
      }, 2000);
    }

    // Animate bop ball: grow and move to center, then disappear
    const originalRadius = bopBall.circleRadius;
    const startX = bopBall.position.x;
    const startY = bopBall.position.y;
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;
    const growDuration = 1500; // 1.5 seconds
    const growSteps = 30;
    const growInterval = growDuration / growSteps;
    let step = 0;

    // Make the ball static so it doesn't fall during animation
    Body.setStatic(bopBall, true);

    const growTimer = setInterval(() => {
      step++;
      const progress = step / growSteps;

      // Ease-out cubic for natural growth and movement
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const scale = 1 + easeProgress * 0.5; // Grow by 50%

      // Move ball to center
      const newX = startX + (centerX - startX) * easeProgress;
      const newY = startY + (centerY - startY) * easeProgress;
      Body.setPosition(bopBall, { x: newX, y: newY });

      // Store custom scale for border rendering
      bopBall.customScale = scale;

      // Scale the sprite
      if (bopBall.render && bopBall.render.sprite) {
        const spriteScale = (originalRadius * scale) / 512;
        bopBall.render.sprite.xScale = spriteScale;
        bopBall.render.sprite.yScale = spriteScale;
      }

      // After growth completes, remove the ball
      if (step >= growSteps) {
        clearInterval(growTimer);

        // Fade out and remove
        setTimeout(() => {
          PhysicsEngine.removeFromWorld(bopBall);
        }, 200);
      }
    }, growInterval);
  },

  gameOver() {
    if (GameState.isState(GAME_STATES.GAME_OVER)) return;

    GameState.setState(GAME_STATES.GAME_OVER);
    PhysicsEngine.stop();

    // Clear timers
    this.clearSettlingTimer();

    // Show game over modal
    const modal = DOMManager.get('game-over-modal');
    if (modal) modal.classList.remove('hidden');

    console.log('Game Over! Final Score:', GameState.score);
  },

  restart() {
    // Clear timers
    this.clearSettlingTimer();

    // Clear confetti
    ConfettiSystem.clearAll();

    // Hide celebration overlay if visible
    const celebrationEl = DOMManager.get('bop-celebration');
    if (celebrationEl) {
      celebrationEl.classList.add('hidden');
    }

    // Clear physics world
    PhysicsEngine.clearWorld();

    // Re-add walls
    const walls = PhysicsBodies.createWalls();
    walls.forEach(wall => PhysicsEngine.addToWorld(wall));

    // Restart physics
    PhysicsEngine.restart();

    // Start new game
    this.startGame();
  }
};

// ==========================================
// Responsive Canvas Sizing
// ==========================================

function resizeCanvas() {
  const screenWidth = document.body.clientWidth;
  const screenHeight = document.body.clientHeight;

  const availableWidth = screenWidth - GAME_CONFIG.SIDEBAR_WIDTH - 80;
  const availableHeight = screenHeight - 40;

  const widthScale = availableWidth / GAME_CONFIG.WIDTH;
  const heightScale = availableHeight / GAME_CONFIG.HEIGHT;
  const scale = Math.min(widthScale, heightScale, 1);

  const newWidth = GAME_CONFIG.WIDTH * scale;
  const newHeight = GAME_CONFIG.HEIGHT * scale;

  if (PhysicsEngine.render?.canvas) {
    PhysicsEngine.render.canvas.style.width = `${newWidth}px`;
    PhysicsEngine.render.canvas.style.height = `${newHeight}px`;
  }
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
  const restartBtn = DOMManager.get('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => GameLogic.restart());
  }

  window.addEventListener('load', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);
}

// ==========================================
// Initialize Game
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  if (GameLogic.init()) {
    setupEventListeners();
    console.log('Bop Drop initialized successfully!');
  } else {
    console.error('Failed to initialize Bop Drop');
  }
});
