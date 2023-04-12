import ts from "typescript";

export interface ResultWriter {
    writeResult(fileName: string, content: string): void;
}

export class ConsoleResultWriter implements ResultWriter {
    writeResult(fileName: string, content: string): void {
        console.log("Result for " + fileName);
        console.log(content);
    }
}

export class FileResultWriter implements ResultWriter {
    writeResult(fileName: string, content: string): void {
        ts.sys.writeFile(fileName, content);
    }
}