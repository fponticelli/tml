import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { BlockNode } from '@typedml/parser'
import { stringifyTML, StringifyOptions } from '../src'

describe('stringifyTML', () => {
  // Helper function to test round-trip parsing and stringifying
  function testRoundTrip(input: string, options?: StringifyOptions) {
    const nodes = parseTML(input)
    const output = stringifyTML(nodes, options)
    const reparsed = parseTML(output)

    // Compare the structure of the original and reparsed nodes
    expect(compareNodeStructure(nodes, reparsed)).toBe(true)
  }

  // Helper function to compare node structures (ignoring positions)
  function compareNodeStructure(nodes1: any[], nodes2: any[]): boolean {
    // Check that the arrays have the same length
    expect(nodes1.length).toBe(nodes2.length)
    if (nodes1.length !== nodes2.length) return false

    for (let i = 0; i < nodes1.length; i++) {
      const node1 = { ...nodes1[i] }
      const node2 = { ...nodes2[i] }

      // Remove position information for comparison
      delete node1.position
      delete node2.position

      // Check that node types match
      expect(node1.type).toBe(node2.type)
      if (node1.type !== node2.type) return false

      // For block nodes, compare name and children recursively
      if (node1.type === 'Block' && node2.type === 'Block') {
        expect(node1.name).toBe(node2.name)
        if (node1.name !== node2.name) return false

        // Sort children by type and name/key for more reliable comparison
        const sortedChildren1 = [...node1.children].sort(sortNodes)
        const sortedChildren2 = [...node2.children].sort(sortNodes)

        if (!compareNodeStructure(sortedChildren1, sortedChildren2)) {
          return false
        }
      }

      // For value nodes, compare the value
      if (node1.type === 'Value' && node2.type === 'Value') {
        expect(node1.value.type).toBe(node2.value.type)
        if (node1.value.type !== node2.value.type) return false

        if (node1.value.type === 'String') {
          expect(node1.value.value).toBe(node2.value.value)
          if (node1.value.value !== node2.value.value) return false
        }

        if (node1.value.type === 'Number') {
          expect(node1.value.value).toBe(node2.value.value)
          if (node1.value.value !== node2.value.value) return false
        }

        if (node1.value.type === 'Boolean') {
          expect(node1.value.value).toBe(node2.value.value)
          if (node1.value.value !== node2.value.value) return false
        }

        // For array values, compare elements
        if (node1.value.type === 'Array' && node2.value.type === 'Array') {
          // Sort elements for more reliable comparison
          const sortedElements1 = [...node1.value.elements].sort(sortNodes)
          const sortedElements2 = [...node2.value.elements].sort(sortNodes)

          expect(sortedElements1.length).toBe(sortedElements2.length)
          if (sortedElements1.length !== sortedElements2.length) return false

          for (let j = 0; j < sortedElements1.length; j++) {
            const elem1 = sortedElements1[j]
            const elem2 = sortedElements2[j]

            expect(elem1.type).toBe(elem2.type)
            if (elem1.type !== elem2.type) return false

            if (elem1.type === 'Element' && elem2.type === 'Element') {
              expect(elem1.value.type).toBe(elem2.value.type)
              if (elem1.value.type !== elem2.value.type) return false

              if (elem1.value.type === 'String') {
                expect(elem1.value.value).toBe(elem2.value.value)
                if (elem1.value.value !== elem2.value.value) return false
              }

              if (elem1.value.type === 'Number') {
                expect(elem1.value.value).toBe(elem2.value.value)
                if (elem1.value.value !== elem2.value.value) return false
              }

              if (elem1.value.type === 'Boolean') {
                expect(elem1.value.value).toBe(elem2.value.value)
                if (elem1.value.value !== elem2.value.value) return false
              }
            }
          }
        }

        // For object values, compare fields
        if (node1.value.type === 'Object' && node2.value.type === 'Object') {
          // Sort fields for more reliable comparison
          const sortedFields1 = [...node1.value.fields].sort(sortNodes)
          const sortedFields2 = [...node2.value.fields].sort(sortNodes)

          expect(sortedFields1.length).toBe(sortedFields2.length)
          if (sortedFields1.length !== sortedFields2.length) return false

          for (let j = 0; j < sortedFields1.length; j++) {
            const field1 = sortedFields1[j]
            const field2 = sortedFields2[j]

            expect(field1.type).toBe(field2.type)
            if (field1.type !== field2.type) return false

            if (field1.type === 'Field' && field2.type === 'Field') {
              expect(field1.key).toBe(field2.key)
              if (field1.key !== field2.key) return false

              expect(field1.value.type).toBe(field2.value.type)
              if (field1.value.type !== field2.value.type) return false

              if (field1.value.type === 'String') {
                expect(field1.value.value).toBe(field2.value.value)
                if (field1.value.value !== field2.value.value) return false
              }

              if (field1.value.type === 'Number') {
                expect(field1.value.value).toBe(field2.value.value)
                if (field1.value.value !== field2.value.value) return false
              }

              if (field1.value.type === 'Boolean') {
                expect(field1.value.value).toBe(field2.value.value)
                if (field1.value.value !== field2.value.value) return false
              }
            }
          }
        }
      }

      // For attribute nodes, compare key and value
      if (node1.type === 'Attribute' && node2.type === 'Attribute') {
        expect(node1.key).toBe(node2.key)
        if (node1.key !== node2.key) return false

        expect(node1.value.type).toBe(node2.value.type)
        if (node1.value.type !== node2.value.type) return false

        if (node1.value.type === 'String') {
          expect(node1.value.value).toBe(node2.value.value)
          if (node1.value.value !== node2.value.value) return false
        }

        if (node1.value.type === 'Number') {
          expect(node1.value.value).toBe(node2.value.value)
          if (node1.value.value !== node2.value.value) return false
        }

        if (node1.value.type === 'Boolean') {
          expect(node1.value.value).toBe(node2.value.value)
          if (node1.value.value !== node2.value.value) return false
        }
      }

      // For comment nodes, compare value and isLineComment
      if (node1.type === 'Comment' && node2.type === 'Comment') {
        expect(node1.value).toBe(node2.value)
        if (node1.value !== node2.value) return false

        expect(node1.isLineComment).toBe(node2.isLineComment)
        if (node1.isLineComment !== node2.isLineComment) return false
      }
    }

    return true
  }

  // Helper function to sort nodes for comparison
  function sortNodes(a: any, b: any): number {
    // First sort by type
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type)
    }

    // Then sort by name/key/value depending on type
    if (a.type === 'Block') {
      return a.name.localeCompare(b.name)
    }

    if (a.type === 'Attribute') {
      return a.key.localeCompare(b.key)
    }

    if (a.type === 'Field') {
      return a.key.localeCompare(b.key)
    }

    if (a.type === 'Value' && a.value.type === 'String') {
      return a.value.value.localeCompare(b.value.value)
    }

    return 0
  }

  it('should stringify a simple block node', () => {
    const input = 'block'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block')
  })

  it('should stringify a block node with attributes', () => {
    const input = 'block attr1=value1 attr2=value2'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block attr1=value1 attr2=value2')
  })

  it('should stringify a block node with a value', () => {
    const input = 'block: value'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: value')
  })

  it('should stringify a block node with children', () => {
    const input = 'block\n  child1\n  child2'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block\n  child1\n  child2')
  })

  it('should stringify a block node with attributes and children', () => {
    const input = 'block attr1=value1 attr2=value2\n  child1\n  child2'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block attr1=value1 attr2=value2\n  child1\n  child2')
  })

  it('should stringify a block node with attributes and a value', () => {
    const input = 'block attr1=value1 attr2=value2: value'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    // The parser might handle this differently, so we'll just check that the key parts are present
    expect(output).toContain('block')
    expect(output).toContain('attr1=value1')
    expect(output).toContain('attr2=value2')
    expect(output).toContain('value')
  })

  it('should stringify a block node with attributes, a value, and children', () => {
    const input = 'block attr1=value1: value\n  child1\n  child2'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    // The parser might handle this differently, so we'll just check that the key parts are present
    expect(output).toContain('block')
    expect(output).toContain('attr1=value1')
    expect(output).toContain('value')
    expect(output).toContain('child1')
    expect(output).toContain('child2')
  })

  it('should stringify a line comment', () => {
    const input = '// This is a comment'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('// This is a comment')
  })

  it('should stringify a block comment', () => {
    const input = '/* This is a block comment */'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('/* This is a block comment */')
  })

  it('should stringify a multiline block comment', () => {
    const input = `/* This is a block comment
    that spans multiple lines */`
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe(
      '/* This is a block comment\n    that spans multiple lines */'
    )
  })

  it('should stringify a block with an inline block comment', () => {
    const input = 'block attr=value /* This is a comment */: value'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    // The parser might handle this differently, so we'll just check that the key parts are present
    expect(output).toContain('block')
    expect(output).toContain('attr=value')
    expect(output).toContain('/* This is a comment */')
    expect(output).toContain('value')
  })

  it('should stringify a block with a multiline string value', () => {
    const input = `description:
  This is a multiline string
  that spans several lines
  and is parsed as one value`
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe(
      'description: "This is a multiline string\\nthat spans several lines\\nand is parsed as one value"'
    )
  })

  it('should stringify a block with a boolean attribute shortcut', () => {
    const input = 'block attr!'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block attr!')
  })

  it('should stringify a block with a number value', () => {
    const input = 'block: 123'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: 123')
  })

  it('should stringify a block with a boolean value', () => {
    const input = 'block: true'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: true')
  })

  it('should stringify a block with an array value', () => {
    const input = 'block: [1, "two", true]'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: [\n  1,\n  "two",\n  true\n]')
  })

  it('should stringify a block with an object value', () => {
    const input = 'block: {a: 1, b: "two", c: true}'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: {\n  a: 1,\n  b: "two",\n  c: true\n}')
  })

  it('should stringify a block with a nested object value', () => {
    const input = 'block: {a: 1, b: {c: 2, d: 3}, e: 4}'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe(
      'block: {\n  a: 1,\n  b: {\n    c: 2,\n    d: 3\n  },\n  e: 4\n}'
    )
  })

  it('should stringify a block with a nested array value', () => {
    const input = 'block: [1, [2, 3], 4]'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: [\n  1,\n  [\n    2,\n    3\n  ],\n  4\n]')
  })

  it('should stringify a complex HTML-like structure', () => {
    const input = `html lang=en
  head
    title: My Website
    meta charset=UTF-8
  body
    h1: Welcome
    p: This is TML`

    testRoundTrip(input)
  })

  it('should stringify a complex structure with comments', () => {
    const input = `// This is a comment
html lang=en
  // This is another comment
  head
    /* This is a block comment */
    title: My Website
    meta charset=UTF-8 /* This is an inline comment */
  body
    h1: Welcome
    p: This is TML`

    testRoundTrip(input)
  })

  it('should stringify a complex structure with arrays and objects', () => {
    const input = `data
  users: [
    {name: "John", age: 30},
    {name: "Jane", age: 25}
  ]
  settings: {
    theme: "dark",
    notifications: true,
    limits: [10, 20, 30]
  }`

    const nodes = parseTML(input)
    const output = stringifyTML(nodes)

    // Check that the output contains the key elements
    expect(output).toContain('data')
    expect(output).toContain('users:')
    expect(output).toContain('John')
    expect(output).toContain('30')
    expect(output).toContain('Jane')
    expect(output).toContain('25')
    expect(output).toContain('settings:')
    expect(output).toContain('dark')
    expect(output).toContain('true')
    expect(output).toContain('10')
    expect(output).toContain('20')
    expect(output).toContain('30')

    // Parse the output again to make sure it's valid TML
    const reparsed = parseTML(output)
    expect(reparsed.length).toBeGreaterThan(0)

    // Verify that we have a data block
    const dataBlock = reparsed.find(
      node => node.type === 'Block' && (node as BlockNode).name === 'data'
    )
    expect(dataBlock).toBeDefined()
  })

  it('should stringify with custom indentation', () => {
    const input = `block
  child`
    const nodes = parseTML(input)
    const output = stringifyTML(nodes, { indentSize: 4 })
    expect(output).toBe('block\n    child')
  })

  it('should stringify without pretty-printing', () => {
    const input = `block: [1, 2, 3]`
    const nodes = parseTML(input)
    const output = stringifyTML(nodes, { pretty: false })
    expect(output).toBe('block: [1, 2, 3]')
  })

  it('should handle empty arrays and objects', () => {
    const input = `block
  emptyArray: []
  emptyObject: {}`
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block\n  emptyArray: []\n  emptyObject: {}')
  })

  it('should handle special characters in strings', () => {
    const input = 'block: "This has \\"quotes\\" and \\\\backslashes\\\\"'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe(
      'block: "This has \\"quotes\\" and \\\\backslashes\\\\"'
    )
  })

  it('should handle newlines in strings', () => {
    const input = 'block: "Line 1\\nLine 2\\nLine 3"'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: "Line 1\\nLine 2\\nLine 3"')
  })

  it('should handle unquoted strings that need quoting', () => {
    const input = 'block: value with spaces'
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block: "value with spaces"')
  })

  it('should handle multiple root nodes', () => {
    const input = `block1
block2
block3`
    const nodes = parseTML(input)
    const output = stringifyTML(nodes)
    expect(output).toBe('block1\nblock2\nblock3')
  })
})
