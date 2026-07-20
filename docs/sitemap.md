# 문선명 연구소 홈페이지 사이트맵

현재 구현된 공개 페이지와 관리자 운영 경로를 정리한 최소 사이트맵이다.
연구 주제 허브와 자료 해설형 아카이브를 중심 탐색 경로로 둔다.

## 공개 페이지

- `/`: 홈. Hero rotation card와 연구 주제 허브에서 주제/자료 탐색으로 이동한다.
- `/topics`: 연구 주제 허브 목록.
- `/topics/[slug]`: 연구 주제 상세. 관련 공지, 관련 자료, 영상 안내, 문의 CTA를 연결한다.
- `/materials`: 자료 해설형 아카이브. 공개 홍보자료를 읽기 순서와 해설 요약으로 보여준다.
- `/materials/[slug]`: 자료 상세. 해설 요약, 읽기 포인트, 자료 본문, 관련 주제, 추천 자료 영역을 제공한다.
- `/notices`: 공지사항 목록. 기존 게시판형 탐색 경로로 유지한다.
- `/notices/[slug]`: 공지사항 상세.
- `/contact`: 문의/참여 신청 폼.
- `/signup`: 연구자 계정 가입 신청. 기본 상태는 승인 대기이다.
- `/login`: 관리자 아이디 또는 승인된 연구자 이메일 로그인.
- `/account`: 승인된 연구자의 계정 확인, 로그아웃, 회원 탈퇴.

## 관리자 페이지

`/admin` 아래의 모든 페이지는 로그인이 필요하다.

- `/admin`: 관리자 홈.
- `/admin/posts`: 관리자 게시글 목록.
- `/admin/posts/new`: 관리자 게시글 작성.
- `/admin/posts/[id]/edit`: 관리자 게시글 수정.
- `/admin/inquiries`: 관리자 문의/참여 신청 확인.
- `/admin/users`: 연구자 가입 신청 승인과 계정 비활성화.

## 운영 메모

- 주제 허브의 기본 문구와 연결 경로는 `src/lib/topics.ts`에서 관리한다.
- 자료 상세의 해설 요약, 읽기 포인트, 추천 자료, 관련 주제는 `src/lib/material-guides.ts`에서 관리한다.
- 추천 자료는 `src/lib/material-guides.ts`의 `recommendationSlugs`에 공개 자료 slug를 수동으로 적어 관리한다. 게시글 slug를 바꾸거나 자료를 비공개로 전환하면 추천 연결도 함께 확인한다.
- 공지와 홍보자료의 실제 게시글은 관리자 게시글 화면에서 관리한다.
- 관리자 로그인은 Auth.js Credentials와 `ADMIN_USERNAME`, `ADMIN_PASSWORD` 환경 변수로 구성한 단일 계정을 유지한다. 연구자는 DB 계정으로 로그인하며 승인 상태를 서버에서 확인한다. OAuth는 지원하지 않는다.
- 관리자 레이아웃이 모든 `/admin` 페이지의 `ADMIN` 역할을 확인하고, 게시글·문의·회원 Server Action도 역할을 다시 확인한다.
- 게시글 카테고리 slug가 주제 연결 기준이므로, seed 또는 운영 DB의 `Category.slug` 값을 변경할 때는 `src/lib/topics.ts`의 `categoryConnections`도 함께 확인한다.
- 인물, 역사, 사상 관련 설명은 공식 원문이 제공된 뒤 반영한다. 임시 문구는 안내 성격으로만 유지한다.

### 주제·자료 연결 점검 (2026-07-13)

| 주제 경로 | 공지 카테고리 | 자료 카테고리 | 입문 자료 slug | 다음 자료 slug |
| --- | --- | --- | --- | --- |
| `/topics/life` | `notice` | `life-materials` | `life-research-material-guide` | `words-research-material-guide` |
| `/topics/words` | `notice` | `words-materials` | `words-research-material-guide` | `achievements-research-material-guide` |
| `/topics/achievements` | `news` | `achievement-materials` | `achievements-research-material-guide` | `life-research-material-guide` |

- 위 카테고리와 자료 slug는 `prisma/seed.ts`의 공개 seed 데이터와 일치한다.
- `intro-materials`처럼 특정 주제에 속하지 않거나 카테고리가 없는 자료의 fallback은 `/topics`로 연결하며 자동 추천을 만들지 않는다.
- 추천 slug에 해당하는 공개 자료가 없으면 추천 목록은 빈 상태 안내를 표시하고 존재하지 않는 상세 링크를 만들지 않는다.

## 주요 QA 경로

- 데스크톱: `/`, `/topics`, `/topics/life`, `/topics/words`, `/topics/achievements`, `/materials`, `/materials/life-research-material-guide`
- 모바일: `/`, `/topics`, `/topics/life`, `/materials`, `/materials/life-research-material-guide`
