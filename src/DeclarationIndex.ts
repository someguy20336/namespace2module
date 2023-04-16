import ts from "typescript";

export class DeclarationIndex {
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
        } else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
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