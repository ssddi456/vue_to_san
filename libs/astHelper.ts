import * as ts from 'typescript';
import * as debugFactory from 'debug';

const debug = debugFactory('astHelper');

function findIdentifierNodeAtLocation<T extends ts.Node>(offset: number, result: { lastVisited: ts.Node | undefined }) {
    return function (context: ts.TransformationContext) {
        return function (rootNode: T) {
            function visit(node: ts.Node): ts.Node {
                console.log(node);

                if (node.pos >= 0 && node.end >= 0 && node.pos < node.end) {
                    if (node.pos > offset) {
                        return node;
                    }
                    if (node.end < offset) {
                        return node;
                    }
                    result.lastVisited = node;
                }

                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(rootNode, visit);
        }
    }
}


export function findIdentifierNodeAtLocationInAst(sourceFile: ts.SourceFile, offset: number) {
    const lastVisited: { lastVisited : ts.Node | undefined} = { lastVisited: undefined };
    ts.transform<ts.SourceFile>(sourceFile, [findIdentifierNodeAtLocation(offset, lastVisited)]);
    return lastVisited.lastVisited;
}
/**
 * seems it is a internal api but we need it.
 */
export function setExternalModuleIndicator(sourceFile: ts.SourceFile) {
    debug((() => ['setExternalModuleIndicator', sourceFile.fileName])());
    const privateTs = ts as any;
    (sourceFile as any).externalModuleIndicator = privateTs.forEach(sourceFile.statements, function (node: ts.Node) {
        return privateTs.hasModifier(node, 1 /* Export */)
            || node.kind === 241 /* ImportEqualsDeclaration */ && (node as any).moduleReference.kind === 252 /* ExternalModuleReference */
            || node.kind === 242 /* ImportDeclaration */
            || node.kind === 247 /* ExportAssignment */
            || node.kind === 248 /* ExportDeclaration */
            ? node
            : undefined;
    });
}

export function typeNodeFromString(typeString: string) {
    const tempSourceFile = ts.createSourceFile('test.ts', 'type myType = ' + typeString, ts.ScriptTarget.ES5);
    const tempType = tempSourceFile.statements[0] as ts.TypeAliasDeclaration;
    return tempType.type;
}

const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
});

function nodeTypeLogger<T extends ts.Node>(context: ts.TransformationContext) {
    return function (rootNode: T) {
        function visit(node: ts.Node): ts.Node {
            console.log("Visiting " + ts.SyntaxKind[node.kind]);

            if (node.kind == ts.SyntaxKind.Identifier) {
                console.log((node as ts.Identifier).escapedText);
            }

            return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(rootNode, visit);
    }
}

export function logCodeAst(code: string) {
    console.log('---------');
    const instanceDataInsertor = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES5);
    ts.transform<ts.Statement>(instanceDataInsertor.statements[0], [nodeTypeLogger]);
}

export function logAstCode(ast: ts.Node) {
    console.log('---------');
    console.log(printer.printNode(ts.EmitHint.Unspecified, ast,
        ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES3)
    ));
}

export function astStringify(ast: ts.Node){
    return printer.printNode(ts.EmitHint.Unspecified, ast,
        ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES3)
    );
}

/** Create a function that calls setTextRange on synthetic wrapper nodes that need a valid range */
export function getWrapperRangeSetter(wrapped: ts.TextRange): <T extends ts.TextRange>(wrapperNode: T) => T {
    return <T extends ts.TextRange>(wrapperNode: T) => ts.setTextRange(wrapperNode, wrapped);
}
export const setZeroPos = getWrapperRangeSetter({ pos: 0, end: 0 });
export function wrapSetPos(setpos: <T extends ts.TextRange>(wrapNode: T) => T) {
    return function <T extends ts.TextRange>(createNode: (...args: any[]) => T) {
        return (...args: any[]) => {
            return setpos<ReturnType<typeof createNode>>(createNode.call(null, ...args));
        };
    }
}
export const setZeroPosed = wrapSetPos(setZeroPos);

export const createAsExpression = setZeroPosed(ts.createAsExpression) as typeof ts.createAsExpression;
export const createBinary = setZeroPosed(ts.createBinary) as typeof ts.createBinary;
export const createConditionalTypeNode = setZeroPosed(ts.createConditionalTypeNode) as typeof ts.createConditionalTypeNode;
export const createIdentifier = setZeroPosed(ts.createIdentifier) as typeof ts.createIdentifier;
export const createImportClause = setZeroPosed(ts.createImportClause) as typeof ts.createImportClause;
export const createImportDeclaration = setZeroPosed(ts.createImportDeclaration) as typeof ts.createImportDeclaration;
export const createImportSpecifier = setZeroPosed(ts.createImportSpecifier) as typeof ts.createImportSpecifier;
export const createInferTypeNode = setZeroPosed(ts.createInferTypeNode) as typeof ts.createInferTypeNode;
export const createKeywordTypeNode = setZeroPosed(ts.createKeywordTypeNode) as typeof ts.createKeywordTypeNode;
export const createLanguageServiceSourceFile = setZeroPosed(ts.createLanguageServiceSourceFile) as typeof ts.createLanguageServiceSourceFile;
export const createLiteral = setZeroPosed(ts.createLiteral) as typeof ts.createLiteral;
export const createNamedImports = setZeroPosed(ts.createNamedImports) as typeof ts.createNamedImports;
export const createNamespaceImport = setZeroPosed(ts.createNamespaceImport) as typeof ts.createNamespaceImport;
export const createObjectLiteral = setZeroPosed(ts.createObjectLiteral) as typeof ts.createObjectLiteral;
export const createParen = setZeroPosed(ts.createParen) as typeof ts.createParen;
export const createPropertyAccess = setZeroPosed(ts.createPropertyAccess) as typeof ts.createPropertyAccess;
export const createPropertySignature = setZeroPosed(ts.createPropertySignature) as typeof ts.createPropertySignature;
export const createQualifiedName = setZeroPosed(ts.createQualifiedName) as typeof ts.createQualifiedName;
export const createTypeAliasDeclaration = setZeroPosed(ts.createTypeAliasDeclaration) as typeof ts.createTypeAliasDeclaration;
export const createTypeLiteralNode = setZeroPosed(ts.createTypeLiteralNode) as typeof ts.createTypeLiteralNode;
export const createTypeParameterDeclaration = setZeroPosed(ts.createTypeParameterDeclaration) as typeof ts.createTypeParameterDeclaration;
export const createTypeQueryNode = setZeroPosed(ts.createTypeQueryNode) as typeof ts.createTypeQueryNode;
export const createTypeReferenceNode = setZeroPosed(ts.createTypeReferenceNode) as typeof ts.createTypeReferenceNode;
export const createVariableDeclaration = setZeroPosed(ts.createVariableDeclaration) as typeof ts.createVariableDeclaration;
export const createVariableDeclarationList = setZeroPosed(ts.createVariableDeclarationList) as typeof ts.createVariableDeclarationList;
export const createVariableStatement = setZeroPosed(ts.createVariableStatement) as typeof ts.createVariableStatement;


export function createVts(pos: ts.TextRange) {
    const setPosed = wrapSetPos(getWrapperRangeSetter(pos));
    return {
        createStatement: setPosed(ts.createStatement) as typeof ts.createStatement,
        createAsExpression: setPosed(ts.createAsExpression) as typeof ts.createAsExpression,
        createBinary: setPosed(ts.createBinary) as typeof ts.createBinary,
        createConditionalTypeNode: setPosed(ts.createConditionalTypeNode) as typeof ts.createConditionalTypeNode,
        createIdentifier: setPosed(ts.createIdentifier) as typeof ts.createIdentifier,
        createImportClause: setPosed(ts.createImportClause) as typeof ts.createImportClause,
        createImportDeclaration: setPosed(ts.createImportDeclaration) as typeof ts.createImportDeclaration,
        createImportSpecifier: setPosed(ts.createImportSpecifier) as typeof ts.createImportSpecifier,
        createInferTypeNode: setPosed(ts.createInferTypeNode) as typeof ts.createInferTypeNode,
        createKeywordTypeNode: setPosed(ts.createKeywordTypeNode) as typeof ts.createKeywordTypeNode,
        createLanguageServiceSourceFile: setPosed(ts.createLanguageServiceSourceFile) as typeof ts.createLanguageServiceSourceFile,
        createLiteral: setPosed(ts.createLiteral) as typeof ts.createLiteral,
        createNamedImports: setPosed(ts.createNamedImports) as typeof ts.createNamedImports,
        createNamespaceImport: setPosed(ts.createNamespaceImport) as typeof ts.createNamespaceImport,
        createObjectLiteral: setPosed(ts.createObjectLiteral) as typeof ts.createObjectLiteral,
        createParen: setPosed(ts.createParen) as typeof ts.createParen,
        createPropertyAccess: setPosed(ts.createPropertyAccess) as typeof ts.createPropertyAccess,
        createPropertySignature: setPosed(ts.createPropertySignature) as typeof ts.createPropertySignature,
        createQualifiedName: setPosed(ts.createQualifiedName) as typeof ts.createQualifiedName,
        createTypeAliasDeclaration: setPosed(ts.createTypeAliasDeclaration) as typeof ts.createTypeAliasDeclaration,
        createTypeLiteralNode: setPosed(ts.createTypeLiteralNode) as typeof ts.createTypeLiteralNode,
        createTypeParameterDeclaration: setPosed(ts.createTypeParameterDeclaration) as typeof ts.createTypeParameterDeclaration,
        createTypeQueryNode: setPosed(ts.createTypeQueryNode) as typeof ts.createTypeQueryNode,
        createTypeReferenceNode: setPosed(ts.createTypeReferenceNode) as typeof ts.createTypeReferenceNode,
        createVariableDeclaration: setPosed(ts.createVariableDeclaration) as typeof ts.createVariableDeclaration,
        createVariableDeclarationList: setPosed(ts.createVariableDeclarationList) as typeof ts.createVariableDeclarationList,
        createVariableStatement: setPosed(ts.createVariableStatement) as typeof ts.createVariableStatement,
        createNodeArray: setPosed(ts.createNodeArray) as typeof ts.createNodeArray,
        createIntersectionTypeNode: setPosed(ts.createIntersectionTypeNode) as typeof ts.createIntersectionTypeNode,
        createExportDefault: setPosed(ts.createExportDefault) as typeof ts.createExportDefault,
        createCall: setPosed(ts.createCall) as typeof ts.createCall,
    };
};

export const vts = createVts({ pos: 0, end: 1 });

export function setPosAstTree<T extends ts.Node>(node: T, pos: ts.TextRange): T {
    return ts.transform(node, [function <T extends ts.Node>(context: ts.TransformationContext): (node: T) => ts.Node {
        return function (rootNode: ts.Node) {
            function visit(node: ts.Node): ts.Node {
                ts.setTextRange(node, pos);
                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(rootNode, visit);
        }

    }]).transformed[0] as T;
}

export function movePosAstTree<T extends ts.Node>(node: T, pos: number): T {
    return ts.transform(node, [function <T extends ts.Node>(context: ts.TransformationContext): (node: T) => ts.Node {
        return function (rootNode: ts.Node) {
            function visit(node: ts.Node): ts.Node {
                ts.setTextRange(node, { pos: node.pos + pos, end: node.end + pos });
                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(rootNode, visit);
        }

    }]).transformed[0] as T;
}

export function getWarppedAstRangeSetter(pos: ts.TextRange) {
    return function <T extends ts.Node>(node: T) {
        return setPosAstTree(node, pos);
    }
}

export function getWarppedAstCreatorRangeSetter(pos: ts.TextRange) {
    return function <T extends ts.Node>(createNode: (...args: any[]) => T) {
        return function (...args: any[]) {
            return setPosAstTree(createNode(...args), pos);
        }
    }
}

export const resetPosAstRangeSetter = getWarppedAstRangeSetter({ pos: -1, end: -1 });

export function startPos(pos: ts.TextRange): ts.TextRange {
    return {
        pos: pos.pos - 1,
        end: pos.pos,
    };
}
export function startZeroPos(pos: ts.TextRange): ts.TextRange {
    return {
        pos: pos.pos,
        end: pos.pos,
    };
}
export function endPos(pos: ts.TextRange): ts.TextRange {
    return {
        pos: pos.pos,
        end: pos.pos + 1,
    };
}
export function endZeroPos(pos: ts.TextRange): ts.TextRange {
    return {
        pos: pos.end,
        end: pos.end,
    };
}

export function findDefaultExports(sourceFile: ts.SourceFile ){
    return sourceFile.statements.filter(st => st.kind === ts.SyntaxKind.ExportAssignment)[0] as ts.ExportAssignment;
}

export function getMembers(ast: ts.ObjectLiteralExpression){
    
}
