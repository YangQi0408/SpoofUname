// 配置管理模块
const CONFIG_FILE = '/data/adb/modules/spoof_uname/config';

// 保存配置到文件
function saveConfig(release, version, enabled, superkey, autoStart) {
    const config = {
        release: release || '',
        version: version || '',
        enabled: enabled !== false,
        superkey: superkey || '',
        autoStart: autoStart !== false
    };
    
    const configText = `release=${config.release}\nversion=${config.version}\nenabled=${config.enabled ? 'true' : 'false'}\nsuperkey=${config.superkey}\nautostart=${config.autoStart ? 'true' : 'false'}\n`;
    
    const callback = `cb_${Date.now()}`;
    window[callback] = (errno, stdout) => {
        if (errno === 0) {
            // 配置保存成功
        } else {
            console.error('保存配置失败');
        }
        delete window[callback];
    };
    
    // 使用shell命令写入配置文件
    const command = `sh -c 'echo "${configText}" > ${CONFIG_FILE}'`;
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
    const lines = configText.trim().split('\n');
    const config = {
        release: '',
        version: '',
        enabled: false,
        superkey: '',
        autoStart: true
    };
    
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key === 'release') config.release = value;
        if (key === 'version') config.version = value;
        if (key === 'enabled') config.enabled = value === 'true';
        if (key === 'superkey') config.superkey = value;
        if (key === 'autostart') config.autoStart = value === 'true';
    });
    
    return config;
}

// 更新UI界面
function updateUI(config) {
    document.getElementById('release').value = config.release;
    document.getElementById('version').value = config.version;
    document.getElementById('moduleSwitch').checked = config.enabled;
    document.getElementById('superkey').value = config.superkey;
    document.getElementById('autoStartSwitch').checked = config.autoStart;
}

// 导出函数
window.saveConfig = saveConfig;
window.loadConfig = loadConfig;