import ts from "typescript";


export class Converter {

    private program: ts.Program;
    constructor(files: string[]) {
        this.program = ts.createProgram(files, {});
    }

    public convert(): void {
        for (const srcFile of this.program.getSourceFiles()){
            console.log(srcFile.fileName);
            this.convertOneFile(srcFile);
        }
    }

    private convertOneFile(srcFile: ts.SourceFile): void {
        const newNode = ts.visitNode(srcFile, node => {

            if (ts.isModuleDeclaration(node)) {
                console.log("found one");
            }

            return node;
        });
    }
}
