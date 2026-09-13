# PointDesk 点金台

私募实习生任务积分与数字权益兑换台。

用户注册 / 登录后，完成任务获得积分，用积分兑换数字商品，并查看余额、收支明细与兑换结果。积分与兑换记录全部落在 PostgreSQL。不接入真实资金。同一任务奖励不能重复领取；重复提交兑换请求不能重复扣分或发货。余额不足或商品发放失败时，可以正确处理并说明结果。

整体使用手册

适用电脑：Windows
项目文件夹（必须进到里面这一层，能看到 `package.json`）：

```text
C:\Users\24788\Desktop\星瀚资本\pointledger\pointledger
```

演示账号：

| 姓名 | 邮箱                                                     | 密码      |
| ---- | -------------------------------------------------------- | --------- |
| 林析 | intern@pointdesk.local                                   | intern123 |
| 周衡 | analyst@pointdesk.local                                  | intern123 |
| YOYO | 以你注册时填写的为准（库里曾是 intern@pointdesk.locall）    | 123456    |

两个网页入口若都指向同一 PostgreSQL，账本是共用的：

- 原版：http://localhost:3000
- 优化版：http://localhost:3010（若你另开了那份代码）

---

## 一、每次要用网页时怎么开

第一次安装 Node、PostgreSQL、`npm install`、建库、seed 已经做过。以后开机不要再跑 seed。

### 1. 打开 PowerShell 的正确位置

1. 用资源管理器进入上面的 `pointledger\pointledger` 文件夹
2. 确认能看到 `package.json`、`README.md`、`prisma`
3. 点击顶部地址栏，输入 `powershell`，回车

窗口开头应类似：

```text
PS C:\Users\24788\Desktop\星瀚资本\pointledger\pointledger-gsap>
```

如果在桌面或不带 `package.json` 的外层，先执行：

```powershell
cd $env:USERPROFILE\Desktop\星瀚资本\pointledger\pointledger
```

### 2. 在这个窗口输入

```powershell
npm run dev -- --port 3010
```

等到出现：

```text
Local: http://localhost:3010
Ready
```

这个窗口不要关。

### 3. 打开浏览器

地址栏输入：http://localhost:3010

若要用优化版，另开一份代码的文件夹，用对方说的端口（如 3010）。两边只要 `.env` 里的 `DATABASE_URL` 相同，数据就是同一本账。

### 4. 关掉以后再开

1. 再进同一个文件夹打开 PowerShell
2. 只运行 npm run dev -- --port 3010
3. 浏览器再打开 http://localhost:3010

不要再运行：

- `npm run db:seed`（会清空重写演示数据）
- `npx prisma db push`（表已经建好）

---

## 二、网页上怎么用（验收路径）

登录后顺序演示即可。

1. **任务**领一次积分，右上角分数增加。同一任务再点一次：提示已领取，分数不变。
2. **兑换**余额够的商品：成功，给出提取码，分数减少。点「用同一请求再提交一次」：提取码不变，分数不再减，兑换表不新增多一行。兑「合伙人 Office Hour」（120 分）：余额不足，不扣分。兑「限量内参」：发放失败，不扣分。
3. **账本**只出现真正加减分的记录。失败兑换不会出现在账本里。
4. **兑换结果**能看到 SUCCESS / REJECTED / FAILED，失败原因和提取码。
5. **退出**
   扔掉登录通行证。数据仍在数据库里，再登录分数还在。

---

## 三、打开 SQL 后台（每次这样启动）

1. 开始菜单搜索 **SQL Shell (psql)** 并打开
2. Server / Database / Port / Username 四项直接回车
3. 「用户 postgres 的口令」：输入安装 PostgreSQL 时设的密码（输入时不显示），回车
4. 看到 `postgres=#` 后，整段粘贴下面三行（把显示改成北京时间并进入点金台的库）：

```sql
\c pointledger
SET TIME ZONE 'Asia/Shanghai';
\dt
```

成功标志：

- 提示已连接到数据库 `pointledger`
- 提示时区已设置
- `\dt` 列出 `User` `Task` `TaskCompletion` `Product` `Redemption` `LedgerEntry`

之后这个窗口里查出的时间就是北京时间。
关掉 SQL Shell 后时区设置消失，下次打开要再执行一次 `SET TIME ZONE 'Asia/Shanghai';`。

和 MySQL 的差别：换库用 `\c` 不是 `USE`；大小写表名列名用 `"User"`、`"createdAt"`，不是反引号。退出输入 `\q`。

先查准确邮箱再筛人：

```sql
SELECT name, email, balance FROM "User";
```

---

## 四、常用查询（时区已按时区设置显示）

一次只复制一个小节，不要把整份手册一次性贴进 SQL Shell。

### 4.1 用户和余额

```sql
SELECT name, email, balance, "createdAt"
FROM "User"
ORDER BY "createdAt";
```

```sql
SELECT name, email, balance
FROM "User"
WHERE email = 'intern@pointdesk.local';
```

不要日常去查 `passwordHash`。

### 4.2 任务目录

```sql
SELECT slug, title, category, reward, "isActive"
FROM "Task"
ORDER BY "sortOrder";
```

### 4.3 谁领了哪个任务

一行 = 成功领奖一次。同一人同一任务只会有一行。

```sql
SELECT
  u.name,
  u.email,
  t.title AS task,
  c."pointsAwarded",
  c."createdAt"
FROM "TaskCompletion" c
JOIN "User" u ON u.id = c."userId"
JOIN "Task" t ON t.id = c."taskId"
ORDER BY c."createdAt" DESC;
```

```sql
SELECT
  u.name,
  t.title AS task,
  c."pointsAwarded",
  c."createdAt"
FROM "TaskCompletion" c
JOIN "User" u ON u.id = c."userId"
JOIN "Task" t ON t.id = c."taskId"
WHERE u.email = 'intern@pointdesk.local'
ORDER BY c."createdAt" DESC;
```

```sql
SELECT
  u.name,
  u.email,
  COUNT(*) AS tasks_claimed,
  SUM(c."pointsAwarded") AS total_earned
FROM "TaskCompletion" c
JOIN "User" u ON u.id = c."userId"
GROUP BY u.id, u.name, u.email
ORDER BY total_earned DESC;
```

### 4.4 商品目录

`kind = flaky` 是限量内参，兑换会失败且不扣分。

```sql
SELECT slug, title, cost, kind, "isActive"
FROM "Product"
ORDER BY "sortOrder";
```

### 4.5 谁兑了什么（最常用）

库里存的是 `userId` / `productId`，必须 JOIN 才能看到人名和商品名。

```sql
SELECT
  u.name,
  u.email,
  p.title AS product,
  r.status,
  r."pointsSpent",
  r."fulfillmentCode",
  r."failReason",
  r."idempotencyKey",
  r."createdAt"
FROM "Redemption" r
JOIN "User" u ON u.id = r."userId"
JOIN "Product" p ON p.id = r."productId"
ORDER BY r."createdAt" DESC;
```

```sql
SELECT
  u.name,
  p.title AS product,
  r.status,
  r."pointsSpent",
  r."fulfillmentCode",
  r."failReason",
  r."createdAt"
FROM "Redemption" r
JOIN "User" u ON u.id = r."userId"
JOIN "Product" p ON p.id = r."productId"
WHERE u.email = 'intern@pointdesk.local'
ORDER BY r."createdAt" DESC;
```

```sql
SELECT u.name, p.title AS product, r."pointsSpent", r."fulfillmentCode"
FROM "Redemption" r
JOIN "User" u ON u.id = r."userId"
JOIN "Product" p ON p.id = r."productId"
WHERE r.status = 'SUCCESS'
ORDER BY r."createdAt" DESC;
```

```sql
SELECT u.name, p.title AS product, r.status, r."failReason"
FROM "Redemption" r
JOIN "User" u ON u.id = r."userId"
JOIN "Product" p ON p.id = r."productId"
WHERE r.status IN ('REJECTED', 'FAILED')
ORDER BY r."createdAt" DESC;
```

状态含义：

- `SUCCESS`：扣分并发提取码
- `REJECTED`：余额不足，`pointsSpent = 0`
- `FAILED`：发放失败，`pointsSpent = 0`

同一 `idempotencyKey` 再提交不会新增多一行，也不会再扣分。

### 4.6 账本流水

只有余额真的变了才有记录。驳回和发放失败不进账本。

```sql
SELECT
  u.name,
  l.direction,
  l.amount,
  l."balanceAfter",
  l.note,
  l."createdAt"
FROM "LedgerEntry" l
JOIN "User" u ON u.id = l."userId"
ORDER BY l."createdAt" DESC
LIMIT 20;
```

```sql
SELECT
  l.direction,
  l.amount,
  l."balanceAfter",
  l.note,
  l."createdAt"
FROM "LedgerEntry" l
JOIN "User" u ON u.id = l."userId"
WHERE u.email = 'intern@pointdesk.local'
ORDER BY l."createdAt" DESC;
```

```sql
SELECT
  u.name,
  u.email,
  u.balance AS current_balance,
  COALESCE(SUM(CASE WHEN l.direction = 'CREDIT' THEN l.amount END), 0) AS total_in,
  COALESCE(SUM(CASE WHEN l.direction = 'DEBIT' THEN l.amount END), 0) AS total_out
FROM "User" u
LEFT JOIN "LedgerEntry" l ON l."userId" = u.id
GROUP BY u.id, u.name, u.email, u.balance
ORDER BY u.name;
```

对账：`total_in - total_out` 应等于 `current_balance`。
`CREDIT` 是领任务入账，`DEBIT` 是兑换扣分。

### 4.7 若没有先 SET 时区，可在单列上换算

```sql
("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Shanghai' AS created_bj
```

---

## 五、验收时建议一次跑的最短套装

先执行第三节的三行（切库 + 北京时间 + 列表），再分别跑：

```sql
SELECT name, email, balance FROM "User";
```

```sql
SELECT u.name, t.title, c."pointsAwarded", c."createdAt"
FROM "TaskCompletion" c
JOIN "User" u ON u.id = c."userId"
JOIN "Task" t ON t.id = c."taskId"
ORDER BY c."createdAt" DESC;
```

```sql
SELECT u.name, p.title, r.status, r."pointsSpent", r."fulfillmentCode", r."createdAt"
FROM "Redemption" r
JOIN "User" u ON u.id = r."userId"
JOIN "Product" p ON p.id = r."productId"
ORDER BY r."createdAt" DESC;
```

```sql
SELECT u.name, l.direction, l.amount, l."balanceAfter", l.note, l."createdAt"
FROM "LedgerEntry" l
JOIN "User" u ON u.id = l."userId"
ORDER BY l."createdAt" DESC
LIMIT 20;
```

---

## 六、系统里发生了什么（给老师讲的短版）

三层：浏览器页面 → Next.js 柜台（`npm run dev`）→ PostgreSQL 仓库。

- 任务不能领两次：`TaskCompletion(userId, taskId)` 唯一约束
- 兑换不能扣两次：`Redemption(userId, idempotencyKey)` 幂等
- 余额不足或发放失败：写兑换单但不改余额、不写账本
- 核心规则文件：`src/lib/points.ts`
- 表结构：`prisma/schema.prisma`

没有单独的「管理员看所有人」网页。看全库用本手册的 JOIN 查询，或分别登录两个账号。

---

## 七、不要做的事

- 不要在 SQL 里随手 `DELETE` / `UPDATE` / `DROP`
- 不要再跑 `npm run db:seed`
- 不要为了改时区去改已经存进库的时间
- `npm run dev` 的窗口关了，网页就打不开，数据库还在

---

## 八、第一次从零安装（已经做过可跳过）

1. 安装 Node.js LTS，重新打开终端，确认 `node -v`、`npm -v`
2. 安装 PostgreSQL（端口 5432），记住 postgres 密码；Stack Builder 取消即可
3. SQL Shell 里建库：

```sql
CREATE USER pointledger WITH PASSWORD 'pointledger_dev';
CREATE DATABASE pointledger OWNER pointledger;
GRANT ALL PRIVILEGES ON DATABASE pointledger TO pointledger;
\c pointledger
GRANT ALL ON SCHEMA public TO pointledger;
\q
```

4. 在项目文件夹 PowerShell：

```powershell
copy .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

`.env` 中的连接串应为：

```text
DATABASE_URL="postgresql://pointledger:pointledger_dev@localhost:5432/pointledger?schema=public"
```
