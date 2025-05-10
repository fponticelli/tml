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

export type ValueOrAttribute = ValueNode | Attribute

/**
 * Represents a named block in TML, which may contain attributes and child nodes.
 * @property type - Discriminator for the node type ("Block")
 * @property position - Span of the line starting this block.
 * @property name - The block name (e.g., "html", "head").
 * @property children - Nested content including attributes, values, or blocks.
 * @property parent - A reference to the parent Block if any
 */
export type BlockNode = {
  type: 'Block'
  position?: Position
  name: string
  children: Node[]
  parent?: BlockNode
}

/**
 * Represents a key-value pair, usually inline with a block.
 * @property type - Discriminator for the node type ("Attribute")
 * @property key - Attribute name.
 * @property value - Attribute value (typed).
 * @property position - Span of the key=value pair.
 * @property parent - A reference to the parent Block if any
 */
export type Attribute = {
  type: 'Attribute'
  key: string
  value: Value
  position?: Position
  parent?: BlockNode
}

type ID<T> = {} & { [P in keyof T]: T[P] }

/**
 * Base properties for all type of Values
 * @property position - Location of the string value in source.
 * @property parent - A reference to the parent Block or Attribute if any.
 */
type BaseValue = {
  position?: Position
  parent?: ValueOrAttribute
}

/**
 * Represents a string literal.
 * @property type - Discriminator for the node type ("String")
 * @property value - The string value.
 * @property position - Location of the string value in source.
 * @property parent - A reference to the parent Block if any.
 */
export type StringValue = ID<
  {
    type: 'string'
    value: string
  } & BaseValue
>

/**
 * Represents a numeric literal (integer or float).
 * @property type - Discriminator for the node type ("Number")
 * @property value - The numeric value.
 * @property position - Location of the number in source.
 * @property parent - A reference to the parent Block if any.
 */
export type NumberValue = ID<
  {
    type: 'number'
    value: number
  } & BaseValue
>

/**
 * Represents a boolean literal: true or false.
 * @property type - Discriminator for the node type ("Boolean")
 * @property value - The boolean value.
 * @property position - Location of the number in source.
 * @property parent - A reference to the parent Block if any.
 */
export type BooleanValue = ID<
  {
    type: 'boolean'
    value: boolean
  } & BaseValue
>

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
 * @property elements - Mixed list of values and comments.
 * @property position - Location of the number in source.
 * @property parent - A reference to the parent Block if any.
 */
export type ArrayValue = ID<
  {
    type: 'Array'
    elements: Array<ArrayElement | CommentNode>
  } & BaseValue
>

/**
 * Represents a structured object, preserving field order and comments.
 * @property type - Discriminator for the node type ("Object")
 * @property fields - Mixed list of fields and comments.
 * @property position - Location of the number in source.
 * @property parent - A reference to the parent Block if any.
 */
export type ObjectValue = ID<
  {
    type: 'Object'
    fields: Array<ObjectField | CommentNode>
  } & BaseValue
>

/**
 * Value type for all supported TML values: primitive, object, or array.
 */
export type Value = ObjectValue | ArrayValue | PrimitiveValue

/**
 * Represents a standalone literal value (anonymous), prefixed by ":".
 * @property type - Discriminator for the node type ("Value")
 * @property value - The contained value node.
 * @property isMultiline - Indicates if this is a multiline value (optional).
 * @property position - Span covering the value line. Required for multiline values.
 * @property parent - A reference to the parent Block if any.
 */
export type ValueNode = {
  type: 'Value'
  value: Value
  isMultiline?: boolean // Optional flag to indicate multiline values
  position?: Position // Making position required
  parent?: BlockNode
}

/**
 * Represents a comment in the source, which can be inline or block.
 * @property type - Discriminator for the node type ("Comment")
 * @property value - Raw comment content.
 * @property isLineComment - True if prefixed with "//", false if block comment.
 * @property position - Span of the comment text.
 * @property parent - A reference to the parent Block if any.
 */
export type CommentNode = {
  type: 'Comment'
  value: string
  isLineComment: boolean
  position?: Position
  parent?: BlockNode | ValueNode | Attribute
}
