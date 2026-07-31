// SpoofUname WebUI 入口：导入所需的 MD3 组件，绑定交互逻辑。
// 交互模型：输入框失焦自动应用到内核并持久化；开关即时生效并持久化；
// 顶部状态在操作后刷新，同时定时轮询保持最新。
// 布局：分段卡片流——状态卡（总开关 + 当前生效 uname）、配置卡（输入框）、
// 选项卡（开机自启）、日志卡（可折叠）。

import '@material/web/divider/divider.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/switch/switch.js';
import '@material/web/button/text-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/circular-progress.js';
import { styles as typescaleStyles } from '@material/web/typography/md-typescale-styles.js';

import * as ksu from './ksu.js';
import './style.css';

// 把 MD3 排版样式表挂到 document 上（官方要求的方式）。
document.adoptedStyleSheets.push(typescaleStyles.styleSheet);

const POLL_INTERVAL_MS = 5000;

const $ = (id) => document.getElementById(id);

const els = {
  statusChip: $('statusChip'),
  statusChipIcon: $('statusChipIcon'),
  refreshStatusBtn: $('refreshStatusBtn'),
  getUnameBtn: $('getUnameBtn'),
  unameOutput: $('unameOutput'),
  curRelease: $('curRelease'),
  curVersion: $('curVersion'),
  release: $('release'),
  version: $('version'),
  moduleSwitch: $('moduleSwitch'),
  autoStartSwitch: $('autoStartSwitch'),
  logToggle: $('logToggle'),
  clearLogBtn: $('clearLogBtn'),
  logDisplay: $('logDisplay'),
  progressOverlay: $('progressOverlay'),
  snackbar: $('snackbar'),
};

// 记录已应用到内核的值，用于在失焦时判断是否真的发生了变化，
// 避免值没变也重复调用特权 CLI。
let appliedRelease = '';
let appliedVersion = '';

// —— UI 辅助 ——

let snackbarTimer = null;
function toast(message) {
  els.snackbar.textContent = message;
  els.snackbar.classList.add('show');
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() => els.snackbar.classList.remove('show'), 3000);
}

let busyCount = 0;
function setBusy(on) {
  busyCount += on ? 1 : -1;
  if (busyCount < 0) busyCount = 0;
  els.progressOverlay.hidden = busyCount === 0;
}

// 包裹一次异步操作：显示进度、结束后收尾。
async function withBusy(fn) {
  setBusy(true);
  try {
    return await fn();
  } finally {
    setBusy(false);
  }
}

// —— 状态渲染与刷新 ——

function renderStatus(status) {
  // 状态 Chip：文案 + 配色（data-state）+ 图标（启用勾选 / 禁用禁止）。
  els.statusChip.label = status.enabled ? '已启用' : '已禁用';
  els.statusChip.dataset.state = status.enabled ? 'enabled' : 'disabled';
  els.statusChipIcon.setAttribute('href', status.enabled ? '#i-check' : '#i-block');
  // 状态卡的"当前生效"展示区：始终反映内核实际返回值（空则显示占位符）。
  els.curRelease.textContent = status.release || '—';
  els.curVersion.textContent = status.version || '—';
  // 开关聚焦时不回填，避免与用户正在进行的切换冲突。
  if (document.activeElement !== els.moduleSwitch) {
    els.moduleSwitch.selected = status.enabled;
  }
  // 输入框即当前生效值：仅在未聚焦时回填，避免打断正在输入的用户。
  if (document.activeElement !== els.release) {
    els.release.value = status.release;
    appliedRelease = status.release;
  }
  if (document.activeElement !== els.version) {
    els.version.value = status.version;
    appliedVersion = status.version;
  }
}

async function refreshStatus() {
  await withBusy(async () => {
    try {
      renderStatus(await ksu.getStatus());
    } catch (e) {
      toast('获取状态失败: ' + e.message);
    }
  });
}

async function getUname() {
  await withBusy(async () => {
    try {
      const out = await ksu.unameAll();
      els.unameOutput.hidden = false;
      els.unameOutput.textContent = out;
    } catch (e) {
      toast('获取 Uname 失败: ' + e.message);
    }
  });
}

// —— 持久化 ——

// 把当前各控件的值统一写入 config.sh。
function persist() {
  return ksu.saveConfig({
    release: els.release.value.trim(),
    version: els.version.value.trim(),
    enabled: els.moduleSwitch.selected,
    autostart: els.autoStartSwitch.selected,
  });
}

// —— 输入框失焦应用 ——

async function onReleaseChange() {
  const release = els.release.value.trim();
  if (release === appliedRelease) return;
  if (!release) {
    // 允许清空输入框（仅更新持久化），但不向内核下发空值。
    appliedRelease = '';
    await withBusy(persist).catch(() => {});
    return;
  }
  await withBusy(async () => {
    try {
      await ksu.setRelease(release);
      appliedRelease = release;
      await persist();
      await ksu.appendLog(`应用 Release: ${release}`);
      toast('Release 已应用并保存');
      await refreshStatus();
    } catch (e) {
      toast('应用 Release 失败: ' + e.message);
    }
  });
}

async function onVersionChange() {
  const version = els.version.value.trim();
  if (version === appliedVersion) return;
  if (!version) {
    appliedVersion = '';
    await withBusy(persist).catch(() => {});
    return;
  }
  await withBusy(async () => {
    try {
      await ksu.setVersion(version);
      appliedVersion = version;
      await persist();
      await ksu.appendLog(`应用 Version: ${version}`);
      toast('Version 已应用并保存');
      await refreshStatus();
    } catch (e) {
      toast('应用 Version 失败: ' + e.message);
    }
  });
}

// —— 开关即时应用 ——

async function onModuleToggle() {
  const enabled = els.moduleSwitch.selected;
  await withBusy(async () => {
    try {
      if (enabled) await ksu.enable();
      else await ksu.disable();
      await persist();
      await ksu.appendLog(`模块${enabled ? '启用' : '禁用'}`);
      toast(enabled ? '模块已启用' : '模块已禁用');
      await refreshStatus();
    } catch (e) {
      toast('切换模块失败: ' + e.message);
      els.moduleSwitch.selected = !enabled; // 回滚以反映真实状态
    }
  });
}

async function onAutoStartToggle() {
  await withBusy(async () => {
    try {
      await persist();
      toast(els.autoStartSwitch.selected ? '开机自启已启用' : '开机自启已禁用');
    } catch (e) {
      toast('保存开机自启失败: ' + e.message);
      els.autoStartSwitch.selected = !els.autoStartSwitch.selected;
    }
  });
}

// —— 日志 ——

async function loadLog() {
  try {
    els.logDisplay.textContent = await ksu.readLog();
  } catch {
    // 日志读取失败不阻塞界面。
  }
}

function toggleLog() {
  const expanded = els.logToggle.getAttribute('aria-expanded') === 'true';
  els.logToggle.setAttribute('aria-expanded', String(!expanded));
  els.logDisplay.hidden = expanded;
}

async function clearLog() {
  await withBusy(async () => {
    try {
      await ksu.clearLog();
      els.logDisplay.textContent = '';
      toast('日志已清除');
    } catch (e) {
      toast('清除日志失败: ' + e.message);
    }
  });
}

// —— 初始加载配置 ——

async function loadConfig() {
  try {
    const config = ksu.parseConfig(await ksu.readConfigRaw());
    els.release.value = config.release;
    els.version.value = config.version;
    appliedRelease = config.release;
    appliedVersion = config.version;
    els.autoStartSwitch.selected = config.autostart;
  } catch {
    // 配置缺失时保持默认值。
  }
}

// —— 定时轮询 ——

let pollTimer = null;

// 后台静默刷新状态：不显示进度遮罩，操作进行中（busy）时跳过以避免竞态。
async function pollTick() {
  if (busyCount > 0) return;
  try {
    renderStatus(await ksu.getStatus());
  } catch {
    // 轮询失败静默处理，下一次再试。
  }
}

function startPolling() {
  if (pollTimer !== null) return;
  pollTimer = setInterval(pollTick, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer === null) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();
  } else {
    startPolling();
    pollTick(); // 恢复可见时立即刷新一次
  }
});

// —— 绑定事件 ——

els.refreshStatusBtn.addEventListener('click', refreshStatus);
els.getUnameBtn.addEventListener('click', getUname);
els.logToggle.addEventListener('click', toggleLog);
els.clearLogBtn.addEventListener('click', clearLog);
els.release.addEventListener('change', onReleaseChange);
els.version.addEventListener('change', onVersionChange);
els.moduleSwitch.addEventListener('change', onModuleToggle);
els.autoStartSwitch.addEventListener('change', onAutoStartToggle);

// —— 初始化 ——

(async function init() {
  await loadConfig();
  await refreshStatus();
  await loadLog();
  startPolling();
})();
