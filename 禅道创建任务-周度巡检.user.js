// ==UserScript==
// @name         禅道创建任务-周度巡检
// @namespace    http://tampermonkey.net/
// @version      2025-03-25
// @description  try to take over the world!
// @author       You
// @match        http://183.201.231.51:18502/*
// @match        http://192.168.61.128:38454/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=231.51
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const date = new Date();
    const year = date.getFullYear().toString().padStart(4, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const current_date = `${year}-${month}-${day}`;
    // 设置任务描述
    const description = `按照网站、服务器周度监控和检查报告进行资源巡检`


    const element_value_map = [
        {
            query: 'input[name="name"]',
            value: '【资源巡检】周度例行检查'
        },
        {
            query: 'input[name="assignedTo"]',
            value: 'dongwenjun'
        },
        {
            query: 'input[name="estStarted"]',
            value: current_date
        },
        {
            query: 'input[name="deadline"]',
            value: current_date
        },
        {
            query: 'input[name="estimate"]',
            value: '0.5'
        }
    ]

    const handleClick = ()=>{
        const iframe = document.querySelector('#appIframe-execution');
        const iframe_document = iframe.contentDocument || iframe.contentWindow.document;

        element_value_map.forEach(item => {
            const element = iframe_document.querySelector(item.query);
            // 遍历item，跳过query键
            for (let key in item) {
                if (key === 'query') {
                    continue;
                }
                element[key] = item[key];
            }
        });
        copyToClipboard(description)
    }

    const style = document.createElement('style');
    style.innerText = `
        .create-task-button-youhou {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 999;
            padding: 10px;
            background-color: #409eff;
            color: #fff;
            border: none;
            cursor: pointer;
        }
    `;

    const button = document.createElement('button');
    button.className = 'create-task-button-youhou';
    button.innerText = '创建巡检任务';
    button.onclick = handleClick;

    document.body.appendChild(style);
    document.body.appendChild(button);

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            // 现代浏览器
            navigator.clipboard.writeText(text)
                .then(() => console.log('复制成功'))
                .catch(err => console.error('复制失败:', err));
        } else {
            // 旧浏览器
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                console.log('复制成功');
            } catch (err) {
                console.error('复制失败:', err);
            }

            document.body.removeChild(textarea);
        }
    }

})();