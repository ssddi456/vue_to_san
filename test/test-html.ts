import 'mocha';
import 'ts-node';

import { assert } from "chai";
import { vueHTMLToSanHTML } from "..";
import { transpileTestCases } from './test';



describe('html transform', function () {
    const tests: transpileTestCases = {
        'basic html': {
            vueCode: `<section></section>`,
            sanCode: `<section></section>`
        },
    };

    for (const k in tests) {
        it(k, function () {
            const sanCode = vueHTMLToSanHTML(tests[k].vueCode);
            if (sanCode !== tests[k].sanCode) {
                console.log(JSON.stringify(sanCode));
                console.log(JSON.stringify(tests[k].sanCode));
            }

            assert.equal(sanCode, tests[k].sanCode);
        })
    }
});
