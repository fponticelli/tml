export type Point = {
  line: number
  column: number
}

export type Position = {
  start: Point
  end: Point
}

export type Node = BlockNode | ValueNode | CommentNode | Attribute

export type BlockNode = {
  type: 'Block'
  position?: Position
  name: string
  children: Node[]
}

export type Attribute = {
  type: 'Attribute'
  key: string
  value: Value
  position?: Position
}

export type StringValue = {
  type: 'String'
  value: string
  position?: Position
}

export type NumberValue = {
  type: 'Number'
  value: number
  position?: Position
}

export type BooleanValue = {
  type: 'Boolean'
  value: boolean
  position?: Position
}

export type PrimitiveValue = StringValue | NumberValue | BooleanValue

export type ArrayElement = {
  type: 'Element'
  value: Value
  position?: Position
}

export type ObjectField = {
  type: 'Field'
  key: string
  keyPosition?: Position
  value: Value
  position?: Position
}

export type PositionedArrayValue = {
  type: 'Array'
  position?: Position
  elements: Array<ArrayElement | CommentNode>
}

export type PositionedObjectValue = {
  type: 'Object'
  position?: Position
  fields: Array<ObjectField | CommentNode>
}

export type Value = PrimitiveValue | PositionedObjectValue | PositionedArrayValue

export type ValueNode = {
  type: 'Value'
  position?: Position
  value: Value
}

export type CommentNode = {
  type: 'Comment'
  position?: Position
  value: string
  isLineComment: boolean
}
