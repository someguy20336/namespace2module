import path from "path";
import ts from "typescript";

// https://github.com/vvakame/typescript-formatter/blob/master/lib/formatter.ts
class LanguageServiceHost implements ts.LanguageServiceHost {
    files: ts.MapLike<ts.IScriptSnapshot> = {};
    addFile(fileName: string, text: string) {
        this.files[fileName] = ts.ScriptSnapshot.fromString(text);
    }

    // for ts.LanguageServiceHost

    getCompilationSettings = () => ts.getDefaultCompilerOptions();
    getScriptFileNames = () => Object.keys(this.files);
    getScriptVersion = (_fileName: string) => "0";
    getScriptSnapshot = (fileName: string) => this.files[fileName];
    getCurrentDirectory = () => process.cwd();
    getDefaultLibFileName = (options: ts.CompilerOptions) => ts.getDefaultLibFilePath(options);
    readFile(path: string, encoding?: string | undefined): string | undefined {        
        throw "Not implemented";
    }
    fileExists(path: string): boolean {
        throw "Not implemented";
    }
}

class FileConverter {

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
            const relPath = path.relative(path.dirname(this.sourceFile.fileName), file);
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
        
        return this.format("Dummy Name", this.sourceFile.getText());
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

    private format(fileName: string, text: string) {
        const host = new LanguageServiceHost();
        host.addFile(fileName, text);
    
        const languageService = ts.createLanguageService(host);
        const edits = languageService.getFormattingEditsForDocument(fileName, {
            // TODO: support more settings here - or settings from a file
            indentSize: 4,
            convertTabsToSpaces: false
        });
        edits
            .sort((a, b) => a.span.start - b.span.start)
            .reverse()
            .forEach(edit => {
                const head = text.slice(0, edit.span.start);
                const tail = text.slice(edit.span.start + edit.span.length);
                text = `${head}${edit.newText}${tail}`;
            });
    
        return text;
    }
}

class DeclarationIndex {
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private currentSrcFile: ts.SourceFile | null = null;
    private fullNameToFilePath: Map<string, string> = new Map();

    constructor(program:  ts.Program) {
        this.program = program;
        this.checker = this.program.getTypeChecker();
    }

    public getFileForDeclaration(dec: string) {
        return this.fullNameToFilePath.get(dec);
    }

    public indexSourceFile(srcFile: ts.SourceFile) {
        this.currentSrcFile = srcFile;
        srcFile.forEachChild((node) => this.visitChildForModuleDeclaration(node));
        this.currentSrcFile = null;
    }

    private visitChildForModuleDeclaration(node: ts.Node) {
        if (ts.isModuleDeclaration(node) && node.body) {
            this.visitModuleDeclarationBody(node.body);
        } else if (node) {
            node.forEachChild((node) => this.visitChildForModuleDeclaration(node));
        }
    }

    private visitModuleDeclarationBody(node: ts.Node) {
        if (ts.isModuleDeclaration(node) && node.body) {
            this.visitModuleDeclarationBody(node.body);
        } else if (ts.isFunctionDeclaration(node)) {
            const symb = this.checker.getSymbolAtLocation(node.name!);
            this.fullNameToFilePath.set(this.checker.getFullyQualifiedName(symb!), this.currentSrcFile!.fileName);
        } else if (ts.isVariableStatement(node)){
            for (let v of node.declarationList.declarations) {
                const symb = this.checker.getSymbolAtLocation(v.name);
                this.fullNameToFilePath.set(this.checker.getFullyQualifiedName(symb!), this.currentSrcFile!.fileName);
            }
        } else {
            node.forEachChild((node) => this.visitModuleDeclarationBody(node));
        }
    }

}

export class Converter {

    private program: ts.Program;

    constructor(files: string[]) {
        this.program = ts.createProgram(files, {});
    }

    public convert(): void {

        // index fully qualified functions and variable declarations inside of a given namespace
        const decVisitor = new DeclarationIndex(this.program);
        for (const srcFile of this.getUserFiles()){
            decVisitor.indexSourceFile(srcFile);
        }

        for (const srcFile of this.getUserFiles()){
            console.log("Converting file: " + srcFile.fileName);
            const fileConv = new FileConverter(srcFile, this.program, decVisitor);
            const newFileText = fileConv.convertOneFile();
            console.log(newFileText);
        }
    }

    public getUserFiles(): ts.SourceFile[] {
        return this.program.getSourceFiles().filter(src => !src.fileName.endsWith(".d.ts"));    // TODO might be more to this...
    }
}
