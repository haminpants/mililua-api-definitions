import { Type, Field } from "protobufjs";

const scriptTextVariableType = new Type("ScriptTextVariable")
    .add(new Field("name", 3, "string"))
    .add(new Field("index", 2, "uint32"));

const projectType = new Type("Project")
    .add(new Field("name", 2, "string"))
    .add(new Field("script_text_variables", 3, "ScriptTextVariable", "repeated"));

const gilRoot = new Type("GilProtobuf")
    .add(scriptTextVariableType)
    .add(projectType);

export class GilProtobufParser {
    private readonly projectSchema: Type;

    constructor() {
        this.projectSchema = gilRoot.lookupType("Project");
    }

    public decode(bindaryData: Buffer | Uint8Array) {
        return this.projectSchema.decode(bindaryData);
    }
}