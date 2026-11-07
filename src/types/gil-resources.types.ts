import { GilFile } from "@/generated/protobufs/gil";

export type StructureConfigIdMap = Record<number, string>;

export interface GilResourceExtractFormat {
    readonly fileName: string;
    readonly format: (gilData: GilFile) => string;
}