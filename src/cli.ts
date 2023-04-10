import { Converter } from "./converter";

// TODO: probably full file paths here
const files = ["tests/fixtures/TestFile1.ts", "tests/fixtures/TestFile2.ts"];
const converter = new Converter(files);
converter.convert();