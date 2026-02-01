#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>
#include <sys/syscall.h>
#include <unistd.h>
#include <stdbool.h>

#define SPOOFUNAME_MAGIC_NUMBER1 0x53504F46
#define SPOOFUNAME_MAGIC_NUMBER2 857865690

void control(unsigned int cmd, char *buf)
{
    syscall(__NR_reboot, SPOOFUNAME_MAGIC_NUMBER1, SPOOFUNAME_MAGIC_NUMBER2, cmd, buf);
}

int main(int argc, char *argv[])
{
    bool action_flag = false;
    bool set_flag = false;

    char *release = NULL;
    char *version = NULL;
    char status_buf[256];

    if (getuid() != 0) {
        fprintf(stderr, "Error: This program must be run as root.\n");
        return 1;
    }

    int opt;
    int option_index = 0;

    static struct option long_opts[] = { { "set-release", required_argument, 0, 'r' },
                                         { "set-version", required_argument, 0, 'v' },
                                         { "disable", no_argument, 0, 'd' },
                                         { "enable", no_argument, 0, 'e' },
                                         { "status", no_argument, 0, 's' },
                                         { 0, 0, 0, 0 } };

    while ((opt = getopt_long(argc, argv, "r:v:des", long_opts, &option_index)) != -1) {
        switch (opt) {
        case 'r':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix --set-release with other options.\n");
                return 1;
            }
            if (release) {
                fprintf(stderr, "Error: --set-release specified multiple times.\n");
                return 1;
            }
            release = optarg;
            set_flag = true;
            break;

        case 'v':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix --set-version with other options.\n");
                return 1;
            }
            if (version) {
                fprintf(stderr, "Error: --set-version specified multiple times.\n");
                return 1;
            }
            version = optarg;
            set_flag = true;
            break;

        case 'd':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix -d with other options.\n");
                return 1;
            }
            action_flag = true;
            control(2, NULL);
            printf("status=disabled\n");
            return 0;
            break;

        case 'e':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix -e with other options.\n");
                return 1;
            }
            action_flag = true;
            control(1, NULL);
            printf("status=enabled\n");
            return 0;
            break;

        case 's':
            if (set_flag || action_flag) {
                fprintf(stderr, "Error: Cannot mix --status with other options.\n");
                return 1;
            }
            action_flag = true;
            control(0, status_buf);
            printf("%s", status_buf);
            return 0;
            break;

        default:
            fprintf(stderr, "Usage: %s (-d | -e | -s | --set-release VER | --set-version VER)\n", argv[0]);
            return 1;
        }
    }

    if (!action_flag && !set_flag) {
        fprintf(stderr, "Error: Must specify an option.\n");
        fprintf(stderr, "Usage: %s (-d | -e | -s | --set-release VER | --set-version VER)\n", argv[0]);
        return 1;
    }

    if (version) {
        control(4, version);
        printf("version=%s\n", version);
    }
    if (release) {
        control(3, release);
        printf("release=%s\n", release);
    }

    return 0;
}