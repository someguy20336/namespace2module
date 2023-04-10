import path from "path";
import { Converter } from "./converter";

// TODO: load from a package.json?
// TODO: what about modules?  can I auto-handle that?
const files = [path.resolve("tests\\fixtures\\TestFile1.ts"), path.resolve("tests\\fixtures\\TestFile2.ts")];
const converter = new Converter(files);
converter.convert();