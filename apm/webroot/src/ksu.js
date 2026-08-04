// KernelSU WebUI 桥接层：把回调式的 ksu.exec 封装成 Promise，并集中管理模块路径。

const MODULE_PATH = '/data/adb/modules/spoof_uname';

export const PATHS = {
  MODULE: MODULE_PATH,
  CLI: `${MODULE_PATH}/bin/spoof-uname-cli`,
  LOG: `${MODULE_PATH}/log/log.txt`,
  CONFIG: `${MODULE_PATH}/config.sh`,
};

// KernelSU 在 window 上注入 ksu 对象；开发环境下没有，退化为抛错的桩。
function getKsu() {
  if (typeof window !== 'undefined' && window.ksu) return window.ksu;
  return null;
}

// 把单引号安全地包进 shell 单引号字符串。
export function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

// 执行一条 shell 命令，resolve 为 stdout，非零退出码 reject。
export function exec(command) {
  return new Promise((resolve, reject) => {
    const ksu = getKsu();
    if (!ksu) {
      reject(new Error('ksu 不可用（请在 KernelSU/APatch WebUI 中打开）'));
      return;
    }
    const cb = `exec_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    window[cb] = (errno, stdout, stderr) => {
      delete window[cb];
      if (errno === 0) {
        resolve((stdout || '').trim());
      } else {
        reject(new Error((stderr || '').trim() || `命令执行失败 (errno=${errno})`));
      }
    };
    ksu.exec(command, '{}', cb);
  });
}

// 调用 CLI 子命令，透传参数。
export function cli(args) {
  return exec(`${PATHS.CLI} ${args}`);
}

// 读取 uname -a。
export function unameAll() {
  return exec('uname -a');
}

// 读取模块状态，解析 CLI --status 的输出。
// 格式（见 kpm/spoofuname.c control STATUS 分支）：
//   modify: enabled|disabled
//   release: <str>
//   version: <str>
export async function getStatus() {
  const out = await cli('--status');
  const status = { enabled: false, release: '', version: '' };
  out.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx <= 0) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key === 'modify') status.enabled = val === 'enabled';
    else if (key === 'release') status.release = val;
    else if (key === 'version') status.version = val;
  });
  return status;
}

export function setRelease(release) {
  return cli(`--set-release ${shellQuote(release)}`);
}

export function setVersion(version) {
  return cli(`--set-version ${shellQuote(version)}`);
}

export function enable() {
  return cli('--enable');
}

export function disable() {
  return cli('--disable');
}

// 清除单个字段的伪装：内核置空后 uname 钩子不再覆盖，恢复设备原值。
export function clearRelease() {
  return cli('--clear-release');
}

export function clearVersion() {
  return cli('--clear-version');
}

// 读取配置文件，缺失时返回空串。
export function readConfigRaw() {
  return exec(`cat ${PATHS.CONFIG} 2>/dev/null || echo ''`);
}

// config.sh 中 boot_stage 合法值；缺失或非法时回退到默认（service）。
export const BOOT_STAGES = ['service', 'post-fs-data'];
export const DEFAULT_BOOT_STAGE = 'service';

// 解析 config.sh 的 KEY="VALUE" 行。
export function parseConfig(text) {
  const unquote = (v) => {
    if (!v) return '';
    const t = v.trim();
    if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
      return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return t;
  };
  const config = {
    release: '',
    version: '',
    enabled: false,
    autostart: true,
    bootStage: DEFAULT_BOOT_STAGE,
  };
  (text || '').trim().split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx <= 0) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1);
    if (key === 'release') config.release = unquote(val);
    else if (key === 'version') config.version = unquote(val);
    else if (key === 'enabled') config.enabled = val.trim() === 'true';
    else if (key === 'autostart') config.autostart = val.trim() === 'true';
    else if (key === 'boot_stage') {
      const stage = unquote(val);
      // 只接受已知阶段，否则用默认值兜底（兼容旧配置 / 手改错值）。
      config.bootStage = BOOT_STAGES.includes(stage) ? stage : DEFAULT_BOOT_STAGE;
    }
  });
  return config;
}

// 写入配置文件。用 printf 保证以 # 开头的 version 也能保留引号。
export function saveConfig({ release, version, enabled, autostart, bootStage }) {
  const stage = BOOT_STAGES.includes(bootStage) ? bootStage : DEFAULT_BOOT_STAGE;
  const cmd =
    `printf 'release=%s\\nversion=%s\\nenabled=%s\\nautostart=%s\\nboot_stage=%s\\n' ` +
    `${shellQuote(`"${release || ''}"`)} ${shellQuote(`"${version || ''}"`)} ` +
    `${enabled ? 'true' : 'false'} ${autostart ? 'true' : 'false'} ${stage} > ${PATHS.CONFIG}`;
  return exec(cmd);
}

// 读取日志文件。
export function readLog() {
  return exec(`cat ${PATHS.LOG} 2>/dev/null || echo ''`);
}

// 追加一行带时间戳的日志。
export function appendLog(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  return exec(`printf '%s\\n' ${shellQuote(line)} >> ${PATHS.LOG}`).catch(() => {});
}

// 清空日志文件。
export function clearLog() {
  return exec(`: > ${PATHS.LOG}`);
}
