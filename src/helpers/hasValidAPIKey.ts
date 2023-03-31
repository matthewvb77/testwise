import * as vscode from "vscode";

export function hasValidAPIKey(): boolean {
	const apiKey = vscode.workspace.getConfiguration("testwise").get("apiKey");
	return (
		apiKey !== undefined && apiKey !== null && apiKey.toString().trim() !== ""
	);
}
