// ==UserScript==
// @name                Therter Mode Any Site
// @name:zh-CN          剧院模式任意网站
// @name:zh-TW          劇院模式任意網站
// @namespace           http://tampermonkey.net/
// @version             0.0.1
// @description         Video theater mode for some sites
// @description:zh-CN   一些网站的视频剧院模式
// @description:zh-TW   一些網站的視頻劇院模式
// @tag                 utilities
// @author              Yolo
// @match               *://**/*
// @icon                https://api.iconify.design/mdi:movie-open-play-outline.svg
// @grant               GM_addStyle
// @grant               GM_getValue
// @grant               GM_setValue
// @run-at              document-end
// ==/UserScript==

(function () {
    'use strict';
    const fullscreenStyle = `
        .reset-style {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            max-height: none !important;
        }

        .keep-front {
            z-index: 2147483647 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 1) !important;
        }

        .no-scroll {
            overflow: hidden !important;
        }
    `
    GM_addStyle(fullscreenStyle)

    let isIframeMode = window.top !== window.self;
    function runInIframe() {
        window.parent.postMessage({
            type: "IframeMode"
        }, "*");
        // listen to message from top
        window.addEventListener("message", (event) => {
            if (!event.data.type) return;
            switch (event.data.type) {
                case "toggleTheaterMode":
                    const playerElement = findPlayerElement(playerSelectorList);
                    toggleTheaterMode(playerElement);
                    break;
                case "check-player":
                    const hasPlayer = !!findPlayerElement(playerSelectorList);
                    event.source.postMessage({
                        type: "player-check-response",
                        hasPlayer: hasPlayer
                    }, "*");
                    break;
                default:
                    break;
            }
        });

        window.addEventListener("keydown", (e) => {
            console.log("recieved keydown event in iframe");
            if (e.key === "Escape") {
                window.parent.postMessage({
                    type: "toggleTheaterMode"
                }, "*");
            }
        })
    }
    function runInTopLevel() {
        let theaterSelector;
        let toggleTarget;
        window.addEventListener("message", async (event) => {
            if (!toggleTarget) {
                const iframeElement = await findIframeContainingPlayer();
                const playerElement = findPlayerElement(playerSelectorList);
                const theaterElement = playerElement || iframeElement;
                toggleTarget = theaterElement;
            }
            switch (event.data.type) {
                case "IframeMode":
                    isIframeMode = event.data.isIframeMode;
                    theaterSelector = "iframe";
                    break;
                case "toggleTheaterMode":
                    console.log("recieved toggleTheaterMode event in top");
                    console.log(event);


                    toggleTheaterMode(toggleTarget);
                    break;
                default:
                    break;
            }
        });

        document.addEventListener("keydown", async (e) => {
            const iframeElement = await findIframeContainingPlayer();
            const playerElement = findPlayerElement(playerSelectorList);
            const theaterElement = playerElement || iframeElement;
            toggleTarget = theaterElement;
            if (e.key === "Escape") {
                toggleTheaterMode(theaterElement);
                iframeElement && iframeElement.contentWindow.postMessage({
                    type: "toggleTheaterMode"
                }, "*");
            }
        });
    }

    const playerSelectorList = [
        ".plyr",
        ".jwplayer",
        "#vplayer",
    ]
    function findPlayerElement(playerSelectorList) {
        for (const selector of playerSelectorList) {
            const playerElement = document.querySelector(selector);
            if (playerElement) {
                return playerElement;
            }
        }
        return null;
    }

    // 1. 修改成 async 函数，返回 Promise
    async function findIframeContainingPlayer() {
        const iframes = Array.from(document.querySelectorAll("iframe"));
        const targetOrigin = '*';  // 可改成具体域名以增强安全
        const total = iframes.length;
        let settled = false;
        let responded = 0;

        return new Promise(resolve => {
            function receiveCheckPlayerResult(event) {
                // ① 可加安全校验：event.origin === 你的父页面 origin
                // 注意：这里 event.origin !== '*' 的检查没意义，'*' 只能用于 postMessage 的第二参
                // if (event.origin !== expectedOrigin) return;

                const idx = iframes.findIndex(f => f.contentWindow === event.source);
                if (idx < 0) return;           // 不是我们发的消息
                if (event.data?.type !== "player-check-response") return;

                responded++;
                const hasPlayer = !!event.data.hasPlayer;

                // ② 早退：一旦某 iframe 有 player，就立刻 resolve
                if (hasPlayer && !settled) {
                    settled = true;
                    window.removeEventListener("message", receiveCheckPlayerResult);
                    return resolve(iframes[idx]);
                }

                // ③ 全部回复且都没找到
                if (responded === total && !settled) {
                    settled = true;
                    window.removeEventListener("message", receiveCheckPlayerResult);
                    return resolve(null);
                }
            }

            window.addEventListener("message", receiveCheckPlayerResult);

            // ④ 同步发消息出去
            for (const iframe of iframes) {
                iframe.contentWindow.postMessage({ type: "check-player" }, targetOrigin);
            }
        });
    }





    if (isIframeMode) {
        runInIframe();
    }
    else {
        runInTopLevel();
    }

    function toggleClassRecursively(element, className) {
        element.classList.toggle(className);
        if (element.parentElement && element.parentElement.tagName !== "BODY") {
            toggleClassRecursively(element.parentElement, className);
        }
    }

    function toggleTheaterMode(element) {
        toggleClassRecursively(element, "reset-style");
        toggleClassRecursively(element, "keep-front");
    }

    function toggleDisableScroll(targetDocument) {
        targetDocument.documentElement.classList.toggle("no-scroll");
        targetDocument.body.classList.toggle("no-scroll");
    }
})();
