#!/bin/bash

###############################################################################
# Gemini in Chrome - 一键启用工具
# 适用于非美区用户在 Chrome 上启用 Gemini 功能
#
# 使用方法:
#   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yourusername/gemini-in-chrome/main/install.sh)"
#
# 参数:
#   --rollback    还原到修改前的状态
#   --debug       显示详细日志
#   --help        显示帮助信息
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 全局变量
SCRIPT_VERSION="1.0.0"
DEBUG_MODE=false
ROLLBACK_MODE=false
CHROME_PATH=""
LOCAL_STATE_FILE=""
BACKUP_FILE=""
OS_TYPE=""

###############################################################################
# 工具函数
###############################################################################

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    if [ "$DEBUG_MODE" = true ]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

# 打印分割线
print_separator() {
    echo "========================================"
}

# 显示帮助信息
show_help() {
    cat << EOF
Gemini in Chrome - 一键启用工具 v${SCRIPT_VERSION}

使用方法:
    bash install.sh [选项]

选项:
    --rollback    还原到修改前的状态
    --debug       显示详细日志
    --help        显示此帮助信息

功能:
    自动修改 Chrome 配置以启用 Gemini 功能
    支持 macOS, Linux, Windows (Git Bash/WSL)

更多信息:
    https://github.com/yourusername/gemini-in-chrome
EOF
    exit 0
}

###############################################################################
# 检测操作系统
###############################################################################

detect_os() {
    print_info "检测操作系统..."

    case "$OSTYPE" in
        darwin*)
            OS_TYPE="macos"
            print_success "检测到 macOS"
            ;;
        linux*)
            OS_TYPE="linux"
            print_success "检测到 Linux"
            ;;
        msys*|cygwin*)
            OS_TYPE="windows"
            print_success "检测到 Windows (Git Bash/MSYS)"
            ;;
        *)
            print_error "不支持的操作系统: $OSTYPE"
            print_info "请使用 macOS, Linux, 或 Windows (Git Bash/WSL)"
            exit 1
            ;;
    esac

    print_debug "OS_TYPE: $OS_TYPE"
}

###############################################################################
# 查找 Chrome 配置路径
###############################################################################

find_chrome_path() {
    print_info "查找 Chrome 安装路径..."

    local possible_paths=()

    case "$OS_TYPE" in
        macos)
            possible_paths=(
                "$HOME/Library/Application Support/Google/Chrome"
                "$HOME/Library/Application Support/Google/Chrome Canary"
            )
            ;;
        linux)
            possible_paths=(
                "$HOME/.config/google-chrome"
                "$HOME/.config/google-chrome-beta"
                "$HOME/.config/google-chrome-unstable"
            )
            ;;
        windows)
            possible_paths=(
                "$LOCALAPPDATA/Google/Chrome/User Data"
                "$APPDATA/Google/Chrome/User Data"
            )
            ;;
    esac

    # 尝试每个可能的路径
    for path in "${possible_paths[@]}"; do
        print_debug "检查路径: $path"

        if [ -d "$path" ]; then
            # 检查是否存在 Local State 文件
            if [ -f "$path/Local State" ]; then
                CHROME_PATH="$path"
                LOCAL_STATE_FILE="$path/Local State"
                print_success "找到 Chrome 配置: $path"
                return 0
            fi
        fi
    done

    # 未找到 Chrome
    print_error "未找到 Chrome 安装！"
    print_info "请先安装 Google Chrome:"
    print_info "  https://www.google.com/chrome/"
    print_info ""
    print_info "如果已经安装，请确保至少运行过一次 Chrome。"
    exit 1
}

###############################################################################
# 备份 Local State 文件
###############################################################################

backup_local_state() {
    print_info "备份 Local State 文件..."

    local timestamp=$(date +%Y%m%d%H%M%S)
    BACKUP_FILE="${LOCAL_STATE_FILE}.backup-${timestamp}"

    if cp "$LOCAL_STATE_FILE" "$BACKUP_FILE"; then
        print_success "备份已创建: $BACKUP_FILE"
        return 0
    else
        print_error "备份失败！"
        print_info "可能的原因："
        print_info "  - 磁盘空间不足"
        print_info "  - 文件权限不足"
        print_info "  - 文件正在被其他程序使用"
        exit 1
    fi
}

###############################################################################
# 执行 sed 替换（跨平台兼容）
###############################################################################

sed_replace() {
    local pattern="$1"
    local replacement="$2"
    local file="$3"

    case "$OS_TYPE" in
        macos)
            # macOS: sed -i '' 需要空字符串参数
            sed -i '' "s/${pattern}/${replacement}/g" "$file"
            ;;
        linux|windows)
            # Linux/Windows: sed -i 直接使用
            sed -i "s/${pattern}/${replacement}/g" "$file"
            ;;
    esac
}

###############################################################################
# 修改配置
###############################################################################

modify_local_state() {
    print_info "修改 Chrome 配置..."

    # 创建临时文件
    local temp_file="${LOCAL_STATE_FILE}.tmp"

    # 复制原文件到临时文件
    cp "$LOCAL_STATE_FILE" "$temp_file"

    # 执行替换操作
    print_debug "执行配置替换..."

    # 1. is_glic_eligible: false -> true
    sed_replace '"is_glic_eligible":[[:space:]]*false' '"is_glic_eligible":true' "$temp_file"

    # 2. variations_country: cn -> us (以及其他可能的地区代码)
    sed_replace '"variations_country":"[a-z][a-z]"' '"variations_country":"us"' "$temp_file"

    # 3. variations_permanent_consistency_country 添加 "us"
    # 使用 Python 进行安全的复杂替换
    if command -v python3 &> /dev/null; then
        print_debug "使用 python3 进行复杂替换..."

        # 使用环境变量传递文件路径，避免单引号注入问题
        export TEMP_FILE_PATH="$temp_file"
        python3 -c '
import json
import os
import sys

file_path = os.environ.get("TEMP_FILE_PATH")
if not file_path:
    sys.exit(1)

try:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 修改 variations_permanent_consistency_country
    if "variations_permanent_consistency_country" in data:
        countries = data["variations_permanent_consistency_country"]
        if isinstance(countries, list):
            if "us" not in countries:
                countries.append("us")
        else:
            data["variations_permanent_consistency_country"] = ["us"]
    else:
        data["variations_permanent_consistency_country"] = ["us"]

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
' 2>/dev/null || print_warning "Python 替换失败，跳过此步骤"

    elif command -v python &> /dev/null; then
        print_debug "使用 python2 进行复杂替换..."

        export TEMP_FILE_PATH="$temp_file"
        python -c '
import json
import os
import sys

file_path = os.environ.get("TEMP_FILE_PATH")
if not file_path:
    sys.exit(1)

try:
    with open(file_path, "r") as f:
        data = json.load(f)

    if "variations_permanent_consistency_country" in data:
        countries = data["variations_permanent_consistency_country"]
        if isinstance(countries, list):
            if "us" not in countries:
                countries.append("us")
        else:
            data["variations_permanent_consistency_country"] = ["us"]
    else:
        data["variations_permanent_consistency_country"] = ["us"]

    with open(file_path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
except Exception as e:
    sys.exit(1)
' 2>/dev/null || print_warning "Python 替换失败，跳过此步骤"
    else
        print_warning "未找到 Python，跳过复杂替换步骤"
    fi

    # 清理可能的 .bak 文件（perl 或其他工具创建的）
    rm -f "${temp_file}.bak" 2>/dev/null || true

    # 验证修改后的文件是否是有效的 JSON
    print_debug "验证 JSON 格式..."
    if ! validate_json "$temp_file"; then
        print_error "修改后的文件格式错误！"
        print_info "正在还原备份..."
        restore_backup
        exit 1
    fi

    # 应用修改
    if mv "$temp_file" "$LOCAL_STATE_FILE"; then
        print_success "配置修改成功！"
        return 0
    else
        print_error "应用修改失败！"
        print_info "正在还原备份..."
        restore_backup
        exit 1
    fi
}

###############################################################################
# 验证 JSON 格式
###############################################################################

validate_json() {
    local file="$1"

    # 使用环境变量传递文件路径，避免单引号注入
    export JSON_VALIDATE_FILE="$file"

    # 尝试使用 python3 验证
    if command -v python3 &> /dev/null; then
        python3 -c 'import json, os; json.load(open(os.environ.get("JSON_VALIDATE_FILE")))' 2>/dev/null && return 0
    fi

    # 尝试使用 python2 验证
    if command -v python &> /dev/null; then
        python -c 'import json, os; json.load(open(os.environ.get("JSON_VALIDATE_FILE")))' 2>/dev/null && return 0
    fi

    # 尝试使用 jq 验证
    if command -v jq &> /dev/null; then
        jq empty "$file" 2>/dev/null && return 0
    fi

    # 如果没有验证工具，假设文件是有效的
    print_warning "无法验证 JSON 格式（缺少 python/jq），假设格式正确"
    return 0
}

###############################################################################
# 验证修改
###############################################################################

verify_changes() {
    print_info "验证配置修改..."

    # 检查关键字段
    if grep -q '"is_glic_eligible":true' "$LOCAL_STATE_FILE"; then
        print_success "✓ is_glic_eligible 已设置为 true"
    else
        print_warning "⚠ is_glic_eligible 未找到或未修改"
    fi

    if grep -q '"variations_country":"us"' "$LOCAL_STATE_FILE"; then
        print_success "✓ variations_country 已设置为 us"
    else
        print_warning "⚠ variations_country 未找到或未修改"
    fi

    if grep -q '"variations_permanent_consistency_country"' "$LOCAL_STATE_FILE"; then
        print_success "✓ variations_permanent_consistency_country 存在"
    else
        print_warning "⚠ variations_permanent_consistency_country 未找到"
    fi
}

###############################################################################
# 还原备份
###############################################################################

restore_backup() {
    print_info "正在还原备份..."

    # 查找最新的备份文件
    local latest_backup=$(ls -t "${LOCAL_STATE_FILE}.backup-"* 2>/dev/null | head -n 1)

    if [ -z "$latest_backup" ]; then
        print_error "未找到备份文件！"
        return 1
    fi

    print_info "使用备份: $latest_backup"

    if cp "$latest_backup" "$LOCAL_STATE_FILE"; then
        print_success "还原成功！"
        return 0
    else
        print_error "还原失败！"
        return 1
    fi
}

###############################################################################
# 检查 Chrome 语言设置
###############################################################################

check_chrome_language() {
    print_info "检查 Chrome 语言设置..."

    case "$OS_TYPE" in
        macos)
            # macOS: 检查 Chrome 的语言偏好设置
            local chrome_lang=$(defaults read com.google.Chrome AppleLanguages 2>/dev/null | head -n 1 | tr -d '()," ')

            print_debug "检测到 Chrome 语言: $chrome_lang"

            # 检查是否包含英语
            if [[ ! "$chrome_lang" =~ [Ee]n-[A-Z][A-Z] && ! "$chrome_lang" =~ [Ee]n ]]; then
                echo ""
                print_warning "⚠ Chrome 的应用语言可能未设置为英语"
                print_info "为了确保 Gemini 正常启用，建议将 Chrome 语言设置为英语："
                echo ""
                echo "  设置方法："
                echo "  1. 打开'系统设置' → '通用' → '语言与地区'"
                echo "  2. 在'应用程序语言'下找到 Google Chrome"
                echo "  3. 将其设置为'英语'或'English'"
                echo "  4. 重启 Chrome 使设置生效"
                echo ""

                # 仅在交互式终端中暂停
                if [ -t 0 ]; then
                    read -p "按回车键继续（建议先设置语言后再继续）..." || true
                    echo ""
                fi
            else
                print_success "✓ Chrome 语言设置正确"
            fi
            ;;
        linux)
            # Linux: 检查 locale 和 Chrome 配置
            local current_locale=$(locale 2>/dev/null | grep LANG= | cut -d= -f2 | cut -d. -f1)

            print_debug "检测到系统语言: $current_locale"

            if [[ ! "$current_locale" =~ ^en ]]; then
                echo ""
                print_warning "⚠ 系统语言可能不是英语"
                print_info "建议将 Chrome 语言设置为英语："
                echo ""
                echo "  设置方法："
                echo "  1. 在 Chrome 地址栏输入 chrome://settings/languages"
                echo "  2. 将'英语'移到首选语言位置"
                echo "  3. 重启 Chrome"
                echo ""

                # 仅在交互式终端中暂停
                if [ -t 0 ]; then
                    read -p "按回车键继续..." || true
                    echo ""
                fi
            else
                print_success "✓ 系统语言设置正确"
            fi
            ;;
        windows)
            # Windows: 提示用户检查 Chrome 语言设置
            print_info "请确保 Chrome 语言设置为英语"
            print_info "在 Chrome 中访问: chrome://settings/languages"
            ;;
    esac
}

###############################################################################
# 检查 Chrome 是否运行
###############################################################################

check_chrome_running() {
    print_info "检查 Chrome 是否运行..."

    local chrome_found=false

    case "$OS_TYPE" in
        macos)
            # 更精确的匹配：查找 Google Chrome 进程
            if pgrep -f "Google Chrome" >/dev/null 2>&1; then
                chrome_found=true
            fi
            ;;
        linux)
            # 查找 chrome 进程，排除其他 chromium 浏览器
            if pgrep -f 'google-chrome|chrome --type' >/dev/null 2>&1; then
                chrome_found=true
            fi
            ;;
        windows)
            # Windows 查找 chrome.exe
            if tasklist 2>/dev/null | grep -i "chrome.exe" >/dev/null 2>&1; then
                chrome_found=true
            fi
            ;;
    esac

    if [ "$chrome_found" = true ]; then
        print_warning "检测到 Chrome 正在运行！"
        print_info "请关闭 Chrome 后重新运行此脚本，以使配置生效。"
        return 1
    fi

    return 0
}

###############################################################################
# 完成提示
###############################################################################

show_completion_message() {
    print_separator
    print_success "配置完成！"
    print_separator
    echo ""
    print_info "接下来的步骤:"
    echo "  1. 重启 Google Chrome"
    echo "  2. 确保 Chrome 中已登录美区 Gmail 账号"
    echo "  3. 访问 https://gemini.google.com/ 或在 Chrome 中使用 Gemini"
    echo ""
    print_info "备份文件位置: $BACKUP_FILE"
    print_info "如需还原，运行: bash install.sh --rollback"
    echo ""
    print_warning "注意: Chrome 更新后可能需要重新运行此脚本"
    print_separator
}

###############################################################################
# 主函数
###############################################################################

main() {
    echo ""
    print_separator
    echo "  Gemini in Chrome - 一键启用工具 v${SCRIPT_VERSION}"
    print_separator
    echo ""

    # 检测操作系统
    detect_os

    # 查找 Chrome 路径（回滚模式也需要）
    find_chrome_path

    # 如果是回滚模式
    if [ "$ROLLBACK_MODE" = true ]; then
        print_info "执行回滚操作..."
        restore_backup
        print_success "回滚完成！"
        exit 0
    fi

    # 检查 Chrome 语言设置（仅 macOS）
    check_chrome_language

    # 备份原文件
    backup_local_state

    # 修改配置
    modify_local_state

    # 验证修改
    verify_changes

    # 检查 Chrome 是否运行
    check_chrome_running || true

    # 显示完成信息
    show_completion_message
}

###############################################################################
# 参数解析
###############################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --rollback)
            ROLLBACK_MODE=true
            shift
            ;;
        --debug)
            DEBUG_MODE=true
            set -x  # 启用调试输出
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            print_error "未知参数: $1"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 执行主函数
main
