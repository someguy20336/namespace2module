import ts from "typescript";

class FileConverter {

    private sourceFile: ts.SourceFile;
    private program: ts.Program;
    private checker: ts.TypeChecker;
    
    public readonly imports: Map<string, Set<string>> = new Map();

    constructor(sourceFile: ts.SourceFile, program: ts.Program) {
        this.sourceFile = sourceFile;
        this.program = program;
        this.checker = this.program.getTypeChecker();
    }

    public convertOneFile(): void {
        const convResult = ts.transform(this.sourceFile, [this.getRemoveNamespaceTransformerFactory(), this.transformNamespaceRefTransformerFactory()], this.program.getCompilerOptions());
        const printed = ts.createPrinter().printNode(ts.EmitHint.Unspecified, convResult.transformed[0], this.sourceFile);
        console.log(printed);
    }

    private getRemoveNamespaceTransformerFactory(): ts.TransformerFactory<ts.SourceFile> {
        return (ctx) => {

            const visitor: ts.Visitor = node => {
                if (ts.isModuleDeclaration(node)) {
                    let bodyNode = node.body;
                    while (typeof bodyNode !== "undefined" && ts.isModuleDeclaration(bodyNode)) {
                        bodyNode = bodyNode.body;
                    }
                    if (typeof bodyNode !== "undefined" && ts.isModuleBlock(bodyNode)) {
                        return [...bodyNode.statements.values()];
                    }
                    return bodyNode;
                } 
                return ts.visitEachChild(node, visitor, ctx);
            }
            return (node) => ts.visitNode(node, visitor);
        };
    }

    private transformNamespaceRefTransformerFactory(): ts.TransformerFactory<ts.SourceFile> {
        return (ctx) => {

            const visitor: ts.Visitor = node => {
                if (ts.isImportEqualsDeclaration(node)) {
                    return undefined;   // remove "import x = Some.Namespace"
                } else if (ts.isPropertyAccessExpression(node)) {
                    const symb = this.checker.getSymbolAtLocation(node.name);
                    // TODO: use fully qualified name to figure it out?
                    return node;
                }
                return ts.visitEachChild(node, visitor, ctx);
            }
            return (node) => ts.visitNode(node, visitor);
        };
    }
}

export class Converter {

    private program: ts.Program;
    constructor(files: string[]) {
        this.program = ts.createProgram(files, {});
    }

    public convert(): void {
        for (const srcFile of this.program.getSourceFiles().filter(src => !src.fileName.endsWith(".d.ts"))){
            console.log(srcFile.fileName);
            const fileConv = new FileConverter(srcFile, this.program);
            fileConv.convertOneFile();
        }
    }


}
