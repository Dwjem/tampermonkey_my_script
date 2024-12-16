// ==UserScript==
// @name         555电影网快捷跳转按钮
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在 wuwu49c.wiki 的视频播放器页面上添加自定义控制按钮
// @author       你的名字
// @match        https://wuwu49c.wiki/vodplay/*.html
// @match        https://5wuxz.shop/vodplay/*.html
// @match        https://wwnkm.shop/vodplay/*.html
// @match        https://www.5wuxrb.wiki/vodplay/*.html
// @match        */vodplay/*.html
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 存储键
    let storeKey = { value: '' };
    // 广告时长键值
    let forwardTimeStoreKey = ''
    // 自定义时间存储键
    let forwardTimeStoreKeyByCustom = ''
    
    let storeKeyProxy = new Proxy(storeKey, {
        set: function (target, key, value) {
            target[key] = value;
            forwardTimeStoreKey = value + '_forwardTime';
            forwardTimeStoreKeyByCustom = value + '_forwardTime_custom';
            return true;
        },
        get(target, prop, receiver) {
            return Reflect.get(...arguments);
        }
    })
    
    // 存储键获取正则
    let storeKeyReg = /\/vodplay\/(\d+)-/;
    // 要追加父元素的选择器
    let parentClass = '.art-controls-left';
    // 设置时间按钮文本
    let setTimeText = '';
    // 跳转按钮文本
    let jumpToTimeText = '';
    // iframe的Id
    let iframeId = 'play_iframe';
    // iframe的DOM
    let iframeDOM = null;
    // 设置轮询间隔（以毫秒为单位）
    let pollInterval = 1000; // 1秒
    // icon地址
    let iconUrl = '//at.alicdn.com/t/c/font_4743067_bun8o1mx2yt.css';
    // 按钮的属性
    let buttonAttributes = {
        class: 'art-control art-control-my-control iconfont', // icon-ic_shezhishijianduan
        style: {
            cursor: 'auto',
            marginRignt: '10px'
        }
    }

    function h(tag, props, ...children) {
        // 创建一个对象来表示虚拟DOM节点
        let node = {
            tag,
            props: props || {},
            children: []
        };

        // 处理子节点
        children.forEach(child => {
            if (typeof child === 'string') {
                // 如果子节点是字符串，直接添加到children数组中
                node.props.innerText = child;
            } else if (Array.isArray(child)) {
                // 如果子节点是数组，递归调用h函数并展开数组
                child.forEach(c => node.children.push(c));
            } else if (typeof child === 'object' && child !== null) {
                // 如果子节点是对象，递归调用h函数
                node.children.push(child);
            } else {
                throw new Error('Invalid child type');
            }
        });
        return node;
    }

    function createElement(vnode) {
        // 创建实际的DOM元素
        let element = document.createElement(vnode.tag);

        // 设置属性和事件监听器
        for (let key in vnode.props) {
            if (key.startsWith('on')) {
                // 如果是事件监听器，例如 onClick
                let eventType = key.slice(2).toLowerCase(); // 去掉 "on" 并转换为小写，例如 "onClick" -> "click"
                element.addEventListener(eventType, vnode.props[key]);
            } else {
                if (key === 'style' && typeof vnode.props[key] === 'object') { // 如果是样式对象，直接设置样式
                    Object.assign(element.style, vnode.props[key]);
                }
                else if (key === 'innerText') {
                    element.innerText = vnode.props[key];
                }
                else {
                    // 否则设置为属性
                    element.setAttribute(key, vnode.props[key]);
                }
            }
        }

        // 递归处理子节点
        vnode.children && vnode.children.forEach(child => {
            if (typeof child === 'string') {
                // 如果子节点是字符串，创建文本节点并添加到元素中
                element.appendChild(document.createTextNode(child));
            } else {
                // 如果子节点是对象，递归调用createElement并添加到元素中
                element.appendChild(createElement(child));
            }
        });

        return element;
    }

    function findStoreKey() {
        // 使用正则表达式匹配地址栏中的数字部分
        const match = location.pathname.match(storeKeyReg);
        if (match && match[1]) {
            storeKeyProxy.value = `video_key_${match[1]}`; // 保存存储键
        } else {
            alert('无法找到存储键，请调整油猴脚本中获取存储键的正则表达式'); // 如果无法匹配到数字部分，提示用户
        }
    }

    // 将秒数格式化为 mm:ss 格式的函数
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60); // 计算分钟数
        const secs = seconds % 60; // 计算剩余的秒数
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; // 返回格式化的时间字符串
    }

    // 将时间保存到浏览器缓存中的函数
    function saveTime(key, value) {
        localStorage.setItem(key, value.toString()); // 使用 localStorage 保存时间字符串
    }

    // 从浏览器缓存中加载时间的函数
    function loadTime() {
        return localStorage.getItem(storeKeyProxy.value); // 从 localStorage 获取时间字符串
    }

    // 快进指定秒数的函数
    function jumpToTime() {
        return localStorage.getItem(forwardTimeStoreKey); // 从 localStorage 获取时间字符串
    }

    // 自定义快进指定描述
    function jumpToTimeDesc() {
        return localStorage.getItem(forwardTimeStoreKeyByCustom); // 从 localStorage 获取时间字符串
    }

    // 跳转到指定时间
    function handleJumpToTime(timeString = loadTime()/* 从浏览器缓存中加载时间 */) {
        if (timeString) {
            const [minutes, seconds] = timeString.split(':').map(Number); // 解析时间字符串为分钟和秒数
            const totalSeconds = minutes * 60 + seconds; // 计算总秒数
            const videoElement = iframeDOM.querySelector('video.art-video'); // 查找视频元素
            if (videoElement) {
                videoElement.currentTime = totalSeconds; // 设置视频播放时间为总秒数
            } else {
                alert('未找到视频元素。'); // 如果未找到视频元素，提示用户
            }
        } else {
            alert('没有保存的时间。'); // 如果未找到保存的时间，提示用户
        }
    }

    // 弹出提示框
    function handleOpenSetTime() {
        const timeString = prompt('输入时间 (mm:ss):', '00:00'); // 弹出提示框让用户输入时间
        if (timeString && /^\d{2}:\d{2}$/.test(timeString)) { // 验证输入的时间格式是否正确
            saveTime(storeKeyProxy.value, timeString); // 保存时间到浏览器缓存
            handleJumpToTime(); // 调用跳转到指定时间的函数
        } else {
            alert('无效的时间格式，请使用 mm:ss 格式。'); // 提示用户输入的时间格式不正确
        }
    }

    // 弹出提示框快进 n 秒
    function handleOpenForwardTime(isCustom) {
        const timeString = prompt('输入快进秒数:', 0); // 弹出提示框让用户输入时间
        if (timeString && /^\d+$/.test(timeString)) { // 验证输入的时间格式是否正确
            saveTime(isCustom ? forwardTimeStoreKeyByCustom : forwardTimeStoreKey, timeString); // 保存时间到浏览器缓存
        } else {
            alert('无效的时间格式，请输入数字。'); // 提示用户输入的时间格式不正确
        }
    }

    // 快进 n 秒
    function handleForwardTime(seconds) {
        const videoElement = iframeDOM.querySelector('video.art-video'); // 查找视频元素
        if (videoElement) {
            videoElement.currentTime += Number(seconds); // 快进 n 秒
        } else {
            alert('未找到视频元素。'); // 如果未找到视频元素，提示用户
        }
    }


    // 创建第一个按钮，用于设置时间
    function createSetTimeButton() {
        const setTimeButton = h('div', {
            ...buttonAttributes,
        },
            setTimeText,
            h('i', {
                class: 'iconfont icon-ic_shezhishijianduan',
                title: '设置片头时间',
                style: {
                    cursor: 'pointer',
                    color: 'red'
                },
                onclick: () => {
                    handleOpenSetTime(); // 调用弹出提示框的函数
                }
            })
        )
        return setTimeButton;
    }

    // 创建第二个按钮，用于跳转到保存的时间
    function createJumpToTimeButton() {
        const jumpToTimeButton = h('div', {
            ...buttonAttributes,
        },
            h('i', {
                class: 'iconfont icon-mti-tiaozhuan',
                title: '跳转到片头结尾',
                style: {
                    cursor: 'pointer',
                    color: 'red'
                },
                onclick: () => {
                    if (loadTime()) {
                        handleJumpToTime(); // 调用跳转到指定时间的函数
                    } else {
                        handleOpenSetTime()
                    }
                }
            }),
            jumpToTimeText,
        )
        return jumpToTimeButton;
    }

    // 创建第三个按钮，用于快进 n 秒
    function createForwardButton() {
        const forwardButton = h('div', {
            ...buttonAttributes,
        },
            h('i', {
                class: 'iconfont icon-ad',
                title: '跳过广告',
                style: {
                    cursor: 'pointer',
                    color: 'red'
                },
                onclick: () => {
                    const seconds = jumpToTime();
                    if (seconds) {
                        handleForwardTime(seconds); // 调用跳转到指定时间的函数
                    } else {
                        handleOpenForwardTime()
                    }
                }
            }),
            "",
        )
        return forwardButton;
    }

    // 创建第四个按钮，自定义跳转时间
    function createForwardTimeButton() {
        return h('div', {
            ...buttonAttributes,
        },
            h('i', {
                class: 'iconfont icon-dingwei',
                title: '自定义跳转',
                style: {
                    cursor: 'pointer',
                    color: 'red'
                },
                onclick: () => {
                    const seconds = jumpToTimeDesc();
                    if (seconds) {
                        handleForwardTime(seconds); // 调用跳转到指定时间的函数
                    } else {
                        handleOpenForwardTime(true)
                    }
                }
            }),
            "",
        );
    }

    // 创建link标签，引入iconUrl，插入到iframe的DOM中
    function createStyleTag() {
        const dom = iframeDOM || document;
        const link = dom.createElement('link');
        link.rel = 'stylesheet';
        link.href = iconUrl;
        dom.querySelector('head').appendChild(link);
    }


    function init(node) {
        const setTime = createSetTimeButton() // 追加设置时间的按钮
        const JumpToTime = createJumpToTimeButton() // 追加跳转到时间的按钮
        const forward = createForwardButton() // 追加快进按钮
        const forward_custom = createForwardTimeButton() // 追加快进自定义按钮

        const append_childs = [setTime, JumpToTime, forward, forward_custom]
        append_childs.forEach((item) => {
            node.appendChild(createElement(item))
        })
    }

    // 定义轮询函数
    function pollFunction() {
        const iframe = document.getElementById(iframeId);
        const iframeDocument = iframe.contentWindow.document;
        const controlsLeft = iframeDocument.querySelector(parentClass);
        console.log("控制栏左侧元素", controlsLeft);
        if (controlsLeft) {
            stopPolling(intervalId);
            iframeDOM = iframeDocument;
            createStyleTag()
            findStoreKey();
            init(controlsLeft);
        }
    }



    // 开始轮询
    function startPolling() {
        createStyleTag()
        return setInterval(pollFunction, pollInterval);
    }

    // 停止轮询
    function stopPolling(intervalId) {
        clearInterval(intervalId);
    }

    // 启动轮询并保存 interval ID
    const intervalId = startPolling();

})();
