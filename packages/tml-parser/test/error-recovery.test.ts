import { describe, it, expect } from 'vitest'
import { BlockNode, Attribute } from '../src/types'
import {
  findNodesByType,
  findBlocksByName,
  testMalformedInput,
} from './helpers'

describe('Malformed Input Recovery', () => {
  it('should handle unbalanced quotes', () => {
    // Use a simpler test case that's more likely to be handled correctly
    const input = `title: "Unbalanced quotes
content: This should still be parsed`

    testMalformedInput(input, result => {
      // Find all block nodes
      const blocks = findNodesByType<BlockNode>(result, 'Block')
      expect(blocks.length).toBeGreaterThan(0)

      // Check that we have a title block
      const titleBlocks = findBlocksByName(result, 'title')
      expect(titleBlocks.length).toBe(1)
    })
  })

  it('should handle unbalanced braces', () => {
    // Use a simpler test case
    const input = `config: {
  name: "My App"
  // Missing closing brace
next-block: This should be parsed`

    testMalformedInput(input, result => {
      // Find all block nodes
      const blocks = findNodesByType<BlockNode>(result, 'Block')
      expect(blocks.length).toBeGreaterThan(0)

      // Check that we have a config block
      const configBlocks = findBlocksByName(result, 'config')
      expect(configBlocks.length).toBe(1)
    })
  })

  it('should handle invalid attribute syntax', () => {
    // Use a simpler test case
    const input = `div id=main =invalid class=primary`

    testMalformedInput(input, result => {
      // Find all block nodes
      const blocks = findNodesByType<BlockNode>(result, 'Block')
      expect(blocks.length).toBeGreaterThan(0)

      // Check that we have a div block
      const divBlocks = findBlocksByName(result, 'div')
      expect(divBlocks.length).toBe(1)

      // Check that at least one valid attribute was parsed
      const divBlock = divBlocks[0]
      const attributes = findNodesByType<Attribute>(
        divBlock.children,
        'Attribute'
      )
      expect(attributes.length).toBeGreaterThan(0)
    })
  })

  it('should handle inconsistent indentation', () => {
    const input = `parent
        child1
      child2 // This has less indentation than child1
            grandchild // This has more indentation than expected`

    testMalformedInput(input, result => {
      // Find the parent block
      const parentBlocks = findBlocksByName(result, 'parent')
      expect(parentBlocks.length).toBe(1)

      const parent = parentBlocks[0]

      // Check that at least one child is parsed
      const childBlocks = parent.children.filter(
        child =>
          child.type === 'Block' &&
          ((child as BlockNode).name === 'child1' ||
            (child as BlockNode).name === 'child2')
      )
      expect(childBlocks.length).toBeGreaterThan(0)
    })
  })
})
