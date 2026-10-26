import * as vscode from "vscode";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";
import { GIL_RESOURCE_DIRECTORY } from "@/constants/gil-resources";
import { SHORT_ID } from "@/constants/extension";

const LUA_CONFIG = {
    WorkspaceLibrary: "workspace.library",
    RuntimeVersion: "runtime.version"
} as const;

export class ConfigListener {
    private extensionConfig = vscode.workspace.getConfiguration(SHORT_ID);
    private luaLibraryPath: string;
    private isMiliLuaLib: RegExp;
    private listener: vscode.Disposable;

    constructor(
        context: vscode.ExtensionContext
    ) {
        this.luaLibraryPath = vscode.Uri.joinPath(context.extensionUri, "resources", "library").fsPath.replace(/\\/g, '/');
        this.isMiliLuaLib = RegExp(`(?:${context.extension.packageJSON.name}|${GIL_RESOURCE_DIRECTORY})`);

        this.listener = vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration(SHORT_ID)) { return; }
            this.updateLuaWorkspaceLibrary();
        });

        context.subscriptions.push(this.listener);
    }

    updateLuaWorkspaceLibrary() {
        const luaConfig = vscode.workspace.getConfiguration("Lua");
        let luaLibs = luaConfig.inspect<string[]>(LUA_CONFIG.WorkspaceLibrary)?.workspaceValue ?? [];
        luaLibs = luaLibs.filter(lib => !this.isMiliLuaLib.test(lib));

        if (this.extensionConfig.inspect<boolean>(CONFIGS.EnableDefinitions)?.workspaceValue) {
            if (!luaLibs.includes(this.luaLibraryPath)) { luaLibs.push(this.luaLibraryPath); }
            if (this.extensionConfig.inspect<boolean>(CONFIGS.ExtractGilResources)?.workspaceValue && !luaLibs.includes(GIL_RESOURCE_DIRECTORY)) {
                luaLibs.push(`./${GIL_RESOURCE_DIRECTORY}`);
            }

            luaConfig.update(LUA_CONFIG.RuntimeVersion, "Lua 5.3");
        }
        else {
            luaConfig.update(LUA_CONFIG.RuntimeVersion, undefined);
        }

        luaConfig.update(LUA_CONFIG.WorkspaceLibrary, luaLibs.length > 0 ? luaLibs : undefined);
    }

    checkEnabled() {
        switch (getWorkspaceConfig<boolean>(CONFIGS.EnableDefinitions)) {
            case true:
                this.updateLuaWorkspaceLibrary();
                break;
            case false:
                break;
            default:
                vscode.window.showInformationMessage("Would you like to enable MiliLua API Definitions for this workspace? Miliastra Lua API definitions and Gil Resource Extraction will be enabled for this workspace.", "Yes", "No")
                    .then(choice => {
                        this.extensionConfig.update(CONFIGS.EnableDefinitions, choice === "Yes");
                        this.extensionConfig.update(CONFIGS.ExtractGilResources, choice === "Yes");
                    });
                break;
        }
    }
}
