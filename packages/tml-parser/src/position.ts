import { Point, Position } from '@/types'

/**
 * Creates a Point object representing a position in the source.
 */
export function createPoint(line: number, column: number): Point {
  return { line, column }
}

/**
 * Creates a Position object representing a span in the source.
 */
export function createPosition(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): Position {
  return {
    start: createPoint(startLine, startColumn),
    end: createPoint(endLine, endColumn),
  }
}

/**
 * Creates a Position object for a single line span.
 */
export function createLinePosition(
  line: number,
  startColumn: number,
  endColumn: number
): Position {
  return createPosition(line, startColumn, line, endColumn)
}
