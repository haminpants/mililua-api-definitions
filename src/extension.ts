import * as vscode from 'vscode';

const cfg_id = "mililua";
const cfg_enableDefinitions = "enableDefinitions";
const cfg_luaRuntimeVersion = "runtime.version";
const cfg_luaWorkspaceLibrary = "workspace.library";

let isPromptActive = false;
let isInitialized = false;

function updateLibs(context: vscode.ExtensionContext) {
    const apiPath = vscode.Uri.joinPath(context.extensionUri, "out", "library").fsPath.replace(/\\/g, '/');
    const luaConfig = vscode.workspace.getConfiguration("Lua");

    let libs: string[] = luaConfig.inspect<string[]>(cfg_luaWorkspaceLibrary)?.workspaceValue ?? [];
    libs = libs.filter(i => {
        if (typeof (i) !== "string") { return false; }
        const match = i.match(/mililua.*-(\d+\.\d+\.\d+)/);
        return match ? match[1] === context.extension.packageJSON.version : true;
    });
    if (!libs.includes(apiPath)) { libs.push(apiPath); }
    luaConfig.update(cfg_luaWorkspaceLibrary, libs);
}

async function checkEnableDefinitions(context: vscode.ExtensionContext) {
    if (isInitialized) { return; }
    const mililuaConfig = vscode.workspace.getConfiguration(cfg_id);

    switch (mililuaConfig.inspect<boolean>(cfg_enableDefinitions)?.workspaceValue) {
        case true:
            isInitialized = true;
            updateLibs(context);
            break;
        case false:
            break;
        default:
            if (isPromptActive) { break; }
            isPromptActive = true;
            await vscode.window.showInformationMessage("Would you like to enable MiliLua for this workspace? Miliastra Wonderland Lua API definitions will be added to this project.", "Yes", "No")
                .then(choice => {
                    isInitialized = true;
                    isPromptActive = false;
                    mililuaConfig.update(cfg_enableDefinitions, null);
                    mililuaConfig.update(cfg_enableDefinitions, choice === "Yes");
                });
            break;
    }
}

export async function activate(context: vscode.ExtensionContext) {
    if (!vscode.workspace.workspaceFolders) { return; }

    const workspaceRoot = vscode.workspace.workspaceFolders[0];
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === "lua") {
        checkEnableDefinitions(context);
    }

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(async e => {
            if (e.document.languageId !== "lua") { return; }
            checkEnableDefinitions(context);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(d => {
            if (d.languageId !== "lua") { return; }
            checkEnableDefinitions(context);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration(cfg_id + "." + cfg_enableDefinitions, workspaceRoot)) { return; }

            const enabled = vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_enableDefinitions)?.workspaceValue ?? null;
            if (enabled === null) { return; }

            const luaConfig = vscode.workspace.getConfiguration("Lua");
            if (enabled) {
                luaConfig.update(cfg_luaRuntimeVersion, "Lua 5.3", false);
                updateLibs(context);
                vscode.window.showInformationMessage("MiliLua has been enabled for this workspace!");
            }
            else {
                luaConfig.update(cfg_luaRuntimeVersion, undefined);
                const libs: string[] = luaConfig.inspect<string[]>(cfg_luaWorkspaceLibrary)?.workspaceValue ?? [];
                if (libs.length === 0) { return; }
                luaConfig.update(cfg_luaWorkspaceLibrary, libs.filter(i => typeof (i) === "string" && !i.match("mililua")));
                vscode.window.showInformationMessage("MiliLua has been disabled for this workspace.");
            }
        })
    );
}

export function deactivate() { }