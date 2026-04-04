// 配置管理模块
const CONFIG_FILE = '/data/adb/modules/spoof_uname/config.sh';

// 保存配置到文件
function saveConfig(release, version, enabled, autoStart) {
    const config = {
        release: release || '',
        version: version || '',
        enabled: enabled !== false,
        autoStart: autoStart !== false
    };
    
    const shellQuote = (value) => `'${String(value).replace(/'/g, `'"'"'`)}'`;
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        if (errno === 0) {
            // 配置保存成功
        } else {
            console.error('保存配置失败');
        }
        delete window[callback];
    };
    
    // 使用printf写入配置文件，保证version以#开头时也能保留引号
    const command = `printf 'release="%s"\nversion="%s"\nenabled=%s\nautostart=%s\n' ${shellQuote(config.release)} ${shellQuote(config.version)} ${config.enabled ? 'true' : 'false'} ${config.autoStart ? 'true' : 'false'} > ${CONFIG_FILE}`;
    ksu.exec(command, '{}', callback);
}

// 从文件读取配置
function loadConfig() {
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        if (errno === 0) {
            const config = parseConfig(stdout);
            updateUI(config);
        } else {
            console.error('读取配置失败');
        }
        delete window[callback];
    };
    
    const command = `cat ${CONFIG_FILE} 2>/dev/null || echo ''`;
    ksu.exec(command, '{}', callback);
}

// 解析配置文本
function parseConfig(configText) {
    const unquoteValue = (value) => {
        if (!value) return '';
        const trimmed = value.trim();
        if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        return trimmed;
    };

    const lines = configText.trim().split('\n');
    const config = {
        release: '',
        version: '',
        enabled: false,
        autoStart: true
    };
    
    lines.forEach(line => {
        const equalPos = line.indexOf('=');
        if (equalPos <= 0) return;
        const key = line.substring(0, equalPos);
        const value = line.substring(equalPos + 1);
        if (key === 'release') config.release = unquoteValue(value);
        if (key === 'version') config.version = unquoteValue(value);
        if (key === 'enabled') config.enabled = value === 'true';
        if (key === 'autostart') config.autoStart = value === 'true';
    });
    
    return config;
}

// 更新UI界面
function updateUI(config) {
    document.getElementById('release').value = config.release;
    document.getElementById('version').value = config.version;
    document.getElementById('moduleSwitch').checked = config.enabled;
    document.getElementById('autoStartSwitch').checked = config.autoStart;
}

// 导出函数
window.saveConfig = saveConfig;
window.loadConfig = loadConfig;
