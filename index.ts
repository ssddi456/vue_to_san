import * as parse5 from 'parse5';
import { modifyVueScript, modifyVueJsSource } from './modes/javascript';
import { walkVueTemplate } from './modes/template';


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

export function vueHTMLToSanHTML(vueHTML: string) {
    const vueTree = parse5.parseFragment(vueHTML, { sourceCodeLocationInfo: true }) as parse5.DefaultTreeDocumentFragment;
    vueTree.childNodes.forEach(walkVueTemplate);
    const sanCode = parse5.serialize(vueTree);
    return sanCode;
}

export const vueJsToSanJs = modifyVueJsSource;
