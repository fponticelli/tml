import { expect } from 'vitest'
import {
  BlockNode,
  ValueNode,
  CommentNode,
  Attribute,
  StringValue,
  NumberValue,
  BooleanValue,
  Node,
  PositionedObjectValue,
  PositionedArrayValue,
  ArrayElement,
  ObjectField
} from '../src/types'

/**
 * Helper function to assert that a node is a BlockNode
 */
export function assertBlockNode(node: Node, name: string, childrenCount?: number): BlockNode {
  expect(node.type).toBe('Block')
  const blockNode = node as BlockNode
  expect(blockNode.name).toBe(name)

  if (childrenCount !== undefined) {
    expect(blockNode.children.length).toBe(childrenCount)
  }

  return blockNode
}

/**
 * Helper function to assert that a node is a ValueNode
 */
export function assertValueNode(node: Node, expectedValueType: string): ValueNode {
  expect(node.type).toBe('Value')
  const valueNode = node as ValueNode
  expect(valueNode.value.type).toBe(expectedValueType)
  return valueNode
}

/**
 * Helper function to assert that a node is a CommentNode
 */
export function assertCommentNode(node: Node, expectedValue: string, isLineComment: boolean): CommentNode {
  expect(node.type).toBe('Comment')
  const commentNode = node as CommentNode
  expect(commentNode.value).toBe(expectedValue)
  expect(commentNode.isLineComment).toBe(isLineComment)
  return commentNode
}

/**
 * Helper function to get a string value from a value node
 */
export function getStringValue(valueNode: ValueNode): string {
  expect(valueNode.value.type).toBe('String')
  return (valueNode.value as StringValue).value
}

/**
 * Helper function to get a number value from a value node
 */
export function getNumberValue(valueNode: ValueNode): number {
  expect(valueNode.value.type).toBe('Number')
  return (valueNode.value as NumberValue).value
}

/**
 * Helper function to get a boolean value from a value node
 */
export function getBooleanValue(valueNode: ValueNode): boolean {
  expect(valueNode.value.type).toBe('Boolean')
  return (valueNode.value as BooleanValue).value
}

/**
 * Helper function to find a child block node by name
 */
export function findChildBlockByName(parent: BlockNode, name: string): BlockNode | undefined {
  const child = parent.children.find(
    child => child.type === 'Block' && (child as BlockNode).name === name
  ) as BlockNode | undefined

  return child
}

/**
 * Helper function to assert the existence of a child block and return it
 */
export function assertChildBlock(parent: BlockNode, name: string, childrenCount?: number): BlockNode {
  const child = findChildBlockByName(parent, name)
  expect(child).toBeDefined()
  return assertBlockNode(child!, name, childrenCount)
}

/**
 * Helper function to assert that a block has a string value
 */
export function assertBlockWithStringValue(block: BlockNode, expectedValue: string): void {
  expect(block.children.length).toBe(1)
  const valueNode = assertValueNode(block.children[0], 'String')
  expect(getStringValue(valueNode)).toBe(expectedValue)
}

/**
 * Helper function to assert that a block has a number value
 */
export function assertBlockWithNumberValue(block: BlockNode, expectedValue: number): void {
  expect(block.children.length).toBe(1)
  const valueNode = assertValueNode(block.children[0], 'Number')
  expect(getNumberValue(valueNode)).toBe(expectedValue)
}

/**
 * Helper function to assert that a block has a boolean value
 */
export function assertBlockWithBooleanValue(block: BlockNode, expectedValue: boolean): void {
  expect(block.children.length).toBe(1)
  const valueNode = assertValueNode(block.children[0], 'Boolean')
  expect(getBooleanValue(valueNode)).toBe(expectedValue)
}

/**
 * Helper function to assert that a block has a specific attribute
 */
export function assertBlockHasAttribute(block: BlockNode, key: string, valueType: string, value?: any): void {
  const attribute = block.children.find(
    child => child.type === 'Attribute' && (child as Attribute).key === key
  ) as Attribute | undefined

  expect(attribute).toBeDefined()
  expect(attribute!.value.type).toBe(valueType)

  if (value !== undefined) {
    if (valueType === 'String') {
      expect((attribute!.value as StringValue).value).toBe(value)
    } else if (valueType === 'Number') {
      expect((attribute!.value as NumberValue).value).toBe(value)
    } else if (valueType === 'Boolean') {
      expect((attribute!.value as BooleanValue).value).toBe(value)
    }
  }
}

/**
 * Helper function to assert that a block has multiple attributes
 */
export function assertBlockHasAttributes(block: BlockNode, attributes: Array<{key: string, valueType: string, value?: any}>): void {
  const attributeNodes = block.children.filter(
    child => child.type === 'Attribute'
  ) as Attribute[]

  expect(attributeNodes.length).toBeGreaterThanOrEqual(attributes.length)

  for (const attr of attributes) {
    assertBlockHasAttribute(block, attr.key, attr.valueType, attr.value)
  }
}

/**
 * Helper function to assert that a node is an object value
 */
export function assertObjectValue(valueNode: ValueNode): PositionedObjectValue {
  expect(valueNode.value.type).toBe('Object')
  return valueNode.value as PositionedObjectValue
}

/**
 * Helper function to assert that a node is an array value
 */
export function assertArrayValue(valueNode: ValueNode): PositionedArrayValue {
  expect(valueNode.value.type).toBe('Array')
  return valueNode.value as PositionedArrayValue
}

/**
 * Helper function to assert that an object has a specific field
 */
export function assertObjectHasField(obj: PositionedObjectValue, key: string, valueType: string, value?: any): void {
  const field = obj.fields.find(
    field => field.type === 'Field' && (field as ObjectField).key === key
  ) as ObjectField | undefined

  expect(field).toBeDefined()
  expect(field!.value.type).toBe(valueType)

  if (value !== undefined) {
    if (valueType === 'String') {
      expect((field!.value as StringValue).value).toBe(value)
    } else if (valueType === 'Number') {
      expect((field!.value as NumberValue).value).toBe(value)
    } else if (valueType === 'Boolean') {
      expect((field!.value as BooleanValue).value).toBe(value)
    }
  }
}

/**
 * Helper function to assert that an array has a specific element
 */
export function assertArrayHasElement(arr: PositionedArrayValue, index: number, valueType: string, value?: any): void {
  expect(arr.elements.length).toBeGreaterThan(index)

  const element = arr.elements[index] as ArrayElement
  expect(element.type).toBe('Element')
  expect(element.value.type).toBe(valueType)

  if (value !== undefined) {
    if (valueType === 'String') {
      expect((element.value as StringValue).value).toBe(value)
    } else if (valueType === 'Number') {
      expect((element.value as NumberValue).value).toBe(value)
    } else if (valueType === 'Boolean') {
      expect((element.value as BooleanValue).value).toBe(value)
    }
  }
}

/**
 * Helper function to find an attribute in a block
 */
export function findAttribute(block: BlockNode, key: string): Attribute | undefined {
  return block.children.find(
    child => child.type === 'Attribute' && (child as Attribute).key === key
  ) as Attribute | undefined
}

/**
 * Helper function to find a value node in a block's children
 */
export function findValueNode(block: BlockNode): ValueNode | undefined {
  return block.children.find(
    child => child.type === 'Value'
  ) as ValueNode | undefined
}

/**
 * Helper function to count attributes in a block
 */
export function countAttributes(block: BlockNode): number {
  return block.children.filter(child => child.type === 'Attribute').length
}

/**
 * Helper function to count value nodes in a block
 */
export function countValueNodes(block: BlockNode): number {
  return block.children.filter(child => child.type === 'Value').length
}

/**
 * Helper function to count comment nodes in a block
 */
export function countCommentNodes(block: BlockNode): number {
  return block.children.filter(child => child.type === 'Comment').length
}

/**
 * Helper function to assert that a block has a specific number of each node type
 */
export function assertBlockChildCounts(
  block: BlockNode,
  counts: {
    attributes?: number,
    values?: number,
    blocks?: number,
    comments?: number
  }
): void {
  if (counts.attributes !== undefined) {
    expect(countAttributes(block)).toBe(counts.attributes)
  }

  if (counts.values !== undefined) {
    expect(countValueNodes(block)).toBe(counts.values)
  }

  if (counts.blocks !== undefined) {
    expect(block.children.filter(child => child.type === 'Block').length).toBe(counts.blocks)
  }

  if (counts.comments !== undefined) {
    expect(countCommentNodes(block)).toBe(counts.comments)
  }
}
