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
const cmd_openWorkspaceSettings = "openWorkspaceSettings";

let expectedGil = "";
const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);

function updateConfig(context: vscode.ExtensionContext) {
    const mililuaConfig = vscode.workspace.getConfiguration(cfg_id);
    const luaConfig = vscode.workspace.getConfiguration("Lua");
    const apiPath = vscode.Uri.joinPath(context.extensionUri, "out", "library").fsPath.replace(/\\/g, '/');
    const isMiliLuaLib = RegExp(`(?:${context.extension.packageJSON.name}|${RESOURCES_DIR})`)

    let libs: string[] = luaConfig.inspect<string[]>(cfg_luaWorkspaceLibrary)?.workspaceValue ?? [];
    libs = libs.filter(lib => { return typeof (lib) === "string" && !isMiliLuaLib.test(lib); });

    if (mililuaConfig.inspect<boolean>(cfg_enableDefinitions)?.workspaceValue) {
        if (!libs.includes(apiPath)) { libs.push(apiPath); }
        if (mililuaConfig.inspect<boolean>(cfg_extractGilResources)?.workspaceValue && !libs.includes(`./${RESOURCES_DIR}/`)) {
            libs.push(`./${RESOURCES_DIR}/`)
        }

        luaConfig.update(cfg_luaRuntimeVersion, "Lua 5.3");
    }
    else {
        luaConfig.update(cfg_luaRuntimeVersion, undefined);
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
    resourceHandler.processResource(GilResource.ClientControlTemplateIndex,
        stageData.uiAssetWrapper?.asset ?? [])
}

async function checkEnableDefinitions(context: vscode.ExtensionContext) {
    const mililuaConfig = vscode.workspace.getConfiguration(cfg_id);
    switch (mililuaConfig.inspect<boolean>(cfg_enableDefinitions)?.workspaceValue) {
        case true:
            updateConfig(context);
            break;
        case false:
            break;
        default:
            vscode.window.showInformationMessage("Would you like to enable MiliLua for this workspace? Miliastra Wonderland Lua API definitions will be added to this project.", "Yes", "No")
                .then(choice => {
                    mililuaConfig.update(cfg_enableDefinitions, choice === "Yes");
                    mililuaConfig.update(cfg_extractGilResources, choice === "Yes");
                });
            break;
    }
}

function updateStatusBar(context: vscode.ExtensionContext) {
    const isDefinitionsEnabled = vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_enableDefinitions)?.workspaceValue;
    const isExtractGilResourcesEnabled = vscode.workspace.getConfiguration(cfg_id).inspect<boolean>(cfg_extractGilResources)?.workspaceValue;
    const tooltip = new vscode.MarkdownString();
    const tooltipNotes: string[] = [];
    let status = isDefinitionsEnabled && isExtractGilResourcesEnabled ? "✅" : isDefinitionsEnabled || isExtractGilResourcesEnabled ? "⚠️" : "❌";

    if (isDefinitionsEnabled) {
        if (isExtractGilResourcesEnabled) {
            tooltipNotes.push(
                `#### 📄 Listening for changes to \`${expectedGil}\``,
                `- Resources extraction will be attempted when a change is detected to \`${expectedGil}\`\n`
            )
        }
        else {
            tooltipNotes.push(
                `#### ⚠️ Gil Resource Extraction is disabled`,
                `- [Enable Gil Resource Extraction](command:${cfg_id}.${cfg_extractGilResources})\n`
            )
        }
    }
    else {
        if (isExtractGilResourcesEnabled) {
            tooltipNotes.push(
                `#### ⚠️ Gil Resource Extraction will only work if Miliastra Lua API Definitions are enabled.`,
                `- [Enable Miliastra Lua API Definitions](command:${cfg_id}.${cfg_enableDefinitions})\n`
            )
        }
        else {
            tooltipNotes.push(
                `#### Miliastra Lua API Definitions are disabled`,
                `- [Enable Miliastra Lua API Definitions](command:${cfg_id}.${cfg_enableDefinitions})\n`
            )
        }
    }
    if (tooltipNotes.length > 0) { tooltipNotes.push(`---`); }

    tooltip.isTrusted = true;
    tooltip.appendMarkdown([
        "## MiliLua API Definitions Status",
        `### Miliastra Lua API Definitions: ${isDefinitionsEnabled ? "✅" : "❌"}`,
        `### Gil Resource Extraction: ${isExtractGilResourcesEnabled ? (isDefinitionsEnabled ? "✅" : "⚠️") : "❌"}`,
        "---",
        ...tooltipNotes,
        `[Open Workspace Settings](command:${cfg_id}.${cmd_openWorkspaceSettings})`
    ].join("\n"));

    // let apiTooltip = `The Miliastra Wonderland Lua API definitions are disabled for this workspace.\nEnable the workspace setting "${cfg_id}.${cfg_enableDefinitions}" for API support.`;

    // let extractTooltip = `Gil Resource Extraction is disbaled for this workspace.\nEnable the workspace setting "${cfg_id}.${cfg_extractGilResources}" to get autocomplete and type-checking for resources from your project.`;
    // apiTooltip = "The Miliastra Wonderland Lua API definitions are enabled for this workspace.";
    // extractTooltip = `Gil Resource Extraction is enabled for this workspace.\nMiliLua will attempt to extract resources from ${expectedGil} if present.`;
    // apiEnabled = `✅`;
    // extractEnabled = `🪄`;

    statusBar.text = `Miliastra ${status}`;
    statusBar.tooltip = tooltip;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log("Activating MiliLua API Definitions...")

    if (!vscode.workspace.workspaceFolders) { return; }
    const workspaceRoot = vscode.workspace.workspaceFolders[0];
    const mililuaSettings = vscode.workspace.getConfiguration(cfg_id);
    const gilResourceHandler = new GilResourceHandler(workspaceRoot);
    expectedGil = `${workspaceRoot.name}.gil`;

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async e => {
            if (e.affectsConfiguration(`${cfg_id}`, workspaceRoot)) {
                updateConfig(context);
                updateStatusBar(context);
            }
        }),
        vscode.commands.registerCommand(`${cfg_id}.${cmd_openWorkspaceSettings}`, args => {
            vscode.commands.executeCommand("workbench.action.openWorkspaceSettings", `@ext:${context.extension.id}`);
        }),
        vscode.commands.registerCommand(`${cfg_id}.${cfg_enableDefinitions}`, args => {
            vscode.workspace.getConfiguration(cfg_id).update(cfg_enableDefinitions, true);
        }),
        vscode.commands.registerCommand(`${cfg_id}.${cfg_extractGilResources}`, args => {
            vscode.workspace.getConfiguration(cfg_id).update(cfg_extractGilResources, true);
        }),
        statusBar
    );

    const gilWatcher = vscode.workspace.createFileSystemWatcher(`**/${workspaceRoot.name}.gil`);
    gilWatcher.onDidChange(uri => {
        if (!mililuaSettings.inspect<boolean>(cfg_enableDefinitions)?.workspaceValue
            || !mililuaSettings.inspect<boolean>(cfg_extractGilResources)?.workspaceValue) {
            return;
        }
        extractGilResources(uri, gilResourceHandler);
    })
    context.subscriptions.push(gilWatcher);

    checkEnableDefinitions(context);
    updateStatusBar(context);
    statusBar.show()
}

export function deactivate() {
    console.log("Deactivating MiliLua API Definitions")
}