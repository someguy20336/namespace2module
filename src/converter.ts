import ts from "typescript";
import { decodeEmptyLines, encodeEmptyLines, format } from "./utils";
import { DeclarationIndex } from "./DeclarationIndex";
import { SingleFileConverter } from "./SingleFileConverter";

export class Converter {

    private program: ts.Program;

    constructor(files: string[]) {
        const host = ts.createCompilerHost({}, true);
        host.readFile = (file) =>{
            let contents = ts.sys.readFile(file)!;
            return encodeEmptyLines(contents);
        }
        this.program = ts.createProgram(files, {}, host);
    }

    public convert(): void {

        // index fully qualified functions and variable declarations inside of a given namespace
        const decVisitor = new DeclarationIndex(this.program);
        for (const srcFile of this.getUserFiles()){
            decVisitor.indexSourceFile(srcFile);
        }

        for (const srcFile of this.getUserFiles()){
            console.log("Converting file: " + srcFile.fileName);
            const fileConv = new SingleFileConverter(srcFile, this.program, decVisitor);
            let newFileText = fileConv.convertOneFile();
            newFileText = format("Dummy Name.ts", decodeEmptyLines(newFileText));
            console.log(newFileText);
        }
    }

    public getUserFiles(): ts.SourceFile[] {
        return this.program.getSourceFiles().filter(src => !src.fileName.endsWith(".d.ts"));    // TODO might be more to this...
    }
}
