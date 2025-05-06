import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { stringifyTML } from '../src'

describe('Object Attribute Stringification', () => {
  it('should correctly stringify an object attribute', () => {
    const input = `block config={
  server: "api.example.com",
  retries: 3,
  features: [
    "fast-start",
    "auto-retry"
  ]
}`

    const nodes = parseTML(input)
    const output = stringifyTML(nodes)

    // Check that the output contains the key elements
    expect(output).toContain('block')
    expect(output).toContain('config=')

    // Parse the output again to make sure it's valid TML
    const reparsed = parseTML(output)
    expect(reparsed.length).toBeGreaterThan(0)

    // Verify the output structure
    expect(output).toContain('config={')
    expect(output).toContain('server: "api.example.com"')
    expect(output).toContain('retries: 3')
    expect(output).toContain('features: [')

    // Check that the reparsed nodes have a block structure
    const originalBlock = nodes[0]
    expect(originalBlock.type).toBe('Block')

    // Find a block in the reparsed nodes
    const reparsedBlock = reparsed.find(node => node.type === 'Block')
    expect(reparsedBlock).toBeDefined()

    // Check that the config attribute exists in the original
    const originalConfig = originalBlock.children.find(
      child => child.type === 'Attribute' && child.key === 'config'
    )
    expect(originalConfig).toBeDefined()

    if (originalConfig) {
      // Verify the config attribute value type
      if (originalConfig.value.type === 'String') {
        expect(originalConfig.value.value.startsWith('{')).toBe(true)
      } else if (originalConfig.value.type === 'Object') {
        expect(originalConfig.value.fields.length).toBeGreaterThan(0)
      }
    }
  })

  it('should correctly stringify a simple object attribute', () => {
    const input = 'block config={a: 1, b: 2}'

    const nodes = parseTML(input)
    const output = stringifyTML(nodes)

    // Verify the output structure
    expect(output).toContain('config={')
    expect(output).toContain('a: 1')
    expect(output).toContain('b: 2')

    // Check that the reparsed nodes have a block structure
    const originalBlock = nodes[0]
    expect(originalBlock.type).toBe('Block')

    // Check that the config attribute exists in the original
    const originalConfig = originalBlock.children.find(
      child => child.type === 'Attribute' && child.key === 'config'
    )
    expect(originalConfig).toBeDefined()

    if (originalConfig) {
      // Verify the config attribute value type
      if (originalConfig.value.type === 'String') {
        expect(originalConfig.value.value.startsWith('{')).toBe(true)
      } else if (originalConfig.value.type === 'Object') {
        expect(originalConfig.value.fields.length).toBeGreaterThan(0)
      }
    }
  })

  it('should correctly stringify a simple array attribute', () => {
    const input = 'block items=[1, 2, 3]'

    const nodes = parseTML(input)
    const output = stringifyTML(nodes)

    // Verify the output structure
    expect(output).toContain('items=[')
    expect(output).toContain('1')
    expect(output).toContain('2')
    expect(output).toContain('3')

    // Check that the reparsed nodes have a block structure
    const originalBlock = nodes[0]
    expect(originalBlock.type).toBe('Block')

    // Check that the items attribute exists in the original
    const originalItems = originalBlock.children.find(
      child => child.type === 'Attribute' && child.key === 'items'
    )
    expect(originalItems).toBeDefined()

    if (originalItems) {
      // Verify the items attribute value type
      if (originalItems.value.type === 'String') {
        expect(originalItems.value.value.startsWith('[')).toBe(true)
      } else if (originalItems.value.type === 'Array') {
        expect(originalItems.value.elements.length).toBeGreaterThan(0)
      }
    }
  })
})
