import ts from "typescript";
import { DeclarationIndex } from "./DeclarationIndex";
import path from "path";

export class SingleFileConverter {

    private sourceFile: ts.SourceFile;
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private decIndex: DeclarationIndex;
    
    public readonly imports: Map<string, Set<string>> = new Map();

    constructor(sourceFile: ts.SourceFile, program: ts.Program, decIndex: DeclarationIndex) {
        this.sourceFile = sourceFile;
        this.program = program;
        this.checker = this.program.getTypeChecker();
        this.decIndex = decIndex;
    }

    public convertOneFile(): string {

        const convResult = ts.transform(this.sourceFile, [this.getRemoveNamespaceTransformerFactory(), this.transformNamespaceRefTransformerFactory()], this.program.getCompilerOptions());
        const newImports: ts.Statement[] = [];
        for (let file of this.imports.keys()) {
            let relPath = path.relative(path.dirname(this.sourceFile.fileName), file);
            relPath = relPath.substring(0, relPath.length - 3); // Take off the .ts
            if (!relPath.startsWith(".")) {
                relPath = "./" + relPath;   // Add ./ if they are in the same directory
            }
            const importIds: string[] = [...this.imports.get(file)!.values()];
            newImports.push(
                ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamedImports(
                            importIds.map(id => ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(id)))
                        )
                    ),
                    ts.factory.createStringLiteral(relPath)
                )
            )
        }
        
        
        this.sourceFile = ts.factory.updateSourceFile(this.sourceFile, [
            ...newImports,
            ...convResult.transformed[0].statements
        ]);
        
        return ts.createPrinter().printNode(ts.EmitHint.Unspecified, this.sourceFile, this.sourceFile);
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
                    const fullName = this.checker.getFullyQualifiedName(symb!);
                    const fromFile = this.decIndex.getFileForDeclaration(fullName)!;
                    this.addImport(fromFile, node.name.text);
                    return node.name;
                }
                return ts.visitEachChild(node, visitor, ctx);
            }
            return (node) => ts.visitNode(node, visitor);
        };
    }

    private addImport(fromFile: string, id: string) {
        if (!this.imports.has(fromFile)) {
            this.imports.set(fromFile, new Set<string>());
        }

        this.imports.get(fromFile)?.add(id);
    }
}
