import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";

const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {},
    strict: true,
    allowPositionals: true
});

const filePath = positionals[0];
if (!filePath) {
    console.error("No file path specified.")
    process.exit()
}
if (path.extname(filePath) !== ".gil") {
    console.error("Provided file must be a .gil file.")
    process.exit()
}

const fileBuffer = fs.readFileSync(filePath);

const contentLength = fileBuffer.readUInt32BE(0x10);
const start = 20;
const end = start + contentLength;
const data = fileBuffer.subarray(start, end);

fs.writeFileSync("gil_dump.bin", data);
console.log("Dumped .gil data successfully!");