# 문선명 연구소 홈페이지 사이트맵 초안

Sprint 4 기준 공개 페이지와 관리자 운영 경로를 정리한 최소 사이트맵이다.
연구 주제 허브와 자료 해설형 아카이브를 중심 탐색 경로로 둔다.

## 공개 페이지

- `/`: 홈. 첫 진입 CTA는 연구 주제 허브와 자료 아카이브를 우선한다.
- `/about`: 연구소 소개.
- `/topics`: 연구 주제 허브 목록.
- `/topics/[slug]`: 연구 주제 상세. 관련 공지, 관련 자료, 영상 안내, 문의 CTA를 연결한다.
- `/materials`: 자료 해설형 아카이브. 공개 홍보자료를 읽기 순서와 해설 요약으로 보여준다.
- `/materials/[slug]`: 자료 상세. 해설 요약, 읽기 포인트, 자료 본문, 관련 주제, 추천 자료 영역을 제공한다.
- `/notices`: 공지사항 목록. 기존 게시판형 탐색 경로로 유지한다.
- `/notices/[slug]`: 공지사항 상세.
- `/contact`: 문의/참여 신청 폼.
- `/login`: 관리자 로그인.

## 관리자 페이지

- `/admin`: 관리자 홈.
- `/admin/posts`: 관리자 게시글 목록.
- `/admin/posts/new`: 관리자 게시글 작성.
- `/admin/posts/[id]/edit`: 관리자 게시글 수정.
- `/admin/inquiries`: 관리자 문의/참여 신청 확인.

## 운영 메모

- 주제 허브의 기본 문구와 연결 경로는 `src/lib/topics.ts`에서 관리한다.
- 자료 상세의 해설 요약, 읽기 포인트, 추천 자료, 관련 주제는 `src/lib/material-guides.ts`에서 관리한다.
- 공지와 홍보자료의 실제 게시글은 관리자 게시글 화면에서 관리한다.
- 게시글 카테고리 slug가 주제 연결 기준이므로, seed 또는 운영 DB의 `Category.slug` 값을 변경할 때는 `src/lib/topics.ts`의 `categoryConnections`도 함께 확인한다.
- 인물, 역사, 사상 관련 설명은 공식 원문이 제공된 뒤 반영한다. 임시 문구는 안내 성격으로만 유지한다.

## Sprint 4 QA 대상

- 데스크톱: `/`, `/topics`, `/topics/pre-launch-archive`, `/materials`, `/materials/institute-introduction-material`
- 모바일: `/`, `/topics`, `/materials`, `/materials/institute-introduction-material`
