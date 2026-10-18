import * as fs from "fs/promises";
import * as vscode from "vscode";
import { GilResourceHandler } from "@/gil-resource-handler";
import { BeyondStage } from "@Protobufs/beyond_stage";
import { GilResource, RESOURCES_DIR } from "@/gil-writer-registry";

const cfg_id = "mililua";
const cfg_enableDefinitions = "enableDefinitions";
const cfg_extractGilResources = "extractGilResources";
const cfg_luaRuntimeVersion = "runtime.version";
const cfg_luaWorkspaceLibrary = "workspace.library";

const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);

let expectedGil = "";
let isPromptActive = false;

function updateLibs(context: vscode.ExtensionContext) {
    const apiPath = vscode.Uri.joinPath(context.extensionUri, "out", "library").fsPath.replace(/\\/g, '/');
    const mililuaConfig = vscode.workspace.getConfiguration(cfg_id);
    const luaConfig = vscode.workspace.getConfiguration("Lua");
    const isMiliLuaLib = RegExp(`(?:${context.extension.packageJSON.name}|${RESOURCES_DIR})`)

    let libs: string[] = luaConfig.inspect<string[]>(cfg_luaWorkspaceLibrary)?.workspaceValue ?? [];
    libs = libs.filter(lib => { return typeof (lib) === "string" && !isMiliLuaLib.test(lib); });

    if (mililuaConfig.inspect<boolean>(cfg_enableDefinitions)?.workspaceValue && !libs.includes(apiPath)) {
        libs.push(apiPath);
    }
    if (mililuaConfig.inspect<boolean>(cfg_extractGilResources)?.workspaceValue && !libs.includes(`./${RESOURCES_DIR}/`)) {
        libs.push(`./${RESOURCES_DIR}/`)
    }

    luaConfig.update(cfg_luaWorkspaceLibrary, libs);
}

async function extractGilResources(uri: vscode.Uri, resourceHandler: GilResourceHandler) {
    const fileBuffer = await fs.readFile(uri.fsPath)

    const contentLength = fileBuffer.readUInt32BE(0x10);
    const start = 20;
    const end = start + contentLength;
    const stageData = BeyondStage.decode(fileBuffer.subarray(start, end))

    resourceHandler.processResource(GilResource.ScriptTextVariables,
        stageData.multiLanguageText?.mltWrapper?.stvWrapper?.scriptTextVariables ?? [])
    resourceHandler.processResource(GilResource.Signals,
        stageData.unkStageData?.signalWrapper?.signals ?? [])
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
            vscode.window.showInformationMessage("Would you like to enable MiliLua for this workspace? Miliastra Wonderland Lua API definitions will be added to this project.", "Yes", "No")
                .then(choice => {
                    isPromptActive = false;
                    mililuaConfig.update(cfg_enableDefinitions, choice === "Yes");
                    mililuaConfig.update(cfg_extractGilResources, choice === "Yes");
                });
            break;
    }
}

function updateStatusBarItem() {
    let apiEnabled = `❌`;
    let apiTooltip = `The Miliastra Wonderland Lua API definitions are disabled for this workspace.\nEnable the workspace setting "${cfg_id}.${cfg_enableDefinitions}" for API support.`;

    let extractEnabled = ``;
    let extractTooltip = `.gil Resource Extraction is not enabled.\nEnable the workspace setting "${cfg_id}.${cfg_extractGilResources}" for stage-specific support.`;

    if (vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_enableDefinitions)?.workspaceValue) {
        apiEnabled = `✅`;
        apiTooltip = "The Miliastra Wonderland Lua API definitions are enabled for this workspace.";
    }

    if (vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_extractGilResources)?.workspaceValue) {
        extractEnabled = `🪄`;
        extractTooltip = `.gil Resource Extraction is active. Target File: ${expectedGil}\nExtracting: Script Text Variables`;
    }

    statusBarItem.text = `Miliastra ${apiEnabled}${extractEnabled}`;
    statusBarItem.tooltip = `${apiTooltip}\n\n${extractTooltip}`;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log("Activating MiliLua API Definitions...")

    context.subscriptions.push(statusBarItem);
    updateStatusBarItem();
    statusBarItem.show()

    if (!vscode.workspace.workspaceFolders) { return; }
    const workspaceRoot = vscode.workspace.workspaceFolders[0];
    const gilResourceHandler = new GilResourceHandler(workspaceRoot);
    expectedGil = `${workspaceRoot.name}.gil`;
    updateStatusBarItem();

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async e => {
            if (e.affectsConfiguration(`${cfg_id}.${cfg_enableDefinitions}`, workspaceRoot)) {
                const luaConfig = vscode.workspace.getConfiguration("Lua");
                if (vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_enableDefinitions)?.workspaceValue) {
                    luaConfig.update(cfg_luaRuntimeVersion, "Lua 5.3", false);
                }
                else {
                    luaConfig.update(cfg_luaRuntimeVersion, undefined);
                }
                updateLibs(context);
            }

            if (e.affectsConfiguration(`${cfg_id}.${cfg_extractGilResources}`, workspaceRoot)) {
                updateLibs(context)
            }

            updateStatusBarItem();
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