import * as vscode from 'vscode'
import { TMLHoverProvider } from './hover-provider'

let outputChannel: vscode.OutputChannel | undefined

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('TML Language Support')
  context.subscriptions.push(outputChannel)
  outputChannel.appendLine('TML Language Support extension is now active')

  context.subscriptions.push(
    vscode.languages.registerHoverProvider('tml', new TMLHoverProvider())
  )
}

export function deactivate() {
  outputChannel?.appendLine('TML Language Support extension is now inactive')
  outputChannel = undefined
}
