# 데이터 모델

현재 Prisma 스키마의 운영 모델을 요약한다. 실제 정의와 migration은 `prisma/schema.prisma`와 `prisma/migrations/`를 기준으로 한다.

- `Category`: 공지·홍보자료 분류와 slug를 관리한다.
- `Post`: 공지·홍보자료·회원 연구 글 본문과 공개 상태를 관리한다. 회원 연구 글은 작성자와 연결하며 공지·홍보자료는 카테고리를 사용할 수 있다.
- `Inquiry`: 일반 문의·참여 신청·후원 관심 내용과 처리 상태를 보존한다.
- `User`: 연구자 이름, 정규화된 고유 이메일, 비밀번호 해시, 역할, 승인 상태를 관리한다.

`User.role`은 현재 `RESEARCHER`만 허용하고 기본값으로 강제한다. 관리자는 DB 사용자가 아니라 환경 변수 기반 단일 계정이다. `User.status`는 `PENDING`, `APPROVED`, `DISABLED`이며 기본값은 `PENDING`이다. 비밀번호는 사용자별 salt를 적용한 scrypt 해시만 `passwordHash`에 저장한다.

회원 연구 글은 `Post.authorId`로 작성자와 연결한다. 탈퇴하면 임시저장 글은 삭제하고 공개 글은 작성자 연결을 제거한 채 보존한다. 소셜 로그인용 계정 연결 모델과 편집자 역할은 아직 없다. `20260720000000_add_researcher_users`와 `20260730000000_member_research_posts` migration의 Production 적용은 별도 승인이 필요하다.
