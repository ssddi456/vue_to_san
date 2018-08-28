import 'mocha';
import 'ts-node';

import { assert } from "chai";
import { setPropertyToSetData, getPropertyToGetData, propertyAccessToDataOPath, astToCode, modifyVueMethods, markThisDataGetOrSet } from '../modes/javascript';
import * as ts from 'typescript';
import { inspect } from 'util';
import { transpileTestCases } from './test';

describe('properties access to data path', function () {

    const tests: transpileTestCases = {
        'simple 1': {
            vueCode: `this.some`,
            sanCode: `'some'
`},
        'simple 2': {
            vueCode: `this.some.things`,
            sanCode: `'some.things'
`},
        'simple 3': {
            vueCode: `this.some.things.that.doesnt.important`,
            sanCode: `'some.things.that.doesnt.important'
`},
        'computed 1': {
            vueCode: `this['some']`,
            sanCode: `'some'
`},
        'computed 2': {
            vueCode: `this['some'].things`,
            sanCode: `'some.things'
`},
        'computed 3': {
            vueCode: `this['some'].things['test'+ a]`,
            sanCode: `'some.things.' + ('test' + a)
`},
        'computed 4': {
            vueCode: `this['some'].things['test'+ a][index]`,
            sanCode: `'some.things.' + ('test' + a) + '.' + index
`},

    };

    for (const k in tests) {
        it(k, function () {
            const vueAst = ts.createSourceFile('test.ts', tests[k].vueCode, ts.ScriptTarget.ESNext);
            const expression = ((vueAst.statements[0] as any) as ts.ExpressionStatement).expression;

            const sanAst = propertyAccessToDataOPath(expression as ts.PropertyAccessExpression);
            const sanCode = astToCode(sanAst, { semi: false });

            if (sanCode !== tests[k].sanCode) {
                console.log(JSON.stringify(sanCode));
                console.log(JSON.stringify(tests[k].sanCode));
            }

            assert.equal(sanCode, tests[k].sanCode);
        })
    }
});

describe('properties change', function () {

    const tests: transpileTestCases = {
        'get to data.get': {
            vueCode: `this.some`,
            sanCode: `this.data.get('some')
`
        },
        'computed 1': {
            vueCode: `this['some']`,
            sanCode: `this.data.get('some')
`},
        'computed 2': {
            vueCode: `this['some'].things`,
            sanCode: `this.data.get('some.things')
`},
        'computed 3': {
            vueCode: `this['some'].things['test'+ a]`,
            sanCode: `this.data.get('some.things.' + ('test' + a))
`},
        'computed 4': {
            vueCode: `this['some'].things['test'+ a][index]`,
            sanCode: `this.data.get('some.things.' + ('test' + a) + '.' + index)
`},
    };

    for (const k in tests) {
        it(k, function () {
            const vueAst = ts.createSourceFile('test.ts', tests[k].vueCode, ts.ScriptTarget.ESNext);
            const expression = ((vueAst.statements[0] as any) as ts.ExpressionStatement).expression;

            const sanAst = getPropertyToGetData(expression as ts.PropertyAccessExpression);
            const sanCode = astToCode(sanAst, { semi: false });

            if (sanCode !== tests[k].sanCode) {
                console.log(JSON.stringify(sanCode));
                console.log(JSON.stringify(tests[k].sanCode));
            }

            assert.equal(sanCode, tests[k].sanCode);
        })
    }
});


describe('find accessors', function(){

    const tests: {
        [k: string]: {
            vueCode: string,
            sanCode: string
        }
    } = {
        'get to data.get': {
            vueCode: `this.some`,
            sanCode: `this.some
`
        },

    };

    for (const k in tests) {
        it(k, function () {
            const vueAst = ts.createSourceFile('test.ts', tests[k].vueCode, ts.ScriptTarget.ESNext);
            const expression = ((vueAst.statements[0] as any) as ts.ExpressionStatement).expression;

            const sanAst = markThisDataGetOrSet(expression);
            const sanCode = sanAst.map(x => astToCode(x, { semi: false })).join('');

            if (sanCode !== tests[k].sanCode) {
                console.log(JSON.stringify(sanCode));
                console.log(JSON.stringify(tests[k].sanCode));
            }

            assert.equal(sanCode, tests[k].sanCode);
        })
    }

});
