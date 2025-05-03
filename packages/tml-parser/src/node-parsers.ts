import { Attribute, CommentNode, ValueNode } from '@/types'
import { createLinePosition } from './position'
import { parseValue } from './value-parsers'

/**
 * Parses an attribute (key=value).
 */
export function parseAttribute(
  text: string,
  line: number,
  startColumn: number
): Attribute {
  const equalsIndex = text.indexOf('=')

  // Handle boolean shortcut (key!)
  if (equalsIndex === -1 && text.endsWith('!')) {
    const key = text.slice(0, -1)
    const position = createLinePosition(
      line,
      startColumn,
      startColumn + text.length
    )

    return {
      type: 'Attribute',
      key,
      value: {
        type: 'Boolean',
        value: true,
        position,
      },
      position,
    }
  }

  // Regular key=value attribute
  if (equalsIndex > 0) {
    const key = text.slice(0, equalsIndex).trim()
    let valueText = text.slice(equalsIndex + 1).trim()

    // Handle the case where the value contains a colon (e.g., path="./template.tml":)
    // This is to fix the issue with $ref blocks with values test
    if (valueText.endsWith(':')) {
      valueText = valueText.slice(0, -1)
    }

    const position = createLinePosition(
      line,
      startColumn,
      startColumn + text.length
    )

    return {
      type: 'Attribute',
      key,
      value: parseValue(valueText, position),
      position,
    }
  }

  // Fallback - treat as boolean true
  return {
    type: 'Attribute',
    key: text,
    value: {
      type: 'Boolean',
      value: true,
      position: createLinePosition(
        line,
        startColumn,
        startColumn + text.length
      ),
    },
    position: createLinePosition(line, startColumn, startColumn + text.length),
  }
}

/**
 * Parses a line comment.
 */
export function parseLineComment(
  text: string,
  line: number,
  startColumn: number
): CommentNode {
  const commentText = text.startsWith('//') ? text.slice(2).trim() : text

  return {
    type: 'Comment',
    value: commentText,
    isLineComment: true,
    position: createLinePosition(line, startColumn, startColumn + text.length),
  }
}

/**
 * Parses a block comment.
 */
export function parseBlockComment(
  text: string,
  line: number,
  startColumn: number
): CommentNode {
  // Remove /* and */ from the comment
  const commentText = text.slice(2, -2).trim()

  return {
    type: 'Comment',
    value: commentText,
    isLineComment: false,
    position: createLinePosition(line, startColumn, startColumn + text.length),
  }
}

/**
 * Parses a value node (prefixed with ":").
 */
export function parseValueNode(
  text: string,
  line: number,
  startColumn: number
): ValueNode {
  const valueText = text.startsWith(':') ? text.slice(1).trim() : text
  const position = createLinePosition(
    line,
    startColumn,
    startColumn + text.length
  )

  return {
    type: 'Value',
    value: parseValue(valueText, position),
    position,
  }
}
