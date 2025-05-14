// ==UserScript==
// @name         最近7天
// @namespace    http://tampermonkey.net/
// @version      2025-03-28
// @description  try to take over the world!
// @author       You
// @match        *://*/control*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=133.9
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // 创建下载按钮
    const downloadButton = document.createElement('button');
    downloadButton.textContent = '最近7天';
    downloadButton.style.position = 'fixed';
    downloadButton.style.top = '10px';
    downloadButton.style.left = '10px';
    downloadButton.style.zIndex = 10000;
    downloadButton.style.padding = '10px';
    downloadButton.style.backgroundColor = '#007bff';
    downloadButton.style.color = '#fff';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '5px';
    downloadButton.style.cursor = 'pointer';
    // 将按钮添加到页面
    document.body.appendChild(downloadButton);

    // 绑定点击事件
    downloadButton.addEventListener('click', function() {
        const list = document.querySelectorAll('.gt')
        if(list.length){
            list.forEach(item=>{
                const text = item.innerText;
                if(text==='最近7天'|| text==='最近七天'){
                    item.click()
                }
            })
        }

        const list2 = document.querySelectorAll('.control-btn button')
        console.log(list2)
        list2.forEach(item=>{
                const text = item.innerText;
                if(text==='最近7天'|| text==='最近七天'){
                    item.click()
                }
            })
    });
})();