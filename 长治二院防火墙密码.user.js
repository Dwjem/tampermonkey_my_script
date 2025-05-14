// ==UserScript==
// @name         长治二院防火墙密码
// @namespace    http://tampermonkey.net/
// @version      2025-04-11
// @description  try to take over the world!
// @author       You
// @match        https://218.26.89.133:8443/login.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=89.133
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    //hQHm8LuH70@!3
    async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log("复制成功:", text);
  } catch (err) {
    console.error("复制失败:", err);
  }
}
    copyToClipboard('hQHm8LuH70@!3')
})();