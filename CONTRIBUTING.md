# 如何贡献 (Contributing Guide)

感谢您对 **PSP 汉化游戏档案库 (PSP Localization Archive)** 的关注！本档案库旨在结构化保存 PSP 时代民间汉化游戏的元数据。由于涉及的数据庞大且时间久远，我们非常需要社区的力量来共同完善。

在提交 Pull Request (PR) 或 Issue 之前，请仔细阅读以下指南。

---

## 🚀 贡献方向

您可以从以下几个方面参与贡献：

1. **补充游戏元数据**：添加缺失的游戏条目 (`game.yml`)，或补充官方原版信息 (`releases/Rxxxx.yml`)。
2. **完善汉化版本信息**：添加新的汉化版本 (`localizations/Lxxxx.yml`)，或者为已有的汉化版本补充缺失的技术指标、人员名单或发布贴链接。
3. **补充实体档案**：完善汉化组 (`entities/groups`) 或个人 (`entities/staff`) 的背景介绍、别名、代表作等信息。
4. **撰写幕后故事**：如果您是当年的亲历者，或者收集到了详细的考证资料，欢迎提交汉化幕后故事 (`localizations/Lxxxx_story.md`)。
5. **纠正错误**：修正现有档案中的错漏（如人员名字拼写、发布日期错误等）。

---

## 🛠️ 数据格式规范 (重要！)

本项目采用 YAML 格式存储数据，并且对字段的引用关系有严格的校验机制。

### 1. 必读技术规范
在新建或修改任何 `.yml` 文件之前，请**务必**阅读 [specification.md](./specification.md) 文档，了解每个层级（Game, Release, Localization, Entities）的数据模型与字段定义。

### 2. 引用完整性原则
如果您在 `localizations/Lxxxx.yml` 中引用了汉化组、人员或原版镜像，**必须确保被引用的 ID 在对应目录中存在**：
- `group_id: "GRP_ACG"` ➔ 必须存在 `entities/groups/GRP_ACG.yml`
- `staff: - id: "S1001"` ➔ 必须存在 `entities/staff/S1001.yml`
- `target_release: ["R5001"]` ➔ 必须存在 `content/games/.../releases/R5001.yml`

> ⚠️ 提示：项目配置了 GitHub Actions 进行自动化校验。如果不满足引用完整性，您的 PR 将无法通过测试。

### 3. 文件命名约定
- **游戏目录**：`G{6位数字}_{英文简写}` (例如: `G000101_Tenchu3`)
- **官方发行版**：`R{4位数字}_{区域或标识}.yml` (例如: `R5001_JP.yml`)
- **汉化版本**：`L{4位数字}_{汉化组或标识}.yml` (例如: `L9001_ACG.yml`)
- **汉化组**：`GRP_{英文或拼音大写}.yml` (例如: `GRP_ACG.yml`, `GRP_PUJIA.yml`)
- **个人档案**：`S{4位数字}_{拼音或英文小写}.yml` (例如: `S1001_nian_gao.yml`)

---

## 📝 提交流程

1. **Fork 本仓库** 到您的 GitHub 账号。
2. 克隆您 Fork 的仓库到本地：
   ```bash
   git clone https://github.com/您的用户名/PSPLocalizationArchive.git
   ```
3. 创建一个新的分支用于您的修改：
   ```bash
   git checkout -b add-xxx-localization
   ```
4. 进行您的数据补充或修改。
5. （推荐）在本地运行校验脚本以确保引用正确（需要 Python 3 环境）：
   ```bash
   pip install -r scripts/requirements.txt
   python scripts/validate_integrity.py
   ```
6. 提交您的修改，并推送到您的 GitHub 仓库：
   ```bash
   git commit -m "feat: add localization info for game xxx"
   git push origin add-xxx-localization
   ```
7. 在 GitHub 页面上发起一个 **Pull Request (PR)**，并在描述中简要说明您添加或修改的内容及其来源（如果是从论坛考古得来，建议附上参考链接）。

---

## ❓ 疑问与讨论

如果您在编辑过程中遇到不确定的字段（例如找不到某汉化组的 ID，或者不知道某个字段该如何填写），您可以通过以下方式寻求帮助：
1. 提交一个 **Issue** 提出您的疑问。
2. 在 PR 描述中注明您的不确定之处，维护者会在 Review 时与您讨论并协助修正。
3. 对于暂不确定的关联字段，可以使用 `null` 作为占位符，而不是随意编造一个不存在的 ID。

再次感谢您对保留这份数字历史所做出的贡献！