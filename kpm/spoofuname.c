#include <log.h>
#include <compiler.h>
#include <kpmodule.h>
#include <hook.h>
#include <linux/printk.h>
#include <kputils.h>
#include <syscall.h>
#include <uapi/asm-generic/unistd.h>
#include <asm/current.h>
#include <linux/sched.h>
#include <linux/uaccess.h>
#include <linux/string.h>
#include <linux/kernel.h>

#ifndef min
#define min(x, y) ((x) < (y) ? (x) : (y))
#endif

#ifndef MYKPM_VERSION
#define MYKPM_VERSION "v0.0.1-1-unknown"
#endif

#define SPOOFUNAME_MAGIC_NUMBER1 0x53504F46
#define SPOOFUNAME_MAGIC_NUMBER2 857865690

static char custom_release[65] = "";
static char custom_version[65] = "";
static int modify_enabled = 0;

KPM_NAME("SpoofUname");
KPM_VERSION(MYKPM_VERSION);
KPM_LICENSE("GPL v2");
KPM_AUTHOR("YangQi0408");
KPM_DESCRIPTION("Spoof Uname Information");

int control(const char *args, char *out_msg, int outlen)
{
    char reply_msg[128];
    int reply_len = 0;

    if (!args || !strncmp(args, "STATUS", 6)) {
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "modify: %s\nrelease: %s\nversion: %s",
                             modify_enabled ? "enabled" : "disabled", custom_release, custom_version);
    } else if (!strncmp(args, "SR ", 3)) {
        const char *new_release = args + 3;
        int len = strlen(new_release);

        if (len > 0 && len < 65) {
            strncpy(custom_release, new_release, sizeof(custom_release) - 1);
            custom_release[sizeof(custom_release) - 1] = '\0';
            modify_enabled = 1;
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "release set to: %s, modify enabled", custom_release);
            logkd("uname release updated to: %s\n", custom_release);
        } else {
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "error: release abnormal (min 1 char and max 64 chars)");
        }
    } else if (!strncmp(args, "SV ", 3)) {
        const char *new_version = args + 3;
        int len = strlen(new_version);

        if (len > 0 && len < 65) {
            strncpy(custom_version, new_version, sizeof(custom_version) - 1);
            custom_version[sizeof(custom_version) - 1] = '\0';
            modify_enabled = 1;
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "version set to: %s, modify enabled", custom_version);
            logkd("uname version updated to: %s\n", custom_version);
        } else {
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "error: version abnormal (min 1 char and max 64 chars)");
        }
    } else if (!strcmp(args, "EN")) {
        modify_enabled = 1;
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "enabled");
        logkd("enabled\n");
    } else if (!strcmp(args, "DIS")) {
        modify_enabled = 0;
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "disabled");
        logkd("disabled\n");
    } else {
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "Unknown command");
    }

    if (out_msg && outlen > 0 && reply_len > 0) {
        int copy_len = min(reply_len + 1, outlen);
        if (memcpy(out_msg, reply_msg, copy_len) <= 0) {
            logkd("failed to copy reply\n");
            return -1;
        }
    }
    return 0;
}

static void before_reboot(hook_fargs4_t *args, void *udata)
{
    int magic1 = (int)syscall_argn(args, 0);
    int magic2 = (int)syscall_argn(args, 1);
    unsigned int cmd = (unsigned int)syscall_argn(args, 2);
    void __user *arg = (void __user *)syscall_argn(args, 3);

    if (magic1 != SPOOFUNAME_MAGIC_NUMBER1 || magic2 != SPOOFUNAME_MAGIC_NUMBER2) return;

    args->skip_origin = 1;
    args->ret = 0;

    switch (cmd) {
        case 0:
            if (arg) {
                char status_msg[256];
                snprintf(status_msg, sizeof(status_msg),
                         "modify: %s\nrelease: %s\nversion: %s",
                         modify_enabled ? "enabled" : "disabled",
                         custom_release,
                         custom_version);
                compat_copy_to_user(arg, status_msg, strlen(status_msg) + 1);
                logkd("KPM status requested\n");
            }
            break;

        case 1:
            modify_enabled = 1;
            logkd("KPM enabled via reboot hook\n");
            break;

        case 2:
            modify_enabled = 0;
            logkd("KPM disabled via reboot hook\n");
            break;

        case 3:
            if (arg && !compat_strncpy_from_user(custom_release, (const char __user *)arg, sizeof(custom_release) - 1)) {
                custom_release[sizeof(custom_release) - 1] = '\0';
                modify_enabled = 1;
                logkd("release set to: %s via reboot hook\n", custom_release);
            }
            break;

        case 4:
            if (arg && !compat_strncpy_from_user(custom_version, (const char __user *)arg, sizeof(custom_version) - 1)) {
                custom_version[sizeof(custom_version) - 1] = '\0';
                modify_enabled = 1;
                logkd("version set to: %s via reboot hook\n", custom_version);
            }
            break;

        default:
            logkd("Unknown reboot hook command: %u\n", cmd);
            break;
    }
}

static void after_newuname(hook_fargs1_t *args, void *udata)
{
    uid_t uid = current_uid();
    long ret = args->ret;
    void __user *name = (void __user *)syscall_argn(args, 0);

    logkd("newuname returned: %ld for uid: %d, user buffer: 0x%lx\n", ret, uid, syscall_argn(args, 0));

    if (!name) {
        logkd("uname user buffer is NULL, skipping modification\n");
        return;
    }

    if (ret == 0 && modify_enabled) {
        if (custom_release[0] != '\0') {
            char release[65];

            if (compat_strncpy_from_user(release, (const char __user *)(name + 130), sizeof(release)) > 0) {
                logkd("original uname release: %s\n", release);
            }

            int cplen = compat_copy_to_user((void __user *)(name + 130), custom_release, strlen(custom_release) + 1);
            if (cplen > 0) {
                logkd("modified uname release to: %s\n", custom_release);
            } else {
                logkd("failed to modify uname release\n");
            }
        }

        if (custom_version[0] != '\0') {
            char version[65];

            if (compat_strncpy_from_user(version, (const char __user *)(name + 195), sizeof(version)) > 0) {
                logkd("original uname version: %s\n", version);
            }

            int cplen = compat_copy_to_user((void __user *)(name + 195), custom_version, strlen(custom_version) + 1);
            if (cplen > 0) {
                logkd("modified uname version to: %s\n", custom_version);
            } else {
                logkd("failed to modify uname version\n");
            }
        }
    }
}

static long inline_hook_demo_init(const char *args, const char *event, void *__user reserved)
{
    logkd("Spoof Uname init\n");

    hook_err_t err = inline_hook_syscalln(__NR_uname, 1, NULL, after_newuname, NULL);
    logkd("uname hook result: %d\n", err);

    if (err != 0) {
        logkd("Failed to hook uname syscall: %d\n", err);
        if (err == -4092 || err == -4094) {
            logkd("Hook already exists or relocation failed, trying to continue...\n");
            return 0;
        }
        return err;
    }

    err = inline_hook_syscalln(__NR_reboot, 4, before_reboot, NULL, NULL);
    logkd("reboot hook result: %d\n", err);

    if (err != 0) {
        logkd("Failed to hook reboot syscall: %d\n", err);
        if (err == -4092 || err == -4094) {
            logkd("Reboot hook already exists or relocation failed, trying to continue...\n");
            return 0;
        }
        return err;
    }

    return 0;
}

static long inline_hook_control0(const char *args, char *__user out_msg, int outlen)
{
    logkd("kpm control, args: %s\n", args ? args : "(null)");
    char buf[256];
    control(args, buf, outlen);
    if (out_msg && outlen > 0) {
        int copy_len = min(strlen(buf) + 1, outlen);
        if (compat_copy_to_user(out_msg, buf, copy_len) <= 0) {
            logkd("failed to copy control reply to user\n");
            return -1;
        }
    }
    return 0;
}

static long inline_hook_demo_exit(void *__user reserved)
{
    logkd("Spoof Uname exit\n");
    modify_enabled = 0;
    inline_unhook_syscalln(__NR_uname, NULL, after_newuname);
    inline_unhook_syscalln(__NR_reboot, before_reboot, NULL);

    return 0;
}

KPM_INIT(inline_hook_demo_init);
KPM_CTL0(inline_hook_control0);
KPM_EXIT(inline_hook_demo_exit);