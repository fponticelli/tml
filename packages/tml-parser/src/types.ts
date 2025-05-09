/**
 * Represents a specific point in the source file (line and column).
 */
export type Point = {
  line: number
  column: number
}

/**
 * Represents a span in the source file from start to end.
 */
export type Position = {
  start: Point
  end: Point
}

/**
 * Union of all node types that can appear in a TML document.
 */
export type Node = BlockNode | ValueNode | CommentNode | Attribute

/**
 * Represents a named block in TML, which may contain attributes and child nodes.
 * @property type - Discriminator for the node type ("Block")
 * @property position - Span of the line starting this block.
 * @property name - The block name (e.g., "html", "head").
 * @property children - Nested content including attributes, values, or blocks.
 */
export type BlockNode = {
  type: 'Block'
  position?: Position
  name: string
  children: Node[]
}

/**
 * Represents a key-value pair, usually inline with a block.
 * @property type - Discriminator for the node type ("Attribute")
 * @property key - Attribute name.
 * @property value - Attribute value (typed).
 * @property position - Span of the key=value pair.
 */
export type Attribute = {
  type: 'Attribute'
  key: string
  value: Value
  position?: Position
}

/**
 * Represents a string literal.
 * @property type - Discriminator for the node type ("String")
 * @property value - The string value.
 * @property position - Location of the string value in source.
 */
export type StringValue = {
  type: 'string'
  value: string
  position?: Position
}

/**
 * Represents a numeric literal (integer or float).
 * @property type - Discriminator for the node type ("Number")
 * @property value - The numeric value.
 * @property position - Location of the number in source.
 */
export type NumberValue = {
  type: 'number'
  value: number
  position?: Position
}

/**
 * Represents a boolean literal: true or false.
 * @property type - Discriminator for the node type ("Boolean")
 * @property value - The boolean value.
 * @property position - Location of the boolean in source.
 */
export type BooleanValue = {
  type: 'boolean'
  value: boolean
  position?: Position
}

/**
 * Union of the three supported primitive value types.
 */
export type PrimitiveValue = StringValue | NumberValue | BooleanValue

/**
 * Represents an item inside an array.
 * @property type - Discriminator for the node type ("Element")
 * @property value - The actual value stored in the array.
 * @property position - Optional span covering the entire element line.
 */
export type ArrayElement = {
  type: 'Element'
  value: Value
  position?: Position
}

/**
 * Represents a key-value pair inside an object.
 * @property type - Discriminator for the node type ("Field")
 * @property key - Field name.
 * @property keyPosition - Location of the key token.
 * @property value - Value assigned to the key.
 * @property position - Span of the entire field.
 */
export type ObjectField = {
  type: 'Field'
  key: string
  keyPosition?: Position
  value: Value
  position?: Position
}

/**
 * Represents a structured array, preserving element order and positions.
 * @property type - Discriminator for the node type ("Array")
 * @property position - Span covering the entire array block.
 * @property elements - Mixed list of values and comments.
 */
export type PositionedArrayValue = {
  type: 'Array'
  position?: Position
  elements: Array<ArrayElement | CommentNode>
}

/**
 * Represents a structured object, preserving field order and comments.
 * @property type - Discriminator for the node type ("Object")
 * @property position - Span covering the entire object block.
 * @property fields - Mixed list of fields and comments.
 */
export type PositionedObjectValue = {
  type: 'Object'
  position?: Position
  fields: Array<ObjectField | CommentNode>
}

/**
 * Value type for all supported TML values: primitive, object, or array.
 */
export type Value =
  | PrimitiveValue
  | PositionedObjectValue
  | PositionedArrayValue

/**
 * Represents a standalone literal value (anonymous), prefixed by ":".
 * @property type - Discriminator for the node type ("Value")
 * @property position - Span covering the value line.
 * @property value - The contained value node.
 */
export type ValueNode = {
  type: 'Value'
  position?: Position
  value: Value
}

/**
 * Represents a comment in the source, which can be inline or block.
 * @property type - Discriminator for the node type ("Comment")
 * @property position - Span of the comment text.
 * @property value - Raw comment content.
 * @property isLineComment - True if prefixed with "//", false if block comment.
 */
export type CommentNode = {
  type: 'Comment'
  position?: Position
  value: string
  isLineComment: boolean
}
