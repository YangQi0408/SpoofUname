#ifndef SPOOFUNAME_COMMON_H
#define SPOOFUNAME_COMMON_H

#define SPOOFUNAME_MAGIC_NUMBER1 0x53504F46
#define SPOOFUNAME_MAGIC_NUMBER2 857865690

#define SPOOFUNAME_CMD_GET_STATUS 0
#define SPOOFUNAME_CMD_ENABLE 1
#define SPOOFUNAME_CMD_DISABLE 2
#define SPOOFUNAME_CMD_SET_RELEASE 3
#define SPOOFUNAME_CMD_SET_VERSION 4

#define SPOOFUNAME_MAX_LENGTH 64

/* struct new_utsname 每个字段为 __NEW_UTS_LEN + 1 = 65 字节。
 * KernelPatch 未导出该结构体定义，故在此派生偏移量。
 * 字段顺序: sysname[0], nodename[1], release[2], version[3], machine[4] */
#define UTS_FIELD_LEN 65
#define UTS_RELEASE_OFFSET (UTS_FIELD_LEN * 2) /* 130 */
#define UTS_VERSION_OFFSET (UTS_FIELD_LEN * 3) /* 195 */

#endif