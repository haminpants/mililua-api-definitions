import * as vscode from "vscode";
import { stripGilHeader } from "@/utils/gil.utils";
import { GilFile } from "@/generated/protobufs/gil";
import { EXTENSION_CONFIG } from "@/constants/config";
import { ConfigManager } from "@/services/config-manager.service";
import { GilResourceHandler } from "@/services/gil-resource.service";
import { GIL_RESOURCES, GilResource } from "@/constants/gil-resources";

export class GilManager {
    public readonly gilFileName: string;
    public readonly resourceHandler: GilResourceHandler;

    constructor(
        context: vscode.ExtensionContext,
        private readonly targetWorkspace: vscode.WorkspaceFolder,
        private readonly configManager: ConfigManager
    ) {
        this.gilFileName = `${targetWorkspace.name}.gil`;
        this.resourceHandler = new GilResourceHandler(targetWorkspace.uri);

        const gilWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(targetWorkspace, this.gilFileName), true, false, true);
        gilWatcher.onDidChange(this.onGilChanged);

        context.subscriptions.push(gilWatcher);
    }

    async extractAllResources(force = false) {
        const gilData = GilFile.decode(await stripGilHeader(this.getGilUri()));
        return Promise.all((Object.keys(GIL_RESOURCES) as GilResource[]).map(async resource => this.resourceHandler.extractResource(resource, gilData, force)));
    }

    private onGilChanged = async () => {
        if (!this.configManager.getExtensionConfig(EXTENSION_CONFIG.ENABLE_DEFINITIONS) || !this.configManager.getExtensionConfig(EXTENSION_CONFIG.EXTRACT_GIL_RESOURCES)) { return; }
        try {
            await this.extractAllResources();
        } catch (error) { console.error(`Failed to decode ${this.getGilUri().fsPath}`), error }
    }

    getGilUri() {
        return vscode.Uri.joinPath(this.targetWorkspace.uri, this.gilFileName);
    }
}