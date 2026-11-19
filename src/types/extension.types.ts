import { Uri } from "vscode";

export interface StageSaveData {
    id: string,
    uri: Uri,
    name: string
}

export interface UidSaveData {
    uid: string,
    uri: Uri,
    nickname: string,
    saves: StageSaveData[]
}