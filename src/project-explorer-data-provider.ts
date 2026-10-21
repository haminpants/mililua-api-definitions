import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { TreeItemCollapsibleState } from "vscode";
import { homedir } from "os";

export const SAVES_DIR = "Beyond_Local_Save_Level"

const isUid = new RegExp(`^1?[1,2,3,5,6,7,8,9][0-9]{8}$`)

export class ProjectExplorerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children?: ProjectExplorerItem[]
    ) {
        super(label, collapsibleState);
    }
}

export class ProjectExplorerTreeDataProvider implements vscode.TreeDataProvider<ProjectExplorerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectExplorerItem | undefined | null | void> = new vscode.EventEmitter<ProjectExplorerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ProjectExplorerItem[] | ProjectExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private data: ProjectExplorerItem[] = [];

    constructor(
        public readonly beyondLocalPath = path.join(homedir(), "AppData", "LocalLow", "miHoYo", "Genshin Impact", "BeyondLocal")
    ) {
        this.update();
    }

    async update() {
        this.data = [];

        for (const dir of await fs.readdir(this.beyondLocalPath)) {
            const dirStats = await fs.lstat(`${this.beyondLocalPath}/${dir}`);
            if (!dirStats.isDirectory() || dirStats.isSymbolicLink() || !isUid.test(dir)) { continue; }

            this.data.push(new ProjectExplorerItem(dir, TreeItemCollapsibleState.Expanded))
        }

        this.updateView();
    }

    getTreeItem(element: ProjectExplorerItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ProjectExplorerItem | undefined): vscode.ProviderResult<ProjectExplorerItem[]> {
        if (!element) { return this.data; }
        return element.children;
    }

    updateView() {
        console.log("Updating view...")
        this._onDidChangeTreeData.fire();
    }
}