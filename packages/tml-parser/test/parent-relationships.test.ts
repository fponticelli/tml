import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  BlockNode,
  ValueNode,
  CommentNode,
  Attribute,
  Node,
} from '../src/types'

/**
 * Helper function to find all nodes of a specific type in a node tree (including nested nodes)
 */
function findAllNodesByType<T extends Node>(
  nodes: Node[],
  type: string,
  result: T[] = []
): T[] {
  for (const node of nodes) {
    if (node.type === type) {
      result.push(node as T)
    }

    if (node.type === 'Block') {
      findAllNodesByType((node as BlockNode).children, type, result)
    }
  }
  return result
}

describe('Parent Relationships in TML', () => {
  describe('Basic Parent Relationships', () => {
    it('should set root nodes to have undefined parent', () => {
      const input = 'block1\nblock2\nblock3'
      const nodes = parseTML(input)

      expect(nodes.length).toBe(3)

      for (const node of nodes) {
        expect(node.type).toBe('Block')
        expect(node.parent).toBeUndefined()
      }
    })

    it('should set direct children to have parent reference to their parent block', () => {
      const input = 'parent\n  child1\n  child2'
      const nodes = parseTML(input)

      expect(nodes.length).toBe(1)
      const parentBlock = nodes[0] as BlockNode
      expect(parentBlock.name).toBe('parent')
      expect(parentBlock.parent).toBeUndefined()

      expect(parentBlock.children.length).toBe(2)
      for (const child of parentBlock.children) {
        expect(child.type).toBe('Block')
        expect(child.parent).toBe(parentBlock)
      }
    })

    it('should set attribute nodes to have parent reference to their parent block', () => {
      const input = 'block attr1=value1 attr2=value2'
      const nodes = parseTML(input)

      expect(nodes.length).toBe(1)
      const block = nodes[0] as BlockNode

      const attributes = block.children.filter(
        child => child.type === 'Attribute'
      )
      expect(attributes.length).toBe(2)

      for (const attr of attributes) {
        expect(attr.parent).toBe(block)
      }
    })

    it('should set value nodes to have parent reference to their parent block', () => {
      const input = 'block: value'
      const nodes = parseTML(input)

      expect(nodes.length).toBe(1)
      const block = nodes[0] as BlockNode

      const values = block.children.filter(child => child.type === 'Value')
      expect(values.length).toBe(1)

      for (const value of values) {
        expect(value.parent).toBe(block)
      }
    })

    it('should set comment nodes to have parent reference to their parent block', () => {
      const input = 'block\n  // This is a comment'
      const nodes = parseTML(input)

      expect(nodes.length).toBe(1)
      const block = nodes[0] as BlockNode

      const comments = block.children.filter(child => child.type === 'Comment')
      expect(comments.length).toBe(1)

      for (const comment of comments) {
        expect(comment.parent).toBe(block)
      }
    })
  })

  describe('Nested Parent Relationships', () => {
    it('should maintain parent relationships through multiple levels of nesting', () => {
      const input = `level1
  level2
    level3
      level4`
      const nodes = parseTML(input)

      expect(nodes.length).toBe(1)
      const level1 = nodes[0] as BlockNode
      expect(level1.parent).toBeUndefined()

      const level2 = level1.children[0] as BlockNode
      expect(level2.parent).toBe(level1)

      const level3 = level2.children[0] as BlockNode
      expect(level3.parent).toBe(level2)

      const level4 = level3.children[0] as BlockNode
      expect(level4.parent).toBe(level3)
    })

    it('should maintain parent relationships in complex nested structures', () => {
      const input = `container
  header
    title: Page Title
    nav
      link href=#home: Home
      link href=#about: About
  content
    section id=main
      h1: Main Content
      p: This is the main content
    aside
      // Sidebar content
      widget: {
        type: "recent-posts",
        count: 5
      }`

      const nodes = parseTML(input)

      // Find all block nodes
      const allBlocks = findAllNodesByType<BlockNode>(nodes, 'Block')

      // Check that each non-root block has a parent
      for (const block of allBlocks) {
        if (block !== nodes[0]) {
          // Skip the root node
          expect(block.parent).toBeDefined()
          expect(block.parent!.type).toBe('Block')
        }
      }

      // Find all value nodes
      const allValues = findAllNodesByType<ValueNode>(nodes, 'Value')

      // Check that each value node has a parent
      for (const value of allValues) {
        expect(value.parent).toBeDefined()
        expect(value.parent!.type).toBe('Block')
      }

      // Find all attribute nodes
      const allAttributes = findAllNodesByType<Attribute>(nodes, 'Attribute')

      // Check that each attribute node has a parent
      for (const attr of allAttributes) {
        expect(attr.parent).toBeDefined()
        expect(attr.parent!.type).toBe('Block')
      }

      // Find all comment nodes
      const allComments = findAllNodesByType<CommentNode>(nodes, 'Comment')

      // Check that each comment node has a parent
      for (const comment of allComments) {
        expect(comment.parent).toBeDefined()
      }
    })
  })

  describe('Value Parent Relationships', () => {
    it('should set attribute values to have parent reference to their containing attribute', () => {
      const input = `block
  attr1=value1
  attr2=123
  attr3=true`

      const nodes = parseTML(input)

      // Find all attributes
      const attributes = findAllNodesByType<Attribute>(nodes, 'Attribute')
      expect(attributes.length).toBe(3)

      // Check that each attribute value has the attribute as its parent
      for (const attr of attributes) {
        expect(attr.value.parent).toBe(attr)
      }
    })

    it('should set primitive values in attributes to have parent reference to their containing attribute', () => {
      const input = `block
  attr1=value1
  attr2=123
  attr3=true`

      const nodes = parseTML(input)

      // Find all attributes
      const attributes = findAllNodesByType<Attribute>(nodes, 'Attribute')

      // Check each attribute value has the attribute as its parent
      for (const attr of attributes) {
        expect(attr.value.parent).toBe(attr)
      }
    })

    it('should set object values in attributes to have parent reference to their containing attribute', () => {
      const input = `block attr={ "name": "App", "version": 1.0 }`

      const nodes = parseTML(input)

      // Find all attributes
      const attributes = findAllNodesByType<Attribute>(nodes, 'Attribute')
      expect(attributes.length).toBe(1)

      // Check the attribute value has the attribute as its parent
      const attr = attributes[0]
      expect(attr.value.type).toBe('Object')
      expect(attr.value.parent).toBe(attr)
    })

    it('should set array values in attributes to have parent reference to their containing attribute', () => {
      const input = `block attr=[1, 2, 3]`

      const nodes = parseTML(input)

      // Find all attributes
      const attributes = findAllNodesByType<Attribute>(nodes, 'Attribute')
      expect(attributes.length).toBe(1)

      // Check the attribute value has the attribute as its parent
      const attr = attributes[0]
      expect(attr.value.type).toBe('Array')
      expect(attr.value.parent).toBe(attr)
    })

    it('should handle boolean shortcut attributes correctly', () => {
      const input = `block attr!`

      const nodes = parseTML(input)

      // Find all attributes
      const attributes = findAllNodesByType<Attribute>(nodes, 'Attribute')
      expect(attributes.length).toBe(1)

      // Check the attribute value has the attribute as its parent
      const attr = attributes[0]
      expect(attr.value.type).toBe('boolean')
      // Type assertion to access the value property
      const boolValue = attr.value as { type: 'boolean'; value: boolean }
      expect(boolValue.value).toBe(true)
      expect(attr.value.parent).toBe(attr)
    })
  })

  describe('Complex Nested Structures', () => {
    it('should maintain parent relationships in deeply nested structures with mixed node types', () => {
      const input = `form id=contact method=post
  fieldset legend="Contact Information"
    div class=form-group
      label for=name: Name
      input type=text id=name required!
    div class=form-group
      label for=email: Email
      input type=email id=email required!
    div class=form-group
      label for=message: Message
      textarea id=message rows=5 cols=30:
        Please enter your message here.
        It can span multiple lines.
  div class=form-actions
    button type=submit: Submit
    // This is a comment
    button type=reset: Reset`

      const nodes = parseTML(input)

      // Find the form block
      expect(nodes.length).toBe(1)
      const form = nodes[0] as BlockNode
      expect(form.type).toBe('Block')
      expect(form.name).toBe('form')
      expect(form.parent).toBeUndefined() // Root node has no parent

      // Find form attributes
      const formAttrs = form.children.filter(
        child => child.type === 'Attribute'
      )
      expect(formAttrs.length).toBe(2)
      for (const attr of formAttrs) {
        expect(attr.parent).toBe(form)
        expect(attr.value.parent).toBe(attr)
      }

      // Find fieldset
      const fieldset = form.children.find(
        child =>
          child.type === 'Block' && (child as BlockNode).name === 'fieldset'
      ) as BlockNode
      expect(fieldset).toBeDefined()
      expect(fieldset.parent).toBe(form)

      // Find legend attribute in fieldset
      const legendAttr = fieldset.children.find(
        child =>
          child.type === 'Attribute' && (child as Attribute).key === 'legend'
      ) as Attribute
      expect(legendAttr).toBeDefined()
      expect(legendAttr.parent).toBe(fieldset)
      expect(legendAttr.value.parent).toBe(legendAttr)

      // Find textarea and its value
      const formGroups = findAllNodesByType<BlockNode>(nodes, 'Block').filter(
        block =>
          block.name === 'div' &&
          block.children.some(
            child =>
              child.type === 'Attribute' &&
              (child as Attribute).key === 'class' &&
              (child as Attribute).value.type === 'string' &&
              ((child as Attribute).value as any).value === 'form-group'
          )
      )

      expect(formGroups.length).toBe(3)

      // Find the textarea in the third form group
      const textarea = formGroups[2].children.find(
        child =>
          child.type === 'Block' && (child as BlockNode).name === 'textarea'
      ) as BlockNode

      expect(textarea).toBeDefined()
      expect(textarea.parent).toBe(formGroups[2])

      // Find the textarea value
      const textareaValue = textarea.children.find(
        child => child.type === 'Value'
      ) as ValueNode

      expect(textareaValue).toBeDefined()
      expect(textareaValue.parent).toBe(textarea)

      // Find the comment
      const comment = findAllNodesByType<CommentNode>(nodes, 'Comment')[0]
      expect(comment).toBeDefined()
      expect(comment.parent).toBeDefined()
    })
  })

  describe('hydrateParents Option', () => {
    it('should not set parent references when hydrateParents is false', () => {
      const input = `parent
  child1
    grandchild
  child2 attr=value`

      const nodes = parseTML(input, { hydrateParents: false })

      // Find all nodes
      const allBlocks = findAllNodesByType<BlockNode>(nodes, 'Block')
      const allAttributes = findAllNodesByType<Attribute>(nodes, 'Attribute')

      // Check that no node has a parent reference
      for (const block of allBlocks) {
        expect(block.parent).toBeUndefined()
      }

      for (const attr of allAttributes) {
        expect(attr.parent).toBeUndefined()
        expect(attr.value.parent).toBeUndefined()
      }
    })

    it('should set parent references when hydrateParents is true (default)', () => {
      const input = `parent
  child1
    grandchild
  child2 attr=value`

      const nodes = parseTML(input, { hydrateParents: true })

      // Find all non-root blocks
      const childBlocks = findAllNodesByType<BlockNode>(nodes, 'Block').filter(
        block => block !== nodes[0]
      )

      // Check that each non-root block has a parent
      for (const block of childBlocks) {
        expect(block.parent).toBeDefined()
      }

      // Find all attributes
      const allAttributes = findAllNodesByType<Attribute>(nodes, 'Attribute')

      // Check that each attribute has a parent
      for (const attr of allAttributes) {
        expect(attr.parent).toBeDefined()
        expect(attr.value.parent).toBe(attr)
      }
    })
  })
})
