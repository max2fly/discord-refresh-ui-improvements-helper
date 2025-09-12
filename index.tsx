/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    removeAtBottom: {
        type: OptionType.BOOLEAN,
        description: "Remove typing gradient when at bottom",
        default: true
    },
    removeNotAtBottom: {
        type: OptionType.BOOLEAN,
        description: "Remove typing gradient when not at bottom",
        default: true
    },
    observerInterval: {
        type: OptionType.NUMBER,
        description: "Observer check interval (ms)",
        default: 50
    }
});

export default definePlugin({
    name: "NoTypingGradient",
    description: "Removes the typing gradient from Discord chat scrollers",
    authors: [
        {
	    id: 236950175480807424n,
            name: "max2fly"
        }
    ],
    settings,

    observer: null as MutationObserver | null,
    intervalId: null as NodeJS.Timeout | null,

    start() {
        this.removeTypingGradients();
        this.startObserver();
        this.startInterval();
    },

    stop() {
        this.stopObserver();
        this.stopInterval();
    },

    removeTypingGradients() {
        const scrollers = document.querySelectorAll('[class*="scroller"]');
        
        scrollers.forEach(scroller => {
            if (!(scroller instanceof HTMLElement)) return;
            
            let className = scroller.className;
            let modified = false;

            // Remove typingGradientAtBottom classes if setting is enabled
            if (settings.store.removeAtBottom && className.includes('typingGradientAtBottom')) {
                className = className.replace(/typingGradientAtBottom__\w+/g, '');
                modified = true;
            }

            // Remove typingGradientNotAtBottom classes if setting is enabled
            if (settings.store.removeNotAtBottom && className.includes('typingGradientNotAtBottom')) {
                className = className.replace(/typingGradientNotAtBottom__\w+/g, '');
                modified = true;
            }

            // Clean up extra whitespace and apply changes
            if (modified) {
                scroller.className = className.replace(/\s+/g, ' ').trim();
            }
        });
    },

    startObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldCheck = false;

            mutations.forEach((mutation) => {
                // Check for class attribute changes
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target as HTMLElement;
                    if (target.className?.includes('scroller') && target.className?.includes('typingGradient')) {
                        shouldCheck = true;
                    }
                }
                // Check for added nodes that might be scrollers
                else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement && node.className?.includes('scroller')) {
                            shouldCheck = true;
                        }
                    });
                }
            });

            if (shouldCheck) {
                this.removeTypingGradients();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    },

    stopObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    },

    startInterval() {
        // Fallback interval in case observer misses something
        this.intervalId = setInterval(() => {
            this.removeTypingGradients();
        }, settings.store.observerInterval);
    },

    stopInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
});