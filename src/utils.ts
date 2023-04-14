import ts from "typescript";

const newLineMarker = "//^^^^^NewLineMarker^^^^^";

export function encodeEmptyLines(text: string) {
    
    const lines = text.split(/\r?\n/);
    
    const commentedLines = lines.map(line => line.trim() == '' ? newLineMarker : line);
    
    return commentedLines.join("\r\n");
}

export function decodeEmptyLines(text: string){    
    var lines = text.split(/\r?\n/);

    const uncommentedLines = lines.map(line => line.trim() == newLineMarker ? '' : line);
    
    return uncommentedLines.join("\r\n");
}

export function format(fileName: string, text: string) {
    const host = new LanguageServiceHost();
    host.addFile(fileName, text);

    const languageService = ts.createLanguageService(host);
    const edits = languageService.getFormattingEditsForDocument(fileName, {
        // TODO: support more settings here - or settings from a file
        indentSize: 4,
        convertTabsToSpaces: false,
        insertSpaceBeforeAndAfterBinaryOperators: true,
        insertSpaceAfterCommaDelimiter: true,
        insertSpaceAfterKeywordsInControlFlowStatements: true

    } as ts.FormatCodeSettings);
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