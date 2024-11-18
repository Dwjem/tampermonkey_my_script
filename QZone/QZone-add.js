// ==UserScript==
// @name         QQ空间自动发说说
// @namespace    none
// @version      1.0.0
// @description  在QQ空间自动发送随机内容的说说
// @author       You
// @match        *://user.qzone.qq.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 随机文本库
    const texts = [
        "今天天气真不错",
        "学习使我快乐",
        "生活就像一盒巧克力",
        "保持微笑，保持热爱",
        "努力工作，认真生活",
        "向前看，别回头",
        "每一天都是新的开始",
        "保持希望，永不放弃",
        "享受生活的每一刻",
        "做最好的自己",
        "阳光总在风雨后",
        "带着梦想前进",
        "简单生活，快乐随行",
        "用心感受生活的美",
        "珍惜当下的每一刻",
        "微笑面对每一天",
        "平凡中寻找快乐",
        "心怀感恩，继续前行",
        "保持初心，砥砺前行",
        "生活处处是惊喜",
        "把握现在，憧憬未来",
        "用心生活，静待花开",
        "岁月静好，现世安稳",
        "保持热爱，奔赴山海",
        "愿你被世界温柔以待",
        "生活明朗，万物可爱",
        "愿每天都充满阳光",
        "保持理想，脚踏实地",
        "让生活充满色彩",
        "心之所向，素履以往",
        "保持善良，保持勇敢",
        "愿你被温柔对待",
        "活在当下，憧憬未来",
        "保持热爱，永不言弃",
        "愿你眼中有光芒",
        "愿你一生被爱护",
        "保持初心，不负韶华",
        "愿你遇见最美好的",
        "生活总有新惊喜",
        "愿你被世界温暖",
        "保持梦想，勇往直前",
        "愿你平安喜乐",
        "生活处处是风景",
        "保持热爱，奋斗不止",
        "愿你被时光眷顾",
        "心怀感恩，笑对人生",
        "愿你遇见美好",
        "保持希望，永不止步",
        "生活充满可能性",
        "愿你被岁月温柔以待"
    ];

    // 创建控制面板
    function createPanel() {
        const panel = h('div', {
            style: `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 9999;
            `
        }, [
            h('div', {style: 'margin-bottom: 10px;'}, [
                h('label', {style: 'margin-right: 10px;'}, '发送数量：'),
                h('input', {
                    type: 'number',
                    id: 'postCount',
                    value: '1',
                    min: '1',
                    style: 'width: 60px;'
                })
            ]),
            h('div', {style: 'margin-bottom: 10px;'}, [
                h('label', {style: 'margin-right: 10px;'}, '间隔范围(ms)：'),
                h('input', {
                    type: 'number',
                    id: 'minInterval',
                    value: '3000',
                    min: '1000',
                    placeholder: '最小值',
                    style: 'width: 80px; margin-right: 5px;'
                }),
                h('span', {style: 'margin-right: 5px;'}, '~'),
                h('input', {
                    type: 'number',
                    id: 'maxInterval',
                    value: '10000',
                    min: '1000',
                    placeholder: '最大值',
                    style: 'width: 80px;'
                })
            ]),
            h('button', {
                onclick: startPosting,
                style: `
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                `
            }, '开始发送')
        ]);

        document.body.appendChild(panel);
    }

    // 获取随机文本
    function getRandomText() {
        return texts[Math.floor(Math.random() * texts.length)];
    }

    // 发送说说
    async function postMessage(text) {
        const frame = document.querySelector('.app_canvas_frame');
        if (!frame || !frame.contentDocument) return false;
        
        const doc = frame.contentDocument;
        
        // 直接点击输入框
        const textArea = doc.querySelector('.textinput.textarea');
        if (!textArea) {
            console.error('未找到输入框');
            return false;
        }
        textArea.click();
        
        // 等待输入框激活
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 找到可编辑的div并输入内容
        const editor = doc.querySelector('[contenteditable="true"]');
        if (!editor) {
            console.error('未找到编辑器');
            return false;
        }
        
        // 设置内容
        editor.innerHTML = text;
        // 触发必要的事件
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 等待一下确保内容已经设置
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 点击发表按钮
        const submitBtn = doc.querySelector('.btn-post');
        if (!submitBtn) {
            console.error('未找到发表按钮');
            return false;
        }
        
        submitBtn.click();
        
        // 等待发送完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
    }

    // 获取随机间隔时间
    function getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 开始发送流程
    async function startPosting() {
        const count = parseInt(document.querySelector('#postCount').value) || 1;
        const minInterval = parseInt(document.querySelector('#minInterval').value) || 3000;
        const maxInterval = parseInt(document.querySelector('#maxInterval').value) || 10000;
        
        if (minInterval > maxInterval) {
            alert('最小间隔不能大于最大间隔！');
            return;
        }

        for (let i = 0; i < count; i++) {
            const text = getRandomText();
            console.log(`正在发送第 ${i + 1}/${count} 条说说`);
            
            const success = await postMessage(text);
            if (!success) {
                console.error('发送失败，请检查页面状态');
                return;
            }
            
            if (i < count - 1) {
                const interval = getRandomInterval(minInterval, maxInterval);
                console.log(`等待 ${interval/1000} 秒后发送下一条...`);
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        
        console.log('所有说说发送完成！');
    }

    // h函数用于创建DOM元素
    function h(tag, props, children) {
        const element = document.createElement(tag);
        
        if (props) {
            Object.entries(props).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'string') {
                    element.style.cssText = value;
                } else if (key.startsWith('on')) {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    element.setAttribute(key, value);
                }
            });
        }
        
        if (children) {
            if (!Array.isArray(children)) {
                children = [children];
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    // 等待页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPanel);
    } else {
        createPanel();
    }
})();
