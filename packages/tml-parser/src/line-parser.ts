import { Node } from '@/types'
import { createLinePosition } from './position'
import {
  parseAttribute,
  parseBlockComment,
  parseLineComment,
  parseValueNode,
} from './node-parsers'
import { tokenizeLine } from './tokenizer'

/**
 * Parses a line of TML into a node.
 */
export function parseLine(
  line: string,
  lineNumber: number
): { indent: number; node: Node | null } {
  // Skip empty lines
  if (!line.trim()) {
    return { indent: 0, node: null }
  }

  // Calculate indentation
  const indent = line.search(/\S/)
  if (indent === -1) {
    return { indent: 0, node: null }
  }

  const trimmedLine = line.trim()

  // Handle line comments
  if (trimmedLine.startsWith('//')) {
    return {
      indent,
      node: parseLineComment(trimmedLine, lineNumber, indent),
    }
  }

  // Handle block comments
  if (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/')) {
    return {
      indent,
      node: parseBlockComment(trimmedLine, lineNumber, indent),
    }
  }

  // Handle value nodes
  if (trimmedLine.startsWith(':')) {
    return {
      indent,
      node: parseValueNode(trimmedLine, lineNumber, indent),
    }
  }

  // Handle attributes (key=value or key!) on their own line
  if (
    (trimmedLine.includes('=') || trimmedLine.endsWith('!')) &&
    !trimmedLine.includes(' ') &&
    !trimmedLine.includes(':')
  ) {
    return {
      indent,
      node: parseAttribute(trimmedLine, lineNumber, indent),
    }
  }

  // Handle block nodes with values (e.g., "title: My Page")
  const colonIndex = trimmedLine.indexOf(':')
  if (colonIndex > 0 && !trimmedLine.substring(0, colonIndex).includes(' ')) {
    const blockName = trimmedLine.substring(0, colonIndex)
    const valueText = trimmedLine.substring(colonIndex)

    // If there's content after the colon, parse it as a value
    if (valueText.length > 1 && valueText.trim().length > 1) {
      // Special handling for $ref blocks with values
      // Check if this is a block with attributes followed by a value
      if (blockName.startsWith('$') && blockName.includes('=')) {
        // Extract the actual block name and the attribute
        const equalIndex = blockName.indexOf('=')
        const actualBlockName = blockName.substring(0, equalIndex).trim()
        const attributeText = blockName.substring(equalIndex)

        // Parse the attribute
        const attribute = parseAttribute(
          attributeText,
          lineNumber,
          indent + actualBlockName.length
        )

        // Parse the value
        const valueNode = parseValueNode(
          valueText,
          lineNumber,
          indent + colonIndex
        )

        // Create the block with both attribute and value
        return {
          indent,
          node: {
            type: 'Block',
            name: actualBlockName,
            children: [attribute, valueNode],
            position: createLinePosition(
              lineNumber,
              indent,
              indent + trimmedLine.length
            ),
          },
        }
      }

      // Normal case - block with value
      const valueNode = parseValueNode(
        valueText,
        lineNumber,
        indent + colonIndex
      )

      return {
        indent,
        node: {
          type: 'Block',
          name: blockName,
          children: [valueNode],
          position: createLinePosition(
            lineNumber,
            indent,
            indent + trimmedLine.length
          ),
        },
      }
    } else {
      // If there's only a colon (or colon + whitespace), return just the block
      // The multiline value will be handled by the main parser
      return {
        indent,
        node: {
          type: 'Block',
          name: blockName,
          children: [],
          position: createLinePosition(
            lineNumber,
            indent,
            indent + trimmedLine.length
          ),
        },
      }
    }
  }

  // Handle block nodes
  const tokens = tokenizeLine(trimmedLine)
  if (tokens.length === 0) {
    return { indent: 0, node: null }
  }

  const blockName = tokens[0]
  const children: Node[] = []
  let currentColumn = indent + blockName.length + 1

  // Process remaining tokens
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]

    // Skip empty tokens
    if (!token.trim()) {
      currentColumn += token.length + 1
      continue
    }

    // Handle comments
    if (token.startsWith('//')) {
      children.push(parseLineComment(token, lineNumber, currentColumn))
      break
    }

    if (token.startsWith('/*') && token.endsWith('*/')) {
      children.push(parseBlockComment(token, lineNumber, currentColumn))
      currentColumn += token.length + 1
      continue
    }

    // Handle value nodes (inline with :)
    if (token.startsWith(':')) {
      // Find where the value ends - collect all remaining tokens as part of the value
      // This ensures that values after attributes are treated as a single value node
      const valueEndIndex = tokens.length - 1

      // Collect the value tokens
      const valueText = tokens.slice(i).join(' ')
      children.push(parseValueNode(valueText, lineNumber, currentColumn))

      // Update the current position and exit the loop
      currentColumn += valueText.length + 1
      i = valueEndIndex
      continue
    }

    // Handle attributes (key=value or key!)
    if (token.includes('=') || token.endsWith('!')) {
      // Handle invalid attribute syntax (e.g., =invalid)
      if (token.startsWith('=')) {
        // Skip invalid attributes but continue parsing
        currentColumn += token.length + 1
        continue
      }

      children.push(parseAttribute(token, lineNumber, currentColumn))
      currentColumn += token.length + 1
      continue
    }

    // Handle inline blocks
    children.push({
      type: 'Block',
      name: token,
      children: [],
      position: createLinePosition(
        lineNumber,
        currentColumn,
        currentColumn + token.length
      ),
    })

    currentColumn += token.length + 1
  }

  // Create the block node
  return {
    indent,
    node: {
      type: 'Block',
      name: blockName,
      children,
      position: createLinePosition(
        lineNumber,
        indent,
        indent + trimmedLine.length
      ),
    },
  }
}
