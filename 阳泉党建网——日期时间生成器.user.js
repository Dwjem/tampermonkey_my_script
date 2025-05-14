// ==UserScript==
// @name         阳泉党建网——日期时间生成器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在页面上添加按钮，点击后替换liveclock内容为生成的日期时间
// @author       You
// @match        http://yqdj.gov.cn
// @require https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js
// @grant        GM_registerMenuCommand
// ==/UserScript==
(function() {
    'use strict';
    // ===========================
    // 生成日期时间字符串的函数
    // ===========================
    function generateDateTimeString(year, month) {
        // 使用 Moment.js 创建指定年份和月份的日期对象
        const date = moment([year, month - 1]); // Moment.js 中月份是0-11

        // 获取该月的最后一天
        const lastDay = date.clone().endOf('month').date();

        // 设置日期为最后一天
        date.date(lastDay);

        // 获取星期几的中文名称
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[date.day()];

        // 生成8:00到18:00之间的随机时间
        const randomHour = Math.floor(Math.random() * (11 - 8 + 1)) + 8; // 8-18之间的随机小时
        const randomMinute = Math.floor(Math.random() * 60); // 0-59之间的随机分钟
        const randomSecond = Math.floor(Math.random() * 60); // 0-59之间的随机秒

        // 格式化日期和时间部分
        const formattedDate = `${date.year()}年${date.month() + 1}月${date.date()}日`;
        const formattedTime = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')}`;

        // 组合成最终字符串
        return `${formattedDate} ${weekday} ${formattedTime}`;
    }

    let elementID = 'liveclock';

    // ===========================
    // 创建输入面板
    // ===========================
    function createInputPanel() {
        // 检查是否已存在面板，如果存在则移除
        const existingPanel = document.getElementById('datetimeInputPanel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const date_ = [Number(localStorage.getItem('yh-year')||0), Number(localStorage.getItem('yh-month')||0)];
        const currentYear = date_[0];
        const currentMonth = date_[1];

        // 创建面板元素
        const panel = document.createElement('div');
        panel.id = 'datetimeInputPanel';
        panel.style.position = 'fixed';
        panel.style.top = '50%';
        panel.style.left = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.style.backgroundColor = 'white';
        panel.style.padding = '20px';
        panel.style.border = '1px solid #ccc';
        panel.style.borderRadius = '5px';
        panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        panel.style.zIndex = '9999';

        // 创建年份输入
        const yearLabel = document.createElement('label');
        yearLabel.textContent = '年份: ';
        yearLabel.style.marginRight = '10px';
        const yearInput = document.createElement('input');
        yearInput.type = 'number';
        yearInput.value = currentYear;
        yearInput.style.marginRight = '20px';

        // 创建月份输入
        const monthLabel = document.createElement('label');
        monthLabel.textContent = '月份: ';
        monthLabel.style.marginRight = '10px';
        const monthInput = document.createElement('input');
        monthInput.type = 'number';
        monthInput.min = '1';
        monthInput.max = '12';
        monthInput.value = currentMonth;
        monthInput.style.marginRight = '20px';

        // 创建应用按钮
        const applyButton = document.createElement('button');
        applyButton.textContent = '应用';
        applyButton.style.marginRight = '10px';
        applyButton.onclick = function() {
            const year = parseInt(yearInput.value);
            const month = parseInt(monthInput.value);

            if (isNaN(year) || isNaN(month)) {
                alert('请输入有效的年份和月份！');
                return;
            }

            if (month < 1 || month > 12) {
                alert('月份必须在1-12之间！');
                return;
            }
            localStorage.setItem('yh-year', year);
            localStorage.setItem('yh-month', month);
            const clockElement = document.getElementById(elementID);
            if (clockElement) {
                clockElement.textContent = generateDateTimeString(year, month);
                clockElement.id = 'liveclock_new';
                elementID = 'liveclock_new';
                panel.remove(); // 应用后自动关闭面板
            } else {
                alert("未找到目标元素！");
            }
        };

        // 创建取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.onclick = function() {
            panel.remove();
        };

        // 将元素添加到面板
        panel.appendChild(yearLabel);
        panel.appendChild(yearInput);
        panel.appendChild(monthLabel);
        panel.appendChild(monthInput);
        panel.appendChild(document.createElement('br'));
        panel.appendChild(document.createElement('br'));
        panel.appendChild(applyButton);
        panel.appendChild(cancelButton);

        // 将面板添加到文档
        document.body.appendChild(panel);
    }

    // ===========================
    // 注册油猴菜单命令
    // ===========================
    GM_registerMenuCommand("更新 liveclock 时间", function() {
        const clockElement = document.getElementById(elementID);
        if (clockElement) {
            const now = new Date();
            clockElement.textContent = generateDateTimeString(now.getFullYear(), now.getMonth() + 1);
            clockElement.id = 'liveclock_new';
            elementID = 'liveclock_new';
            console.log("已更新 liveclock 时间！");
        } else {
            alert("未找到 ID 为 'liveclock' 的元素！");
        }
    });

    // 注册油猴菜单命令打开输入面板
    GM_registerMenuCommand("自定义日期时间", createInputPanel);
})();
