# Lin Lab 网站与成员资料维护

本分支交接实验室网站的视觉改版、成员资料整理与自助维护服务。接手请先阅读 [HANDOFF.md](HANDOFF.md)，其中包含完成范围、验证结果、已知限制和下一步操作。

## 获取交接分支

```sh
git clone --branch codex/lab-site-handoff-2026-11-12 --single-branch \
  https://github.com/hxu129/Julie-Lin-Lab.github.io.git lin-lab-site
cd lin-lab-site
```

## 本地查看网站

在仓库根目录运行以下命令，然后打开 `http://127.0.0.1:8000/`。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

网站采用 HTML、CSS 和 JavaScript，可直接进行静态预览。成员维护服务使用 Python 3.10 或更新版本及标准库，操作与配置方法见 [maintenance/README.md](maintenance/README.md)。

## 主要文件

| 入口 | 内容 |
| --- | --- |
| `index.html` | 英文首页 |
| `research.html`、`publication.html` | 研究内容与论文 |
| `people.html`、`people_zh.html` | 中英文成员、校友和合作者 |
| `profile.html` | 共用成员资料页 |
| `photography.html`、`contact.html` | 新闻与加入实验室 |
| `css/atlas.css`、`css/profile.css` | 网站样式 |
| `js/people-data.js` | 仓库中的公开资料快照 |
| `js/people-directory.js`、`js/member-profile.js` | 名录和个人页渲染 |
| `maintenance/` | 私有编辑器、接口、初始化工具和测试 |
| `design-review/DESIGN-SPEC.md` | 视觉迭代记录与素材来源约定 |

## 验证

```sh
python3 -m unittest discover -s maintenance -p 'test_server.py' -v
node --check maintenance/editor.js
node --check maintenance/seed_from_site.mjs
node --check js/people-directory.js
node --check js/member-profile.js
```

测试使用临时目录和示例人物。维护服务投入使用后，SQLite 保存最新资料，编辑器会生成网站所需的 `js/people-data.js`。迁移运行数据前请阅读交接文档中的资料维护说明。

## 发布状态

交接分支用于审阅和后续接手。正式发布由实验室确认内容、素材、权限和目标环境后安排。仓库中的操作说明供接手者参考。

## 协作说明

本轮代码与交接文档由 Codex 协助实现和整理，验证范围见 [HANDOFF.md](HANDOFF.md)。成员事实来自实验室提供的资料，素材使用范围与署名记录见设计文档。
