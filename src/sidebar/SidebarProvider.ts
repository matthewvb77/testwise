import * as vscode from "vscode";
import { getNonce } from "../helpers/getNonce";
import { recursiveDevelopment } from "../AIContainer/recursiveDevelopment";
import { hasValidAPIKey } from "../helpers/hasValidAPIKey";
import { queryChatGPT } from "../AIContainer/AIHelpers/queryChatGPT";
import { Subtask } from "../AIContainer/recursiveDevelopment";

export class SidebarProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	_doc?: vscode.TextDocument;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		let taskInProgress = false;
		let questionInProgress = false;
		const abortController = new AbortController();
		const signal = abortController.signal;

		webviewView.webview.onDidReceiveMessage(async (message) => {
			if (!message.input) {
				return;
			}
			if (!hasValidAPIKey()) {
				vscode.window.showErrorMessage(
					"Please enter a valid API key in the TestWise settings."
				);
				return;
			}

			switch (message.command) {
				case "submit-task":
					if (taskInProgress) {
						vscode.window.showInformationMessage(
							"A task is already in progress."
						);
						return;
					}
					taskInProgress = true;
					this.showTaskStarted();

					try {
						const result = await recursiveDevelopment(
							message.input,
							signal,
							this.onStartSubtask.bind(this),
							this.onSubtasksReady.bind(this),
							this.onSubtaskError.bind(this)
						);
						if (result === "Cancelled") {
							this.showTaskCancelled();
						} else if (typeof result === "string") {
							this.showTaskError();
						} else {
							this.showTaskCompleted();
						}
						taskInProgress = false;
					} catch (error) {
						vscode.window.showErrorMessage(
							"Error occurred while running task: " + error
						);
						taskInProgress = false;
					}
					break;

				case "cancel-task":
					if (!taskInProgress) {
						vscode.window.showInformationMessage(
							"No task is currently in progress."
						);
						return;
					}
					this.showTaskCancelled();
					abortController.abort();

				case "submit-question":
					if (questionInProgress) {
						vscode.window.showInformationMessage(
							"A question is already in progress."
						);
						return;
					}
					await vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: "Generating response...",
							cancellable: false,
						},
						async () => {
							questionInProgress = true;
							try {
								const response = await queryChatGPT(message.input, signal);
								webviewView.webview.postMessage({
									command: "response",
									text: response,
								});
								questionInProgress = false;
							} catch (error) {
								vscode.window.showErrorMessage(
									"Error occurred while responding: " + error
								);
								questionInProgress = false;
							}
						}
					);
					break;

				case "onStartSubtask":
					this.onStartSubtask(message.subtask);
					break;

				default:
					throw new Error("Invalid command");
			}
		});
	}

	public revive(panel: vscode.WebviewView) {
		this._view = panel;
	}

	private onStartSubtask(subtask: Subtask) {
		if (this._view) {
			this._view.webview.postMessage({
				command: "onStartSubtask",
				subtask: subtask,
			});
		}
	}

	private async onSubtasksReady(subtasks: Array<Subtask>): Promise<string> {
		return new Promise((resolve) => {
			if (this._view) {
				this._view.webview.postMessage({
					command: "showSubtasks",
					subtasks: subtasks,
				});

				this._view.webview.onDidReceiveMessage((message) => {
					if (message.command === "userAction") {
						resolve(message.action);
					}
				});
			}
		});
	}

	private showTaskStarted() {
		if (this._view) {
			this._view.webview.postMessage({
				command: "showTaskStarted",
			});
		}
	}

	private showTaskCompleted() {
		if (this._view) {
			this._view.webview.postMessage({
				command: "showTaskCompleted",
			});
		}
	}

	private showTaskCancelled() {
		if (this._view) {
			this._view.webview.postMessage({
				command: "showTaskCancelled",
			});
		}
	}

	private showTaskError() {
		if (this._view) {
			this._view.webview.postMessage({
				command: "showTaskError",
			});
		}
	}

	private onSubtaskError() {
		if (this._view) {
			this._view.webview.postMessage({
				command: "onSubtaskError",
			});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "src", "sidebar/sidebar.js")
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "src", "sidebar/sidebar.css")
		);
		const codiconStylesheetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this._extensionUri,
				"node_modules",
				"vscode-codicons",
				"dist",
				"codicon.css"
			)
		);

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}';">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        		<link href="${styleMainUri}" rel="stylesheet">
				<link rel="stylesheet" href="${codiconStylesheetUri}">
			</head>
      		<body>
				<div class="inline-container">
					<label for="input-type">Input:</label>
					<select id="input-type">
						<option value="task">Task</option>
						<option value="question">Question</option>
					</select>
				</div>
				<div class="tabs-wrapper">
					<div id="task-tab" class="tab-container">
						<textarea id="task-user-input" class="user-input" name="task-user-input" placeholder="Give a task..."></textarea>
						<button id="task-submit-button" class="submit-button">Submit</button>
						<br>

						<div id="progress-container">
							<div class="inline-container">
								<div id="progress-loader" class="loader"></div>
								<span id="progress-text" class="subtask-text">Generating subtasks...</span>
								<button id="task-cancel-button" class="codicon codicon-close"></button>
							</div>

							<div id="subtasks-container"></div>

							<div id="buttons-container" class="inline-container">
								<button id="confirm-button">Confirm</button>
								<button id="cancel-button">Cancel</button>
								<button id="regenerate-button">Regenerate</button>
							</div>
						</div>
					</div>

					<div id="question-tab" class="tab-container">
						<textarea id="question-user-input" class="user-input" name="user-input" placeholder="Ask a question..."></textarea>
						<button id="question-submit-button">Submit</button>
						<br>

						<label id="response-label">Response:</label>
						<textarea id="response-area" name="response-area" placeholder="TestWise will respond..." readonly></textarea>
					</div>
				</div>

				<script nonce="${nonce}">
                	var vscode = acquireVsCodeApi();
            	</script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>
		`;
	}
}
