// ==UserScript==
// @name                Therter Mode Any Site
// @name：zh-CN         剧院模式任意网站
// @name：zh-TW         劇院模式任意網站
// @namespace           http://tampermonkey.net/
// @version             0.0.1
// @description         Video theater mode for some sites
// @description:zh-CN   一些网站的视频剧院模式
// @description:zh-TW   一些網站的視頻劇院模式
// @tag                 utilities
// @author              Yolo
// @match               https://mjv004.com/*
// @match               https://missav.ai/*
// @match               https://jable.tv/*
// @icon                data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant               GM_addStyle
// @grant               GM_getValue
// @grant               GM_setValue
// ==/UserScript==

(function () {
    'use strict';
    // 在这里写入你的代码...
    const playerDict = loadPlayerDict();
    console.log(playerDict);

    const isIframe = window.top !== window.self;
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
        }

        .no-scroll {
            overflow: hidden !important;
        }
    `

    GM_addStyle(fullscreenStyle)
    // document.addEventListener("keydown", (e) => {
    //     if (e.key === "Escape") {
    //         if (!isIframe) {
    //             const targetElement = document.querySelector("iframe");
    //             toggleFullScreen(targetElement);

    //             const innerPlayer = targetElement.contentDocument.querySelector("#player_top .plyr");
    //             toggleFullScreen(innerPlayer);
    //             toggleDisableScroll(document);
    //         }
    //         else {
    //             const targetElement = document.querySelector("#player_top .plyr");
    //             toggleFullScreen(targetElement);

    //             const outerElement = window.parent.document.querySelector("iframe");
    //             toggleFullScreen(outerElement);
    //             toggleDisableScroll(window.parent.document);
    //         }
    //     }
    // });

    // missav
    const playerSelector = playerDict[window.location.hostname];

    const playerElement = document.querySelector(playerSelector);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (!isIframe) {
                toggleTheaterMode(playerElement);
            }
            else {
                toggleFullScreen(playerElement);
                toggleDisableScroll(window.parent.document);
            }
        }
    });

    function savePlayerDict(playerDict) {
        GM_setValue("playerDict", JSON.stringify(playerDict));
    }

    function loadPlayerDict() {
        const defaultPlayerDict = {
            "mjv004.com": ".plyr",
            "missav.ai": ".plyr",
            "jable.tv": ".plyr"
        };
        const playerDict = GM_getValue("playerDict",);
        return playerDict || defaultPlayerDict;
    }

    function toggleTheaterMode(targetElement) {
        targetElement.classList.toggle("reset-style");
        targetElement.classList.toggle("keep-front");
    }

    function toggleClassRecursively(element, className) {
        element.classList.toggle(className);

        if (element.parentElement && element.parentElement.tagName !== "BODY") {
            toggleClassRecursively(element.parentElement, className);
        }
    }

    function toggleFullScreen(element) {
        toggleClassRecursively(element, "reset-style");
        toggleClassRecursively(element, "keep-front");
    }

    function toggleDisableScroll(targetDocument) {
        targetDocument.documentElement.classList.toggle("no-scroll");
        targetDocument.body.classList.toggle("no-scroll");
    }
})();
