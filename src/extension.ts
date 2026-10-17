import * as fs from "fs/promises";
import * as vscode from "vscode";
import { GilResourceHandler } from "@/gil-resource-handler";
import { BeyondStage } from "@Protobufs/beyond_stage";
import { GilResource } from "@/gil-writer-registry";

const cfg_id = "mililua";
const cfg_enableDefinitions = "enableDefinitions";
const cfg_extractGilResources = "extractGilResources";
const cfg_luaRuntimeVersion = "runtime.version";
const cfg_luaWorkspaceLibrary = "workspace.library";

const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);

let isPromptActive = false;

function updateLibs(context: vscode.ExtensionContext, addLibs: boolean = true) {
    const apiPath = vscode.Uri.joinPath(context.extensionUri, "out", "library").fsPath.replace(/\\/g, '/');
    const luaConfig = vscode.workspace.getConfiguration("Lua");
    const isMiliLuaLib = RegExp(context.extension.packageJSON.name)

    let libs: string[] = luaConfig.inspect<string[]>(cfg_luaWorkspaceLibrary)?.workspaceValue ?? [];
    libs = libs.filter(lib => { return typeof (lib) === "string" && !isMiliLuaLib.test(lib); });
    if (addLibs && !libs.includes(apiPath)) { libs.push(apiPath); }
    luaConfig.update(cfg_luaWorkspaceLibrary, libs);
}

async function extractGilResources(uri: vscode.Uri, resourceHandler: GilResourceHandler) {
    const fileBuffer = await fs.readFile(uri.fsPath)

    const contentLength = fileBuffer.readUInt32BE(0x10);
    const start = 20;
    const end = start + contentLength;
    const stageData = BeyondStage.decode(fileBuffer.subarray(start, end))

    console.log("Extracting .gil resources")
    const scriptTextVariables = stageData.multiLanguageText?.mltWrapper?.stvWrapper?.scriptTextVariable ?? [];
    resourceHandler.processResource(GilResource.ScriptTextVariables, scriptTextVariables)
}

async function checkEnableDefinitions(context: vscode.ExtensionContext) {
    const mililuaConfig = vscode.workspace.getConfiguration(cfg_id);
    switch (mililuaConfig.inspect<boolean>(cfg_enableDefinitions)?.workspaceValue) {
        case true:
            updateLibs(context);
            break;
        case false:
            break;
        default:
            if (isPromptActive) { break; }
            isPromptActive = true;
            await vscode.window.showInformationMessage("Would you like to enable MiliLua for this workspace? Miliastra Wonderland Lua API definitions will be added to this project.", "Yes", "No")
                .then(choice => {
                    isPromptActive = false;
                    mililuaConfig.update(cfg_enableDefinitions, choice === "Yes");
                    updateStatusBarItem(context);
                });
            break;
    }
}

function updateStatusBarItem(context: vscode.ExtensionContext) {
    let status = `❌`;
    let tooltip = "The Miliastra Wonderland Lua API definitions are disabled for this workspace.";

    const enabled = vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_enableDefinitions)?.workspaceValue ?? null;
    if (enabled) {
        status = `✅`;
        tooltip = "The Miliastra Wonderland Lua API definitions are enabled for this workspace.";
    }

    statusBarItem.text = `Miliastra ${status}`;
    statusBarItem.tooltip = tooltip;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log("Activating MiliLua API Definitions...")

    context.subscriptions.push(statusBarItem);
    updateStatusBarItem(context);
    statusBarItem.show()

    if (!vscode.workspace.workspaceFolders) { return; }
    const workspaceRoot = vscode.workspace.workspaceFolders[0];
    const gilResourceHandler = new GilResourceHandler(workspaceRoot);

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration(cfg_id + "." + cfg_enableDefinitions, workspaceRoot)) { return; }

            const enabled = vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_enableDefinitions)?.workspaceValue ?? null;
            if (enabled === null) { return; }

            const luaConfig = vscode.workspace.getConfiguration("Lua");
            if (enabled) {
                luaConfig.update(cfg_luaRuntimeVersion, "Lua 5.3", false);
                updateLibs(context);
            }
            else {
                luaConfig.update(cfg_luaRuntimeVersion, undefined);
                updateLibs(context, false);
            }

            updateStatusBarItem(context);
        })
    );

    const gilWatcher = vscode.workspace.createFileSystemWatcher(`**/${workspaceRoot.name}.gil`);
    gilWatcher.onDidChange(uri => {
        if (!(vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_extractGilResources)?.workspaceValue ?? null)) { return; }
        extractGilResources(uri, gilResourceHandler);
    })
    context.subscriptions.push(gilWatcher);

    checkEnableDefinitions(context);
}

export function deactivate() {
    console.log("Deactivating MiliLua API Definitions")
}