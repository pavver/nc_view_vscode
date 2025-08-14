const vscode = require("vscode");
const path = require("path");
const fs = require('fs');

// 创建输出通道用于调试
let outputChannel;

function activate(context) {
  // 创建调试输出通道
  outputChannel = vscode.window.createOutputChannel('NC Viewer Debug');
  outputChannel.appendLine('[NC Viewer] Extension activated');
  outputChannel.show(true); // 自动显示调试面板

  let disposable = vscode.commands.registerCommand('ncViewer.open', (uri) => {
    try {
      outputChannel.appendLine(`[NC Viewer] Command triggered`);
      outputChannel.appendLine(`[NC Viewer] URI received: ${uri ? uri.toString() : 'undefined'}`);

      // 如果没有URI，尝试获取当前活动编辑器
      if (!uri) {
        outputChannel.appendLine('[NC Viewer] No URI provided, checking active editor...');
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          uri = activeEditor.document.uri;
          outputChannel.appendLine(`[NC Viewer] Got URI from active editor: ${uri.toString()}`);
        } else {
          outputChannel.appendLine('[NC Viewer] ERROR: No active editor found');
          vscode.window.showErrorMessage('NC Viewer: No active file found');
          return;
        }
      }

      outputChannel.appendLine(`[NC Viewer] File path: ${uri.fsPath}`);
      outputChannel.appendLine(`[NC Viewer] File scheme: ${uri.scheme}`);
      outputChannel.appendLine(`[NC Viewer] File extension: ${path.extname(uri.fsPath)}`);

      // 检查文件是否存在
      if (!fs.existsSync(uri.fsPath)) {
        outputChannel.appendLine(`[NC Viewer] ERROR: File does not exist: ${uri.fsPath}`);
        vscode.window.showErrorMessage(`NC Viewer: File not found - ${uri.fsPath}`);
        return;
      }

      outputChannel.appendLine('[NC Viewer] Creating webview panel...');

      // Create webview panel on the right side
      const panel = vscode.window.createWebviewPanel(
        'ncViewer',
        `NC Viewer - ${path.basename(uri.fsPath)}`,
        vscode.ViewColumn.Two, // Show on right side (Column Two)
        {
          enableScripts: true, // Allow JavaScript in webview
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'media'))
          ]
        }
      );

      outputChannel.appendLine('[NC Viewer] Webview panel created successfully');

      // 监听webview消息
      panel.webview.onDidReceiveMessage(message => {
        outputChannel.appendLine(`[NC Viewer] Received message from webview: ${JSON.stringify(message)}`);
      });

      // 监听面板关闭
      panel.onDidDispose(() => {
        outputChannel.appendLine('[NC Viewer] Webview panel disposed');
      });

      outputChannel.appendLine('[NC Viewer] Loading webview content...');

      // Set the webview HTML content
      try {
        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);
        outputChannel.appendLine('[NC Viewer] Webview HTML content set successfully');
      } catch (htmlError) {
        outputChannel.appendLine(`[NC Viewer] ERROR setting HTML content: ${htmlError.message}`);
        vscode.window.showErrorMessage(`NC Viewer: Failed to load viewer - ${htmlError.message}`);
        return;
      }

      outputChannel.appendLine('[NC Viewer] Reading NC file...');

      // Read the NC file and send content to webview
      vscode.workspace.openTextDocument(uri).then(doc => {
        const fileContent = doc.getText();
        const contentLength = fileContent.length;
        const firstLine = fileContent.split('\n')[0] || '';

        outputChannel.appendLine(`[NC Viewer] File read successfully`);
        outputChannel.appendLine(`[NC Viewer] Content length: ${contentLength} characters`);
        outputChannel.appendLine(`[NC Viewer] First line: "${firstLine}"`);
        outputChannel.appendLine(`[NC Viewer] Language ID: ${doc.languageId}`);

        outputChannel.appendLine('[NC Viewer] Sending content to webview...');
        panel.webview.postMessage({ ncText: fileContent });
        outputChannel.appendLine('[NC Viewer] Content sent to webview successfully');

      }).catch(readError => {
        outputChannel.appendLine(`[NC Viewer] ERROR reading file: ${readError.message}`);
        outputChannel.appendLine(`[NC Viewer] Error stack: ${readError.stack}`);
        vscode.window.showErrorMessage(`NC Viewer: Failed to read file - ${readError.message}`);
      });

    } catch (error) {
      outputChannel.appendLine(`[NC Viewer] FATAL ERROR: ${error.message}`);
      outputChannel.appendLine(`[NC Viewer] Error stack: ${error.stack}`);
      vscode.window.showErrorMessage(`NC Viewer: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
  outputChannel.appendLine('[NC Viewer] Command registered successfully');
}

function getWebviewContent(webview, extensionPath) {
  try {
    outputChannel.appendLine(`[NC Viewer] getWebviewContent called`);
    outputChannel.appendLine(`[NC Viewer] Extension path: ${extensionPath}`);

    // Get URIs for local resources
    const mediaPath = path.join(extensionPath, 'media');
    const indexHtmlPath = path.join(mediaPath, 'index.html');

    outputChannel.appendLine(`[NC Viewer] Media path: ${mediaPath}`);
    outputChannel.appendLine(`[NC Viewer] HTML path: ${indexHtmlPath}`);

    // 检查关键文件是否存在
    const filesToCheck = [
      { path: indexHtmlPath, name: 'index.html' },
      { path: path.join(mediaPath, 'g_code_parser.js'), name: 'g_code_parser.js' },
      { path: path.join(mediaPath, 'libs', 'three.module.js'), name: 'three.module.js' },
      { path: path.join(mediaPath, 'libs', 'addons', 'controls', 'OrbitControls.js'), name: 'OrbitControls.js' }
    ];

    filesToCheck.forEach(file => {
      if (fs.existsSync(file.path)) {
        outputChannel.appendLine(`[NC Viewer] ✓ Found: ${file.name}`);
      } else {
        outputChannel.appendLine(`[NC Viewer] ✗ Missing: ${file.name} at ${file.path}`);
      }
    });

    // Read the HTML file
    if (!fs.existsSync(indexHtmlPath)) {
      throw new Error(`HTML file not found: ${indexHtmlPath}`);
    }

    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    outputChannel.appendLine(`[NC Viewer] HTML file read, length: ${html.length} characters`);

    // Convert local file paths to webview URIs
    const mediaUri = webview.asWebviewUri(vscode.Uri.file(mediaPath));
    outputChannel.appendLine(`[NC Viewer] Media URI: ${mediaUri.toString()}`);

    // Replace relative paths with webview URIs
    const originalHtmlLength = html.length;
    html = html.replace(/src="\.\/g_code_parser\.js"/g, `src="${mediaUri}/g_code_parser.js"`);
    html = html.replace(/\.\/libs\//g, `${mediaUri}/libs/`);

    outputChannel.appendLine(`[NC Viewer] Path replacement completed`);
    outputChannel.appendLine(`[NC Viewer] HTML length after replacement: ${html.length}`);

    if (html.length === originalHtmlLength) {
      outputChannel.appendLine(`[NC Viewer] WARNING: No path replacements made - check HTML patterns`);
    }

    return html;

  } catch (error) {
    outputChannel.appendLine(`[NC Viewer] ERROR in getWebviewContent: ${error.message}`);
    outputChannel.appendLine(`[NC Viewer] Error stack: ${error.stack}`);
    throw error;
  }
}

exports.activate = activate;

function deactivate() {
  if (outputChannel) {
    outputChannel.appendLine('[NC Viewer] Extension deactivated');
    outputChannel.dispose();
  }
}

exports.deactivate = deactivate;