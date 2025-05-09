import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { BlockNode, ValueNode, Attribute } from '@typedml/parser/types'
import { findNodeAtPosition, findParentBlock } from '../src'

describe('findParentBlock', () => {
  it('should find the correct parent for a value node after attributes', () => {
    const tml = 'attr name=pattern: { type: string }'
    const nodes = parseTML(tml)

    // Check what type of node we actually have
    expect(nodes.length).toBe(1)
    expect(nodes[0].type).toBe('Block')

    const blockNode = nodes[0] as BlockNode
    expect(blockNode.name).toBe('attr')

    // Verify block has both Attribute and Value children
    const attributeChildren = blockNode.children.filter(
      c => c.type === 'Attribute'
    )
    const valueChildren = blockNode.children.filter(c => c.type === 'Value')

    expect(attributeChildren.length).toBe(1)
    expect(valueChildren.length).toBe(1)

    // Verify attribute properties
    const attrNode = attributeChildren[0] as Attribute
    expect(attrNode.key).toBe('name')
    expect(attrNode.value.value).toBe('pattern')

    // Find the value node at the position
    const valuePosition = { line: 1, column: 20 } // Position within the value part
    const valueNode = findNodeAtPosition(nodes, valuePosition)

    // The value node should exist and be a Value type
    expect(valueNode).toBeDefined()
    expect(valueNode?.type).toBe('Value')

    // Find the parent of the value node
    const parent = findParentBlock(nodes, valueNode!)

    // The parent should be the attr block
    expect(parent).toBeDefined()
    expect(parent?.type).toBe('Block')
    expect(parent?.name).toBe('attr')
  })

  it('should find the correct parent for a value node in a block', () => {
    const tml = 'block\n  value: test'
    const nodes = parseTML(tml)

    // There should be one block node
    expect(nodes.length).toBe(1)
    expect(nodes[0].type).toBe('Block')

    const blockNode = nodes[0] as BlockNode
    expect(blockNode.name).toBe('block')

    // Verify block children structure
    const blockChildren = blockNode.children.filter(c => c.type === 'Block')
    expect(blockChildren.length).toBe(1)

    const valueBlock = blockChildren[0] as BlockNode
    expect(valueBlock.name).toBe('value')

    // Find the value node
    const valuePosition = { line: 2, column: 10 } // Position within the value part
    const valueNode = findNodeAtPosition(nodes, valuePosition)

    // The value node should exist and be a Value type
    expect(valueNode).toBeDefined()
    expect(valueNode?.type).toBe('Value')

    // Find the parent of the value node
    const parent = findParentBlock(nodes, valueNode!)

    // The parent should be the value block
    expect(parent).toBeDefined()
    expect(parent?.type).toBe('Block')
    expect(parent?.name).toBe('value')

    // Verify parent-child relationship
    if (valueNode) {
      // Check if this is a direct child of the value block
      const isDirectChild = valueBlock.children.includes(valueNode)
      expect(isDirectChild).toBe(true)
    }
  })

  it('should find the correct parent for a value node after attributes in a block', () => {
    const tml = 'block\n  attr name=pattern: { type: string }'
    const nodes = parseTML(tml)

    // There should be one block node
    expect(nodes.length).toBe(1)
    expect(nodes[0].type).toBe('Block')

    const blockNode = nodes[0] as BlockNode
    expect(blockNode.name).toBe('block')

    // Verify block children structure
    const blockChildren = blockNode.children.filter(c => c.type === 'Block')
    expect(blockChildren.length).toBe(1)

    const attrBlock = blockChildren[0] as BlockNode
    expect(attrBlock.name).toBe('attr')

    // Verify attr block has both Attribute and Value children
    const attributeChildren = attrBlock.children.filter(
      c => c.type === 'Attribute'
    )
    const valueChildren = attrBlock.children.filter(c => c.type === 'Value')

    expect(attributeChildren.length).toBe(1)
    expect(valueChildren.length).toBe(1)

    // Verify attribute properties
    const attrNode = attributeChildren[0] as Attribute
    expect(attrNode.key).toBe('name')
    expect(attrNode.value.value).toBe('pattern')

    // Find the value node at the position
    const valuePosition = { line: 2, column: 25 } // Position within the value part
    const valueNode = findNodeAtPosition(nodes, valuePosition)

    // The value node should exist and be a Value type
    expect(valueNode).toBeDefined()
    expect(valueNode?.type).toBe('Value')

    // Find the parent of the value node
    const parent = findParentBlock(nodes, valueNode!)

    // The parent should be the attr block
    expect(parent).toBeDefined()
    expect(parent?.type).toBe('Block')
    expect(parent?.name).toBe('attr')

    // Verify parent-child relationship
    if (valueNode) {
      // Check if this is a direct child of the attr block
      const isDirectChild = attrBlock.children.includes(valueNode)
      expect(isDirectChild).toBe(true)

      // Verify the value is not directly referenced by an attribute
      if (valueNode.type === 'Value') {
        let valueReferencedByAttribute = false

        for (const child of attrBlock.children) {
          if (child.type === 'Attribute') {
            const attr = child as Attribute
            if (attr.value === (valueNode as ValueNode).value) {
              valueReferencedByAttribute = true
              break
            }
          }
        }

        // This value should not be directly referenced by an attribute
        expect(valueReferencedByAttribute).toBe(false)
      }
    }
  })
})
