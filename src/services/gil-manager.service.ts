import * as vscode from "vscode";
import { stripGilHeader } from "@/utils/gil.utils";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";
import { BeyondStage } from "@/generated/protobufs/beyond_stage";
import { GilResourceHandler } from "@/services/gil-resource.service";
import { GIL_RESOURCES, GilResource } from "@/constants/gil-resources";

export class GilManager {
    public readonly gilFileName: string;
    public readonly resourceHandler: GilResourceHandler;
    private lastExtract = -1;

    constructor(
        context: vscode.ExtensionContext,
        private readonly targetWorkspace: vscode.WorkspaceFolder,
    ) {
        this.gilFileName = `${targetWorkspace.name}.gil`;
        this.resourceHandler = new GilResourceHandler(targetWorkspace.uri);

        const gilWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(targetWorkspace, this.gilFileName), true, false, true);
        gilWatcher.onDidChange(this.onGilChanged);

        context.subscriptions.push(gilWatcher);
    }

    async extractAllResources(force = false) {
        const gilData = BeyondStage.decode(await stripGilHeader(this.getGilUri()));
        this.lastExtract = Date.now();
        return Promise.all((Object.keys(GIL_RESOURCES) as GilResource[]).map(async resource => this.resourceHandler.extractResource(resource, gilData, force)));
    }

    private onGilChanged = async () => {
        if (!getWorkspaceConfig(CONFIGS.EnableDefinitions) || !getWorkspaceConfig(CONFIGS.ExtractGilResources)) { return; }
        try {
            await this.extractAllResources();
        } catch (error) { console.error(`Failed to decode ${this.getGilUri().fsPath}`), error }
    }

    getGilUri() {
        return vscode.Uri.joinPath(this.targetWorkspace.uri, this.gilFileName);
    }

    getLastExtract() {
        return this.lastExtract;
    }
}