import path from "path";
import { Converter } from "./converter";
import ts from "typescript";
import { ConsoleResultWriter, FileResultWriter, ResultWriter } from "./ResultWriter";
import { exit } from "process";

// TODO: what about modules?  can I auto-handle that?
const argPath = process.argv[2];
if (!argPath) {
    console.log("tsconfig file path not specified");
    exit(1);
} else {
    const resolved = path.isAbsolute(argPath) ? argPath : path.resolve(argPath);
    const configFile = ts.readConfigFile(resolved, ts.sys.readFile);
    const options = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(resolved));
    const files = options.fileNames.map(fn => path.resolve(fn));

    const writer: ResultWriter = process.argv[3] === "-v"
        ? new ConsoleResultWriter()
        : new FileResultWriter();

    const converter = new Converter(files, writer);
    converter.convert();
}


