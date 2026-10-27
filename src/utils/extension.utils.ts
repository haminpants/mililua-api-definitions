import * as vscode from "vscode";

export async function isInMiliLuaWorkspace(workspaceFolder: vscode.WorkspaceFolder) {
    return (await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, `{**/*.lua,${workspaceFolder.name}.gil}`), undefined, 1)).length > 0;
}