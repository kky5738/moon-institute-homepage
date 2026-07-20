# M Institute Homepage

문선명 연구소의 공개 홈페이지와 단일 관리자 운영 화면을 제공하는 Next.js App Router 프로젝트다.

## 기술 스택

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- PostgreSQL, Prisma
- Auth.js Credentials 기반 관리자·연구자 인증

## 로컬 실행

Node.js 20.9 이상과 PostgreSQL이 필요하다.

```bash
npm install
cp .env.example .env
```

`.env`에 PostgreSQL 연결 정보와 `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`를 설정한다. 로컬 PostgreSQL은 Docker로 실행할 수 있다.

```bash
npm run docker:db:up
npm run db:setup
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 연다. `AUTH_URL`은 배포 플랫폼이 호스트를 추론하지 못할 때 설정하며, 로컬에서 필요하면 `http://localhost:3000`을 사용한다.

## 주요 경로

- 공개: `/`, `/topics`, `/materials`, `/notices`, `/contact`, `/signup`, `/login`
- 연구자 인증 필요: `/account`
- 관리자 인증 필요: `/admin`, `/admin/posts`, `/admin/inquiries`, `/admin/users`

관리자는 환경 변수의 단일 계정이며, 연구자는 이메일과 비밀번호로 가입한 뒤 관리자 승인을 받아 로그인한다. 소셜 로그인은 구현되어 있지 않다. 연구자 사용자 migration의 Production 적용은 별도 승인을 받아야 한다.

전체 경로는 `docs/sitemap.md`, 배포 후보별 준비 사항은 `docs/deployment-checklist.md`와 `docs/aws-plan.md`를 참고한다. 첫 공식 배포 환경은 아직 결정되지 않았다.

## 검증

```bash
npm run lint
npm run test:auth
npm run build
```
