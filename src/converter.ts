import ts from "typescript";


export class Converter {

    private program: ts.Program;
    constructor(files: string[]) {
        this.program = ts.createProgram(files, {});
    }

    public convert(): void {
        for (const srcFile of this.program.getSourceFiles().filter(src => !src.fileName.endsWith(".d.ts"))){
            console.log(srcFile.fileName);
            this.convertOneFile(srcFile);
        }
    }

    private convertOneFile(srcFile: ts.SourceFile): void {
        const convResult = ts.transform(srcFile, [this.getRemoveNamespaceTransformerFactory()], this.program.getCompilerOptions());
        const printed = ts.createPrinter().printNode(ts.EmitHint.Unspecified, convResult.transformed[0], srcFile);
        console.log(printed);
    }

    private getRemoveNamespaceTransformerFactory(): ts.TransformerFactory<ts.SourceFile> {
        return (ctx) => {

            const visitor: ts.Visitor = node => {
                if (ts.isModuleDeclaration(node)) {
                    return ts.visitNode(node.body, visitor);
                } else if (ts.isModuleBlock(node)) {
                    return [...node.statements.values()];
                }
                return ts.visitEachChild(node, visitor, ctx);
            }
            return (node) => ts.visitNode(node, visitor);
        };
    }
}
