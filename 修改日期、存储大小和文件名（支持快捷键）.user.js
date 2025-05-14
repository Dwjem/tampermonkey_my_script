// ==UserScript==
// @name         修改日期、存储大小和文件名（支持快捷键）
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  修改日期为月份最后一天并调整存储大小和文件名，支持Alt+Q快捷键触发
// @author       You
// @match        https://192.168.61.130:29547/files
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @require      https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 配置部分
    const config = {
        // 日期相关配置
        parentSelector: '.vue-recycle-scroller__item-wrapper',
        dateElementSelector: 'div.custom-td.w-\\[160px\\] > span',
        fileNameElementSelector: 'div.custom-td.w-\\[420px\\].flex.justify-between.items-center span.cursor-pointer.hover\\:text-primary.truncate.max-w-\\[84\\%\\].ml-\\[4px\\].fileName',
        startYear: 2023,
        startMonth: 7,
        dateFormat: 'yyyy-MM-dd 03:30:02',
        fileNameDateFormat: 'yyyy-MM-dd 03:30:01', // 文件名中的日期格式（秒固定为01）

        // 存储大小相关配置 - 现在使用预设列表
        sizeElementSelector: 'div.custom-td.w-\\[100px\\]:nth-child(odd)',
        sizeList: [5.3 , 5.8, 5.3, 5.3, 5.7, 5.5, 5.3, 5.2, 5.5, 5.6, 5.8, 6.1],//[23.71, 23.85, 23.91, 24.17, 24.11, 24.12, 25.31, 25.74, 25.99, 26.21, 26.62, 28.5], // 预设的大小列表
        sizeUnit: 'MB',           // 单位

        // 功能配置
        autoModify: true,
        hotkey: 'Alt+Q',
        maxRetryCount: 10,
        retryInterval: 500
    };

    const DateTime = luxon.DateTime;

    function modifyContent() {
        let retryCount = 0;
        let sizeIndex = 0; // 用于跟踪当前使用的大小列表索引

        function attemptModify() {
            const parentElement = document.querySelector(config.parentSelector);

            if (!parentElement) {
                if (retryCount++ < config.maxRetryCount) {
                    setTimeout(attemptModify, config.retryInterval);
                    return;
                }
                showNotification('未找到父元素: ' + config.parentSelector);
                return;
            }

            // 修改日期
            modifyDates(parentElement);

            // 修改存储大小
            modifySizes(parentElement);

            // 修改文件名
            modifyFileNames(parentElement);
        }

        function modifyDates(parent) {
            const dateElements = parent.querySelectorAll(config.dateElementSelector);

            if (dateElements.length === 0) {
                showNotification('未找到日期元素: ' + config.dateElementSelector);
                return;
            }

            let currentYear = config.startYear;
            let currentMonth = config.startMonth;

            dateElements.forEach(element => {
                const lastDay = DateTime.local(currentYear, currentMonth).endOf('month');
                element.textContent = lastDay.toFormat(config.dateFormat);

                currentMonth++;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                }
            });

            console.log(`已修改 ${dateElements.length} 个日期元素`);
        }

        function modifyFileNames(parent) {
            const nameElements = parent.querySelectorAll(config.fileNameElementSelector);

            if (nameElements.length === 0) {
                showNotification('未找到文件名元素: ' + config.fileNameElementSelector);
                return;
            }

            let currentYear = config.startYear;
            let currentMonth = config.startMonth;

            nameElements.forEach(element => {
                const lastDay = DateTime.local(currentYear, currentMonth).endOf('month');
                const newDateStr = lastDay.toFormat(config.fileNameDateFormat)
                    .replace(/:/g, '-')  // 将时间中的冒号替换为短横线
                    .replace(' ', '_');   // 将日期和时间之间的空格替换为下划线

                // 保留原始文件名结构，只修改日期部分
                const originalText = element.textContent;
                const newFileName = originalText.replace(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, newDateStr);
                element.textContent = newFileName;

                currentMonth++;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                }
            });

            console.log(`已修改 ${nameElements.length} 个文件名元素`);
        }

        function modifySizes(parent) {
            const sizeElements = parent.querySelectorAll(config.sizeElementSelector);

            if (sizeElements.length === 0) {
                showNotification('未找到存储大小元素: ' + config.sizeElementSelector);
                return;
            }

            sizeElements.forEach(element => {
                // 从列表中获取当前大小值
                const sizeValue = config.sizeList[sizeIndex % config.sizeList.length];

                // 更新元素内容
                element.textContent = `${sizeValue.toFixed(2)}${config.sizeUnit}`;

                // 移动到列表中的下一个值
                sizeIndex++;
            });

            console.log(`已修改 ${sizeElements.length} 个存储大小元素，使用了 ${Math.min(sizeIndex, config.sizeList.length)} 个不同的大小值`);
        }

        attemptModify();
    }

    function showNotification(message) {
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                text: message,
                title: '内容修改脚本',
                timeout: 2000
            });
        } else {
            console.log(message);
        }
    }

    function registerHotkey() {
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.key === 'q') {
                e.preventDefault();
                modifyContent();
            }
        });
    }

    function registerMenuCommand() {
        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand('修改日期、存储大小和文件名', modifyContent);
        }
    }

    function init() {
        registerHotkey();
        registerMenuCommand();

        if (config.autoModify) {
            setTimeout(modifyContent, 2000);
        }
    }

    init();
})();