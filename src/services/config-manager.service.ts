import * as vscode from "vscode";
import { SHORT_ID } from "@/constants/extension";
import { isInMiliLuaWorkspace } from "@/utils/extension.utils";
import { GIL_RESOURCE_DIRECTORY } from "@/constants/gil-resources";
import { ExtensionConfig, EXTENSION_CONFIG, LuaConfig, LUA_CONFIG, LuaDiagnostic, LUA_DIAGNOSTIC } from "@/constants/config";

export class ConfigManager {
    private readonly extensionConfig = vscode.workspace.getConfiguration(SHORT_ID);
    private readonly luaConfig = vscode.workspace.getConfiguration("Lua");
    private readonly luaLibraryPath: string;
    private readonly isMiliLuaLib: RegExp;
    private hasCheckedWorkspaceConfig = false;

    constructor(
        context: vscode.ExtensionContext,
        private readonly workspaceFolder: vscode.WorkspaceFolder,
    ) {
        this.luaLibraryPath = vscode.Uri.joinPath(context.extensionUri, "resources", "library").fsPath.replace(/\\/g, '/');
        this.isMiliLuaLib = RegExp(`(?:${context.extension.packageJSON.name}|${GIL_RESOURCE_DIRECTORY})`);

        this.checkWorkspaceConfig();

        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (!e.affectsConfiguration(SHORT_ID)) { return; }
                this.updateLuaWorkspaceLibrary();
            }),
            vscode.workspace.onDidCreateFiles(e => {
                this.checkWorkspaceConfig();
            })
        );
    }

    updateLuaWorkspaceLibrary() {
        let luaLibs = this.luaConfig.inspect<string[]>(LUA_CONFIG.WORKSPACE_LIBRARY)?.workspaceValue ?? [];
        luaLibs = luaLibs.filter(lib => !this.isMiliLuaLib.test(lib));

        if (this.extensionConfig.inspect<boolean>(EXTENSION_CONFIG.ENABLE_DEFINITIONS)?.workspaceValue) {
            if (!luaLibs.includes(this.luaLibraryPath)) { luaLibs.push(this.luaLibraryPath); }
            if (this.extensionConfig.inspect<boolean>(EXTENSION_CONFIG.EXTRACT_GIL_RESOURCES)?.workspaceValue && !luaLibs.includes(GIL_RESOURCE_DIRECTORY)) {
                luaLibs.push(`./${GIL_RESOURCE_DIRECTORY}`);
            }

            this.luaConfig.update(LUA_CONFIG.RUNTIME_VERSION, "Lua 5.3", vscode.ConfigurationTarget.Workspace);
            this.luaConfig.update(LUA_CONFIG.COMPLETION_SHOW_WORD, "Disable");
        }
        else {
            this.luaConfig.update(LUA_CONFIG.RUNTIME_VERSION, undefined, vscode.ConfigurationTarget.Workspace);
            this.luaConfig.update(LUA_CONFIG.COMPLETION_SHOW_WORD, undefined, vscode.ConfigurationTarget.Workspace);
            this.toggleLuaDiagnostic(LUA_DIAGNOSTIC.NEED_CHECK_NIL, false);
        }

        this.luaConfig.update(LUA_CONFIG.WORKSPACE_LIBRARY, luaLibs.length > 0 ? luaLibs : undefined, vscode.ConfigurationTarget.Workspace);
    }

    async checkWorkspaceConfig() {
        if (this.hasCheckedWorkspaceConfig || !await isInMiliLuaWorkspace(this.workspaceFolder)) { return; }

        this.hasCheckedWorkspaceConfig = true;
        switch (this.getExtensionConfig<boolean>(EXTENSION_CONFIG.ENABLE_DEFINITIONS)) {
            case true:
                this.updateLuaWorkspaceLibrary();
                break;
            case false:
                break;
            default:
                vscode.window.showInformationMessage("Would you like to enable MiliLua API Definitions for this workspace? Miliastra Lua API definitions and Gil Resource Extraction will be enabled for this workspace.",
                    "Yes", "Lua API Only", "No")
                    .then(choice => {
                        this.extensionConfig.update(EXTENSION_CONFIG.ENABLE_DEFINITIONS, choice === "Yes" || choice === "Lua API Only");
                        this.extensionConfig.update(EXTENSION_CONFIG.EXTRACT_GIL_RESOURCES, choice === "Yes");
                    });
                break;
        }
    }

    toggleExtensionConfig<T = boolean>(config: ExtensionConfig, set?: boolean, trueValue: T = true as unknown as T, falseValue: T = false as unknown as T) {
        const value = set !== undefined
            ? set ? trueValue : falseValue
            : this.getExtensionConfig<T>(config) === trueValue ? falseValue : trueValue;
        this.extensionConfig.update(config, value, vscode.ConfigurationTarget.Workspace);
    }

    toggleLuaConfig<T = boolean>(config: LuaConfig, set?: boolean, trueValue: T = true as unknown as T, falseValue: T = false as unknown as T) {
        const value = set !== undefined
            ? set ? trueValue : falseValue
            : this.getLuaConfig<T>(config) === trueValue ? falseValue : trueValue;
        this.luaConfig.update(config, value, vscode.ConfigurationTarget.Workspace);
    }

    toggleLuaDiagnostic(diagnostic: LuaDiagnostic, set?: boolean) {
        const luaDiagnostics = new Set(this.getLuaConfig<string[]>(LUA_CONFIG.DIAGNOSTICS_DISABLE) ?? []);
        if (set !== undefined) {
            if (set) { luaDiagnostics.add(diagnostic); }
            else { luaDiagnostics.delete(diagnostic); }
        }
        else {
            if (luaDiagnostics.has(diagnostic)) { luaDiagnostics.delete(diagnostic); }
            else { luaDiagnostics.add(diagnostic); };
        }
        this.luaConfig.update(LUA_CONFIG.DIAGNOSTICS_DISABLE, luaDiagnostics.size > 0 ? [...luaDiagnostics] : undefined, vscode.ConfigurationTarget.Workspace);
    }

    getExtensionConfig<T>(config: ExtensionConfig) {
        return this.extensionConfig.inspect<T>(config)?.workspaceValue;
    }

    getLuaConfig<T>(config: LuaConfig) {
        return this.luaConfig.inspect<T>(config)?.workspaceValue;
    }

    isLuaDiagnosticEnabled(diagnostic: LuaDiagnostic) {
        return (this.getLuaConfig<string[]>(LUA_CONFIG.DIAGNOSTICS_DISABLE) ?? []).includes(diagnostic);
    }
}
