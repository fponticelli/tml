import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { Attribute, StringValue, ValueNode } from '../src/types'
import {
  assertBlockNode,
  assertBlockHasAttributes,
  assertBlockHasAttribute,
  assertChildBlock,
} from './helpers'

describe('Special Block Names', () => {
  it('should parse $ref blocks correctly', () => {
    const input = `$ref path="./components/button.tml" id=myButton`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const refBlock = assertBlockNode(result[0], '$ref')
    assertBlockHasAttributes(refBlock, [
      { key: 'path', valueType: 'String', value: './components/button.tml' },
      { key: 'id', valueType: 'String', value: 'myButton' },
    ])
  })

  it('should parse $include blocks correctly', () => {
    const input = `$include source="./partials/header.tml" cache=false`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const includeBlock = assertBlockNode(result[0], '$include')
    assertBlockHasAttributes(includeBlock, [
      { key: 'source', valueType: 'String', value: './partials/header.tml' },
      { key: 'cache', valueType: 'Boolean', value: false },
    ])
  })

  it('should parse nested blocks with $ names', () => {
    const input = `container
  $ref path="./components/header.tml"
  content
    $include source="./partials/sidebar.tml"`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const container = assertBlockNode(result[0], 'container')
    const refBlock = assertChildBlock(container, '$ref')
    assertBlockHasAttribute(
      refBlock,
      'path',
      'String',
      './components/header.tml'
    )

    const content = assertChildBlock(container, 'content')
    const includeBlock = assertChildBlock(content, '$include')
    assertBlockHasAttribute(
      includeBlock,
      'source',
      'String',
      './partials/sidebar.tml'
    )
  })

  it('should parse $ref blocks with values', () => {
    // Create a block with attribute and value directly
    const input = `$ref
  path="./template.tml"
  : Default content`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const refBlock = assertBlockNode(result[0], '$ref')

    // Check for the path attribute
    const pathAttr = refBlock.children.find(
      child => child.type === 'Attribute' && (child as Attribute).key === 'path'
    ) as Attribute | undefined

    expect(pathAttr).toBeDefined()
    if (pathAttr) {
      expect(pathAttr.value.type).toBe('String')
      expect((pathAttr.value as StringValue).value).toBe('./template.tml')
    }

    // Check that the value is correctly parsed
    const valueNode = refBlock.children.find(
      child => child.type === 'Value'
    ) as ValueNode | undefined

    expect(valueNode).toBeDefined()
    if (valueNode) {
      expect(valueNode.value.type).toBe('String')
      expect((valueNode.value as StringValue).value).toBe('Default content')
    }
  })
})
