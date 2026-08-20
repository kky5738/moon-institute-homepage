<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# M Institute Homepage

이 프로젝트는 문선명 연구소 홈페이지 개발 프로젝트다.

## 목표
- 점진적으로 홈페이지를 발전시켜 나간다.
- 연구소 소개, 공지사항, 홍보자료, 문의 등의 기본적 구조를 확립한다.
- 기본적 구조를 확립한 다음에는 기존의 틀을 깨는 사용자 친화적인 UI/UX로 확장시킨다.
- 기존의 틀을 깨는 UI/UX로는 landing page에 Hero Section 등이 있다.
- 연구 주제 허브, 자료 해설 아카이브 등을 landing page에 추가하여 사용자 친화적 UI를 만든다. 자세한 내용은 docs/proposal.md에 연구 주제 허브 및 자료 해설 아카이브를 참조한다.

## Output style

The reader has ADHD. Shape every response so it can be acted on:

1. Lead with the answer or next action: command, path, or snippet first.
2. Number multi-step work; one bounded action per step.
3. End with one next action doable in under two minutes.
4. Finish the current issue before raising a new one.
5. Restate progress each turn ("step 3 of 5 done").
6. Give time estimates in concrete units, never "a bit".
7. After a change, show what now works.
8. Errors: state location, cause, and fix. No drama.
9. Cap lists at 5 items.
10. No preamble, no recaps, no closers.

Exceptions: explain fully when asked to explain. Confirm before destructive actions. After three failed fixes, stop and name the doubtful assumption. If the request is ambiguous, ask one short question.

## 기술 스택
- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- AWS 배포 예정

## 개발 원칙
- 코드는 재사용 및 유지보수가 용이하게 단순한 구조를 우선한다.
- 처음부터 과도한 커뮤니티 기능을 만들지 않는다.
- 게시글, 문의글, 참여 신청 데이터는 장기 보존을 전제로 설계한다.
- 관리자 기능은 최소 기능부터 구현한다.

## 초기 핵심 기능
- 메인 페이지
- 연구소 소개
- 홍보자료 게시판
- 공지사항
- 문의/참여 신청 폼
- 관리자 로그인
- 관리자 게시글 작성/수정/삭제

## 주의사항
- 인물, 역사, 사상 관련 설명은 사용자가 제공한 원문을 우선한다.
- 임의로 사실을 단정하지 않는다.
- 디자인은 공식적이고 차분한 연구소 느낌을 유지한다.

## 공식 개시 작업
- 공식 개시 준비 작업은 `docs/agent-work-plan.md`를 먼저 확인한다.
- `READY` 작업만 수행하고, `WAITING` 작업은 필요한 사용자 결정 또는 승인이 기록될 때까지 시작하지 않는다.
