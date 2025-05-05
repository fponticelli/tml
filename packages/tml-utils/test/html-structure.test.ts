import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseTML,
  BlockNode,
  ValueNode,
  Attribute,
  CommentNode,
  StringValue,
} from '@tml/parser'
import {
  findNodeAtPosition,
  findParentBlock,
  findNodesByType,
  findBlocksByName,
} from '../src'

describe('HTML Structure Tests', () => {
  // Sample TML content that resembles HTML
  const tmlContent = `// This is a sample TML file
$schema: "https://example.com/schema/tml-html/1.0"
html lang=en
  head
    title: My Website
    meta charset=UTF-8
`

  let nodes: ReturnType<typeof parseTML>
  let htmlNode: BlockNode
  let headNode: BlockNode
  let titleNode: BlockNode
  let metaNode: BlockNode

  // Parse the TML content before each test
  beforeEach(() => {
    nodes = parseTML(tmlContent)
  })

  describe('Basic Structure', () => {
    it('should parse the TML content correctly', () => {
      expect(nodes).toBeDefined()
      expect(nodes.length).toBe(3) // Comment, $schema value node, html block
    })

    it('should identify the comment node', () => {
      const commentNodes = findNodesByType<CommentNode>(nodes, 'Comment')
      expect(commentNodes.length).toBe(1)
      expect(commentNodes[0].value).toBe('This is a sample TML file')
      expect(commentNodes[0].isLineComment).toBe(true)
    })

    it('should identify the $schema value node', () => {
      const schemaNode = nodes[1]
      expect(schemaNode.type).toBe('Block')

      const blockNode = schemaNode as BlockNode
      expect(blockNode.name).toBe('$schema')

      const valueNode = blockNode.children[0] as ValueNode
      expect(valueNode.type).toBe('Value')
      expect(valueNode.value.type).toBe('String')
      expect((valueNode.value as StringValue).value).toBe(
        'https://example.com/schema/tml-html/1.0'
      )
    })

    it('should identify the html block', () => {
      const htmlBlocks = findBlocksByName(nodes, 'html')
      expect(htmlBlocks.length).toBe(1)

      htmlNode = htmlBlocks[0]
      expect(htmlNode.name).toBe('html')

      // Check the lang attribute
      const langAttr = htmlNode.children.find(
        child =>
          child.type === 'Attribute' && (child as Attribute).key === 'lang'
      ) as Attribute

      expect(langAttr).toBeDefined()
      expect(langAttr.value.type).toBe('String')
      expect((langAttr.value as StringValue).value).toBe('en')
    })
  })

  describe('Nested Structure', () => {
    beforeEach(() => {
      // Get the html node
      htmlNode = findBlocksByName(nodes, 'html')[0]

      // Get the head node
      const headBlocks = findBlocksByName([htmlNode], 'head')
      expect(headBlocks.length).toBe(1)
      headNode = headBlocks[0]

      // Get the title node
      const titleBlocks = findBlocksByName([headNode], 'title')
      expect(titleBlocks.length).toBe(1)
      titleNode = titleBlocks[0]

      // Get the meta node
      const metaBlocks = findBlocksByName([headNode], 'meta')
      expect(metaBlocks.length).toBe(1)
      metaNode = metaBlocks[0]
    })

    it('should find the head block inside html', () => {
      expect(headNode).toBeDefined()
      expect(headNode.name).toBe('head')

      // Check that head is a child of html
      const parent = findParentBlock(nodes, headNode)
      expect(parent).toBe(htmlNode)
    })

    it('should find the title block inside head', () => {
      expect(titleNode).toBeDefined()
      expect(titleNode.name).toBe('title')

      // Check that title is a child of head
      const parent = findParentBlock(nodes, titleNode)
      expect(parent).toBe(headNode)

      // Check the title value
      const valueNode = titleNode.children.find(
        child => child.type === 'Value'
      ) as ValueNode
      expect(valueNode).toBeDefined()
      expect(valueNode.value.type).toBe('String')
      expect((valueNode.value as StringValue).value).toBe('My Website')
    })

    it('should find the meta block inside head', () => {
      expect(metaNode).toBeDefined()
      expect(metaNode.name).toBe('meta')

      // Check that meta is a child of head
      const parent = findParentBlock(nodes, metaNode)
      expect(parent).toBe(headNode)

      // Check the charset attribute
      const charsetAttr = metaNode.children.find(
        child =>
          child.type === 'Attribute' && (child as Attribute).key === 'charset'
      ) as Attribute

      expect(charsetAttr).toBeDefined()
      expect(charsetAttr.value.type).toBe('String')
      expect((charsetAttr.value as StringValue).value).toBe('UTF-8')
    })
  })

  describe('Finding Nodes by Type', () => {
    it('should find all block nodes', () => {
      const blockNodes = findNodesByType<BlockNode>(nodes, 'Block')
      expect(blockNodes.length).toBe(5) // $schema, html, head, title, meta
    })

    it('should find all attribute nodes', () => {
      const attrNodes = findNodesByType<Attribute>(nodes, 'Attribute')
      expect(attrNodes.length).toBe(2) // lang, charset

      // Check attribute keys
      const keys = attrNodes.map((attr: Attribute) => attr.key)
      expect(keys).toContain('lang')
      expect(keys).toContain('charset')
    })

    it('should find all value nodes', () => {
      const valueNodes = findNodesByType<ValueNode>(nodes, 'Value')
      expect(valueNodes.length).toBe(2) // $schema value, title value

      // Check one of the values
      const titleValue = valueNodes.find(
        (node: ValueNode) => (node.value as StringValue).value === 'My Website'
      )
      expect(titleValue).toBeDefined()
    })

    it('should find all comment nodes', () => {
      const commentNodes = findNodesByType<CommentNode>(nodes, 'Comment')
      expect(commentNodes.length).toBe(1)
      expect(commentNodes[0].value).toBe('This is a sample TML file')
    })
  })

  describe('Finding Blocks by Name', () => {
    it('should find html block', () => {
      const htmlBlocks = findBlocksByName(nodes, 'html')
      expect(htmlBlocks.length).toBe(1)
      expect(htmlBlocks[0].name).toBe('html')
    })

    it('should find head block', () => {
      const headBlocks = findBlocksByName(nodes, 'head')
      expect(headBlocks.length).toBe(1)
      expect(headBlocks[0].name).toBe('head')
    })

    it('should find title block', () => {
      const titleBlocks = findBlocksByName(nodes, 'title')
      expect(titleBlocks.length).toBe(1)
      expect(titleBlocks[0].name).toBe('title')
    })

    it('should find meta block', () => {
      const metaBlocks = findBlocksByName(nodes, 'meta')
      expect(metaBlocks.length).toBe(1)
      expect(metaBlocks[0].name).toBe('meta')
    })

    it('should not find non-existent blocks', () => {
      const bodyBlocks = findBlocksByName(nodes, 'body')
      expect(bodyBlocks.length).toBe(0)
    })
  })

  describe('Parent-Child Relationships', () => {
    // We'll use a different approach for testing parent-child relationships

    it('should verify html has no parent', () => {
      // For root nodes, we can check directly
      expect(htmlNode.type).toBe('Block')
      expect(htmlNode.name).toBe('html')

      // HTML should be a root node, so it has no parent in the original nodes array
      const htmlNodes = findBlocksByName(nodes, 'html')
      expect(htmlNodes.length).toBe(1)
      expect(htmlNodes[0]).toEqual(htmlNode)
    })

    it('should verify head is inside html', () => {
      // Check that head is a child of html
      const headInHtml = htmlNode.children.find(
        child => child.type === 'Block' && (child as BlockNode).name === 'head'
      )
      expect(headInHtml).toBeDefined()
      expect(headInHtml).toEqual(headNode)
    })

    it('should verify title is inside head', () => {
      // Check that title is a child of head
      const titleInHead = headNode.children.find(
        child => child.type === 'Block' && (child as BlockNode).name === 'title'
      )
      expect(titleInHead).toBeDefined()
      expect(titleInHead).toEqual(titleNode)
    })

    it('should verify meta is inside head', () => {
      // Check that meta is a child of head
      const metaInHead = headNode.children.find(
        child => child.type === 'Block' && (child as BlockNode).name === 'meta'
      )
      expect(metaInHead).toBeDefined()
      expect(metaInHead).toEqual(metaNode)
    })

    it('should verify parent chain from title to root', () => {
      // Manually verify the chain
      expect(titleNode.type).toBe('Block')
      expect(titleNode.name).toBe('title')

      // Title should be in head's children
      const titleInHead = headNode.children.includes(titleNode)
      expect(titleInHead).toBe(true)

      // Head should be in html's children
      const headInHtml = htmlNode.children.includes(headNode)
      expect(headInHtml).toBe(true)

      // HTML should be a root node
      const htmlInRoot = nodes.some(
        node => node.type === 'Block' && (node as BlockNode).name === 'html'
      )
      expect(htmlInRoot).toBe(true)
    })
  })

  describe('Finding Nodes by Position', () => {
    // We'll test the findNodeAtPosition function with the nodes array

    it('should find the comment node at different positions', () => {
      // Comment: "// This is a sample TML file" (line 1)
      const commentNode = findNodesByType<CommentNode>(nodes, 'Comment')[0]

      // Start boundary
      const startPos = { line: 1, column: 0 }
      const nodeAtStart = findNodeAtPosition(nodes, startPos)
      expect(nodeAtStart).toBeDefined()
      expect(nodeAtStart?.type).toBe('Comment')

      // Middle position
      const middlePos = { line: 1, column: 10 }
      const nodeAtMiddle = findNodeAtPosition(nodes, middlePos)
      expect(nodeAtMiddle).toBeDefined()
      expect(nodeAtMiddle?.type).toBe('Comment')

      // End boundary (just before the end)
      const endPos = { line: 1, column: commentNode.position!.end.column - 1 }
      const nodeAtEnd = findNodeAtPosition(nodes, endPos)
      expect(nodeAtEnd).toBeDefined()
      expect(nodeAtEnd?.type).toBe('Comment')
    })

    it('should find the $schema node at different positions', () => {
      // $schema: "https://example.com/schema/tml-html/1.0" (line 2)

      // Start boundary
      const startPos = { line: 2, column: 0 }
      const nodeAtStart = findNodeAtPosition(nodes, startPos)
      expect(nodeAtStart).toBeDefined()
      expect(nodeAtStart?.type).toBe('Block')
      expect((nodeAtStart as BlockNode).name).toBe('$schema')

      // Value position (inside the string)
      const valuePos = { line: 2, column: 10 }
      const nodeAtValue = findNodeAtPosition(nodes, valuePos)
      expect(nodeAtValue).toBeDefined()
      expect(nodeAtValue?.type).toBe('Value')
    })

    it('should find the html block at different positions', () => {
      // html lang=en (line 3)

      // Start boundary
      const startPos = { line: 3, column: 0 }
      const nodeAtStart = findNodeAtPosition(nodes, startPos)
      expect(nodeAtStart).toBeDefined()
      expect(nodeAtStart?.type).toBe('Block')
      expect((nodeAtStart as BlockNode).name).toBe('html')

      // Attribute position
      const attrPos = { line: 3, column: 7 }
      const nodeAtAttr = findNodeAtPosition(nodes, attrPos)
      expect(nodeAtAttr).toBeDefined()
      expect(nodeAtAttr?.type).toBe('Attribute')
      expect((nodeAtAttr as Attribute).key).toBe('lang')
    })

    it('should find the head block at different positions', () => {
      // head (line 4)

      // Start boundary
      const startPos = { line: 4, column: 2 }
      const nodeAtStart = findNodeAtPosition(nodes, startPos)
      expect(nodeAtStart).toBeDefined()
      expect(nodeAtStart?.type).toBe('Block')
      expect((nodeAtStart as BlockNode).name).toBe('head')

      // Middle position
      const middlePos = { line: 4, column: 4 }
      const nodeAtMiddle = findNodeAtPosition(nodes, middlePos)
      expect(nodeAtMiddle).toBeDefined()
      expect(nodeAtMiddle?.type).toBe('Block')
      expect((nodeAtMiddle as BlockNode).name).toBe('head')
    })

    it('should find the title block and its value at different positions', () => {
      // title: My Website (line 5)

      // Block position
      const blockPos = { line: 5, column: 4 }
      const nodeAtBlock = findNodeAtPosition(nodes, blockPos)
      expect(nodeAtBlock).toBeDefined()
      expect(nodeAtBlock?.type).toBe('Block')
      expect((nodeAtBlock as BlockNode).name).toBe('title')

      // Value position
      const valuePos = { line: 5, column: 12 }
      const nodeAtValue = findNodeAtPosition(nodes, valuePos)
      expect(nodeAtValue).toBeDefined()
      expect(nodeAtValue?.type).toBe('Value')
    })

    it('should find the meta block and its attribute at different positions', () => {
      // meta charset=UTF-8 (line 6)

      // Block position
      const blockPos = { line: 6, column: 4 }
      const nodeAtBlock = findNodeAtPosition(nodes, blockPos)
      expect(nodeAtBlock).toBeDefined()
      expect(nodeAtBlock?.type).toBe('Block')
      expect((nodeAtBlock as BlockNode).name).toBe('meta')

      // Attribute key position
      const keyPos = { line: 6, column: 10 }
      const nodeAtKey = findNodeAtPosition(nodes, keyPos)
      expect(nodeAtKey).toBeDefined()
      expect(nodeAtKey?.type).toBe('Attribute')
      expect((nodeAtKey as Attribute).key).toBe('charset')

      // Attribute value position
      const valuePos = { line: 6, column: 18 }
      const nodeAtValue = findNodeAtPosition(nodes, valuePos)
      expect(nodeAtValue).toBeDefined()
      expect(nodeAtValue?.type).toBe('Attribute')
      expect((nodeAtValue as Attribute).key).toBe('charset')
    })

    it('should handle positions at exact boundaries', () => {
      // Test exact start and end positions of nodes

      // HTML block exact start
      const htmlStartPos = {
        line: htmlNode.position!.start.line,
        column: htmlNode.position!.start.column,
      }
      const nodeAtHtmlStart = findNodeAtPosition(nodes, htmlStartPos)
      expect(nodeAtHtmlStart).toBeDefined()
      expect(nodeAtHtmlStart?.type).toBe('Block')
      expect((nodeAtHtmlStart as BlockNode).name).toBe('html')

      // Title block exact start
      const titleStartPos = {
        line: titleNode.position!.start.line,
        column: titleNode.position!.start.column,
      }
      const nodeAtTitleStart = findNodeAtPosition(nodes, titleStartPos)
      expect(nodeAtTitleStart).toBeDefined()
      expect(nodeAtTitleStart?.type).toBe('Block')
      expect((nodeAtTitleStart as BlockNode).name).toBe('title')

      // Meta block exact end (should still find the attribute node)
      const metaEndPos = {
        line: metaNode.position!.end.line,
        column: metaNode.position!.end.column,
      }
      const nodeAtMetaEnd = findNodeAtPosition(nodes, metaEndPos)
      expect(nodeAtMetaEnd).toBeDefined()
      expect(nodeAtMetaEnd?.type).toBe('Attribute')
      expect((nodeAtMetaEnd as Attribute).key).toBe('charset')
    })

    it('should return undefined for positions outside any node', () => {
      // Position before any content
      const beforePos = { line: 0, column: 0 }
      const nodeBeforeContent = findNodeAtPosition(nodes, beforePos)
      expect(nodeBeforeContent).toBeUndefined()

      // Position after all content
      const afterPos = { line: 10, column: 0 }
      const nodeAfterContent = findNodeAtPosition(nodes, afterPos)
      expect(nodeAfterContent).toBeUndefined()

      // Position in empty space between nodes (if there is any)
      const emptyPos = { line: 7, column: 0 }
      const nodeInEmptySpace = findNodeAtPosition(nodes, emptyPos)
      expect(nodeInEmptySpace).toBeUndefined()
    })
  })
})
