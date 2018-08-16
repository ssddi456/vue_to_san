import * as parse5 from 'parse5';
import * as ts from 'typescript';
import { findDefaultExports, astStringify } from './libs/astHelper';
import * as util from 'util';
import * as prettier from 'prettier';
import { assert } from 'console';

function modifyVueAttr(attr: parse5.Attribute, allAttr: parse5.Attribute[]) {
    /**
     * events
     * loop
     * condition
     * custom
     */

    const attrPrefixSymble = attr.name[0];
    const attrPrefix = attr.name.slice(0, 2);

    if (attrPrefix == 'v-') {
        // full replacements
        switch (attr.name) {
            case 'v-text':
                attr.name = 's-text';
                break;
            case 'v-html':
                attr.name = 's-html';
                break;
            case 'v-show':
                attr.name = 's-if';
                break;
            case 'v-if':
                attr.name = 's-if';
                break;
            case 'v-else':
                attr.name = 's-else';
                break;
            case 'v-else-if':
                attr.name = 's-else-if';
                break;
            case 'v-for':
                attr.name = 's-for';
                // 在这里构造成san的格式，没括号
                attr.name = 's-for';
                attr.value = attr.value.replace(/\(|\)/g, '');
                break;
            case 'v-on':
                attr.name = 's-on';
                break;
            case 'v-model':
                attr.name = 'value';
                attr.value = '{= ' + attr.value + ' =}';
                break;

            // 这部分没有内容
            case 'v-pre':
                break;
            case 'v-cloak':
                break;
            case 'v-once':
                break;

            default:
                // 'v-bind:':
                if (attr.name.slice(0, 7) == 'v-bind:') {
                    const attrname = attr.name.slice(7);
                    attr.name = attrname;
                    attr.value = '{{ ' + attr.value + ' }}';
                } else {
                    console.log('unsupport attr filename');
                }
                break;
        }
    } else if (attrPrefixSymble == '@') {
        // 事件绑定
        // 不处理modifier
        const attrname = attr.name.slice(1);
        attr.name = 'on-' + attrname;
        return;
    } else if (attrPrefixSymble == ':') {
        // 单向绑定
        // 暂时不处理modifier
        if (attr.name == ':kay') {
            return;
        } else if (attr.name == ':class') {
            attr.name = 'class';
            // 这里需要处理成插值表达式
            // 需要先转换成ast再导出
            return;
        } else {
            const attrname = attr.name.slice(1);
            attr.name = attrname;
            attr.value = '{{ ' + attr.value + ' }}';
            return;
        }
    }
}

function walkVueTemplate(doc: parse5.DefaultTreeElement) {
    if (doc.attrs) {
        for (let i = 0; i < doc.attrs.length; i++) {
            const element = doc.attrs[i];
            modifyVueAttr(element, doc.attrs);
        }
    }

    if (doc.childNodes) {
        for (let index = 0; index < doc.childNodes.length; index++) {
            const element = doc.childNodes[index];
            walkVueTemplate(element as parse5.DefaultTreeElement);
        }
    }
}

type vueCompoentTypeInfo = {
    dataNames: string[]
};

function getComponentType(vueExport: ts.ObjectLiteralExpression): vueCompoentTypeInfo {
    const dataNames = [] as string[]
    return {
        dataNames,
    };
}

function modifyVueMethods(methods: ts.MethodDeclaration, componentInfo: vueCompoentTypeInfo) {

}

function modifyVueScript(vueCode: string) {
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
                            modifyVueMethods(element, vueComponentType);
                            methods.push(element);
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


    return prettier.format(
        astStringify(vueSourceFile),
        {
            parser: 'typescript',
            singleQuote: true,
            tabWidth: 4
        });
}

export function vueToSan(vueCode: string) {
    const vueTree = parse5.parseFragment(vueCode, { sourceCodeLocationInfo: true });

    /**
     *  this should be 
     * <template>
     * </template>
     * <script>
     * </script>
     * <style>
     * </style>
     * 
     * we need to transpile template part and script part
     */
    const childNodes = (vueTree as parse5.DefaultTreeElement).childNodes;
    if (childNodes) {

        childNodes.forEach(element => {
            if (element.nodeName == 'template') {
                walkVueTemplate((element as any).content);
            } else if (element.nodeName == 'script') {
                const codeNode = (element as parse5.DefaultTreeElement).childNodes[0] as parse5.DefaultTreeTextNode;
                codeNode.value = modifyVueScript(codeNode.value);
            }
        });
    }

    const sanCode = parse5.serialize(vueTree);
    return sanCode;
}
