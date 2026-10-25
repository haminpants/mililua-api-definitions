import * as vscode from "vscode";
import { EXTENSION_ID } from "@/constants/extension";

export type ConfigKey = typeof CONFIGS[keyof typeof CONFIGS];
export const CONFIGS = {
    EnableDefinitions: "enableDefinitions",
    ExtractGilResources: "extractGilResources",
} as const;

export function getWorkspaceConfig<T>(config: ConfigKey): T | undefined {
    return vscode.workspace.getConfiguration(EXTENSION_ID).inspect<T>(config)?.workspaceValue;
}