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
        console.log("running in iframe");

        // tell top to listen message
        window.parent.postMessage("IframeMode", "*");
        // listen to message from top
        window.addEventListener("message", (event) => {
            switch (event.data) {
                case "toggleTheaterMode":
                    const playerElement = findPlayerElement(playerSelectorList);
                    toggleTheaterMode(playerElement);
                    break;
                default:
                    break;
            }
        });

        document.addEventListener("keydown", (e) => {
            console.log("recieved keydown event in iframe");
            if (e.key === "Escape") {
                window.parent.postMessage("toggleTheaterMode", "*");
            }
        })
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

    function runInTopLevel() {

        let theaterSelector;
        window.addEventListener("message", (event) => {
            switch (event.data) {
                case "IframeMode":
                    isIframeMode = event.data.isIframeMode;
                    theaterSelector = "iframe";
                    break;
                case "toggleTheaterMode":
                    toggleTheaterMode(document.querySelector(theaterSelector));
                    break;
                default:
                    break;
            }
        });

        document.addEventListener("keydown", (e) => {
            const iframeElement = document.querySelector("iframe");
            const playerElement = findPlayerElement(playerSelectorList);
            const theaterElement = playerElement || iframeElement;
            if (e.key === "Escape") {
                toggleTheaterMode(theaterElement);
                iframeElement && iframeElement.contentWindow.postMessage("toggleTheaterMode", "*");
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
