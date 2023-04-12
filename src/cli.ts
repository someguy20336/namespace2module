import path from "path";
import { Converter } from "./converter";
import ts from "typescript";
import { ConsoleResultWriter } from "./ResultWriter";

// TODO: take in path to config file as
// TODO: what about modules?  can I auto-handle that?


const configFile = ts.readConfigFile("tsconfig.test.json", ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(configFile.config, ts.sys, "./");
const files = options.fileNames.map(fn => path.resolve(fn));
const converter = new Converter(files, new ConsoleResultWriter());
converter.convert();