import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { BlockNode, ValueNode } from '../src/types'

describe('Value After Attributes', () => {
  it('should correctly parse a value after attributes', () => {
    const input = 'div id=main class=container: This is a value'
    const result = parseTML(input)

    // There should be one block
    expect(result.length).toBe(1)

    // The block should be a div
    const block = result[0] as BlockNode
    expect(block.type).toBe('Block')
    expect(block.name).toBe('div')

    // The block should have 3 children: two attributes and one value
    expect(block.children.length).toBe(3)

    // Check the attributes
    const attributes = block.children.filter(
      child => child.type === 'Attribute'
    )
    expect(attributes.length).toBe(2)
    expect(attributes[0].key).toBe('id')
    expect(attributes[0].value.value).toBe('main')
    expect(attributes[1].key).toBe('class')
    expect(attributes[1].value.value).toBe('container')

    // Check the value
    const values = block.children.filter(child => child.type === 'Value')
    expect(values.length).toBe(1)

    const valueNode = values[0] as ValueNode
    expect(valueNode.value.type).toBe('string')
    expect(valueNode.value.value).toBe('This is a value')
  })

  it('should correctly parse a value directly after a block name', () => {
    const input = 'div: This is a value'
    const result = parseTML(input)

    // There should be one block
    expect(result.length).toBe(1)

    // The block should be a div
    const block = result[0] as BlockNode
    expect(block.type).toBe('Block')
    expect(block.name).toBe('div')

    // The block should have 1 child: a value
    expect(block.children.length).toBe(1)

    // Check the value
    const valueNode = block.children[0] as ValueNode
    expect(valueNode.type).toBe('Value')
    expect(valueNode.value.type).toBe('string')
    expect(valueNode.value.value).toBe('This is a value')
  })

  it('should correctly parse a standalone value', () => {
    const input = ': This is a standalone value'
    const result = parseTML(input)

    // There should be one value node
    expect(result.length).toBe(1)

    // It should be a value node
    const valueNode = result[0] as ValueNode
    expect(valueNode.type).toBe('Value')
    expect(valueNode.value.type).toBe('string')
    expect(valueNode.value.value).toBe('This is a standalone value')
  })

  it('should correctly parse a value with structured content after attributes', () => {
    const input =
      'config id=settings class=system: { theme: "dark", fontSize: 16 }'
    const result = parseTML(input)

    // There should be one block
    expect(result.length).toBe(1)

    // The block should be a config
    const block = result[0] as BlockNode
    expect(block.type).toBe('Block')
    expect(block.name).toBe('config')

    // The block should have 3 children: two attributes and one value
    expect(block.children.length).toBe(3)

    // Check the attributes
    const attributes = block.children.filter(
      child => child.type === 'Attribute'
    )
    expect(attributes.length).toBe(2)
    expect(attributes[0].key).toBe('id')
    expect(attributes[0].value.value).toBe('settings')
    expect(attributes[1].key).toBe('class')
    expect(attributes[1].value.value).toBe('system')

    // Check the value
    const values = block.children.filter(child => child.type === 'Value')
    expect(values.length).toBe(1)

    const valueNode = values[0] as ValueNode
    expect(valueNode.value.type).toBe('Object')

    // Check the object fields
    const objectValue = valueNode.value as any
    expect(objectValue.fields.length).toBe(2)
    expect(objectValue.fields[0].key).toBe('theme')
    expect(objectValue.fields[0].value.type).toBe('string')
    expect(objectValue.fields[0].value.value).toBe('dark')
    expect(objectValue.fields[1].key).toBe('fontSize')
    expect(objectValue.fields[1].value.type).toBe('number')
    expect(objectValue.fields[1].value.value).toBe(16)
  })
})
