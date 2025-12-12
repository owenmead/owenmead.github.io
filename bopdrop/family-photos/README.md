# Family Photos

Place your family member photos in this folder to process them for the game.

## Instructions

1. **Add your photos** to this folder (12 images total)
   - Supported formats: PNG, JPG, JPEG
   - Any size works - the script will resize them
   - Photos will be processed alphabetically by filename

2. **Name them in order** (smallest/youngest to largest/oldest):
   ```
   person-0.png   (or any name - will become ball-0.png)
   person-1.png   (will become ball-1.png)
   person-2.png   (will become ball-2.png)
   ...
   person-11.png  (will become ball-11.png)
   ```

3. **Run the processor**:
   ```bash
   npm install        # Install dependencies (first time only)
   npm run process-images
   ```

The script will:
- Crop each photo to a centered square
- Resize to 1024x1024 pixels
- Make it circular with transparent background
- Save to `assets/img/ball-X.png`

## Tips

- **Center faces**: Make sure faces are roughly centered in the source photo
- **Square is better**: Square photos work best (but rectangles work too)
- **Good quality**: Use high-resolution photos for best results
- **Consistent style**: Similar photo styles (lighting, background) look better together

## Example Naming

```
family-photos/
├── baby-emma.png      → becomes ball-0.png (smallest)
├── kid-noah.png       → becomes ball-1.png
├── teen-sophia.png    → becomes ball-2.png
├── dad.png            → becomes ball-3.png
├── grandma.png        → becomes ball-11.png (largest)
```
