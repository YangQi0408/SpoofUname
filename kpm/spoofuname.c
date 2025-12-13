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

static char custom_release[65] = "";
static char custom_version[65] = "";
static int modify_enabled = 0;

KPM_NAME("SpoofUname");
KPM_VERSION(MYKPM_VERSION);
KPM_LICENSE("GPL v2");
KPM_AUTHOR("YangQi0408");
KPM_DESCRIPTION("Spoof Uname Information");

static void before_newuname(hook_fargs1_t *args, void *udata)
{
    uid_t uid = current_uid();
    void __user *name __maybe_unused = (void __user *)syscall_argn(args, 0);
    
    logkd("newuname called by uid: %d, args[0]: 0x%lx\n", uid, syscall_argn(args, 0));
}

static void after_newuname(hook_fargs1_t *args, void *udata)
{
    uid_t uid = current_uid();
    long ret = args->ret;
    void __user *name = (void __user *)syscall_argn(args, 0);
    
    logkd("newuname returned: %ld for uid: %d, user buffer: 0x%lx\n", ret, uid, syscall_argn(args, 0));
    
    // 检查用户空间指针是否有效
    if (!name) {
        logkd("uname user buffer is NULL, skipping modification\n");
        return;
    }

    // 如果系统调用成功且启用了修改，才修改release和version信息
    if (ret == 0 && modify_enabled) {
        // 修改release信息
        if (custom_release[0] != '\0') {
            char release[65];
            
            // 尝试读取原始release信息
            if (compat_strncpy_from_user(release, (const char __user *)(name + 130), sizeof(release)) > 0) {
                logkd("original uname release: %s\n", release);
            }
            
            // 修改release信息为自定义内容
            int cplen = compat_copy_to_user((void __user *)(name + 130), custom_release, strlen(custom_release) + 1);
            if (cplen > 0) {
                logkd("modified uname release to: %s\n", custom_release);
            } else {
                logkd("failed to modify uname release\n");
            }
        }
        
        // 修改version信息
        if (custom_version[0] != '\0') {
            char version[65];
            
            // 尝试读取原始version信息
            if (compat_strncpy_from_user(version, (const char __user *)(name + 195), sizeof(version)) > 0) {
                logkd("original uname version: %s\n", version);
            }
            
            // 修改version信息为自定义内容
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
    
    hook_err_t err = inline_hook_syscalln(__NR_uname, 1, before_newuname, after_newuname, NULL);
    logkd("uname hook result: %d\n", err);
    
    if (err != 0) {
        logkd("Failed to hook uname syscall: %d\n", err);
        // 如果是重定位错误或重复错误，尝试继续
        if (err == -4092 || err == -4094) { // HOOK_BAD_RELO or HOOK_DUPLICATED
            logkd("Hook already exists or relocation failed, trying to continue...\n");
            return 0;
        }
        return err;
    }

    return 0;
}

static long inline_hook_control0(const char *args, char *__user out_msg, int outlen)
{
    logkd("kpm control, args: %s\n", args ? args : "(null)");
    
    char reply_msg[128];
    int reply_len = 0;
    
    if (!args || args[0] == '\0') {
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "modify: %s, release: %s, version: %s", 
                           modify_enabled ? "enabled" : "disabled", custom_release, custom_version);
    } else if (!strncmp(args, "SR ", 3)) {
        const char *new_release = args + 3;
        int len = strlen(new_release);
        
        if (len > 0 && len < 65) {
            strncpy(custom_release, new_release, sizeof(custom_release) - 1);
            custom_release[sizeof(custom_release) - 1] = '\0';
            modify_enabled = 1;
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "release set to: %s, modify enabled", custom_release);
            logkd("uname release updated to: %s, modify enabled\n", custom_release);
        } else {
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "error: release too long (max 64 chars)");
        }
    } else if (!strncmp(args, "SV ", 3)) {
        const char *new_version = args + 3;
        int len = strlen(new_version);
        
        if (len > 0 && len < 65) {
            strncpy(custom_version, new_version, sizeof(custom_version) - 1);
            custom_version[sizeof(custom_version) - 1] = '\0';
            modify_enabled = 1;
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "version set to: %s, modify enabled", custom_version);
            logkd("uname version updated to: %s, modify enabled\n", custom_version);
        } else {
            reply_len = snprintf(reply_msg, sizeof(reply_msg), "error: version too long (max 64 chars)");
        }
    } else if (!strcmp(args, "EN")) {
        modify_enabled = 1;
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "enabled");
        logkd("uname modify enabled\n");
    } else if (!strcmp(args, "DIS")) {
        modify_enabled = 0;
        reply_len = snprintf(reply_msg, sizeof(reply_msg), "disabled");
        logkd("uname modify disabled\n");
    } else {

        reply_len = snprintf(reply_msg, sizeof(reply_msg), "usage: SR <release> | SV <version> | EN | DIS");
    }
    
    if (out_msg && outlen > 0 && reply_len > 0) {
        int copy_len = min(reply_len + 1, outlen);
        if (compat_copy_to_user(out_msg, reply_msg, copy_len) <= 0) {
            logkd("failed to copy reply to user\n");
            return -1;
        }
    }
    
    return 0;
}

static long inline_hook_demo_exit(void *__user reserved)
{
    logkd("Spoof Uname exit\n");
    modify_enabled = 0;
    inline_unhook_syscalln(__NR_uname, before_newuname, after_newuname);
    
    return 0;
}

KPM_INIT(inline_hook_demo_init);
KPM_CTL0(inline_hook_control0);
KPM_EXIT(inline_hook_demo_exit);