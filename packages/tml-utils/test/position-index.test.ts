import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { BlockNode, Attribute } from '@typedml/parser'
import {
  findNodeAtPosition,
  findNodeAtPositionWithIndex,
  PositionIndex,
} from '../src'

describe('PositionIndex', () => {
  describe('Basic functionality', () => {
    it('should create a position index from nodes', () => {
      const tml = 'block\n  child'
      const nodes = parseTML(tml)
      const index = new PositionIndex(nodes)

      expect(index).toBeDefined()
    })

    it('should find a node at position', () => {
      const tml = 'block\n  child'
      const nodes = parseTML(tml)
      const index = new PositionIndex(nodes)

      const position = { line: 1, column: 2 } // Position within 'block'
      const node = index.findNodeAtPosition(position)

      expect(node).toBeDefined()
      expect(node?.type).toBe('Block')
      expect((node as BlockNode).name).toBe('block')
    })
  })

  describe('Comparison with original implementation', () => {
    it('should return the same result as the original implementation for a simple block', () => {
      const tml = 'block\n  child'
      const nodes = parseTML(tml)

      const position = { line: 1, column: 2 } // Position within 'block'

      const originalResult = findNodeAtPosition(nodes, position)
      const newResult = findNodeAtPositionWithIndex(nodes, position)

      expect(newResult).toEqual(originalResult)
    })

    it('should return the same result for a nested block', () => {
      const tml = 'block\n  child\n    grandchild'
      const nodes = parseTML(tml)

      // Position within 'grandchild'
      const position = { line: 3, column: 6 }

      const originalResult = findNodeAtPosition(nodes, position)
      const newResult = findNodeAtPositionWithIndex(nodes, position)

      expect(newResult).toEqual(originalResult)
      expect(newResult?.type).toBe('Block')
      expect((newResult as BlockNode).name).toBe('grandchild')
    })

    it('should return the same result for a value node', () => {
      const tml = 'title: My Page'
      const nodes = parseTML(tml)

      // Position within the value
      const position = { line: 1, column: 10 }

      const originalResult = findNodeAtPosition(nodes, position)
      const newResult = findNodeAtPositionWithIndex(nodes, position)

      expect(newResult).toEqual(originalResult)
      expect(newResult?.type).toBe('Value')
    })

    it('should return the same result for an attribute', () => {
      const tml = 'div id=main class=container'
      const nodes = parseTML(tml)

      // Position within the 'class' attribute
      const position = { line: 1, column: 15 }

      const originalResult = findNodeAtPosition(nodes, position)
      const newResult = findNodeAtPositionWithIndex(nodes, position)

      expect(newResult).toEqual(originalResult)
      expect(newResult?.type).toBe('Attribute')
      expect((newResult as Attribute).key).toBe('class')
    })

    it('should return the same result for a comment', () => {
      const tml = 'div\n  // This is a comment\n  p: Text'
      const nodes = parseTML(tml)

      // Position within the comment
      const position = { line: 2, column: 10 }

      const originalResult = findNodeAtPosition(nodes, position)
      const newResult = findNodeAtPositionWithIndex(nodes, position)

      expect(newResult).toEqual(originalResult)
      expect(newResult?.type).toBe('Comment')
    })
  })

  describe('Complex structures', () => {
    it('should find the correct node in a complex structure', () => {
      const tml = `html
  head
    title: My Page
  body
    div id=main class=container
      h1: Hello World
      p: This is a paragraph
      // This is a comment
      ul
        li: Item 1
        li: Item 2`

      const nodes = parseTML(tml)

      // Get the original implementation results to compare with
      const positions = [
        { line: 1, column: 2 },
        { line: 3, column: 10 },
        { line: 5, column: 8 },
        { line: 5, column: 15 },
        { line: 8, column: 10 },
        { line: 10, column: 12 },
      ]

      // Get the expected results from the original implementation
      const expectedResults = positions.map(pos => {
        const node = findNodeAtPosition(nodes, pos)
        return {
          ...pos,
          expectedType: node?.type,
          expectedName:
            node?.type === 'Block' ? (node as BlockNode).name : undefined,
          expectedKey:
            node?.type === 'Attribute' ? (node as Attribute).key : undefined,
        }
      })

      for (const expected of expectedResults) {
        const node = findNodeAtPositionWithIndex(nodes, {
          line: expected.line,
          column: expected.column,
        })

        expect(node).toBeDefined()
        expect(node?.type).toBe(expected.expectedType)

        if (expected.expectedType === 'Block') {
          expect((node as BlockNode).name).toBe(expected.expectedName)
        } else if (expected.expectedType === 'Attribute') {
          expect((node as Attribute).key).toBe(expected.expectedKey)
        }
      }
    })

    it('should find the correct node in a structure with arrays and objects', () => {
      const tml = `config
  settings: {
    theme: "dark",
    fontSize: 16,
    features: [
      "autocomplete",
      "formatting",
      "linting"
    ]
  }`

      const nodes = parseTML(tml)

      // Position within the array
      const position = { line: 6, column: 8 }

      // Get the expected result from the original implementation
      const expectedNode = findNodeAtPosition(nodes, position)
      const node = findNodeAtPositionWithIndex(nodes, position)

      expect(node).toBeDefined()
      expect(node?.type).toBe(expectedNode?.type)
    })
  })

  describe('Edge cases', () => {
    it('should handle positions outside any node', () => {
      const tml = 'block\n\n  child'
      const nodes = parseTML(tml)

      // Position on an empty line
      const position = { line: 2, column: 0 }

      const node = findNodeAtPositionWithIndex(nodes, position)

      expect(node).toBeUndefined()
    })

    it('should handle empty documents', () => {
      const tml = ''
      const nodes = parseTML(tml)

      const position = { line: 1, column: 0 }

      const node = findNodeAtPositionWithIndex(nodes, position)

      expect(node).toBeUndefined()
    })
  })
})
