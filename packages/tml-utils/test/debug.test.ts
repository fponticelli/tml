import { describe, it, expect } from 'vitest'
import { parseTML, BlockNode } from '@tml/parser'
import { findNodeAtPosition } from '../src'

describe('Debug', () => {
  it('should print node positions', () => {
    const tml = 'block\n  child'
    const nodes = parseTML(tml)

    // Print the root node position
    const rootNode = nodes[0] as BlockNode
    console.log('Root node position:', rootNode.position)

    // Print the child node position
    const childNode = rootNode.children[0] as BlockNode
    console.log('Child node position:', childNode.position)

    // Test different positions
    for (let column = 2; column <= 7; column++) {
      const position = { line: 2, column }
      const node = findNodeAtPosition(nodes, position)
      console.log(
        `Position (2, ${column}):`,
        node ? `Found ${node.type}` : 'Not found'
      )
    }

    // This test always passes, it's just for debugging
    expect(true).toBe(true)
  })
})
