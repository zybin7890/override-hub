# ClashParty-Override v3.3.0

Mihomo 覆写入口 `main(config, runtimeMode)`，适用于 Clash Party / Clash Verge Rev。JS 与 TXT 字节一致，UTF-8 / CRLF。

## 当前个人策略

- 自用 SG 节点统一连接 `104.234.177.140`，固定 `ip-version: ipv4`。不继续强制 SG IPv6，不添加中转。SG/JP/KR 节点名称以国旗开头（如 🇸🇬 SG 稳定、🇯🇵 JP、🇰🇷 KR），并同步改写引用。
- SG VLESS 与 HY2 使用 443，AnyTLS 使用 443 + `alpn: [anytls]`。服务端由 HAProxy 按 ALPN 分流到原 AnyTLS 后端，避免当前网络中不可达的 10443/TCP。
- JP VLESS、HY2 迁移到 `43.165.175.13`，保留订阅的 UUID/密码。VLESS 公钥及 HY2 证书 pin 更新为该主机的服务身份；HY2 使用 443/UDP，删除旧 `ports: 443,41000-41020`、跳端口周期及临时中转。JP AnyTLS 仅加国旗，保留原服务器。
- Google 一般流量与 `category-porn` 进入仅含自用 SG 三节点的 `SG出口`。此组缺少 SG 时使用 REJECT。`谷歌服务` 与 `av` 策略组也仅可选择 SG出口。
- YouTube 优先匹配到只含新 JP VLESS/HY2 的 `JP出口`，规则位于 Google 之前，避免被 Google 集合或谷歌服务组带到 SG。JP 节点没有 dialer-proxy，不经过 SG，也没有其他地区或 DIRECT 回退。
- `GPT`、`Gemini`、`Grok`、`Claude`、`muse` 各有独立的节点选择组。专用域名先于 Google 泛规则匹配。其余国外 AI 走 `节点选择`。

这些是作者指定的个人节点及出口策略，不是通用地区默认值。节点认证信息仍由用户的订阅提供；仓库没有 UUID、真实节点密码、私钥、订阅令牌或私人生成配置。代码中的端点公钥及证书指纹用于验证服务器身份，不是私钥。

## 保留的功能

国内和节点解析使用 AliDNS literal-IP DoH，经 DIRECT；海外 DNS 经 DNS代理。保留有效传输依赖并同步节点更名；缺失引用与循环会报错。保留自定义规则及未被新固定地区策略覆盖的例外、服务组、PikPak 分流及已有下载策略。

不固定用户物理网卡，不主动开启 TUN；现有端口、TUN、MTU 和客户端设置仍优先。SG 使用 IPv4 不等于关闭 Windows IPv6 或整台服务器 IPv6。字段含义参见 [Mihomo 通用字段](https://wiki.metacubex.one/config/proxies/)。

## 2026-11-01 实测

- 15/15 仓库回归测试通过，覆盖 SG IPv4、JP 两协议迁移、旧跳端口清理、国旗引用、固定 SG 分流及原有 DNS/依赖处理。
- 实际订阅合并前基线差异为空；候选通过 Mihomo v1.19.32 配置检查，并在原核心进程内热加载，HTTP 204。v3.2 为 7 节点、16 组、9,578 规则；v3.2.1 添加 JP出口 后为 7 节点、17 组、9,578 规则。
- Windows 物理接口实际请求：SG VLESS/HY2/AnyTLS 与新 JP VLESS/HY2 五个节点分别访问 `www.gstatic.com/generate_204`，全部 HTTP 204。独立测试实例在测试时绑定物理网卡以避免被正式 TUN 再次接管；此绑定没有写入发布脚本或正式配置。
- 正式内核的三个 SG 节点 delay API 均成功。真实 Google 与成人分类域名的 TLS 证书验证成功，控制器连接记录分别显示 `youtube` → JP出口 → 🇯🇵 JP 节点、`google`/`category-porn` → SG出口 → 🇸🇬 SG 节点，YouTube 链路没有 SG；未下载或展示成人页面内容。
- SG 订阅源的 YAML/JSON/URI/Base64 已同步地址、国旗与身份参数；Clash YAML/JSON 同步固定 SG 出口规则。
- 新 JP 仅部署所需 VLESS/HY2。系统防火墙允许 22/TCP、443/TCP、443/UDP，以及回环、已建立连接和必要 ICMP；独立新 SSH 连接验证成功。

原生 IPv6 恢复已经被用户后续“SG 使用 IPv4”要求取代，本版本不声称电脑原生 IPv6 已恢复。没有把失败的中间诊断、端口可连接或配置检查单独当作节点验收；未进行长期稳定性、带宽压测或旧 JP AnyTLS 验收。

## 使用与检查

导入 [JS 原始地址](https://raw.githubusercontent.com/zybin7890/override-hub/main/javascript/ClashParty-Override.js)，以本脚本替换此前完整覆写。不要同时叠加两个版本。GEOSITE 数据库需要包含上述分类；已用实际安装数据库验证。

```sh
node --check javascript/ClashParty-Override.js
node tests/ClashParty-Override.test.cjs
```
