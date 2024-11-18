// ==UserScript==
// @name         QQ空间批量删除说说（自用版）
// @namespace    qzone.delete
// @version      1.0.1
// @description  主要用于在QQ空间网页版的说说栏目下进行批量删除说说
// @author       thbelief
// @match        *://user.qzone.qq.com/*
// ==/UserScript==
(function () {
    'use strict';
    
    // 将checkboxList移到全局作用域外
    const globalState = {
        checkboxList: [],
        isDeleting: false
    };

    // 监听iframe加载
    function waitForIframe() {
        const observer = new MutationObserver((mutations, obs) => {
            const mainFrame = document.querySelector('.app_canvas_frame');
            if (mainFrame) {
                // 等待iframe加载完成
                mainFrame.addEventListener('load', () => {
                    console.log('iframe加载完成');
                    initCheckboxes(mainFrame.contentDocument);
                });
                
                // 如果iframe已经加载完成
                if (mainFrame.contentDocument && mainFrame.contentDocument.readyState === 'complete') {
                    console.log('iframe已存在且加载完成');
                    initCheckboxes(mainFrame.contentDocument);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 立即检查一次，以防iframe已经存在
        const existingFrame = document.querySelector('.app_canvas_frame');
        if (existingFrame && existingFrame.contentDocument) {
            console.log('iframe已经存在');
            initCheckboxes(existingFrame.contentDocument);
        }
    }

    // 将主要逻辑封装成函数
    function initCheckboxes(frameDoc) {
        // 使用MutationObserver监听msgList的出现
        const observer = new MutationObserver((mutations, obs) => {
            const msgList = frameDoc.querySelector('#msgList');
            if (msgList) {
                obs.disconnect(); // 停止观察document
                console.log('找到说说列表，开始初始化多选框');
                initCheckboxesUI(frameDoc, msgList);
                
                // 监听msgList的变化
                observeMsgList(frameDoc, msgList);
            }
        });

        observer.observe(frameDoc.body, {
            childList: true,
            subtree: true
        });
    }

    // 监听说说列表变化
    function observeMsgList(frameDoc, msgList) {
        const listObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('feed')) {
                        const avatar = node.querySelector('.avatar');
                        if (avatar && !avatar.querySelector('.checkbox-wrapper')) {
                            addCheckbox(frameDoc, avatar);
                        }
                    }
                });
            });
        });

        listObserver.observe(msgList, {
            childList: true,
            subtree: true
        });
    }

    // 添加单个checkbox的函数
    function addCheckbox(frameDoc, avatar) {
        // 创建包装容器
        const wrapper = h('div', { 
            class: 'checkbox-wrapper'
        });
        
        const checkbox = h('input', { 
            type: 'checkbox',
            class: 'avatar-checkbox',
            onclick: (e) => {
                const liParent = avatar.closest('li');
                const uin = liParent.getAttribute('data-uin');
                
                // 获取删除按钮元素
                const boxElement = avatar.parentElement.querySelector('.box.bgr3');
                const deleteBtn = boxElement ? 
                    boxElement.querySelector('.ft .op div div ul li:nth-child(4) a') : null;
                
                if (!deleteBtn) {
                    console.error('未找到删除按钮');
                    e.target.checked = false;
                    return;
                }
                
                if (e.target.checked) {
                    globalState.checkboxList.push({
                        delElement: deleteBtn,
                        uin: uin
                    });
                } else {
                    const removeIndex = globalState.checkboxList.findIndex(item => 
                        item.delElement.closest('li').getAttribute('data-uin') === uin
                    );
                    if (removeIndex > -1) {
                        globalState.checkboxList.splice(removeIndex, 1);
                    }
                }
                console.log('当前选中的项目：', globalState.checkboxList);
            }
        });
        
        wrapper.appendChild(checkbox);
        avatar.appendChild(wrapper);
    }

    // 创建列表底部的简单面板
    function createPanel(frameDoc, msgList) {
        // 检查是否已存在控制面板
        if (msgList.querySelector('.qzone-control-panel')) {
            return;
        }

        // 创建包含控制面板的li元素
        const panelLi = h('li', {
            class: 'qzone-control-panel',
            style: `
                padding: 20px;
                margin: 10px 0;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            `
        }, [
            h('button', {
                onclick: () => startBatchDelete(frameDoc),  // 使用相同的删除方法
                style: `
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                `
            }, '批量删除')
        ]);

        // 将控制面板添加到列表的最后面
        msgList.appendChild(panelLi);
    }

    // 切换多选框可见性
    function toggleCheckboxVisibility(visible) {
        // 获取iframe
        const frame = document.querySelector('.app_canvas_frame');
        if (!frame || !frame.contentDocument) return;
        
        // 在iframe内部查找checkbox
        const checkboxWrappers = frame.contentDocument.querySelectorAll('.checkbox-wrapper');
        checkboxWrappers.forEach(wrapper => {
            wrapper.style.display = visible ? 'flex' : 'none';
        });
    }

    // 创建固定控制面板
    function createFixedPanel(frameDoc) {
        // 检查是否已存在固定控制面板
        if (frameDoc.querySelector('.qzone-fixed-panel')) {
            return;
        }

        // 从本地存储获取面板状态
        const isPanelCollapsed = localStorage.getItem('qzone_fixed_panel_collapsed') === 'true';

        const panel = h('div', {
            class: 'qzone-fixed-panel',
            style: `
                position: fixed;
                top: 100px;
                right: ${isPanelCollapsed ? '-260px' : '0'};
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 9999;
                transition: right 0.3s ease;
                width: 260px;
                display: flex;
            `
        }, [
            // 标题栏（放在左边）
            h('div', {
                class: 'panel-title',
                style: `
                    padding: 10px 5px;
                    background: #4CAF50;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    user-select: none;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                    position: absolute;
                    left: -40px;
                    top: 0;
                    height: 100px;
                    width: 30px;
                    font-size: 14px;
                `
            }, [
                h('span', {
                    style: `
                        transform: rotate(${isPanelCollapsed ? '0deg' : '180deg'});
                        display: inline-block;
                        margin-bottom: 8px;
                        transition: transform 0.3s ease;
                        font-size: 12px;
                    `
                }, '◀'),
                h('div', {
                    style: `
                        writing-mode: vertical-lr;
                        text-orientation: upright;
                        letter-spacing: 3px;
                        height: 100%;
                    `
                }, '批量操作')
            ]),
            // 内容区
            h('div', {
                style: `
                    padding: 15px;
                    flex: 1;
                    background: white;
                    border-radius: 8px;
                `,
                class: 'panel-content'
            }, [
                h('div', {style: 'margin-bottom: 10px;'}, [
                    h('label', {
                        style: 'display: flex; align-items: center;'
                    }, [
                        h('input', {
                            type: 'checkbox',
                            onchange: (e) => {
                                toggleCheckboxVisibility(e.target.checked);
                            },
                            style: 'margin-right: 8px;'
                        }),
                        '选择'
                    ])
                ]),
                h('div', {style: 'margin-bottom: 10px;'}, [
                    h('label', {style: 'display: block; margin-bottom: 5px;'}, '删除间隔(ms)：'),
                    h('div', {style: 'display: flex; align-items: center;'}, [
                        h('input', {
                            type: 'number',
                            class: 'min-interval',
                            value: '1000',
                            min: '1000',
                            placeholder: '最小值',
                            style: 'width: 80px; margin-right: 5px;'
                        }),
                        h('span', {style: 'margin: 0 5px;'}, '~'),
                        h('input', {
                            type: 'number',
                            class: 'max-interval',
                            value: '2000',
                            min: '1000',
                            placeholder: '最大值',
                            style: 'width: 80px;'
                        })
                    ])
                ]),
                h('button', {
                    onclick: () => startBatchDelete(frameDoc),  // 使用相同的删除方法
                    style: `
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                    `
                }, '批量删除')
            ])
        ]);

        // 添加折叠功能
        const titleBar = panel.querySelector('.panel-title');
        titleBar.onclick = () => {
            const isCollapsed = panel.style.right === '-260px';
            panel.style.right = isCollapsed ? '0' : '-260px';
            localStorage.setItem('qzone_fixed_panel_collapsed', !isCollapsed);
            // 旋转箭头
            titleBar.firstChild.style.transform = `rotate(${isCollapsed ? '180deg' : '0deg'})`;
        };

        frameDoc.body.appendChild(panel);
    }

    // UI初始化函数
    function initCheckboxesUI(frameDoc, msgList) {
        // 添加样式到iframe内部
        const style = h('style', null, `
            #msgList li.feed .avatar .checkbox-wrapper {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: none;  /* 默认隐藏 */
                justify-content: center;
                align-items: center;
                background: rgba(0, 0, 0, 0.3);
                z-index: 10;
            }
            #msgList li.feed .avatar .avatar-checkbox {
                width: 20px;
                height: 20px;
                cursor: pointer;
            }
            .panel-arrow {
                transition: transform 0.3s ease;
            }
        `);
        frameDoc.head.appendChild(style);

        // 初始化现有的avatar
        const avatars = msgList.querySelectorAll('li.feed .avatar');
        avatars.forEach(avatar => {
            if (!avatar.querySelector('.checkbox-wrapper')) {
                addCheckbox(frameDoc, avatar);
            }
        });

        // 创建两个控制面板
        createPanel(frameDoc, msgList);  // 列表末尾的面板
        createFixedPanel(frameDoc);      // 右侧固定面板
        
        console.log('多选框初始化完成！');
    }

    // 页面加载完成后开始监听iframe
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForIframe);
    } else {
        waitForIframe();
    }

    // 保留h函数的定义...
    function h(tag, props, children) {
        // 创建元素
        const element = document.createElement(tag);

        // 处理属性
        if (props) {
            Object.keys(props).forEach(key => {
                if (key.startsWith('on')) {
                    // 事件监听
                    const eventName = key.slice(2).toLowerCase();
                    element.addEventListener(eventName, props[key]);
                } else {
                    // 普通属性
                    element.setAttribute(key, props[key]);
                }
            });
        }

        // 处理子元素
        if (children) {
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else {
                        element.appendChild(child);
                    }
                });
            } else if (typeof children === 'string') {
                element.appendChild(document.createTextNode(children));
            } else {
                element.appendChild(children);
            }
        }

        return element;
    }

    // 获取随机间隔时间
    function getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 等待确认弹窗出现并点击确认
    async function waitForConfirmDialog() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 最多等待5秒
            
            const checkDialog = setInterval(() => {
                attempts++;
                // 在主文档中查找确认按钮
                const confirmBtn = document.querySelector([
                    '#dialog_main_1 > div.qz_dialog_layer_ft > div.qz_dialog_layer_op > a.qz_dialog_layer_btn.qz_dialog_layer_sub',
                    '.qz_dialog_layer_btn.qz_dialog_layer_sub',
                    '.qz_dialog_layer_sub'
                ].join(','));

                if (confirmBtn) {
                    clearInterval(checkDialog);
                    // 等待一下再点击，确保弹窗完全显示
                    setTimeout(() => {
                        confirmBtn.click();
                        resolve();
                    }, 500);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkDialog);
                    console.error('未找到确认按钮，跳过当前项');
                    resolve();
                }
            }, 100);
        });
    }

    // 添加消息提示函数
    function showMessage(text, type = 'success') {
        const message = h('div', {
            style: `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 4px;
                background: ${type === 'success' ? '#4CAF50' : '#f44336'};
                color: white;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `
        }, text);

        document.body.appendChild(message);
        
        // 淡入效果
        setTimeout(() => {
            message.style.opacity = '1';
        }, 10);

        // 3秒后淡出并移除
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(message);
            }, 300);
        }, 3000);
    }

    // 批量删除处理函数
    async function startBatchDelete(frameDoc) {
        if (globalState.isDeleting) {
            showMessage('正在删除中，请等待...', 'warning');
            return;
        }

        const minInterval = parseInt(frameDoc.querySelector('.qzone-fixed-panel .min-interval').value) || 1000;
        const maxInterval = parseInt(frameDoc.querySelector('.qzone-fixed-panel .max-interval').value) || 2000;

        if (minInterval > maxInterval) {
            showMessage('最小间隔不能大于最大间隔！', 'error');
            return;
        }

        if (!globalState.checkboxList.length) {
            showMessage('请先选择要删除的说说！', 'error');
            return;
        }

        globalState.isDeleting = true;
        const total = globalState.checkboxList.length;
        
        try {
            for (let i = 0; i < total; i++) {
                console.log(`正在删除第 ${i + 1}/${total} 条说说`);
                
                // 点击删除按钮
                globalState.checkboxList[i].delElement.click();
                
                // 等待一下再检查确认框
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 等待并点击确认弹窗
                await waitForConfirmDialog();
                
                // 等待随机时间后继续下一个
                if (i < total - 1) {
                    const interval = getRandomInterval(minInterval, maxInterval);
                    console.log(`等待 ${interval/1000} 秒后删除下一条...`);
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
            }
            
            showMessage(`成功删除 ${total} 条说说！`);
        } catch (error) {
            showMessage('删除过程中出现错误，请重试', 'error');
            console.error(error);
        } finally {
            globalState.isDeleting = false;
            // 清空选中列表
            globalState.checkboxList.length = 0;
        }
    }
})();
