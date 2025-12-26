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
        
        // 设置完成后将开关显示为打开状态
        if (errno === 0) {
            setSwitchOn();
        }
        
        // 写入日志
        writeLog(`setRelease: superkey=${superkey}, release=${release}, errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `/data/adb/modules/spoof_uname/bin/spoof-uname-cli -s ${superkey} -r "${release}"`;
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
        
        // 设置完成后将开关显示为打开状态
        if (errno === 0) {
            setSwitchOn();
        }
        
        // 写入日志
        writeLog(`setVersion: superkey=${superkey}, version=${version}, errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `/data/adb/modules/spoof_uname/bin/spoof-uname-cli -s ${superkey} -v "${version}"`;
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
        
        // 写入日志
        writeLog(`toggleModule: superkey=${superkey}, enabled=${isEnabled}, errno=${errno}, stdout=${stdout.trim()}`);
    };
    
    const command = `/data/adb/modules/spoof_uname/bin/spoof-uname-cli -s ${superkey} ${isEnabled ? '-e' : '-d'}`;
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
    
    // 使用shell命令将日志追加到文件
    const command = `sh -c 'echo "${logMessage}" >> /data/adb/llloooggg.txt'`;
    ksu.exec(command, '{}', logCallback);
}

window.getUname = getUname;
window.setRelease = setRelease;
window.setVersion = setVersion;
window.toggleModule = toggleModule;
window.writeLog = writeLog;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('output').innerHTML = '点击输入文本';
    
    // 监听开关变化
    document.getElementById('moduleSwitch').addEventListener('change', toggleModule);
    
    // 写入页面加载日志
    writeLog('Web界面已加载');
});