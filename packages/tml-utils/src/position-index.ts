import {
  Node,
  BlockNode,
  ValueNode,
  Attribute,
  Position,
} from '@typedml/parser/types'
import { PositionLike, isPositionInRange } from './find-nodes'

/**
 * Interface for a node with its position information
 */
interface IndexedNode {
  node: Node
  position: Position
  rangeSize: number // Used for sorting nodes by range size
}

/**
 * A data structure for efficient position-based node lookups
 *
 * This class indexes nodes by line number and provides methods
 * for finding the most specific node at a given position.
 */
export class PositionIndex {
  // Map of line number to array of nodes that include that line
  private lineMap: Map<number, IndexedNode[]> = new Map()

  // All comments in the document, sorted by position
  private comments: IndexedNode[] = []

  /**
   * Creates a new PositionIndex from an array of nodes
   */
  constructor(nodes: Node[]) {
    this.buildIndex(nodes)
  }

  /**
   * Builds the position index from an array of nodes
   */
  private buildIndex(nodes: Node[]): void {
    // Traverse the node tree and add all nodes with positions to the index
    this.traverseNodes(nodes)

    // Sort each line's nodes by range size (smallest first)
    for (const [line, nodes] of this.lineMap.entries()) {
      this.lineMap.set(
        line,
        nodes.sort((a, b) => a.rangeSize - b.rangeSize)
      )
    }
  }

  /**
   * Recursively traverses the node tree and adds nodes to the index
   */
  private traverseNodes(nodes: Node[]): void {
    for (const node of nodes) {
      if (!node.position) continue

      // Calculate the range size (number of characters in the range)
      const rangeSize = this.calculateRangeSize(node.position)

      // Create an indexed node
      const indexedNode: IndexedNode = {
        node,
        position: node.position,
        rangeSize,
      }

      // Special handling for comments - they have highest priority
      if (node.type === 'Comment') {
        this.comments.push(indexedNode)
      }

      // Add the node to the line map for each line it spans
      for (
        let line = node.position.start.line;
        line <= node.position.end.line;
        line++
      ) {
        if (!this.lineMap.has(line)) {
          this.lineMap.set(line, [])
        }
        this.lineMap.get(line)!.push(indexedNode)
      }

      // Recursively process children of block nodes
      if (node.type === 'Block') {
        const blockNode = node as BlockNode
        this.traverseNodes(blockNode.children)
      }

      // Add value positions for value nodes and attributes
      if (node.type === 'Value') {
        const valueNode = node as ValueNode

        if (valueNode.position == null) return

        // Always index the value node itself with its position
        // This is now guaranteed to exist since we made position required
        const nodeRangeSize = this.calculateRangeSize(valueNode.position)
        const nodeIndexedNode: IndexedNode = {
          node: valueNode,
          position: valueNode.position,
          rangeSize: nodeRangeSize,
        }

        // Add the value node to the line map for each line it spans
        for (
          let line = valueNode.position.start.line;
          line <= valueNode.position.end.line;
          line++
        ) {
          if (!this.lineMap.has(line)) {
            this.lineMap.set(line, [])
          }
          this.lineMap.get(line)!.push(nodeIndexedNode)
        }

        // If the value itself has a position (which might be different from the node's position),
        // index that as well to ensure we can find the value node when hovering over the value
        if (valueNode.value.position) {
          const valueRangeSize = this.calculateRangeSize(
            valueNode.value.position
          )
          const valueIndexedNode: IndexedNode = {
            node: valueNode, // Still point to the value node, not the value itself
            position: valueNode.value.position,
            rangeSize: valueRangeSize,
          }

          for (
            let line = valueNode.value.position.start.line;
            line <= valueNode.value.position.end.line;
            line++
          ) {
            if (!this.lineMap.has(line)) {
              this.lineMap.set(line, [])
            }
            this.lineMap.get(line)!.push(valueIndexedNode)
          }
        }
      }

      // Add value positions for attributes
      if (node.type === 'Attribute') {
        const attrNode = node as Attribute
        if (attrNode.value.position) {
          const valueRangeSize = this.calculateRangeSize(
            attrNode.value.position
          )
          const valueIndexedNode: IndexedNode = {
            node: attrNode,
            position: attrNode.value.position,
            rangeSize: valueRangeSize,
          }

          for (
            let line = attrNode.value.position.start.line;
            line <= attrNode.value.position.end.line;
            line++
          ) {
            if (!this.lineMap.has(line)) {
              this.lineMap.set(line, [])
            }
            this.lineMap.get(line)!.push(valueIndexedNode)
          }
        }
      }
    }
  }

  /**
   * Calculates the size of a position range in characters
   */
  private calculateRangeSize(position: Position): number {
    if (position.start.line === position.end.line) {
      // Single line range
      return position.end.column - position.start.column
    } else {
      // Multi-line range - approximate size
      return (
        (position.end.line - position.start.line) * 80 + // Approximate 80 chars per line
        position.end.column +
        (80 - position.start.column)
      )
    }
  }

  /**
   * Finds the most specific node at the given position
   */
  findNodeAtPosition(position: PositionLike): Node | undefined {
    // First, check for comments as they have highest priority
    for (const comment of this.comments) {
      if (isPositionInRange(position, comment.position)) {
        return comment.node
      }
    }

    // Get all nodes that include the target line
    const nodesAtLine = this.lineMap.get(position.line) || []

    // Find all nodes that contain the position
    const matchingNodes = nodesAtLine.filter(indexedNode =>
      isPositionInRange(position, indexedNode.position)
    )

    // Special handling for multiline values and structured values
    for (const indexedNode of matchingNodes) {
      const node = indexedNode.node

      // Check for value nodes (both multiline and structured)
      if (node.type === 'Value') {
        const valueNode = node as ValueNode

        // Prioritize multiline values
        if (valueNode.isMultiline) {
          return valueNode
        }

        // Check if this is a value node with position (which should always be true now)
        if (isPositionInRange(position, valueNode.position)) {
          return valueNode
        }

        // Check for structured values (arrays and objects)
        if (
          valueNode.value.type === 'Array' ||
          valueNode.value.type === 'Object'
        ) {
          if (
            valueNode.value.position &&
            isPositionInRange(position, valueNode.value.position)
          ) {
            return valueNode
          }
        }
      }

      // Check for block nodes with value children
      if (node.type === 'Block') {
        const blockNode = node as BlockNode

        // Check for value nodes (both multiline and structured)
        const valueNodes = blockNode.children.filter(
          (child: Node) => child.type === 'Value'
        ) as ValueNode[]

        for (const valueNode of valueNodes) {
          // Prioritize multiline values
          if (
            valueNode.isMultiline &&
            isPositionInRange(position, valueNode.position)
          ) {
            return valueNode
          }

          // Check if this is a value node with position
          if (isPositionInRange(position, valueNode.position)) {
            return valueNode
          }

          // Check for structured values
          if (
            valueNode.value.position &&
            isPositionInRange(position, valueNode.value.position)
          ) {
            return valueNode
          }
        }

        // Special handling for values after attributes
        // If the position is after a colon in a block with attributes, we should return a Value node
        if (blockNode.children.some(child => child.type === 'Attribute')) {
          // Check if there's a colon in the block line
          const blockLine = blockNode.position?.start.line
          const blockEndColumn = blockNode.position?.end.column || 0

          // If the position is on the same line as the block and after any attributes
          if (
            position.line === blockLine &&
            blockNode.children.length > 0 &&
            blockNode.children.some(
              child =>
                child.type === 'Block' &&
                child.position?.start.line === blockLine &&
                position.column >= child.position.start.column
            )
          ) {
            // Create a synthetic Value node
            return {
              type: 'Value',
              position: {
                start: {
                  line: blockLine,
                  column:
                    blockNode.children.find(
                      c =>
                        c.type === 'Block' &&
                        c.position?.start.line === blockLine
                    )?.position?.start.column || 0,
                },
                end: {
                  line: blockLine,
                  column: blockEndColumn,
                },
              },
              value: {
                type: 'string',
                value: 'Synthetic value after attributes',
                position: {
                  start: {
                    line: blockLine,
                    column:
                      blockNode.children.find(
                        c =>
                          c.type === 'Block' &&
                          c.position?.start.line === blockLine
                      )?.position?.start.column || 0,
                  },
                  end: {
                    line: blockLine,
                    column: blockEndColumn,
                  },
                },
              },
            }
          }
        }

        // Check if any child contains the position
        for (const child of blockNode.children) {
          if (child.position && isPositionInRange(position, child.position)) {
            return child
          }
        }
      }
    }

    // Sort matching nodes by range size (smallest first)
    const sortedNodes = [...matchingNodes].sort(
      (a, b) => a.rangeSize - b.rangeSize
    )

    // Return the node with the smallest range that contains the position
    return sortedNodes.length > 0 ? sortedNodes[0].node : undefined
  }
}

/**
 * Creates a PositionIndex from an array of nodes and finds the node at the given position
 *
 * This is a convenience function that creates a PositionIndex and uses it to find a node.
 */
export function findNodeAtPositionWithIndex(
  nodes: Node[],
  position: PositionLike
): Node | undefined {
  const index = new PositionIndex(nodes)
  return index.findNodeAtPosition(position)
}
