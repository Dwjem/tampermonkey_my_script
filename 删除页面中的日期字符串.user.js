// ==UserScript==
// @name         删除页面中的日期字符串
// @namespace    http://tampermonkey.net/
// @version      2025-02-10
// @description  try to take over the world!
// @author       You
// @match        https://www.sogou.com/web?*
// @match        https://www.baidu.com/s?*
// @match        https://www.so.com/s?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sogou.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 匹配常见日期格式（包括 yyyy年MM月dd日）
    const dateRegex = /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b|\d{4}年\d{1,2}月\d{1,2}日?/g;

    // 递归遍历 DOM 节点并替换日期文本
    function walkNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent.replace(dateRegex, '');
        } else {
            Array.from(node.childNodes).forEach(walkNodes);
        }
    }




    $(document).ready(function() {
        console.log('ready')
        // 执行清理
        walkNodes(document.body);
        console.log('ok')
    });

})();