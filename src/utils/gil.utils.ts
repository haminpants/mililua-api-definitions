import * as fs from "fs/promises";
import { Uri } from "vscode";

export async function stripGilHeader(gilUri: Uri) {
    const gilBuffer = await fs.readFile(gilUri.fsPath);

    const contentLength = gilBuffer.readUInt32BE(0x10);
    const start = 20;
    const end = start + contentLength;

    return gilBuffer.subarray(start, end);
}