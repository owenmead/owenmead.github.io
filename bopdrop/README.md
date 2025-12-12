# Family Ball Drop Game

A physics-based merging puzzle game inspired by Suika Game (Watermelon Game). Drop balls, merge matching ones, and try to reach the highest score!

## Quick Start

### Running the Game

1. Open `index.html` in a web browser, OR
2. Start a local web server:
   ```bash
   # Python 3
   python3 -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000

   # Node.js (if you have npx)
   npx http-server
   ```
3. Navigate to `http://localhost:8000` in your browser

## How to Play

1. Click anywhere in the play area to drop a ball
2. When two balls of the same size touch, they merge into a larger ball
3. Keep merging to create bigger balls and score more points
4. Don't let the balls stack above the red danger line!
5. Game ends when a ball crosses the line at the top

## Customizing with Family Photos

### Automated Image Processing (Recommended!)

We've included an automated script that converts your family photos into perfectly circular game assets:

**Step 1: Install dependencies**
```bash
npm install
```

**Step 2: Add your photos**
- Place 12 family photos in the `family-photos/` folder
- Supported formats: PNG, JPG, JPEG
- Name them in order (they'll be processed alphabetically):
  - `person-0.png` - Smallest/youngest
  - `person-1.png` - Next size
  - ...
  - `person-11.png` - Largest/oldest

**Step 3: Run the processor**
```bash
npm run process-images
```

The script automatically:
- Crops photos to centered squares
- Resizes to 1024x1024 pixels
- Makes them circular with transparent backgrounds
- Saves to `assets/img/ball-0.png` through `ball-11.png`

**Step 4: Play!**
```bash
npm run serve
# Open http://localhost:8000
```

### Manual Method (Alternative)

If you prefer to manually edit images:
1. Create 12 circular PNG images (1024x1024px)
2. Name them `ball-0.png` through `ball-11.png`
3. Place in `assets/img/`

### Tips for Best Results

- **Center faces**: Make sure faces are roughly centered in source photos
- **Good quality**: Use high-resolution photos (the script will resize)
- **Consistent style**: Similar lighting/backgrounds look better together
- **Any size works**: The script handles resizing automatically

## Project Structure

```
balldrop/
├── index.html           # Main HTML file
├── game.js             # Game logic and physics
├── global.css          # Styles and theming
├── process-images.js   # Image processor script
├── package.json        # Node.js dependencies and scripts
├── family-photos/      # Put your source photos here!
│   └── README.md
├── lib/
│   └── matter.js       # Matter.js physics engine
├── assets/
│   ├── img/            # Ball images (auto-generated or manual)
│   │   └── ball-0.png through ball-11.png
│   └── audio/          # Sound effects
│       ├── click.mp3
│       └── pop0.mp3 through pop10.mp3
└── README.md           # This file
```

## Customizing Game Settings

Edit `game.js` to customize:

### Ball Sizes and Points

Find the `BALL_TYPES` array (around line 50):
```javascript
const BALL_TYPES = [
  { radius: 24,  points: 1,  image: 'ball-0.png'  },
  { radius: 32,  points: 3,  image: 'ball-1.png'  },
  // ... modify radius and points as desired
];
```

### Game Difficulty

Find `GAME_CONFIG` (around line 15):
```javascript
const GAME_CONFIG = {
  TIME_SCALE: 3,        // Higher = faster physics (default: 3)
  LOSE_LINE_HEIGHT: 84, // Lower = harder (default: 84)
  DROP_DELAY: 0,        // Delay between drops in ms (default: 0)
  // ... other settings
};
```

### Colors and Theme

Edit `global.css` CSS variables:
```css
:root {
  --color-bg: #FFD59D;           /* Background color */
  --color-primary: #FF5300;      /* Primary accent color */
  /* ... other colors */
}
```

## Technology Stack

- **Physics Engine**: [Matter.js](https://brm.io/matter-js/)
- **Rendering**: HTML5 Canvas
- **Styling**: CSS3 with CSS Variables
- **JavaScript**: ES6+ (Vanilla JS, no frameworks)

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- CSS Variables

## Credits

- Original game concept: Suika Game (Aladdin X)
- Physics engine: Matter.js by Liam Brummitt
- Refactored and cleaned up code structure

## License

ISC - Feel free to use and modify for personal projects!

---

Enjoy your personalized family ball drop game!
