// ==UserScript==
// @name         可配置的进度圆修改工具（修复版）
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  添加浮动配置面板动态修改进度值和文本
// @author       You
// @match        https://192.168.61.130:29547
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 默认配置
    const defaultConfig = {
        percentages: [15.32, 4.6, 28, 17.5],
        totalLength: 289.027,
        suffix: '%',
        hotkey: {
            altKey: true,
            key: 'w'
        }
    };

    // 加载保存的配置或使用默认值
    let config = JSON.parse(GM_getValue('progressConfig', JSON.stringify(defaultConfig)));

    // 添加CSS样式
    GM_addStyle(`
        #progress-config-panel {
            position: fixed;
            top: 50px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ddd;
            padding: 15px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            z-index: 999999;
            font-family: Arial, sans-serif;
            display: none;
        }
        #progress-config-panel.visible {
            display: block;
        }
        #progress-config-panel h3 {
            margin-top: 0;
            color: #333;
            padding-right: 20px;
        }
        .config-group {
            margin-bottom: 15px;
        }
        .config-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .config-group input[type="number"],
        .config-group input[type="text"] {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }
        .percentage-inputs {
            margin: 10px 0;
            max-height: 200px;
            overflow-y: auto;
        }
        .percentage-item {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        .percentage-item input {
            flex: 1;
            padding: 5px;
        }
        .percentage-item button {
            margin-left: 5px;
            padding: 5px 8px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        #add-percentage {
            width: 100%;
            padding: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin-bottom: 10px;
        }
        .panel-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        .panel-buttons button {
            padding: 8px 15px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        #save-config {
            background: #2196F3;
            color: white;
        }
        #apply-now {
            background: #FF9800;
            color: white;
        }
        #close-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #888;
        }
        #close-panel:hover {
            color: #333;
        }
    `);

    // 创建配置面板
    function createConfigPanel() {
        // 如果面板已存在，则直接显示
        let panel = document.getElementById('progress-config-panel');
        if (panel) {
            panel.classList.add('visible');
            return;
        }

        // 创建面板元素
        panel = document.createElement('div');
        panel.id = 'progress-config-panel';
        panel.className = 'visible';

        // 面板HTML内容
        panel.innerHTML = `
            <button id="close-panel" title="关闭">&times;</button>
            <h3>进度圆配置</h3>
            <div class="config-group">
                <label for="total-length">总长度值:</label>
                <input type="number" id="total-length" value="${config.totalLength}" step="0.001">
            </div>
            <div class="config-group">
                <label for="suffix">文本后缀:</label>
                <input type="text" id="suffix" value="${config.suffix}">
            </div>
            <div class="config-group">
                <label>百分比值:</label>
                <div class="percentage-inputs" id="percentage-inputs">
                    ${config.percentages.map((p, i) => `
                        <div class="percentage-item">
                            <input type="number" value="${p}" step="0.01" placeholder="百分比值">
                            <button class="remove-percentage" title="删除">×</button>
                        </div>
                    `).join('')}
                </div>
                <button id="add-percentage">+ 添加百分比</button>
            </div>
            <div class="panel-buttons">
                <button id="save-config">保存配置</button>
                <button id="apply-now">保存并应用</button>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(panel);

        // 添加事件监听
        panel.querySelector('#close-panel').addEventListener('click', () => {
            panel.classList.remove('visible');
        });

        panel.querySelector('#add-percentage').addEventListener('click', () => {
            const container = panel.querySelector('#percentage-inputs');
            const item = document.createElement('div');
            item.className = 'percentage-item';
            item.innerHTML = `
                <input type="number" value="0" step="0.01" placeholder="百分比值">
                <button class="remove-percentage" title="删除">×</button>
            `;
            container.appendChild(item);
            item.querySelector('.remove-percentage').addEventListener('click', () => {
                item.remove();
            });
        });

        // 为现有删除按钮添加事件
        panel.querySelectorAll('.remove-percentage').forEach(btn => {
            btn.addEventListener('click', function() {
                this.parentElement.remove();
            });
        });

        panel.querySelector('#save-config').addEventListener('click', saveConfig);
        panel.querySelector('#apply-now').addEventListener('click', () => {
            saveConfig();
            modifyProgressElements();
        });
    }

    // 保存配置
    function saveConfig() {
        const panel = document.getElementById('progress-config-panel');
        if (!panel) return;

        // 更新配置对象
        config.totalLength = parseFloat(panel.querySelector('#total-length').value) || defaultConfig.totalLength;
        config.suffix = panel.querySelector('#suffix').value || defaultConfig.suffix;

        // 获取所有百分比值
        const inputs = panel.querySelectorAll('.percentage-item input');
        config.percentages = Array.from(inputs).map(input => {
            const value = parseFloat(input.value);
            return isNaN(value) ? 0 : value;
        });

        // 保存到存储
        GM_setValue('progressConfig', JSON.stringify(config));

        // 反馈
        const feedback = document.createElement('div');
        feedback.textContent = '配置已保存！';
        feedback.style.color = 'green';
        feedback.style.marginTop = '10px';
        panel.querySelector('.panel-buttons').before(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }

    // 修改进度元素
    function modifyProgressElements() {
        const progressCircles = document.querySelectorAll(".el-progress-circle");
        const progressTexts = document.querySelectorAll(".el-progress__text");

        const minLength = Math.min(
            progressCircles.length,
            progressTexts.length,
            config.percentages.length
        );

        if (minLength === 0) {
            console.warn('未找到可修改的进度元素');
            return;
        }

        for (let i = 0; i < minLength; i++) {
            const percentage = config.percentages[i];

            // 修改进度圆
            const circle = progressCircles[i];
            const svg = circle.querySelector("svg");
            if (svg) {
                const paths = svg.querySelectorAll("path");
                if (paths.length >= 2) {
                    const firstValue = (percentage * config.totalLength / 100).toFixed(3);
                    paths[1].style.strokeDasharray = `${firstValue}px ${config.totalLength}px`;
                }
            }

            // 修改文本
            const textElement = progressTexts[i];
            if (textElement) {
                textElement.innerText = `${percentage}${config.suffix}`;
            }
        }

        console.log(`已修改 ${minLength} 个进度元素`);
    }

    // 添加快捷键 Alt+W
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key.toLowerCase() === config.hotkey.key) {
            e.preventDefault();
            modifyProgressElements();
        }
    });

    // 添加到Tampermonkey菜单
    GM_registerMenuCommand("打开配置面板", createConfigPanel);
    GM_registerMenuCommand("应用当前配置", modifyProgressElements);

    // 初始提示
    console.log('进度圆修改工具已加载，按 Alt+W 应用配置');
})();