import { describe, it, expect } from 'vitest'
import { parseTML, BlockNode } from '@tml/parser'
import { findNodeAtPosition } from '../src'

describe('Node Position and Finding', () => {
  it('should correctly track node positions', () => {
    const tml = 'block\n  child'
    const nodes = parseTML(tml)

    // Verify the root node position
    const rootNode = nodes[0] as BlockNode
    expect(rootNode.position).toBeDefined()
    if (rootNode.position) {
      expect(rootNode.position.start.line).toBe(1)
      expect(rootNode.position.start.column).toBe(0)
      expect(rootNode.position.end.line).toBe(1)
      expect(rootNode.position.end.column).toBe(5)
    }

    // Verify the child node position
    const childNode = rootNode.children[0] as BlockNode
    expect(childNode.position).toBeDefined()
    if (childNode.position) {
      expect(childNode.position.start.line).toBe(2)
      expect(childNode.position.start.column).toBe(2)
      expect(childNode.position.end.line).toBe(2)
      expect(childNode.position.end.column).toBe(7)
    }
  })

  it('should find nodes at specific positions', () => {
    const tml = 'block\n  child'
    const nodes = parseTML(tml)

    // Test positions within the root block
    const position1 = { line: 1, column: 0 }
    const node1 = findNodeAtPosition(nodes, position1)
    expect(node1).toBeDefined()
    expect(node1?.type).toBe('Block')
    expect((node1 as BlockNode).name).toBe('block')

    const position2 = { line: 1, column: 2 }
    const node2 = findNodeAtPosition(nodes, position2)
    expect(node2).toBeDefined()
    expect(node2?.type).toBe('Block')
    expect((node2 as BlockNode).name).toBe('block')

    const position3 = { line: 1, column: 5 }
    const node3 = findNodeAtPosition(nodes, position3)
    expect(node3).toBeDefined()
    expect(node3?.type).toBe('Block')
    expect((node3 as BlockNode).name).toBe('block')

    // Test position outside of any node
    const position4 = { line: 1, column: 6 }
    const node4 = findNodeAtPosition(nodes, position4)
    expect(node4).toBeUndefined()

    // Test position on line 2 (should find the child node)
    const position5 = { line: 2, column: 2 }
    const node5 = findNodeAtPosition(nodes, position5)
    expect(node5).toBeDefined()
    expect(node5?.type).toBe('Block')
    expect((node5 as BlockNode).name).toBe('child')
  })
})
