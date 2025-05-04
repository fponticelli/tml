import * as vscode from 'vscode'
import {
  parseTML,
  Node,
  BlockNode,
  ValueNode,
  Attribute,
  Position,
  Point,
} from '@tml/parser'

// Type for nodes with additional value type information
type NodeWithValueType = Node & { valueType?: string }

/**
 * Converts a TML Point to a VSCode Position
 */
function tmlPointToVSCodePosition(point: Point): vscode.Position {
  // TML positions are 1-based, VSCode positions are 0-based
  return new vscode.Position(point.line - 1, point.column)
}

/**
 * Converts a TML Position to a VSCode Range
 */
function tmlPositionToVSCodeRange(position: Position): vscode.Range {
  const start = tmlPointToVSCodePosition(position.start)
  const end = tmlPointToVSCodePosition(position.end)
  return new vscode.Range(start, end)
}

/**
 * Checks if a VSCode position is within a TML position range
 */
function isPositionInRange(
  position: vscode.Position,
  tmlPosition?: Position
): boolean {
  if (!tmlPosition) return false

  const range = tmlPositionToVSCodeRange(tmlPosition)
  return range.contains(position)
}

/**
 * Finds the node at the given position in the document
 */
function findNodeAtPosition(
  nodes: Node[],
  position: vscode.Position
): Node | undefined {
  for (const node of nodes) {
    if (isPositionInRange(position, node.position)) {
      // For block nodes, check children recursively
      if (node.type === 'Block') {
        const blockNode = node as BlockNode
        const childNode = findNodeAtPosition(blockNode.children, position)
        if (childNode) {
          return childNode
        }
      }

      // For value nodes, check the contained value
      if (node.type === 'Value') {
        const valueNode = node as ValueNode
        if (
          valueNode.value.position &&
          isPositionInRange(position, valueNode.value.position)
        ) {
          // Create a new object with the value type information
          const result = Object.assign({}, node) as NodeWithValueType
          result.valueType = valueNode.value.type
          return result
        }
      }

      // For attribute nodes, check the value
      if (node.type === 'Attribute') {
        const attrNode = node as Attribute
        if (
          attrNode.value.position &&
          isPositionInRange(position, attrNode.value.position)
        ) {
          // Create a new object with the value type information
          const result = Object.assign({}, node) as NodeWithValueType
          result.valueType = attrNode.value.type
          return result
        }
      }

      return node
    }
  }

  return undefined
}

/**
 * Finds the parent block of a node
 */
function findParentBlock(
  nodes: Node[],
  targetNode: Node,
  currentParent?: BlockNode
): BlockNode | undefined {
  for (const node of nodes) {
    if (node === targetNode) {
      return currentParent
    }

    if (node.type === 'Block') {
      const blockNode = node as BlockNode
      const parent = findParentBlock(blockNode.children, targetNode, blockNode)
      if (parent) {
        return parent
      }
    }
  }

  return undefined
}

/**
 * Gets hover information for a node
 */
function getHoverInfo(
  node: Node,
  _document: vscode.TextDocument,
  allNodes: Node[]
): vscode.MarkdownString | undefined {
  const markdown = new vscode.MarkdownString()

  switch (node.type) {
    case 'Block': {
      const blockNode = node as BlockNode
      markdown.appendMarkdown(`**Block**: \`${blockNode.name}\`\n\n`)

      // Add number of children
      if (blockNode.children.length > 0) {
        markdown.appendMarkdown(`Children: ${blockNode.children.length}\n\n`)
      }

      return markdown
    }

    case 'Value': {
      const valueNode = node as ValueNode & { valueType?: string }
      markdown.appendMarkdown(`**Value Node**\n\n`)

      // Add value type information
      if (valueNode.valueType) {
        markdown.appendMarkdown(`Type: \`${valueNode.valueType}\`\n\n`)
      } else {
        markdown.appendMarkdown(`Type: \`${valueNode.value.type}\`\n\n`)
      }

      // Add parent information
      const parent = findParentBlock(allNodes, node)
      if (parent) {
        markdown.appendMarkdown(`Parent: \`${parent.name}\`\n\n`)
      }

      return markdown
    }

    case 'Attribute': {
      const attrNode = node as Attribute & { valueType?: string }
      markdown.appendMarkdown(`**Attribute**: \`${attrNode.key}\`\n\n`)

      // Add value type information
      if (attrNode.valueType) {
        markdown.appendMarkdown(`Value Type: \`${attrNode.valueType}\`\n\n`)
      } else {
        markdown.appendMarkdown(`Value Type: \`${attrNode.value.type}\`\n\n`)
      }

      // Add parent information
      const parent = findParentBlock(allNodes, node)
      if (parent) {
        markdown.appendMarkdown(`Parent: \`${parent.name}\`\n\n`)
      }

      return markdown
    }

    case 'Comment': {
      markdown.appendMarkdown(`**Comment**\n\n`)
      return markdown
    }

    default:
      return undefined
  }
}

/**
 * TML Hover Provider implementation
 */
export class TMLHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    try {
      // Log to output channel
      const outputChannel = vscode.window.createOutputChannel('TML Hover')
      outputChannel.appendLine(
        `Hover requested at position: ${position.line}:${position.character}`
      )
      outputChannel.appendLine(`Document language ID: ${document.languageId}`)

      // Parse the document
      const text = document.getText()
      const nodes = parseTML(text)

      // Find the node at the position
      const node = findNodeAtPosition(nodes, position)
      if (!node) {
        return null
      }

      // Get hover information
      const hoverInfo = getHoverInfo(node, document, nodes)
      if (!hoverInfo) {
        return null
      }

      // Create hover with range
      const range = node.position
        ? tmlPositionToVSCodeRange(node.position)
        : undefined
      return new vscode.Hover(hoverInfo, range)
    } catch (error) {
      // Log error to output channel
      const outputChannel = vscode.window.createOutputChannel('TML Hover Error')
      outputChannel.appendLine(`Error in hover provider: ${error}`)
      return null
    }
  }
}
