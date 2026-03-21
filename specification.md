这是一份整合了所有改进建议的 **PSP 汉化游戏档案库 (PSP Localization Archive)** 完整技术规范文档（v1.1 修订版）。本版本确立了从“底层物理镜像”到“上层人文叙事”，再到“跨项目逻辑继承”的全方位归档标准。

---

# PSP 汉化游戏档案库技术规范 (v1.1)

## 1. 核心设计理念
*   **物理归档**：以游戏为最小物理单位，保持资源文件夹的独立性与自洽性。
*   **逻辑解耦**：官方发行版 (Release)、民间汉化版 (Localization) 与 贡献实体 (Entities) 物理隔离，通过逻辑 ID 实现多维关联。
*   **版本演进**：支持“补丁继承”逻辑，清晰展现汉化版的进化谱系（如：基于 A 组文本，由 B 组修复）。
*   **技术精度**：通过 LBA (逻辑扇区地址) 与 修改标记 (Modified Flag) 精确还原镜像篡改轨迹。

---

## 2. 目录树结构 (Directory Structure)

```text
/content
  ├── games/                      # 游戏数据库
  │   └── G000101_Tenchu3/
  │       ├── game.yml            # [G层] 游戏本体元数据
  │       ├── releases/           # [R层] 官方发行版
  │       │   └── R5001_JP.yml
  │       └── localizations/      # [L层] 汉化版本
  │           ├── L9001_ACG.yml   # 汉化元数据 (含技术指标)
  │           ├── L9001_files.yml # 镜像文件系统 (LBA/Size/Modify Flag)
  │           └── L9001_story.md  # 汉化幕后故事
  └── entities/                   # 贡献实体库
      ├── groups/                 # 汉化组档案
      │   └── GRP001_ACG.yml
      └── staff/                  # 个人档案 (破解/翻译/美工等)
          └── S1001_A_Gao.yml
```

---

## 3. 数据模型定义 (Data Schemas)

### 3.1 游戏本体 (Game Layer - `game.yml`)
```yaml
id: G000101
titles:
  native: "天誅 3 Portable"
  zh_cn: "天诛3 携带版"
  en: "Tenchu 3"
developer: "FromSoftware"
genres: ["ACT", "Stealth"]
tags: ["Ninja", "Portable"]
external_links:             # 外部数据库关联
  vndb: "v1234"
  igdb: "5678"
  psptimes: "p12345"
description: "本作是PS2经典动作游戏《天诛3》在PSP上的移植版。"
```

### 3.2 官方发行版 (Release Layer - `releases/Rxxxx.yml`)
```yaml
id: R5001
game_id: G000101
catalog_id: "ULJS-00179"
region: "JP"
media: "UMD"                # UMD, Digital
titles: ""
version: "1.01"
size: 1105395712
release_date: 2009-02-12
hashes:
  sha1: "7110eda4d09e062aa5e4a390b0a572ac0d2c0220"
  crc32: ""
  md5: ""
```

### 3.3 汉化版本 (Localization Layer - `localizations/Lxxxx.yml`)
```yaml
id: L9001
parent_localization_id: null   # 【继承逻辑】若基于前人汉化，填入上级 ID
title: "天诛3 携带版 汉化修正版" # 汉化版本标题（用于前端展示/区分同游戏多汉化）
groups: ["GRP001"]             # 关联汉化组 ID（支持联合汉化）
staff:                         # 关联个人 ID 及其职责
  - id: "S1001"
    role: "Reverse Engineer"
  - id: "S1005"
    role: "Translator"
target_release: ["R5001"]      # 适用的原版 ID
lang: "zh-Hans"
version: "v1.1"
release_date: 2024-03-07

# --- 技术指标 (Technical Flags) ---
tech_stats:
  psn_base: false              # 是否基于数字版修改
  media_install_compatible: true # 是否支持官方“媒体安装”功能
  cheat_code_support: true     # 是否兼容原版金手指 (地址未偏移)
  font_requirement: "internal" # internal (内置字库), external (需外挂 PBP)
  emulator_only: true          # 仅模拟器可用
  
links:
  - label: "发布页面"
    url: "https://..."
```

字段说明补充：
- `title`：面向展示层的“版本标题/版本名”，用于区分同一游戏下多个汉化版本（例如“欧版补丁修正版”“Disc 2 字幕版”）。
- `title` 应保留能区分版本的关键信息（如 `UMD Disc 2`、`欧版/日版`、`修正版`、`字幕版`）。
- 兼容旧数据时可缺省；建议通过迁移脚本逐步补全。前端应优先使用 `title`，缺失时可从 `notes` 的“原始条目”中推导。

### 3.4 汉化技术档案 (Technical Archive - `localizations/Lxxxx_files.yml`)
记录镜像内部结构。不再记录每个文件的哈希，重点在于 **LBA 布局** 与 **变动标记**。
```yaml
lid: L9001
archive_info:
  filename: "Tenchu3_CN_ACG.iso"
  size: 891234567
  hashes:
    sha1: "f9e8d7c6..."        # 仅记录最终 ISO 的全路径哈希

# 镜像内部目录树
file_tree:
  - path: "/PSP_GAME/PARAM.SFO"
    lba: 256                   # 逻辑扇区地址
    size: 1320
    modified: true             # 标记该文件是否被汉化组改动
    mtime: 2024-03-07 12:00:00
  - path: "/PSP_GAME/USRDIR/data.bin"
    lba: 1024
    size: 50432111
    modified: true
    hashes: { sha1: "..." }    # 仅对 modified: true 的关键大文件记录哈希
  - path: "/PSP_GAME/USRDIR/movie.pmf"
    lba: 24576
    size: 10485760
    modified: false            # 原封不动的文件无需哈希，节省空间
```

---

## 4. 实体档案 (Entity Layer)

### 4.1 汉化组 (Groups - `entities/groups/GRPxxxx.yml`)
```yaml
id: GRP001
name: "ACG汉化组"
status: "inactive"             # active, inactive, merged
founded: 2007
description: "国内著名的汉化组织..."
website: "http://zt.tgbus.com/acg/"
archives:                      # 网页存档链接
  - label: "Wayback Machine"
    url: "https://web.archive.org/..."
```

### 4.2 个人档案 (Staff - `entities/staff/Sxxxx.yml`)
```yaml
id: S1001
name: "年糕小豆湯"
aliases: ["Azuki", "NG"]        # 常用马甲
roles: ["Programmer", "Translator"]
description: "活跃于 2000 年代后期的核心破解..."
```

---

## 5. 标准化参考 (Reference Standards)

| 类别 | 标准 | 示例 |
| :--- | :--- | :--- |
| **地区** | ISO 3166-1 alpha-2 | `JP`, `CN`, `US`, `HK` |
| **语言** | BCP 47 | `zh-Hans`, `zh-Hant`, `ja` |
| **职责** | 自定义枚举 | `Programmer`, `Translator`, `Graphic`, `Tester` |
| **介质** | 枚举 | `UMD`, `Digital` (PSN版) |

---

## 6. 技术实现建议

1.  **自动化扫描**：利用开源的 `pycdlib` 或 `iso-parser` 编写脚本，自动提取 ISO 的 LBA、文件大小和 mtime，通过与原版 ISO 对比自动生成 `modified: true` 标记。
2.  **演进树可视化**：前端 UI 利用 `parent_localization_id` 渲染出类似 Git 提交历史的版本演进图（如：扑家修正版 <- 官方汉化版）。
3.  **引用完整性校验**：
    *   `L9001.yml` 中的 `group_id` 必须在 `entities/groups/` 中存在。
    *   `L9001.yml` 中的 `staff.id` 必须在 `entities/staff/` 中存在。
    *   `L9001.yml` 中的 `target_release` 必须在当前游戏的 `releases/` 下存在。

---

## 7. 方案评价
本 1.1 版本规范通过 **LBA 级记录** 解决了汉化 ISO “黑盒化”的问题，通过 **Parent ID** 解决了汉化资源乱象中的代际关系问题，并赋予了参与汉化的**组和个人**以数字尊严（独立档案）。它不仅是一套存储规范，更是一套研究 PSP 汉化历史的学术级元数据框架。