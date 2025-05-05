import { Node, BlockNode, ValueNode, Attribute, CommentNode } from '@tml/parser'

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

  // For debugging
  // console.log('isPositionInRange:', { position, range, isAfterStart, isBeforeEnd })

  return isAfterStart && isBeforeEnd
}

/**
 * Recursively finds the most specific node at the given position
 *
 * This function traverses the node tree to find the most specific node
 * that contains the given position. It handles multiline documents and
 * nested nodes correctly.
 */
export function findNodeAtPosition(
  nodes: Node[],
  position: PositionLike
): Node | undefined {
  // First, check for comments at any level in the tree
  // Comments have the highest priority
  const allComments = findNodesByType<CommentNode>(nodes, 'Comment')
  for (const comment of allComments) {
    if (comment.position && isPositionInRange(position, comment.position)) {
      return comment
    }
  }

  // Next, check for direct matches at the current level
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]

    // Check if this node directly contains the position
    if (node.position && isPositionInRange(position, node.position)) {
      // For comment nodes, return immediately as they have highest priority
      if (node.type === 'Comment') {
        return node
      }
    }
  }

  // Next, check for structured values and array values
  // These need special handling because they span multiple lines
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]

    if (node.type === 'Block') {
      const blockNode = node as BlockNode

      // Check for value nodes with structured values (objects or arrays)
      const valueNodes = blockNode.children.filter(
        child => child.type === 'Value'
      ) as ValueNode[]
      for (const valueNode of valueNodes) {
        if (
          valueNode.value.position &&
          isPositionInRange(position, valueNode.value.position)
        ) {
          // If the position is within the value's position, return the value node
          return valueNode
        }
      }
    }
  }

  // Find all value nodes in the tree for multiline value checking
  const allValueNodes = findNodesByType<ValueNode>(nodes, 'Value')

  // Special handling for multiline values
  // Check if the position is within a multiline value's content range
  // This is needed because the parser doesn't track the position of the value itself
  // for multiline values, only the position of the value node
  for (const valueNode of allValueNodes) {
    // For multiline values, the value's content might span multiple lines
    // Check if the position is within the expected range of the value's content
    if (valueNode.position) {
      // The value's content starts after the colon and indentation
      const valueStartLine = valueNode.position.start.line
      const valueEndLine = valueNode.position.end.line

      // For multiline values, check if position is within the value's range
      if (
        // Check if position is on a line after the value node's start line
        // and before or at the value node's end line
        (position.line > valueStartLine && position.line <= valueEndLine) ||
        // Or if position is on the same line as the value node's start line
        // but after the colon
        (position.line === valueStartLine &&
          position.column > valueNode.position.start.column + 1)
      ) {
        return valueNode
      }
    }
  }

  // Process nodes in reverse order to prioritize later nodes
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]

    // For block nodes, check children first regardless of position
    if (node.type === 'Block') {
      const blockNode = node as BlockNode

      // Check if any child contains the position
      for (const child of blockNode.children) {
        if (child.position && isPositionInRange(position, child.position)) {
          // If a child contains the position, recursively check it
          const childResult = findNodeAtPosition([child], position)
          if (childResult) {
            return childResult
          }
          // If no deeper match found, return the child itself
          return child
        }
      }
    }

    // Check if position is within the node's range
    if (node.position && isPositionInRange(position, node.position)) {
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

      // If we didn't find a more specific node, return this one
      return node
    }
  }

  // If we didn't find a node in the direct hierarchy, try a more exhaustive search
  // This is useful for deeply nested structures where the position might be in a node
  // that's not directly in the path from the root to the leaf
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]

    if (node.type === 'Block') {
      const blockNode = node as BlockNode

      // Recursively search all children
      const result = findNodeAtPosition(blockNode.children, position)
      if (result) {
        return result
      }
    }
  }

  return undefined
}

/**
 * Finds the parent block of a node
 *
 * This function has special handling for comments to ensure they are associated
 * with the correct parent block based on indentation level.
 */
export function findParentBlock(
  nodes: Node[],
  targetNode: Node,
  currentParent?: BlockNode
): BlockNode | undefined {
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

  // Standard parent finding logic
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
