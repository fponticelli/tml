import { Node, BlockNode, ValueNode, Attribute } from '@tml/parser'

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

  return isAfterStart && isBeforeEnd
}

/**
 * Recursively finds the most specific node at the given position
 */
export function findNodeAtPosition(
  nodes: Node[],
  position: PositionLike
): Node | undefined {
  // Process nodes in reverse order to prioritize later nodes (which might be more specific)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]

    // For debugging, uncomment this line
    // console.log(`Checking node: ${node.type}${node.type === 'Block' ? ` (${(node as BlockNode).name})` : ''}`, node.position)

    // Check if position is within the node's range
    if (node.position && isPositionInRange(position, node.position)) {
      // For block nodes, check children first
      if (node.type === 'Block') {
        const blockNode = node as BlockNode
        const childNode = findNodeAtPosition(blockNode.children, position)
        if (childNode) {
          // If we found a child node, return it immediately
          return childNode
        }
      }

      // For value nodes, check the contained value
      if (node.type === 'Value') {
        const valueNode = node as ValueNode
        if (
          valueNode.value.position &&
          isPositionInRange(position, valueNode.value.position)
        ) {
          return node
        }
      }

      // For attribute nodes, check the value
      if (node.type === 'Attribute') {
        const attrNode = node as Attribute
        if (
          attrNode.value.position &&
          isPositionInRange(position, attrNode.value.position)
        ) {
          return node
        }
      }

      // For comment nodes, check the position
      if (node.type === 'Comment') {
        if (node.position && isPositionInRange(position, node.position)) {
          return node
        }
      }

      // If we didn't find a more specific node, return this one
      return node
    }
  }

  return undefined
}

/**
 * Finds the parent block of a node
 */
export function findParentBlock(
  nodes: Node[],
  targetNode: Node,
  currentParent?: BlockNode
): BlockNode | undefined {
  for (const node of nodes) {
    if (node === targetNode) {
      return currentParent
    }

    if (node.type === 'Block') {
      const blockNode = node as BlockNode
      const parent = findParentBlock(blockNode.children, targetNode, blockNode)
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
      const blockNode = node as BlockNode
      result.push(...findNodesByType<T>(blockNode.children, type))
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
      const blockNode = node as BlockNode
      if (blockNode.name === name) {
        result.push(blockNode)
      }
      result.push(...findBlocksByName(blockNode.children, name))
    }
  }

  return result
}
