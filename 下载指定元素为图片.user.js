// ==UserScript==
// @name         下载指定元素为图片
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  将页面中的指定元素下载为图片
// @author       你的名字
// @match        *://*/control*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 等待页面加载完成
    window.addEventListener('load', function() {

        // 创建下载按钮
        const downloadButton = document.createElement('button');
        downloadButton.textContent = '下载为图片';
        downloadButton.style.position = 'fixed';
        downloadButton.style.top = '10px';
        downloadButton.style.right = '10px';
        downloadButton.style.zIndex = 10000;
        downloadButton.style.padding = '10px';
        downloadButton.style.backgroundColor = '#007bff';
        downloadButton.style.color = '#fff';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '5px';
        downloadButton.style.cursor = 'pointer';

        const elementSelector = "#layout-main > div > div:nth-child(2)"//".main-content .container-fluid"

        // 将按钮添加到页面
        document.body.appendChild(downloadButton);
        function getCurrentDateTime() {
            const now = new Date();

            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');

            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
        }


        function createImage(){
            // 替换为你需要下载的元素的选择器
            const element = document.querySelector(elementSelector);

            if (!element) {
                alert('未找到需要下载的元素！');
                return;
            }

            // 使用html2canvas将元素转换为图片
            html2canvas(element,{
                scale: 2, // 提高分辨率
                backgroundColor: '#e6e9ee', // 设置背景颜色
            }).then(function(canvas) {
                // 将canvas转换为图片
                const image = canvas.toDataURL('image/png');

                // 创建一个链接元素
                const link = document.createElement('a');
                link.href = image;
                link.download = getCurrentDateTime()+'.png';

                // 触发下载
                link.click();
            }).catch(function(error) {
                console.error('无法生成图片:', error);
                alert('生成图片失败，请检查控制台日志！');
            });
        }

        // 绑定点击事件
        downloadButton.addEventListener('click', function() {
            const list = document.querySelectorAll('.gt')
            list.forEach(item=>{
                const text = item.innerText;
                if(text==='最近7天'){
                    item.click()
                }
            })
            setTimeout(()=>{
                createImage()
            }, 3000)
        });
    });
})();