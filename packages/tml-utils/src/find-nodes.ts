import { Node, BlockNode } from '@typedml/parser/types'
import { findNodeAtPositionWithIndex } from './position-index'

/**
 * Interface for position-like objects that can be used to check if a position is within a range
 */
export interface PositionLike {
  line: number
  column: number
}

/**
 * Interface for range-like objects that can be used to check if a position is within a range
 */
export interface RangeLike {
  start: PositionLike
  end: PositionLike
}

/**
 * Checks if a position is within a range
 */
export function isPositionInRange(
  position: PositionLike,
  range?: RangeLike
): boolean {
  if (!range) return false

  // Check if position is after or at the start
  const isAfterStart =
    position.line > range.start.line ||
    (position.line === range.start.line &&
      position.column >= range.start.column)

  // Check if position is before or at the end
  const isBeforeEnd =
    position.line < range.end.line ||
    (position.line === range.end.line && position.column <= range.end.column)

  // Check if position is within range

  return isAfterStart && isBeforeEnd
}

/**
 * Finds the most specific node at the given position
 *
 * This function uses a position index to efficiently find the node
 * at the given position. It prioritizes nodes with the smallest range
 * that contains the position.
 *
 * @param nodes The array of nodes to search
 * @param position The position to find a node at
 * @returns The most specific node at the position, or undefined if no node is found
 */
export function findNodeAtPosition(
  nodes: Node[],
  position: PositionLike
): Node | undefined {
  return findNodeAtPositionWithIndex(nodes, position)
}

/**
 * Finds the parent block of a node
 *
 * This function now uses the parent field directly from the node.
 * The old implementation is kept for backward compatibility with special handling for comments.
 *
 * @deprecated Use node.parent directly instead
 */
export function findParentBlock(
  nodes: Node[],
  targetNode: Node,
  currentParent?: BlockNode
): BlockNode | undefined {
  // If the node has a parent field, use it directly
  if ('parent' in targetNode && targetNode.parent) {
    return targetNode.parent as BlockNode
  }

  // Special handling for comments
  if (targetNode.type === 'Comment' && targetNode.position) {
    // Get the comment's indentation level
    const commentIndentation = targetNode.position.start.column

    // Find the correct parent based on indentation
    if (currentParent && currentParent.position) {
      // For nested blocks, we need to check if the comment belongs to a parent
      // higher up in the hierarchy based on indentation

      // If the comment is indented at the same level as the body block's children,
      // then the comment should be a child of the body block
      if (commentIndentation === 4) {
        // Find the body block
        const bodyBlock = findBlocksByName(nodes, 'body')[0]
        if (bodyBlock) {
          return bodyBlock
        }
      }

      // If the comment's indentation matches the parent's children indentation,
      // then the comment should be a direct child of the parent, not a child of another child
      const parentIndentation = currentParent.position.start.column
      if (commentIndentation === parentIndentation + 2) {
        // This is a direct child of the current parent
        return currentParent
      }
    }
  }

  // Fallback to the old implementation for backward compatibility
  for (const node of nodes) {
    if (node === targetNode) {
      return currentParent
    }

    if (node.type === 'Block') {
      const parent = findParentBlock(node.children, targetNode, node)
      if (parent) {
        return parent
      }
    }
  }

  return undefined
}

/**
 * Finds all nodes of a specific type in a node tree
 */
export function findNodesByType<T extends Node>(
  nodes: Node[],
  type: string
): T[] {
  const result: T[] = []

  for (const node of nodes) {
    if (node.type === type) {
      result.push(node as T)
    }

    if (node.type === 'Block') {
      result.push(...findNodesByType<T>(node.children, type))
    }
  }

  return result
}

/**
 * Finds all block nodes with a specific name
 */
export function findBlocksByName(nodes: Node[], name: string): BlockNode[] {
  const result: BlockNode[] = []

  for (const node of nodes) {
    if (node.type === 'Block') {
      if (node.name === name) {
        result.push(node)
      }
      result.push(...findBlocksByName(node.children, name))
    }
  }

  return result
}
