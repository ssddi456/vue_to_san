import * as parse5 from 'parse5';
import * as ts from 'typescript';
import * as prettier from 'prettier';

import { getCodeAst, astStringify, getTextOfPropertyName } from '../libs/astHelper';
import { camalCaseToDashed } from '../libs/utils';

function vueClassToSanClass(vueClassString: string, classAttr: string) {
    let ret = '';

    if (!vueClassString.match(/[\[\]\{\}]/)) {
        // 说明是一个vue实例上的对象，这里转换不了
        // 需要插入一个lib来做转换
    } else {
        const vueClassAst = ((getCodeAst('(' + vueClassString + ')') as ts.ExpressionStatement)
            .expression as ts.ParenthesizedExpression).expression;

        if (ts.isArrayLiteralExpression(vueClassAst)) {
            vueClassAst.elements.forEach(function (element) {
                ret += ' {{ ' + astStringify(element) + ' }}';
            })
        } else if (ts.isObjectLiteralExpression(vueClassAst)) {
            vueClassAst.properties.forEach(function (property: ts.PropertyAssignment) {
                const name = getTextOfPropertyName(property.name);
                ret += ' {{ ' + astStringify(property.initializer) + ' ? \'' + name + '\' : \'\' }}';
            });
        } else {
            console.log('unsupport class bind syntax');
        }
    }

    return (classAttr + ret).trim();
}

function vueStyleToSanStyle(vueStyleString: string, styleAttr: string) {
    let ret = '';

    if (!vueStyleString.match(/[\{\}]/)) {
        // 说明是一个vue实例上的对象，这里转换不了
        // 需要插入一个lib来做转换
    } else {
        const vueClassAst = ((getCodeAst('(' + vueStyleString + ')') as ts.ExpressionStatement)
            .expression as ts.ParenthesizedExpression).expression;

        if (ts.isObjectLiteralExpression(vueClassAst)) {
            vueClassAst.properties.forEach(function (property: ts.PropertyAssignment) {
                const name = getTextOfPropertyName(property.name);
                let value = '';

                if (ts.isStringLiteral( property.initializer)) {
                    value = getTextOfPropertyName(property.initializer);
                    ret += `${camalCaseToDashed(name)}: ${value};`;
                } else {
                    value = prettier.format(
                        astStringify(property.initializer),
                        {
                            parser: 'typescript',
                            singleQuote: true,
                        }).slice(0, -2);
                    ret += `${camalCaseToDashed(name)}: {{ ${value} }};`;
                }

            });
        } else {
            console.log('unsupport style bind syntax');
        }
    }

    return ((styleAttr ? (styleAttr.replace(/;$/, '') + ';') : '') + ret).trim();
}

interface markedAttr extends parse5.Attribute {
    deleted?: boolean;
}

function processAttrBind(attr: markedAttr, allAttr: parse5.Attribute[]) {
    const _attrName = attr.name.slice(0, 7) == 'v-bind:' ? attr.name.slice(7) : attr.name.slice(1);
    const [attrname, filter] = _attrName.split('.') as [string, string];


    // 单向绑定
    // 暂时不处理modifier
    if (attrname == 'kay') {
        return;
    }
    else if (attrname == 'class') {
        // 这里需要处理成插值表达式
        // 需要先转换成ast再导出
        const classAttr = allAttr.filter(x => x.name == 'class')[0] as markedAttr;
        if (classAttr) {
            classAttr.deleted = true;
        }

        attr.value = vueClassToSanClass(attr.value, classAttr ? classAttr.value : '');
        attr.name = 'class';
        return;
    }
    else if (attrname == 'style') {
        const styleAttr = allAttr.filter(x => x.name == 'style')[0] as markedAttr;
        if (styleAttr) {
            styleAttr.deleted = true;
        }

        attr.value = vueStyleToSanStyle(attr.value, styleAttr ? styleAttr.value : '');
        attr.name = 'style';
        return;
    }
    else {
        attr.name = attrname;
        attr.value = '{{ ' + attr.value + (filter ? '| ' + filter : '') + ' }}';
        return;
    }
}

function modifyVueAttr(attr: markedAttr, allAttr: parse5.Attribute[]) {
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
            case 'v-cloak':
            case 'v-once':
                break;
            default:

                processAttrBind(attr, allAttr);

        }
    }
    else if (attrPrefixSymble == '@') {
        // 事件绑定
        // 不处理modifier
        const attrname = attr.name.slice(1);
        attr.name = 'on-' + attrname;
        return;
    }
    else if (attrPrefixSymble == ':') {
        processAttrBind(attr, allAttr);
    }
}


export function walkVueTemplate(doc: parse5.DefaultTreeElement) {
    if (doc.attrs) {
        for (let i = 0; i < doc.attrs.length; i++) {
            const element = doc.attrs[i];
            modifyVueAttr(element, doc.attrs);
        }
        for (let i = doc.attrs.length - 1; i >= 0; i--) {
            const element = doc.attrs[i] as markedAttr;
            if (element.deleted) {
                doc.attrs.splice(i, 1);
            }
        }
    }

    if (doc.childNodes) {
        for (let index = 0; index < doc.childNodes.length; index++) {
            const element = doc.childNodes[index];
            walkVueTemplate(element as parse5.DefaultTreeElement);
        }
    }
}
