# PointDesk 点金台

私募实习生任务积分与数字权益兑换台。

用户注册 / 登录后，完成任务获得积分，用积分兑换数字商品，并查看余额、收支明细与兑换结果。积分与兑换记录全部落在 PostgreSQL。不接入真实资金。

## 技术栈

- Next.js 15（App Router）+ TypeScript
- PostgreSQL 16
- Prisma ORM
- JWT HttpOnly Cookie 会话（jose + bcryptjs）

## 本地启动

### 1. 准备数据库

任选一种。

**方式 A：Docker（推荐）**

```bash
docker compose up -d
```

**方式 B：本机 PostgreSQL**

```sql
CREATE USER pointledger WITH PASSWORD 'pointledger_dev';
CREATE DATABASE pointledger OWNER pointledger;
```

### 2. 安装与初始化

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

演示账号：

- 邮箱 `intern@pointdesk.local`
- 密码 `intern123`

也可直接注册新用户，初始积分为 0。

### 3. 验收建议路径（约 3 分钟）

1. 登录演示账号，进入「任务台」。
2. 领取「参加周一晨会测验」（20 分），再点一次，应提示不可重复领取。
3. 再领取「阅读本周投资备忘录」（30 分），余额 50。
4. 进入「兑换」，兑换「模拟项目 Tombstone 徽章」（25 分），应得到凭证。
5. 点击「用同一请求再提交一次」，应返回原结果，余额不再减少。
6. 兑换「合伙人 Office Hour 预约码」（120 分），应因余额不足驳回，不扣分。
7. 兑换「限量内参」，应发放失败，不扣分。
8. 在「账本」「兑换结果」核对上述记录。

可选自动化核对（需先启动 `npm run dev`）：

```bash
npm run demo:check
```

## 仓库说明

请将本目录推到自己的 GitHub Public Repo：

```bash
git init
git add .
git commit -m "feat: PointDesk points ledger and digital goods redemption"
git branch -M main
git remote add origin git@github.com:<your-name>/<repo>.git
git push -u origin main
```

不要提交 `.env`。`.env.example` 已纳入版本库。
