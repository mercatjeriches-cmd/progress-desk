# 进度桌面

一个简体中文 Windows 桌面应用，用于逐节记录学习或论文任务。每个任务可设为 3、4 或 5 节，关键词可以选预设，也可以自行填写。

## 使用方式

双击随附的 Windows x64 EXE。程序默认打开置顶小窗，拖动标题栏即可挪动位置。「展开管理」用于切换、新建和编辑任务，「收起小窗」可回到紧凑视图。退出后再次双击 EXE 即可重新显示小窗。点击「新建任务」填写名称、节数和关键词。用「完成当前项」推进，误点后可撤销最近一次完成。重置需要确认。在「展开管理」里可选择浅蓝、浅红或浅黄进度条，颜色会自动保存。可以切换任务，编辑名称和关键词时保留进度。

应用使用 Windows WebView2。任务保存在当前 Windows 用户的 WebView2 本地存储中，关闭软件后自动恢复。清除该应用的 WebView2 数据会删除任务。软件运行时无需联网。

## 源码与构建

- `frontend/` 包含界面、样式和任务逻辑，使用原生 HTML、CSS 和 JavaScript。
- `src-tauri/` 包含 Rust 桌面入口和 Tauri 配置。

Windows 构建需要 Rust MSVC 工具链、Visual Studio 的 C++ 桌面开发工具和 WebView2。参考 [Tauri Windows 环境要求](https://v2.tauri.app/start/prerequisites/)。

在项目根目录执行：

```powershell
cargo build --locked --release --features custom-protocol --manifest-path src-tauri/Cargo.toml
```

生成的程序位于 `src-tauri/target/release/progress-desk.exe`。



