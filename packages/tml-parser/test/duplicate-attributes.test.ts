import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { Attribute, StringValue, BooleanValue } from '../src/types'
import { assertBlockNode, assertChildBlock } from './helpers'

describe('Duplicate Attributes', () => {
  it('should preserve duplicate attributes in order', () => {
    const input = `div class=primary class=secondary class=tertiary`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const div = assertBlockNode(result[0], 'div')

    // Count the class attributes
    const classAttributes = div.children.filter(
      child =>
        child.type === 'Attribute' && (child as Attribute).key === 'class'
    ) as Attribute[]

    expect(classAttributes.length).toBe(3)

    // Check the values in order
    expect((classAttributes[0].value as StringValue).value).toBe('primary')
    expect((classAttributes[1].value as StringValue).value).toBe('secondary')
    expect((classAttributes[2].value as StringValue).value).toBe('tertiary')
  })

  it('should preserve duplicate attributes with different types', () => {
    const input = `button disabled=false disabled! disabled="true"`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const button = assertBlockNode(result[0], 'button')

    // Count the disabled attributes
    const disabledAttributes = button.children.filter(
      child =>
        child.type === 'Attribute' && (child as Attribute).key === 'disabled'
    ) as Attribute[]

    expect(disabledAttributes.length).toBe(3)

    // Check the values in order
    expect((disabledAttributes[0].value as BooleanValue).value).toBe(false)
    expect((disabledAttributes[1].value as BooleanValue).value).toBe(true)
    expect((disabledAttributes[2].value as StringValue).value).toBe('true')
  })

  it('should preserve duplicate attributes in nested blocks', () => {
    const inputText = `form
  input type=text type=email name=contact`

    const result = parseTML(inputText)
    expect(result.length).toBe(1)

    const form = assertBlockNode(result[0], 'form')
    const inputNode = assertChildBlock(form, 'input')

    // Count the type attributes
    const typeAttributes = inputNode.children.filter(
      child => child.type === 'Attribute' && (child as Attribute).key === 'type'
    ) as Attribute[]

    expect(typeAttributes.length).toBe(2)

    // Check the values in order
    expect((typeAttributes[0].value as StringValue).value).toBe('text')
    expect((typeAttributes[1].value as StringValue).value).toBe('email')
  })
})
