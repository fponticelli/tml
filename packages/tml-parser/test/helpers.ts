import { expect } from 'vitest'
import {
  BlockNode,
  ValueNode,
  CommentNode,
  Attribute,
  StringValue,
  NumberValue,
  BooleanValue,
  Node
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
