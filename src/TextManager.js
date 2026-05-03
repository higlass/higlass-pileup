import boxIntersect from 'box-intersect';

/**
 * TextManager handles text label rendering with overlap detection.
 *
 * This manager creates a pool of PIXI.Text objects and selectively shows/hides
 * them based on:
 * 1. Maximum text limit (performance)
 * 2. Overlap detection using box-intersect
 * 3. Importance values to prioritize which labels to show
 *
 * Can be used by any track that needs to display non-overlapping text labels.
 */
export class TextManager {
  /**
   * @param {Object} track - The parent track instance (must have pMain container)
   * @param {Object} PIXI - PIXI library reference
   * @param {Object} options - Configuration options
   * @param {number} options.maxTexts - Maximum number of text objects to create (default: 200)
   * @param {number} options.fontSize - Font size in pixels (default: 10)
   * @param {string} options.fontFamily - Font family (default: 'Arial')
   * @param {number|string} options.fill - Text fill color (default: 0x000000)
   * @param {number} options.strokeThickness - Stroke thickness (default: 0)
   * @param {number|string} options.stroke - Stroke color (default: 0xffffff)
   */
  constructor(track, PIXI, options = {}) {
    this.track = track;
    this.PIXI = PIXI;

    // Configuration
    this.maxTexts = options.maxTexts || 50;
    this.fontSize = options.fontSize || 10;
    this.fontFamily = options.fontFamily || 'Arial';
    this.fill = options.fill !== undefined ? options.fill : 0x000000;
    this.strokeThickness = options.strokeThickness !== undefined ? options.strokeThickness : 0;
    this.stroke = options.stroke !== undefined ? options.stroke : 0xffffff;

    // Text storage
    this.texts = {}; // uid -> PIXI.Text
    this.textsList = []; // Array of PIXI.Text objects for reuse
    this.textWidths = {}; // uid -> width (cached)
    this.textHeights = {}; // uid -> height (cached)

    // Graphics container
    this.textGraphics = new PIXI.Graphics();
    this.track.pMain.addChild(this.textGraphics);

    // Temporary storage for overlap detection
    this.allBoxes = [];
    this.allTexts = [];
  }

  /**
   * Get or create a text style object
   */
  getTextStyle() {
    return {
      fontSize: `${this.fontSize}px`,
      fontFamily: this.fontFamily,
      fill: this.fill,
      strokeThickness: this.strokeThickness,
      stroke: this.stroke,
    };
  }

  /**
   * Update configuration options
   */
  updateOptions(options) {
    if (options.maxTexts !== undefined) this.maxTexts = options.maxTexts;
    if (options.fontSize !== undefined) this.fontSize = options.fontSize;
    if (options.fontFamily !== undefined) this.fontFamily = options.fontFamily;
    if (options.fill !== undefined) this.fill = options.fill;
    if (options.strokeThickness !== undefined) this.strokeThickness = options.strokeThickness;
    if (options.stroke !== undefined) this.stroke = options.stroke;

    // Update existing text styles
    const style = this.getTextStyle();
    this.textsList.forEach(text => {
      text.style = style;
    });
  }

  /**
   * Get or create a PIXI.Text object from the pool
   */
  getTextObject(uid) {
    if (this.texts[uid]) {
      return this.texts[uid];
    }

    let text;
    // Find an unused text object from the pool
    const unusedText = this.textsList.find(t => !Object.values(this.texts).includes(t));

    if (unusedText) {
      text = unusedText;
    } else if (this.textsList.length < this.maxTexts) {
      // Create new text object
      text = new this.PIXI.Text('', this.getTextStyle());
      this.textsList.push(text);
      this.textGraphics.addChild(text);
    } else {
      // Pool is full and all objects are in use
      // Find the least important visible text and reuse it
      let leastImportant = null;
      let minImportance = Infinity;
      for (const [existingUid, existingText] of Object.entries(this.texts)) {
        const existingData = this.allTexts.find(t => t.uid === existingUid);
        if (existingData && existingData.importance < minImportance) {
          minImportance = existingData.importance;
          leastImportant = { uid: existingUid, text: existingText };
        }
      }
      if (leastImportant) {
        delete this.texts[leastImportant.uid];
        text = leastImportant.text;
      } else {
        // Fallback: reuse last text
        text = this.textsList[this.textsList.length - 1];
        // Find and delete the old UID that points to this text object
        for (const [oldUid, oldText] of Object.entries(this.texts)) {
          if (oldText === text) {
            delete this.texts[oldUid];
            break;
          }
        }
      }
    }

    this.texts[uid] = text;
    return text;
  }

  /**
   * Simple hash function to generate importance value from string
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update texts with new data
   *
   * @param {Array} textData - Array of text data objects with structure:
   *   {
   *     uid: string,           // Unique identifier
   *     text: string,          // Text to display
   *     x: number,             // X position
   *     y: number,             // Y position
   *     importance: number,    // Optional: Higher values = higher priority (will be generated if not provided)
   *     anchor: {x, y}        // Optional: Text anchor point (default: {x: 0.5, y: 0.5})
   *   }
   */
  updateTexts(textData) {
    // Track which texts were visible before this update
    const previouslyVisible = new Set();
    Object.keys(this.texts).forEach(uid => {
      if (this.texts[uid].visible) {
        previouslyVisible.add(uid);
      }
    });

    // Create a set of new UIDs for quick lookup
    const newUids = new Set(textData.map(td => td.uid));

    // Remove old UID mappings BEFORE getting text objects for new UIDs
    // This ensures the pool has unused objects available
    const oldUids = Object.keys(this.texts);
    oldUids.forEach(uid => {
      if (!newUids.has(uid)) {
        delete this.texts[uid];
      }
    });

    // Process all new text data first
    this.allBoxes = [];
    this.allTexts = [];

    textData.forEach((td) => {
      const text = this.getTextObject(td.uid);
      text.text = td.text;
      text.x = td.x;
      text.y = td.y;

      // Set anchor (default to center)
      if (td.anchor) {
        text.anchor.x = td.anchor.x;
        text.anchor.y = td.anchor.y;
      } else {
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
      }

      text.visible = true;

      // Cache dimensions
      const bounds = text.getBounds();
      const width = bounds.width;
      const height = bounds.height;

      this.textWidths[td.uid] = width;
      this.textHeights[td.uid] = height;

      // Generate importance if not provided
      let importance = td.importance !== undefined
        ? td.importance
        : this.hashCode(td.uid);

      // BOOST importance for texts that were already visible
      // Use x position for tie-breaking among priority reads
      const isPriority = previouslyVisible.has(td.uid);
      if (isPriority) {
        // Use a huge base + x position (inverted so leftmost = highest)
        // This ensures: 1) priority >> non-priority, 2) leftmost priority wins
        importance = 1000000000000 - td.x;
      }

      // Store importance and priority on the text object for later use
      if (!text.userData) text.userData = {};
      text.userData.importance = importance;
      text.userData.isPriority = isPriority;

      // Bounding box for overlap detection [xMin, yMin, xMax, yMax]
      const box = [
        bounds.x,
        bounds.y,
        bounds.x + width,
        bounds.y + height
      ];

      this.allBoxes.push(box);
      this.allTexts.push({
        uid: td.uid,
        text: text,
        importance: importance,
        isPriority: isPriority
      });
    });

    // Hide overlapping texts based on importance
    this.hideOverlaps();

    // Hide text objects that are not currently in use
    this.textsList.forEach(textObj => {
      const isInUse = Object.values(this.texts).includes(textObj);
      if (!isInUse) {
        textObj.visible = false;
      }
    });
  }

  /**
   * Hide overlapping texts, keeping higher-importance ones visible
   */
  hideOverlaps() {
    const { allBoxes, allTexts } = this;

    if (allBoxes.length === 0) return;

    // Build overlap map
    const overlaps = new Map();
    for (let i = 0; i < allTexts.length; i++) {
      overlaps.set(i, new Set());
    }

    boxIntersect(allBoxes, (i, j) => {
      overlaps.get(i).add(j);
      overlaps.get(j).add(i);
    });

    // Sort by importance (highest first)
    const sorted = allTexts
      .map((t, idx) => ({ idx, importance: t.importance }))
      .sort((a, b) => b.importance - a.importance);

    // Greedy selection: pick highest importance labels that don't overlap with already selected
    const selected = new Set();

    for (const item of sorted) {
      const idx = item.idx;

      // Check if this overlaps with any already-selected label
      let hasOverlap = false;
      for (const selectedIdx of selected) {
        if (overlaps.get(idx).has(selectedIdx)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        selected.add(idx);
        allTexts[idx].text.visible = true;
      } else {
        allTexts[idx].text.visible = false;
      }
    }

  }

  /**
   * Get dimensions of a text by uid (cached)
   */
  getTextDimensions(uid) {
    return {
      width: this.textWidths[uid] || 0,
      height: this.textHeights[uid] || 0
    };
  }

  /**
   * Update positions of existing texts and recalculate collisions
   * Used during zoom to keep text size constant while repositioning
   *
   * @param {Object} positionMap - Map of uid -> {x, y} or uid -> {x, y, importance}
   */
  updatePositions(positionMap) {
    // Update positions and optionally importance
    Object.entries(positionMap).forEach(([uid, pos]) => {
      const text = this.texts[uid];
      if (text) {
        text.x = pos.x;
        text.y = pos.y;

        // Update importance if provided
        if (pos.importance !== undefined) {
          if (!text.userData) text.userData = {};
          text.userData.importance = pos.importance;
        }
      }
    });

    // Recalculate bounding boxes
    this.allBoxes = [];
    this.allTexts = [];

    Object.entries(this.texts).forEach(([uid, text]) => {
      const bounds = text.getBounds();
      const width = bounds.width;
      const height = bounds.height;

      const box = [
        bounds.x,
        bounds.y,
        bounds.x + width,
        bounds.y + height
      ];

      this.allBoxes.push(box);
      this.allTexts.push({
        uid: uid,
        text: text,
        importance: text.userData && text.userData.importance ? text.userData.importance : this.hashCode(uid),
        isPriority: text.userData && text.userData.isPriority ? text.userData.isPriority : false
      });
    });

    // Re-run collision detection
    this.hideOverlaps();
  }

  /**
   * Clear all texts
   */
  clear() {
    Object.values(this.texts).forEach(text => {
      text.visible = false;
    });
    this.texts = {};
    this.allBoxes = [];
    this.allTexts = [];
  }

  /**
   * Destroy the text manager and clean up resources
   */
  destroy() {
    this.textsList.forEach(text => {
      text.destroy();
    });
    this.textGraphics.destroy();
    this.texts = {};
    this.textsList = [];
    this.textWidths = {};
    this.textHeights = {};
    this.allBoxes = [];
    this.allTexts = [];
  }
}

export default TextManager;
