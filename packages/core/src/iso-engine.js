/**
 * Core Isometric Projection Engine
 * Translates (u, v, z) grid coordinates to flat screen (x, y) coordinates.
 */

export const IsoEngine = {
  // The constants that define your 2:1 projection plane
  A: 50, // Tile half-width (radius from center to left/right point)
  HH: 25, // Tile half-height (A / 2 for true 2:1 iso)
  H: 58, // Standard vertical unit height for a 3D block

  // The screen origin where (u:0, v:0) lands
  ORIGIN: { x: 400, y: 100 },

  /**
   * Projects a 3D grid point to a 2D screen point.
   * @param {number} u - The down-right axis
   * @param {number} v - The down-left axis
   * @param {number} z - The elevation axis (0 is floor level)
   * @returns {{ x: number, y: number }} screen coordinates
   */
  project(u, v, z = 0) {
    return {
      x: this.ORIGIN.x + (u - v) * this.A,
      y: this.ORIGIN.y + (u + v) * this.HH - z * this.H,
    };
  },
};
