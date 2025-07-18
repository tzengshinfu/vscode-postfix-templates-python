import * as vscode from 'vscode'

/**
 * 判斷 Python 源碼中游標所在位置是否在跨行結構內
 */
export class PythonMultilineDetector {
  /**
   * 檢查指定位置是否在跨行結構內
   * @param document 文件物件
   * @param position 游標位置
   * @returns 跨行檢查結果
   */
  public static checkMultilineContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ): MultilineContext {
    const text = document.getText()
    const offset = document.offsetAt(position)

    return this.analyzePosition(text, offset)
  }

  /**
   * 分析指定偏移量位置的跨行狀態
   * @param text 完整文本
   * @param offset 字元偏移量
   * @returns 跨行上下文資訊
   */
  private static analyzePosition(text: string, offset: number): MultilineContext {
    const state = new ParseState()

    for (let i = 0; i < text.length && i <= offset; i++) {
      const char = text[i]
      const nextChar = text[i + 1]
      const prevChar = text[i - 1]

      // 處理字串狀態
      if (this.handleStringState(state, char, nextChar, prevChar, i)) {
        continue
      }

      // 如果在字串內，跳過其他處理
      if (state.inString) {
        continue
      }

      // 處理註解
      if (this.handleComment(state, char, nextChar)) {
        continue
      }

      // 如果在註解內，跳過其他處理
      if (state.inComment) {
        if (char === '\n') {
          state.inComment = false
        }
        continue
      }

      // 處理括號
      this.handleBrackets(state, char)

      // 處理反斜線續行符
      this.handleBackslashContinuation(state, char, nextChar)

      // 處理換行
      if (char === '\n') {
        state.backslashContinuation = false
      }

      // 如果到達目標位置，返回結果
      if (i === offset) {
        return this.createResult(state)
      }
    }

    return this.createResult(state)
  }

  /**
   * 處理字串狀態
   */
  private static handleStringState(
    state: ParseState,
    char: string,
    nextChar: string,
    prevChar: string,
    index: number
  ): boolean {
    // 檢查三引號字串
    if (!state.inString && this.isTripleQuoteStart(char, nextChar, state.text, index)) {
      state.inString = true
      state.stringType = char as '"' | "'"
      state.isTripleQuote = true
      return true
    }

    // 檢查三引號字串結束
    if (state.inString && state.isTripleQuote &&
      this.isTripleQuoteEnd(char, nextChar, state.text, index, state.stringType)) {
      state.inString = false
      state.isTripleQuote = false
      state.stringType = null
      return true
    }

    // 檢查普通字串
    if (!state.inString && (char === '"' || char === "'")) {
      state.inString = true
      state.stringType = char as '"' | "'"
      state.isTripleQuote = false
      return true
    }

    // 檢查普通字串結束（考慮跳脫字元）
    if (state.inString && !state.isTripleQuote &&
      char === state.stringType && prevChar !== '\\') {
      state.inString = false
      state.stringType = null
      return true
    }

    return false
  }

  /**
   * 檢查是否為三引號開始
   */
  private static isTripleQuoteStart(
    char: string,
    nextChar: string,
    text: string,
    index: number
  ): boolean {
    if (char !== '"' && char !== "'") {
      return false
    }

    return text.substr(index, 3) === char.repeat(3)
  }

  /**
   * 檢查是否為三引號結束
   */
  private static isTripleQuoteEnd(
    char: string,
    nextChar: string,
    text: string,
    index: number,
    quoteType: string
  ): boolean {
    if (char !== quoteType) {
      return false
    }

    return text.substr(index, 3) === quoteType.repeat(3)
  }

  /**
   * 處理註解
   */
  private static handleComment(state: ParseState, char: string, _nextChar: string): boolean {
    if (char === '#') {
      state.inComment = true
      return true
    }
    return false
  }

  /**
   * 處理括號
   */
  private static handleBrackets(state: ParseState, char: string): void {
    switch (char) {
      case '(':
        state.bracketStack.push('()')
        break
      case '[':
        state.bracketStack.push('[]')
        break
      case '{':
        state.bracketStack.push('{}')
        break
      case ')':
        if (state.bracketStack.length > 0 &&
          state.bracketStack[state.bracketStack.length - 1] === '()') {
          state.bracketStack.pop()
        }
        break
      case ']':
        if (state.bracketStack.length > 0 &&
          state.bracketStack[state.bracketStack.length - 1] === '[]') {
          state.bracketStack.pop()
        }
        break
      case '}':
        if (state.bracketStack.length > 0 &&
          state.bracketStack[state.bracketStack.length - 1] === '{}') {
          state.bracketStack.pop()
        }
        break
    }
  }

  /**
   * 處理反斜線續行符
   */
  private static handleBackslashContinuation(
    state: ParseState,
    char: string,
    nextChar: string
  ): void {
    if (char === '\\' && nextChar === '\n') {
      state.backslashContinuation = true
    }
  }

  /**
   * 創建結果物件
   */
  private static createResult(state: ParseState): MultilineContext {
    const isMultiline = state.inString && state.isTripleQuote ||
      state.bracketStack.length > 0 ||
      state.backslashContinuation

    return {
      isMultiline,
      context: {
        inTripleQuoteString: state.inString && state.isTripleQuote,
        inParentheses: state.bracketStack.includes('()'),
        inSquareBrackets: state.bracketStack.includes('[]'),
        inCurlyBraces: state.bracketStack.includes('{}'),
        inBackslashContinuation: state.backslashContinuation,
        stringType: state.stringType,
        bracketStack: [...state.bracketStack]
      }
    }
  }
}

/**
 * 解析狀態類別
 */
class ParseState {
  public inString = false;
  public isTripleQuote = false;
  public stringType: '"' | "'" | null = null;
  public inComment = false;
  public bracketStack: string[] = [];
  public backslashContinuation = false;
  public text = '';
}

/**
 * 跨行上下文資訊
 */
export interface MultilineContext {
  /** 是否在跨行結構內 */
  isMultiline: boolean
  /** 具體的上下文資訊 */
  context: {
    /** 是否在三引號字串內 */
    inTripleQuoteString: boolean
    /** 是否在圓括號內 */
    inParentheses: boolean
    /** 是否在方括號內 */
    inSquareBrackets: boolean
    /** 是否在大括號內 */
    inCurlyBraces: boolean
    /** 是否在反斜線續行符後 */
    inBackslashContinuation: boolean
    /** 字串類型 */
    stringType: '"' | "'" | null
    /** 括號堆疊 */
    bracketStack: string[]
  }
}

/**
 * VS Code 擴充套件主要功能
 */
export function activate(context: vscode.ExtensionContext) {

  // 註冊命令：檢查當前游標位置
  const checkPositionCommand = vscode.commands.registerCommand(
    'python-multiline.checkPosition',
    () => {
      const editor = vscode.window.activeTextEditor
      if (!editor || editor.document.languageId !== 'python') {
        vscode.window.showInformationMessage('請在 Python 檔案中使用此功能')
        return
      }

      const position = editor.selection.active
      const result = PythonMultilineDetector.checkMultilineContext(
        editor.document,
        position
      )

      showMultilineResult(result)
    }
  )

  // 註冊狀態列項目
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  statusBarItem.command = 'python-multiline.checkPosition'

  // 監聽游標位置變化
  const onSelectionChange = vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      const editor = event.textEditor
      if (editor?.document.languageId !== 'python') {
        statusBarItem.hide()
        return
      }

      const position = editor.selection.active
      const result = PythonMultilineDetector.checkMultilineContext(
        editor.document,
        position
      )

      updateStatusBar(statusBarItem, result)
    }
  )

  context.subscriptions.push(
    checkPositionCommand,
    statusBarItem,
    onSelectionChange
  )
}

/**
 * 顯示跨行檢查結果
 */
function showMultilineResult(result: MultilineContext): void {
  if (result.isMultiline) {
    const details = []
    if (result.context.inTripleQuoteString) {
      details.push(`三引號字串 (${result.context.stringType})`)
    }
    if (result.context.inParentheses) {
      details.push('圓括號')
    }
    if (result.context.inSquareBrackets) {
      details.push('方括號')
    }
    if (result.context.inCurlyBraces) {
      details.push('大括號')
    }
    if (result.context.inBackslashContinuation) {
      details.push('反斜線續行符')
    }

    vscode.window.showInformationMessage(
      `游標位置在跨行結構內: ${details.join(', ')}`
    )
  } else {
    vscode.window.showInformationMessage('游標位置在獨立行上')
  }
}

/**
 * 更新狀態列
 */
function updateStatusBar(
  statusBarItem: vscode.StatusBarItem,
  result: MultilineContext
): void {
  if (result.isMultiline) {
    statusBarItem.text = '$(symbol-bracket) 跨行'
    statusBarItem.tooltip = '點擊查看詳細資訊'
    statusBarItem.show()
  } else {
    statusBarItem.text = '$(symbol-line) 獨立行'
    statusBarItem.tooltip = '當前位置在獨立行上'
    statusBarItem.show()
  }
}
