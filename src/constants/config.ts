import * as vscode from "vscode";
import { SHORT_ID } from "./extension";

export type ConfigKey = typeof CONFIGS[keyof typeof CONFIGS];
export const CONFIGS = {
    EnableDefinitions: "enableDefinitions",
    ExtractGilResources: "extractGilResources",
} as const;

export function getWorkspaceConfig<T>(config: ConfigKey): T | undefined {
    return vscode.workspace.getConfiguration(SHORT_ID).inspect<T>(config)?.workspaceValue;
}