# TextManager

A modular text label manager for HiGlass tracks with collision detection and overlap avoidance.

## Overview

`TextManager` handles the display of text labels with intelligent overlap detection using the `box-intersect` algorithm. It maintains a pool of reusable PIXI.Text objects and selectively shows/hides labels based on importance values to prevent visual clutter.

## Features

- **Collision Detection**: Uses `box-intersect` for efficient overlap detection
- **Importance-based Filtering**: Higher-importance labels remain visible when conflicts occur
- **Object Pooling**: Reuses PIXI.Text objects for better performance
- **Configurable**: Font size, color, stroke, and maximum label count
- **Cached Dimensions**: Pre-calculates text dimensions for faster rendering

## Usage

```javascript
import TextManager from './TextManager';

// Initialize in your track constructor
this.textManager = new TextManager(this, PIXI, {
  maxTexts: 200,              // Maximum number of text objects
  fontSize: 10,               // Font size in pixels
  fontFamily: 'Arial',        // Font family
  fill: 0x000000,            // Text color (PIXI color format)
  stroke: 0xffffff,          // Stroke color
  strokeThickness: 2         // Stroke thickness
});

// Update labels with your data
const textData = [
  {
    uid: 'unique-id-1',      // Unique identifier
    text: 'Label 1',         // Text to display
    x: 100,                  // X position
    y: 50,                   // Y position
    importance: 10,          // Higher = higher priority (optional)
    anchor: {x: 0.5, y: 0.5} // Anchor point (optional, default: center)
  },
  // ... more labels
];

this.textManager.updateTexts(textData);

// Clear all labels
this.textManager.clear();

// Update configuration
this.textManager.updateOptions({
  fontSize: 12,
  fill: 0xff0000
});

// Clean up when done
this.textManager.destroy();
```

## API

### Constructor

```javascript
new TextManager(track, PIXI, options)
```

- `track`: Parent track instance (must have `pMain` PIXI container)
- `PIXI`: PIXI library reference
- `options`: Configuration object (see Options below)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTexts` | number | 200 | Maximum number of text objects to create |
| `fontSize` | number | 10 | Font size in pixels |
| `fontFamily` | string | 'Arial' | Font family |
| `fill` | number/string | 0x000000 | Text fill color |
| `stroke` | number/string | 0xffffff | Stroke color |
| `strokeThickness` | number | 0 | Stroke thickness |

### Methods

#### `updateTexts(textData)`

Update the displayed labels. Each text data object should have:
- `uid`: Unique identifier (string)
- `text`: Text to display (string)
- `x`: X position (number)
- `y`: Y position (number)
- `importance`: Priority value (number, optional - higher = more important)
- `anchor`: Anchor point (object, optional - default: {x: 0.5, y: 0.5})

#### `updateOptions(options)`

Update configuration options dynamically.

#### `clear()`

Hide all text labels.

#### `destroy()`

Clean up all resources and destroy PIXI objects.

#### `getTextDimensions(uid)`

Get cached dimensions for a text by uid. Returns `{width, height}`.

## Integration with PileupTrack

The TextManager is integrated into PileupTrack with the following options:

- `showReadLabels`: Enable/disable read labels (boolean)
- `maxReadLabels`: Maximum number of visible labels (number)
- `readLabelFontSize`: Font size (number)
- `readLabelFontFamily`: Font family (string)
- `readLabelColor`: Text color (PIXI color format)
- `readLabelStrokeColor`: Stroke color (PIXI color format)
- `readLabelStrokeThickness`: Stroke thickness (number)
- `readLabelField`: Which field to display ('readName' or 'id')

## Future Improvements

- Could be extracted into a standalone npm package for use across HiGlass tracks
- Could be consolidated with BedLikeTrack's TextManager implementation
- Additional label positioning strategies (e.g., leader lines, smart placement)
- Support for multi-line labels
- Label rotation for dense layouts

## Implementation Notes

- Labels are prioritized by importance value (defaults to hash of uid if not provided)
- The `box-intersect` algorithm efficiently detects overlapping bounding boxes
- Text objects are pooled and reused to avoid excessive object creation
- Dimensions are cached to avoid expensive getBounds() calls
- The manager creates a single PIXI.Graphics container for all text objects
