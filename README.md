# LEGO Bridge

中韩乐高收藏跨境服务创业项目。参考浅灰背景、白色圆角商品卡与红橙强调色，支持桌面与手机。

## 本地运行

需要 Node.js 22 或以上，无需安装依赖。在本目录运行 `node server.mjs`（或 `npm start`），打开 http://127.0.0.1:4173 。

在线静态演示：https://a1141114a.github.io/LEGO-Bridge/ 。该地址不运行后台，不接收真实购买申请。

### 已实现

- 中文 / 韩语切换：首页、商城、详情、购物车、申请、关于与隐私页面。
- 超过 800 片的官方商品目录；按名称、编号、系列搜索，分类、报价、收藏及待核实目录筛选，价格与颗粒数排序。
- 商品详情、编号、颗粒数、建议年龄、三张商品图、中韩美国价格与来源链接。
- 购物车增删、每次申请 10 件上限、人民币 / 韩元小计；价格缺失时不可提交。
- 购买申请接口：服务器校验报价和数量、重新计算金额、保存申请、返回独立查询密钥。数量上限不代表库存，不收款或预留库存。
- 当前浏览器的申请查询，以及管理员读取、修改状态、删除测试申请。

## 管理后台与数据

启动前通过环境变量设置强随机 `ADMIN_TOKEN`（建议至少32随机字节）。未配置时管理接口关闭。浏览器进入 `#admin`，输入密钥。不要将密钥写入代码或提交 Git。

申请记录位于 `.data/`（已被 Git 忽略），可通过 `DATA_DIR` 指定持久化目录。**部署到支持 Node.js 且具备持久化磁盘的主机才能接收申请**。GitHub 存放源代码；GitHub Pages 只能展示 `dist/` 静态页面，无法运行申请接口，也不会假装提交成功。

公开托管需设置 `HOST=0.0.0.0`、`PORT` 和 `PUBLIC_ORIGIN=https://你的域名`，配置 HTTPS 反向代理，并保护持久化目录。此文件存储实现适合单进程原型；正式经营应替换为数据库，完善身份认证、反滥用、数据保留、隐私删除及备份。没有设置任何自动邮件发送功能。

## 官方目录与定价

2026-10-14 分页读取 LEGO 美国、韩国和中国公开商品目录并按产品编号去重。300 款超过 800 片的套装在美国或韩国销售目录中，其中 287 款可购买、13 款暂时缺货；80 款只存在中国资料目录中，单独标为在售待核实。中国资料目录没有公开售价和购买状态。目录是当日快照，不是实时库存或全世界各地区的完整在售目录。

`dist/products.js` 汇总 `dist/catalog/part-*.js`。美国参考价采用官网未折扣原价，韩国基准采用官网当日销售价；人民币平台价为 `round(美国原价 × 9 × 0.6)`，韩国平台价为 `round(韩国官网销售价 × 0.75)`。人民币基准并非核实的中国官方发售价，美元乘 9 是运营者指定的定价规则，不是汇率。缺失价格使用 `null`，不会补估价或显示成 0 元。

所有商品的本平台库存均未提供，使用 `stock: null`；单次申请上限是 10 件。正式报价需确认商品状态、库存、运费、税费及服务费。

商品图引用各套装官网图库的公开 CDN 地址，按编号和对应商品页匹配，主图和细节图分别记录。图片需联网，官网可能变更地址；公开可访问不代表已取得商业使用许可，正式经营应确认素材授权或使用自有实拍。每款保留中韩美官网来源链接及查询日期。客服联系方式尚未配置。

LEGO Bridge 为独立创业演示项目，与 LEGO 集团无隶属关系。LEGO、相关系列名称及图像属于各自权利人。

## 检查

`node --test tests/orders.test.mjs`（或 `npm test`）验证服务端拒绝非法数量、金额篡改无效、订单查询权限、管理员权限、状态更新与删除。测试在临时目录运行，结束后清理测试数据。

## 文件

- `dist/`：可直接托管的静态前端。
- `server.mjs`：无第三方依赖的 Node.js HTTP 与申请接口。
- `tests/`：接口与权限检查。
- `.data/`：运行时私有申请数据，不提交到公开仓库。

商品编辑暂通过 `dist/products.js` 完成，不含在线支付、会员系统、实时抓取、寄售、社区和价格走势图。

## Manual payment interface
The checkout dialog displays the merchant-provided WeChat and Alipay QR codes. KakaoPay and bank transfer remain unconfigured. UI copy is Chinese/Korean; QR artwork is displayed with CSS cropping and the original is available via a link. GitHub Pages generates an in-memory order draft only: it does not transmit contact/address data, create a server order, reserve stock, or confirm payment. With the Node order API running, the same dialog follows a successful saved purchase request. Confirm the final amount and shipping with the merchant before transferring funds.

