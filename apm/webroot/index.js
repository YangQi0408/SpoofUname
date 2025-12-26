// 路径配置 - 如果需要修改模块路径，只需修改这里的配置
const CONFIG = {
    MODULE_PATH: '/data/adb/modules/spoof_uname',
    CLI_PATH: '/data/adb/modules/spoof_uname/bin/spoof-uname-cli',
    LOG_PATH: '/data/adb/modules/spoof_uname/log/log.txt'
};

function getUname() {
    const output = document.getElementById('output');
    output.innerHTML = '正在测试 uname 命令...';
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        output.innerHTML = errno === 0 ? `系统信息: ${stdout.trim()}` : '获取系统信息失败';
        delete window[callback];
        
        // 写入日志
        writeLog(`getUname: errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    ksu.exec('uname -a', '{}', callback);
}

function setRelease() {
    const output = document.getElementById('output');
    const superkey = document.getElementById('superkey').value.trim();
    const release = document.getElementById('release').value.trim();
    
    if (!superkey || !release) {
        output.innerHTML = '请先输入 SuperKey 和 RELEASE';
        return;
    }
    
    output.innerHTML = '正在设置 RELEASE...';
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        output.innerHTML = errno === 0 ? `设置 RELEASE 成功: ${stdout.trim()}` : '设置 RELEASE 失败';
        delete window[callback];
        
        // 设置完成后将开关显示为打开状态并刷新KPM状态
        if (errno === 0) {
            setSwitchOn();
            setTimeout(() => getKpmStatus(), 500);
        }
        
        // 写入日志
        writeLog(`setRelease: superkey=${superkey}, release=${release}, errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `${CONFIG.CLI_PATH} -s ${superkey} -r "${release}"`;
    ksu.exec(command, '{}', callback);
}

function setVersion() {
    const output = document.getElementById('output');
    const superkey = document.getElementById('superkey').value.trim();
    const version = document.getElementById('version').value.trim();
    
    if (!superkey || !version) {
        output.innerHTML = '请先输入 SuperKey 和 VERSION';
        return;
    }
    
    output.innerHTML = '正在设置 VERSION...';
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        output.innerHTML = errno === 0 ? `设置 VERSION 成功: ${stdout.trim()}` : '设置 VERSION 失败';
        delete window[callback];
        
        // 设置完成后将开关显示为打开状态并刷新KPM状态
        if (errno === 0) {
            setSwitchOn();
            setTimeout(() => getKpmStatus(), 500);
        }
        
        // 写入日志
        writeLog(`setVersion: superkey=${superkey}, version=${version}, errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `${CONFIG.CLI_PATH} -s ${superkey} -v "${version}"`;
    ksu.exec(command, '{}', callback);
}

function toggleModule() {
    const output = document.getElementById('output');
    const superkey = document.getElementById('superkey').value.trim();
    const isEnabled = document.getElementById('moduleSwitch').checked;
    
    if (!superkey) {
        output.innerHTML = '请先输入 SuperKey';
        return;
    }
    
    output.innerHTML = isEnabled ? '正在启用模块...' : '正在禁用模块...';
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        output.innerHTML = errno === 0 ? `模块${isEnabled ? '启用' : '禁用'}成功: ${stdout.trim()}` : `模块${isEnabled ? '启用' : '禁用'}失败`;
        delete window[callback];
        
        // 操作完成后刷新KPM状态
        if (errno === 0) {
            setTimeout(() => getKpmStatus(), 500);
        }
        
        // 写入日志
        writeLog(`toggleModule: superkey=${superkey}, enabled=${isEnabled}, errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `${CONFIG.CLI_PATH} -s ${superkey} ${isEnabled ? '-e' : '-d'}`;
    ksu.exec(command, '{}', callback);
}

function setSwitchOn() {
    document.getElementById('moduleSwitch').checked = true;
}

// 写入日志函数
function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    const logCallback = `log_cb_${Date.now()}`;
    window[logCallback] = (errno, stdout) => {
        delete window[logCallback];
    };
    
    // 确保日志目录存在并写入日志
    const logDir = CONFIG.LOG_PATH.substring(0, CONFIG.LOG_PATH.lastIndexOf('/'));
    const command = `mkdir -p ${logDir} && echo "${logMessage}" >> ${CONFIG.LOG_PATH}`;
    ksu.exec(command, '{}', logCallback);
}

function getKpmStatus() {
    const output = document.getElementById('output');
    const kpmStatus = document.getElementById('kpmStatus');
    const kpmStatusContent = document.getElementById('kpmStatusContent');
    const superkey = document.getElementById('superkey').value.trim();
    
    if (!superkey) {
        output.innerHTML = '请先输入 SuperKey';
        return;
    }
    
    output.innerHTML = '正在获取 KPM 状态...';
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        if (errno === 0) {
            // 解析换行的状态信息
            const lines = stdout.trim().split('\n');
            let statusHtml = '';
            
            lines.forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    
                    if (key === 'modify') {
                        const is_enabled = value === 'enabled';
                        const color = is_enabled ? '#4caf50' : '#f44336';
                        const text = is_enabled ? '已启用' : '已禁用';
                        statusHtml += `<div><strong>模块状态:</strong> <span style="color: ${color}">${text}</span></div>`;
                        
                        // 更新开关状态
                        document.getElementById('moduleSwitch').checked = is_enabled;
                    } else if (key === 'release') {
                        const displayValue = value || '(未设置)';
                        statusHtml += `<div><strong>Release:</strong> ${displayValue}</div>`;
                        document.getElementById('release').value = value;
                    } else if (key === 'version') {
                        const displayValue = value || '(未设置)';
                        statusHtml += `<div><strong>Version:</strong> ${displayValue}</div>`;
                        document.getElementById('version').value = value;
                    }
                }
            });
            
            // 显示KPM状态区域
            kpmStatusContent.innerHTML = statusHtml;
            kpmStatus.style.display = 'block';
            output.innerHTML = 'KPM 状态已更新';
        } else {
            output.innerHTML = '获取 KPM 状态失败，请检查 SuperKey 是否正确';
        }
        delete window[callback];
        
        // 写入日志
        writeLog(`getKpmStatus: errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `${CONFIG.CLI_PATH} -s ${superkey} -k`;
    ksu.exec(command, '{}', callback);
}

// 清除日志功能
function clearLogs() {
    const output = document.getElementById('output');
    output.innerHTML = '正在清除日志...';
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        if (errno === 0) {
            output.innerHTML = '日志已清除';
            writeLog('clearLogs: 日志已清除');
        } else {
            output.innerHTML = '清除日志失败';
        }
        delete window[callback];
    };
    
    // 删除日志文件并重新创建空文件
    const logDir = CONFIG.LOG_PATH.substring(0, CONFIG.LOG_PATH.lastIndexOf('/'));
    const command = `rm -f ${CONFIG.LOG_PATH} && mkdir -p ${logDir} && touch ${CONFIG.LOG_PATH}`;
    ksu.exec(command, '{}', callback);
}

window.getUname = getUname;
window.setRelease = setRelease;
window.setVersion = setVersion;
window.toggleModule = toggleModule;
window.writeLog = writeLog;
window.getKpmStatus = getKpmStatus;
window.clearLogs = clearLogs;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('output').innerHTML = 'Welcome';
    
    // 监听开关变化
    document.getElementById('moduleSwitch').addEventListener('change', toggleModule);
    
    // 写入页面加载日志
    writeLog('Web界面已加载');
});