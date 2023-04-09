import { Converter } from "./converter";

const files = ["tests/fixtures/TestFile1.ts"];
const converter = new Converter(files);
converter.convert();