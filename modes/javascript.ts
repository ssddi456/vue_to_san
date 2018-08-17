import { findDefaultExports, astStringify } from "../libs/astHelper";
import * as util from 'util';
import * as ts from 'typescript';
import * as prettier from 'prettier';


type vueCompoentTypeInfo = {
    dataNames: string[]
};

export function getComponentType(vueExport: ts.ObjectLiteralExpression): vueCompoentTypeInfo {
    const dataNames = [] as string[]
    return {
        dataNames,
    };
}

export function modifyVueMethods(method: ts.MethodDeclaration, componentInfo: vueCompoentTypeInfo) {
    const accessCallsToModify = markThisDataGetOrSet(method);
    const astReplaceInfos: astReplaceInfo[] = [];
    for (let i = 0; i < accessCallsToModify.length; i++) {
        const element = accessCallsToModify[i];
        astReplaceInfos.push({ origin: element, modified: getPropertyToGetData(element) })
    }

    return replaceAccessors(method, astReplaceInfos);
}

type astReplaceInfo = { origin: ts.Node, modified: ts.Node };

export function markThisDataGetOrSet(ast: ts.Node): Array<ts.PropertyAccessExpression | ts.ElementAccessExpression> {
    const ret = [] as Array<ts.PropertyAccessExpression | ts.ElementAccessExpression>;
    const thisCall = [] as ts.Node[];

    let parent = ast;
    ts.forEachChild(ast, walk);

    function walk(node: ts.Node) {
        const prevParent = parent;

        if (node.kind == ts.SyntaxKind.ThisKeyword) {
            thisCall.push(node);
        }
        node.parent = parent;

        parent = node;
        ts.forEachChild(node, walk);
        parent = prevParent;
    }



    for (let i = 0; i < thisCall.length; i++) {
        const element = thisCall[i];
        let lookUp = element;

        while (
            lookUp.parent
            && (ts.isPropertyAccessExpression(lookUp.parent)
                || ts.isElementAccessExpression(lookUp.parent))
        ) {
            lookUp = lookUp.parent;
        }

        if (ts.isPropertyAccessExpression(lookUp)
            || ts.isElementAccessExpression(lookUp)
        ) {
            ret.push(lookUp as ts.PropertyAccessExpression);
        }
    }
    return ret;
}

export function replaceAccessors(ast: ts.Node, replaceToDo: astReplaceInfo[]): ts.Node {
    const _replaceToDo = replaceToDo.slice(0);
    return ts.transform(ast, [function (context: ts.TransformationContext) {
        return function (rootNode) {
            function visit(node: ts.Node): ts.Node {
                for (let i = 0; i < _replaceToDo.length; i++) {
                    const element = _replaceToDo[i];
                    if (element.origin == node) {
                        _replaceToDo.splice(i, 1);
                        return element.modified;
                    }
                }
                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(rootNode, visit);
        }
    }]).transformed[0];
}

export function propertyAccessToDataOPath(ast: ts.PropertyAccessExpression | ts.ElementAccessExpression): ts.Expression {
    const dataPathSeg: Array<{ type: 'string' | 'expression', content: ts.Expression }> = [];

    let lookFor = ast as ts.Expression;
    while (ts.isPropertyAccessExpression(lookFor) || ts.isElementAccessExpression(lookFor)) {
        if (ts.isPropertyAccessExpression(lookFor)) {
            dataPathSeg.unshift({ type: 'string', content: lookFor.name });
        } else {
            if (ts.isStringLiteral(lookFor.argumentExpression)) {
                dataPathSeg.unshift({ type: 'string', content: lookFor.argumentExpression });
            } else {
                dataPathSeg.unshift({ type: 'expression', content: lookFor.argumentExpression });
            }
        }
        lookFor = lookFor.expression;
    }

    let ret: ts.Expression;

    const first = dataPathSeg[0];
    if (first.type == 'string') {
        ret = ts.createStringLiteral((first.content as ts.StringLiteral).text);
    } else {
        ret = ts.createParen(first.content);
    }

    for (let i = 1; i < dataPathSeg.length; i++) {
        const element = dataPathSeg[i];

        if (element.type == 'string') {
            const string = (element.content as ts.StringLiteral).text;
            if (ts.isStringLiteral(ret)) {
                ret.text = ret.text + '.' + string;
            } else {
                ret = ts.createAdd(
                    ret,
                    ts.createStringLiteral('.' + string)
                )
            }
        } else {
            if (ts.isStringLiteral(ret)) {
                ret = ts.createAdd(
                    ts.createStringLiteral(ret.text + '.'),
                    element.content
                );
            } else {
                ret = ts.createAdd(
                    ts.createAdd(
                        ret,
                        ts.createStringLiteral('.')
                    ),
                    element.content
                )
            }
        }
    }
    return ret;
}

export function getPropertyToGetData(ast: ts.PropertyAccessExpression | ts.ElementAccessExpression): ts.CallExpression {
    const ret = ts.createCall(
        ts.createPropertyAccess(
            ts.createPropertyAccess(
                ts.createThis(),
                'data'
            ),
            'get'
        ),
        null,
        ts.createNodeArray([propertyAccessToDataOPath(ast)]),
    );
    return ret;
}

export function setPropertyToSetData(ast: ts.AssignmentExpression<ts.AssignmentOperatorToken>): ts.CallExpression {
    const ret = ts.createCall(
        ts.createPropertyAccess(
            ts.createPropertyAccess(
                ts.createThis(),
                'data'
            ),
            'set',
        ),
        null,
        ts.createNodeArray([propertyAccessToDataOPath(ast.left as ts.PropertyAccessExpression), ast.right])
    );
    return ret;
}

export function modifyVueScript(vueCode: string) {
    /**
     * 将vue的js转换成san的js
     * 导出vue component的类型
     * 
     * {
     *   data  => initData
     * }
     */

    const vueSourceFile = ts.createSourceFile('test.ts', vueCode, ts.ScriptTarget.ES2015);
    const vueCompoentExports = findDefaultExports(vueSourceFile);

    if (vueCompoentExports
        && ts.isObjectLiteralExpression(vueCompoentExports.expression)
    ) {

        const vueCompoentOption = vueCompoentExports.expression as ts.ObjectLiteralExpression;

        const vueComponentType = getComponentType(vueCompoentOption);

        const methods = [];
        let methodsToRemove;
        vueCompoentOption.properties.forEach(function (x) {
            const propertyName = (x.name as ts.Identifier).escapedText as string;
            if (propertyName == 'data') {
                ((x.name as ts.Identifier).escapedText as string) = 'initData';
            } else if (propertyName == 'methods' && ts.isPropertyAssignment(x)) {
                methodsToRemove = x;
                if (ts.isObjectLiteralExpression(x.initializer)) {
                    x.initializer.properties.forEach(element => {
                        if (ts.isMethodDeclaration(element)) {
                            methods.push(modifyVueMethods(element, vueComponentType));
                        };
                    });
                }
            }
        });
        if (methodsToRemove) {
            [].splice.apply(vueCompoentOption.properties,
                [
                    vueCompoentOption.properties.indexOf(methodsToRemove),
                    1,
                    ...methods
                ])
        }
    }

    return astToCode(vueSourceFile)
}

export function astToCode(ast: ts.Node, options?: prettier.Options) {

    return prettier.format(
        astStringify(ast),
        {
            parser: 'typescript',
            singleQuote: true,
            tabWidth: 4,
            ...options
        });

}
