#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>

#include "supercall.h"

char *concat(const char *s1, const char *s2)
{
    if (!s1 || !s2) return NULL;
    size_t len1 = strlen(s1);
    size_t len2 = strlen(s2);
    char *out = malloc(len1 + len2 + 1);
    if (!out) return NULL;
    memcpy(out, s1, len1);
    memcpy(out + len1, s2, len2 + 1);
    return out;
}

int main(int argc, char *argv[])
{
    bool superkey_flag = 0;
    bool action_flag  = false;
    bool set_flag     = false;

    char *superkey = NULL;
    char *release = NULL;
    char *version = NULL;
    char buf[256];

    int opt;
    int option_index = 0;
    int parsed_count = 0;

    static struct option long_opts[] = {
        {"superkey",       required_argument, 0, 's'},
        {"set-release",    required_argument, 0, 'r'},
        {"set-version",    required_argument, 0, 'v'},
        {"disable",        no_argument,       0, 'd'},
        {"enable",         no_argument,       0, 'e'},
        {"get-kpm-status", no_argument,       0, 'k'},
        {0, 0, 0, 0}
    };

    while ((opt = getopt_long(argc, argv, "s:r:v:dek", long_opts, &option_index)) != -1) {
        parsed_count++;
        switch (opt) {
        case 's':
            if (superkey_flag) {
                fprintf(stderr, "Error: --superkey specified multiple times.\n");
                return 1;
            }
            superkey_flag = 1;
            superkey      = optarg;
            break;

        case 'r':
            if (set_flag) {
                fprintf(stderr, "Error: Cannot mix --set-release/-set-version with -d/-e.\n");
                return 1;
            }
            if (release) {
                fprintf(stderr, "Error: --set-release specified multiple times.\n");
                return 1;
            }
            release  = optarg;
            set_flag = true;
            break;

        case 'v':
            if (set_flag) {
                fprintf(stderr, "Error: Cannot mix --set-release/-set-version with -d/-e.\n");
                return 1;
            }
            if (version) {
                fprintf(stderr, "Error: --set-version specified multiple times.\n");
                return 1;
            }
            version  = optarg;
            set_flag = true;
            break;

        case 'd':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix -d/-e with --set-release/--set-version or duplicate.\n");
                return 1;
            }
            if (!superkey_flag) {
                fprintf(stderr, "Error: -d/-e must be specified after --superkey.\n");
                return 1;
            }
            action_flag = true;
            sc_kpm_control(superkey, "SpoofUname", "DIS", buf, sizeof(buf));
            printf("Control result: %s\n", buf);
            return 0;
            break;

        case 'e':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix -d/-e with --set-release/--set-version or duplicate.\n");
                return 1;
            }
            if (!superkey_flag) {
                fprintf(stderr, "Error: -d/-e must be specified after --superkey.\n");
                return 1;
            }
            action_flag = true;
            sc_kpm_control(superkey, "SpoofUname", "EN", buf, sizeof(buf));
            printf("Control result: %s\n", buf);
            return 0;
            break;

        case 'k':
            if (!superkey_flag) {
                fprintf(stderr, "Error: --get-kpm-status must be specified after --superkey.\n");
                return 1;
            }
            sc_kpm_control(superkey, "SpoofUname", "STATUS", buf, sizeof(buf));
            
            // 直接输出KPM的原始状态信息
            printf("%s", buf);
            return 0;
            break;

        default:
            fprintf(stderr, "Usage: %s --superkey KEY "
                            "((-d | -e) | (--set-release VER | --set-version VER) | -k)\n", argv[0]);
            return 1;
        }
    }

    if (parsed_count < 1 || !superkey_flag) {
        fprintf(stderr, "Error: --superkey must be specified first.\n");
        return 1;
    }
    if (!action_flag && !set_flag) {
        fprintf(stderr, "Error: Must specify either (-d/-e), (--set-release/--set-version), or -k.\n");
        return 1;
    }

    // 检查是否第一个选项是 --superkey
    if (parsed_count < 1 || !superkey_flag) {
        fprintf(stderr, "Error: --superkey must be specified first.\n");
        fprintf(stderr, "Usage: %s --superkey KEY ((-d | -e) | (--set-release VER | --set-version VER) | -k)\n", argv[0]);
        return 1;
    }

    // 检查是否指定了 set-release 或 set-version，或者是 -k 选项
    if (!release && !version && !action_flag) {
        fprintf(stderr, "Error: Must specify either (-d/-e), (--set-release/--set-version), or -k after --superkey.\n");
        fprintf(stderr, "Usage: %s --superkey KEY ((-d | -e) | (--set-release VER | --set-version VER) | -k)\n", argv[0]);
        return 1;
    }

    if (version) {
        sc_kpm_control(superkey, "SpoofUname", concat("SV ", version), buf, sizeof(buf));
    }
    if (release) {
        sc_kpm_control(superkey, "SpoofUname", concat("SR ", release), buf, sizeof(buf));
    }
    
    printf("Control result: %s\n", buf);
    return 0;
}