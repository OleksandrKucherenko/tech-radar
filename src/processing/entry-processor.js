// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { cartesian } from '../math/coordinates.js';
import { createSegment } from '../geometry/segment-calculator.js';
import { generateQuadrantOrder } from '../geometry/quadrant-calculator.js';

/**
 * Entry Processor - Handles positioning, segmentation, ID assignment, and collision radius calculation.
 * Encapsulates all data processing logic for radar entries.
 */
export class EntryProcessor {
  /**
   * Creates a new EntryProcessor.
   *
   * @param {Object} config - Configuration object
   * @param {Array<Object>} quadrants - Array of quadrant configurations
   * @param {Array<Object>} rings - Array of ring configurations
   * @param {Function} randomNext - Random number generator function () => [0,1)
   * @param {Function} randomBetween - Random range generator function (min, max) => number
   */
  constructor(config, quadrants, rings, randomNext, randomBetween) {
    this.config = config;
    this.quadrants = quadrants;
    this.rings = rings;
    this.randomNext = randomNext;
    this.randomBetween = randomBetween;
    this.numQuadrants = quadrants.length;
    this.numRings = rings.length;
  }

  /**
   * Processes all entries: segments, positions, colors, IDs, and collision radii.
   *
   * @param {Array<Object>} entries - Array of entry objects
   * @returns {Array<Object>} Processed entries with all properties assigned
   */
  processEntries(entries) {
    // Step 1: Partition entries into segments
    const segmented = this.segmentEntries(entries);

    // Step 2: Assign segment and color to each entry
    this.assignSegmentsAndColors(entries);

    // Step 3: Position entries using grid-based distribution
    this.positionEntries(segmented);

    // Step 4: Assign unique sequential IDs
    this.assignIds(segmented);

    // Step 5: Calculate adaptive collision radii
    this.calculateCollisionRadii(segmented);

    return entries;
  }

  /**
   * Partitions entries into a 2D array by quadrant and ring.
   *
   * @param {Array<Object>} entries - Array of entry objects
   * @returns {Array<Array<Array<Object>>>} 2D array [quadrant][ring] containing entries
   */
  segmentEntries(entries) {
    const segmented = new Array(this.numQuadrants);
    for (let quadrant = 0; quadrant < this.numQuadrants; quadrant++) {
      segmented[quadrant] = new Array(this.numRings);
      for (let ring = 0; ring < this.numRings; ring++) {
        segmented[quadrant][ring] = [];
      }
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      segmented[entry.quadrant][entry.ring].push(entry);
    }

    return segmented;
  }

  /**
   * Assigns segment and color properties to each entry.
   *
   * @param {Array<Object>} entries - Array of entry objects
   */
  assignSegmentsAndColors(entries) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      entry.segment = createSegment(
        entry.quadrant,
        entry.ring,
        this.quadrants,
        this.rings,
        this.config,
        this.randomBetween
      );
      entry.color = entry.active || this.config.print_layout
        ? this.config.rings[entry.ring].color
        : this.config.colors.inactive;
    }
  }

  /**
   * Positions entries using grid-based distribution within each segment.
   *
   * @param {Array<Array<Array<Object>>>} segmented - 2D array of entries by quadrant/ring
   */
  positionEntries(segmented) {
    for (let quadrant = 0; quadrant < this.numQuadrants; quadrant++) {
      for (let ring = 0; ring < this.numRings; ring++) {
        this.gridPosition(segmented[quadrant][ring], quadrant, ring);
      }
    }
  }

  /**
   * Distributes entries in a grid pattern within their segment.
   * Uses intelligent grid sizing based on segment geometry and entry count.
   *
   * @param {Array<Object>} entries - Entries to position
   * @param {number} quadrant - Quadrant index
   * @param {number} ring - Ring index
   */
  gridPosition(entries, quadrant, ring) {
    if (entries.length === 0) return;

    const min_angle = this.quadrants[quadrant].radial_min * Math.PI;
    const max_angle = this.quadrants[quadrant].radial_max * Math.PI;
    const base_inner_radius = ring === 0 ? 30 : this.rings[ring - 1].radius;
    const base_outer_radius = this.rings[ring].radius;

    // Apply radial padding
    let inner_radius = base_inner_radius + this.config.segment_radial_padding;
    let outer_radius = base_outer_radius - this.config.segment_radial_padding;
    if (outer_radius <= inner_radius) {
      const midpoint = (base_inner_radius + base_outer_radius) / 2;
      inner_radius = Math.max(0, midpoint - 1);
      outer_radius = midpoint + 1;
    }

    const ring_center = (inner_radius + outer_radius) / 2;
    let angular_padding = this.config.segment_angular_padding / Math.max(ring_center, 1);
    const angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
    angular_padding = Math.min(angular_padding, angular_limit);

    const angle_min = min_angle + angular_padding;
    const angle_max = max_angle - angular_padding;

    // Calculate segment dimensions
    const angle_range = angle_max - angle_min;
    const radius_range = outer_radius - inner_radius;
    const count = entries.length;

    // Calculate segment dimensions in pixels
    // Use inner_radius for ring 0 to avoid overestimating angular capacity
    const effective_radius = (ring === 0) ? inner_radius : ring_center;
    const segment_arc_length = angle_range * effective_radius;
    const segment_radial_depth = radius_range;

    // Estimate item size
    const item_size = this.config.blip_collision_radius || 14;

    // Calculate maximum items that could fit in each dimension
    const max_angular_items = Math.max(3, Math.floor(segment_arc_length / (item_size * 0.7)));
    const max_radial_items = Math.max(3, Math.floor(segment_radial_depth / (item_size * 0.7)));

    // Calculate balanced grid dimensions
    let angular_divisions, radial_divisions;
    const base = Math.ceil(Math.sqrt(count));
    const aspect_ratio = segment_arc_length / Math.max(segment_radial_depth, 1);

    if (count === 1) {
      angular_divisions = 1;
      radial_divisions = 1;
    } else if (count <= 4) {
      // For small counts, spread evenly
      angular_divisions = Math.min(count, max_angular_items);
      radial_divisions = Math.ceil(count / angular_divisions);
    } else {
      // For larger counts, balance based on aspect ratio
      if (aspect_ratio > 2) {
        // Much wider than tall - strongly prefer angular spread
        angular_divisions = Math.min(max_angular_items, Math.ceil(base * 1.5));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else if (aspect_ratio > 1) {
        // Moderately wider - prefer angular spread
        angular_divisions = Math.min(max_angular_items, Math.ceil(base * 1.2));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else if (aspect_ratio < 0.5) {
        // Much taller than wide - balanced approach for narrow segments
        const radial_bias = (ring === 0) ? 0.85 : 0.7;
        angular_divisions = Math.min(max_angular_items, Math.max(3, Math.floor(base * radial_bias)));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else {
        // Moderately tall or square - balanced approach
        angular_divisions = Math.min(max_angular_items, Math.max(3, base));
        radial_divisions = Math.ceil(count / angular_divisions);
      }

      // Ensure we don't exceed capacity
      angular_divisions = Math.max(2, Math.min(angular_divisions, max_angular_items));
      radial_divisions = Math.max(2, Math.min(radial_divisions, max_radial_items));
    }

    // Distribute entries in grid
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Grid cell indices
      let angular_index = i % angular_divisions;
      let radial_index = Math.floor(i / angular_divisions);

      // Handle overcrowding by wrapping excess entries
      const is_overcrowded = radial_index >= radial_divisions;
      if (is_overcrowded) {
        const total_cells = angular_divisions * radial_divisions;
        const cell_index = i % total_cells;
        angular_index = cell_index % angular_divisions;
        radial_index = Math.floor(cell_index / angular_divisions);
      }

      // Position within grid cell with jitter (0.15-0.85 range for better spread)
      const angular_fraction = (angular_index + 0.15 + this.randomNext() * 0.7) / angular_divisions;
      const radial_fraction = (radial_index + 0.15 + this.randomNext() * 0.7) / radial_divisions;

      const angle = angle_min + angular_fraction * angle_range;
      const radius = inner_radius + radial_fraction * radius_range;

      const point = cartesian({ t: angle, r: radius });
      entry.x = point.x;
      entry.y = point.y;
    }
  }

  /**
   * Assigns unique sequential IDs to all entries in display order.
   *
   * @param {Array<Array<Array<Object>>>} segmented - 2D array of entries by quadrant/ring
   */
  assignIds(segmented) {
    let id = 1;
    const quadrant_order = generateQuadrantOrder(this.numQuadrants);

    for (const quadrant of quadrant_order) {
      for (let ring = 0; ring < this.numRings; ring++) {
        const entries = segmented[quadrant][ring];
        // Sort alphabetically within each segment
        entries.sort(function (a, b) { return a.label.localeCompare(b.label); });
        for (let i = 0; i < entries.length; i++) {
          entries[i].id = "" + id++;
        }
      }
    }
  }

  /**
   * Calculates adaptive collision radii for entries based on segment density.
   *
   * @param {Array<Array<Array<Object>>>} segmented - 2D array of entries by quadrant/ring
   */
  calculateCollisionRadii(segmented) {
    for (let quadrant = 0; quadrant < this.numQuadrants; quadrant++) {
      for (let ring = 0; ring < this.numRings; ring++) {
        const entries = segmented[quadrant][ring];
        if (entries.length === 0) continue;

        // Calculate segment geometry
        const seg_base_inner_radius = ring === 0 ? 30 : this.rings[ring - 1].radius;
        const seg_base_outer_radius = this.rings[ring].radius;
        let seg_inner_radius = seg_base_inner_radius + this.config.segment_radial_padding;
        let seg_outer_radius = seg_base_outer_radius - this.config.segment_radial_padding;

        // Guard against zero-width segments
        if (seg_outer_radius <= seg_inner_radius) {
          const midpoint = (seg_base_inner_radius + seg_base_outer_radius) / 2;
          seg_inner_radius = Math.max(0, midpoint - 1);
          seg_outer_radius = midpoint + 1;
        }

        const seg_angle_range = (this.quadrants[quadrant].radial_max - this.quadrants[quadrant].radial_min) * Math.PI;
        const seg_ring_center = (seg_inner_radius + seg_outer_radius) / 2;
        const seg_radial_thickness = seg_outer_radius - seg_inner_radius;

        // Approximate segment area (sector area)
        const segment_area = seg_angle_range * seg_ring_center * seg_radial_thickness;

        // Calculate area per entry
        const area_per_entry = segment_area / entries.length;

        // Collision radius based on available area (with safety factor 0.55)
        const ideal_radius = Math.sqrt(area_per_entry / Math.PI) * 0.55;

        // Allow adaptive radius to exceed default when there's room
        let adaptive_radius = Math.max(12, ideal_radius);

        // Ensure minimum spacing for dense segments
        if (entries.length > 10) {
          adaptive_radius = Math.max(adaptive_radius, 13);
        }
        if (entries.length > 15) {
          adaptive_radius = Math.max(adaptive_radius, 14);
        }

        // Reduce collision radius for narrow segments (many quadrants in ring 0)
        if (ring === 0 && this.numQuadrants >= 6) {
          adaptive_radius = Math.max(10, adaptive_radius * 0.9);
        }

        // Assign collision radius to each entry
        for (let i = 0; i < entries.length; i++) {
          entries[i].collision_radius = adaptive_radius;
        }
      }
    }
  }
}
