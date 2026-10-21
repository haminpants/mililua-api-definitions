import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { TreeItemCollapsibleState } from "vscode";
import { homedir } from "os";

export const LEVEL_SAVE_DIR = "Beyond_Local_Save_Level"

const isUid = new RegExp(`^1?[1,2,3,5,6,7,8,9][0-9]{8}$`);
const isStage = new RegExp(`^[0-9]{10}$`);

export enum ICON_PATH {
    SAVE = "miliastra_save_icon.svg"
}

class PlayerDirectory {
    constructor(
        public readonly uid: string,
    ) { }
}

export class ProjectExplorerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        iconPath?: ICON_PATH,
        public readonly children?: ProjectExplorerItem[],
    ) {
        super(label, collapsibleState);
        this.iconPath = iconPath
    }
}

export class ProjectExplorerTreeDataProvider implements vscode.TreeDataProvider<ProjectExplorerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectExplorerItem | undefined | null | void> = new vscode.EventEmitter<ProjectExplorerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ProjectExplorerItem[] | ProjectExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private readonly beyondLocalPath = path.join(homedir(), "AppData", "LocalLow", "miHoYo", "Genshin Impact", "BeyondLocal");
    private data: ProjectExplorerItem[] = [];

    constructor() {
        this.update();
    }

    async update() {
        const playerDirectories = await this.getPlayerDirectories();

        const results = await Promise.allSettled(playerDirectories.map(async p => {
            const stageDirs = await fs.readdir(path.join(this.beyondLocalPath, p.uid, LEVEL_SAVE_DIR));

            const stageCheckResults = await Promise.allSettled(
                stageDirs.map(async stageDir => {
                    const stageFiles = await fs.readdir(path.join(this.beyondLocalPath, p.uid, LEVEL_SAVE_DIR, stageDir));

                    const isValid = stageFiles.includes(`${stageDir}.gil`) && stageFiles.includes("external_lua_file");

                    return { stageDir, isValid };
                })
            );

            const validStages = stageCheckResults
                .filter((s): s is PromiseFulfilledResult<{ stageDir: string; isValid: boolean }> => {
                    return s.status === "fulfilled" && s.value.isValid === true;
                })
                .map(s => {
                    return new ProjectExplorerItem(s.value.stageDir, TreeItemCollapsibleState.None);
                });

            return new ProjectExplorerItem(p.uid, TreeItemCollapsibleState.Expanded, undefined, validStages);
        }))

        this.data = results.filter(r => { return r.status === "fulfilled" }).map(r => r.value);

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

    private async getPlayerDirectories(): Promise<PlayerDirectory[]> {
        const files = await fs.readdir(this.beyondLocalPath);

        const results = await Promise.allSettled(files.map(async file => {
            const filePath = path.join(this.beyondLocalPath, file);
            const stats = await fs.lstat(filePath);
            return { file, stats }
        }));

        return results.filter((r): r is PromiseFulfilledResult<{ file: string, stats: any }> => {
            return r.status === "fulfilled"
                && r.value.stats.isDirectory()
                && !r.value.stats.isSymbolicLink()
                && isUid.test(r.value.file);
        }).map(r => { return new PlayerDirectory(r.value.file) })
    }
}