/**
 * Gemini in Chrome - 主交互脚本
 * 提供复制、折叠、模态框等交互功能
 */

(function() {
    'use strict';

    // ==================== 工具函数 ====================

    /**
     * 获取元素
     */
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    /**
     * 复制文本到剪贴板
     */
    async function copyToClipboard(text) {
        try {
            // 使用现代 Clipboard API
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降级方案：使用 execCommand
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackErr) {
                document.body.removeChild(textArea);
                console.error('复制失败:', fallbackErr);
                return false;
            }
        }
    }

    /**
     * 显示 toast 提示
     */
    function showToast(toastElement, duration = 2000) {
        toastElement.classList.add('show');
        setTimeout(() => {
            toastElement.classList.remove('show');
        }, duration);
    }

    /**
     * 检测操作系统
     */
    function detectOS() {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac os x')) {
            return 'macos';
        } else if (userAgent.includes('linux')) {
            return 'linux';
        } else if (userAgent.includes('win')) {
            return 'windows';
        }
        return 'unknown';
    }

    // ==================== 复制命令功能 ====================

    /**
     * 初始化复制命令按钮
     */
    function initCopyCommand() {
        const copyBtn = $('#copy-command-btn');
        const copyIconBtn = $('#copy-btn');
        const installCommand = $('#install-command').textContent;
        const toast = $('#copy-toast');

        const handleCopy = async (e) => {
            e.preventDefault();

            const success = await copyToClipboard(installCommand);

            if (success) {
                showToast(toast);

                // 按钮反馈动画
                const icon = copyBtn.querySelector('.material-icons');
                const originalText = icon.textContent;
                icon.textContent = 'check';

                setTimeout(() => {
                    icon.textContent = originalText;
                }, 2000);
            } else {
                alert('复制失败，请手动复制命令');
            }
        };

        // 绑定两个复制按钮
        if (copyBtn) {
            copyBtn.addEventListener('click', handleCopy);
        }

        if (copyIconBtn) {
            copyIconBtn.addEventListener('click', handleCopy);
        }
    }

    // ==================== 折叠功能 ====================

    /**
     * 初始化可折叠区域
     */
    function initCollapsibles() {
        const collapsibles = $$('.collapsible');

        collapsibles.forEach(collapsible => {
            const targetId = collapsible.dataset.target;
            const target = $(`#${targetId}`);
            const expandIcon = collapsible.querySelector('.expand-icon');

            // 默认全部展开
            if (expandIcon) {
                expandIcon.classList.add('expanded');
            }

            collapsible.addEventListener('click', () => {
                const isHidden = target.classList.contains('hidden');

                if (isHidden) {
                    // 展开
                    target.classList.remove('hidden');
                    if (expandIcon) {
                        expandIcon.classList.add('expanded');
                    }
                } else {
                    // 折叠
                    target.classList.add('hidden');
                    if (expandIcon) {
                        expandIcon.classList.remove('expanded');
                    }
                }
            });
        });
    }

    // ==================== 模态框功能 ====================

    /**
     * 初始化模态框
     */
    function initModal() {
        const modal = $('#terminal-modal');
        const overlay = $('#modal-overlay');
        const openBtn = $('#open-terminal-btn');
        const closeBtn = $('#close-modal');

        // 打开模态框
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            });
        }

        // 关闭模态框
        const closeModal = () => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }

        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    // ==================== 检查清单状态 ====================

    /**
     * 初始化检查清单
     */
    function initChecklist() {
        const checkboxes = $$('.checklist-item input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            // 从 localStorage 恢复状态
            const savedState = localStorage.getItem(`checkbox-${checkbox.id}`);
            if (savedState === 'true') {
                checkbox.checked = true;
            }

            // 保存状态
            checkbox.addEventListener('change', () => {
                localStorage.setItem(`checkbox-${checkbox.id}`, checkbox.checked);
            });
        });
    }

    // ==================== 反馈问题链接 ====================

    /**
     * 初始化反馈链接
     */
    function initFeedbackLinks() {
        const reportIssueBtn = $('#report-issue');

        if (reportIssueBtn) {
            reportIssueBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.open('https://github.com/yourusername/gemini-in-chrome/issues', '_blank');
            });
        }
    }

    // ==================== 平滑滚动 ====================

    /**
     * 初始化平滑滚动
     */
    function initSmoothScroll() {
        // 为所有内部链接添加平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#!') return;

                const target = $(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ==================== 安装命令动态更新 ====================

    /**
     * 根据访问域名更新安装命令
     */
    function updateInstallCommand() {
        const commandElement = $('#install-command');
        if (!commandElement) return;

        // 获取当前协议和域名
        const protocol = window.location.protocol;
        const hostname = window.location.hostname || '';

        // 根据访问方式选择合适的 CDN
        let scriptUrl;

        if (protocol === 'file:') {
            // 本地文件打开，使用默认 GitHub 地址
            scriptUrl = 'https://raw.githubusercontent.com/lehao/gemini-in-chrome/main/install.sh';
        } else if (hostname.includes('github.io')) {
            // GitHub Pages 部署
            const parts = window.location.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                scriptUrl = `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/main/install.sh`;
            } else {
                scriptUrl = 'https://raw.githubusercontent.com/yourusername/gemini-in-chrome/main/install.sh';
            }
        } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            // 本地开发服务器
            scriptUrl = 'https://raw.githubusercontent.com/yourusername/gemini-in-chrome/main/install.sh';
        } else {
            // 自定义域名或其他情况，使用默认值
            scriptUrl = 'https://raw.githubusercontent.com/yourusername/gemini-in-chrome/main/install.sh';
        }

        commandElement.textContent = `/bin/bash -c "$(curl -fsSL ${scriptUrl})"`;
    }

    // ==================== 键盘快捷键 ====================

    /**
     * 初始化键盘快捷键
     */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + C 复制命令（当焦点在命令框时）
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const commandBox = $('.command-box:hover');
                if (commandBox || document.activeElement === $('#install-command')) {
                    const copyBtn = $('#copy-command-btn');
                    if (copyBtn) {
                        copyBtn.click();
                    }
                }
            }
        });
    }

    // ==================== 终端检测提示 ====================

    /**
     * 根据用户操作系统显示对应的终端提示
     */
    function initTerminalHint() {
        const os = detectOS();

        // 高亮当前系统的终端说明
        $$('.terminal-os').forEach(el => {
            const title = el.querySelector('h3')?.textContent.toLowerCase() || '';
            if (
                (os === 'macos' && title.includes('mac')) ||
                (os === 'linux' && title.includes('linux')) ||
                (os === 'windows' && title.includes('windows'))
            ) {
                el.style.backgroundColor = '#e8f0fe';
                el.style.borderLeft = '3px solid var(--md-primary)';
            }
        });

        // 更新"如何打开终端"按钮文本
        const openTerminalBtn = $('#open-terminal-btn');
        if (openTerminalBtn) {
            const osNames = {
                'macos': '打开终端 (macOS)',
                'linux': '打开终端 (Linux)',
                'windows': '打开 Git Bash',
                'unknown': '如何打开终端'
            };
            openTerminalBtn.lastChild.textContent = ` ${osNames[os]}`;
        }
    }

    // ==================== macOS 语言提示 ====================

    /**
     * 为 macOS 用户显示语言设置提示
     */
    function initMacOSLanguageHint() {
        const os = detectOS();

        // 仅对 macOS 用户显示语言设置提示
        if (os === 'macos') {
            const languageTip = $('#macos-language-tip');
            if (languageTip) {
                languageTip.style.display = 'block';
            }

            // 高亮语言检查项
            const languageItem = $('#check-language-item');
            if (languageItem) {
                languageItem.classList.add('important');
                languageItem.style.backgroundColor = '#fff3e0';
                languageItem.style.borderColor = '#ff9800';
            }
        }
    }

    // ==================== 页面加��动画 ====================

    /**
     * 初始化页面加载动画
     */
    function initPageAnimation() {
        // 为各个 section 添加淡入动画
        const sections = $$('.section');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });

        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(section);
        });
    }

    // ==================== 初始化 ====================

    /**
     * DOM 加载完成后初始化所有功能
     */
    function init() {
        // 等待 DOM 完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    /**
     * 初始化所有功能
     */
    function initAll() {
        initCopyCommand();
        initCollapsibles();
        initModal();
        initChecklist();
        initFeedbackLinks();
        initSmoothScroll();
        updateInstallCommand();
        initKeyboardShortcuts();
        initTerminalHint();
        initMacOSLanguageHint();
        initPageAnimation();

        console.log('Gemini in Chrome - 页面已加载完成');
    }

    // 启动初始化
    init();

})();
