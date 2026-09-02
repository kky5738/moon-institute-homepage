# 데이터 모델

현재 Prisma 스키마의 운영 모델을 요약한다. 실제 정의와 migration은 `prisma/schema.prisma`와 `prisma/migrations/`를 기준으로 한다.

- `Category`: 공지·홍보자료 분류와 slug를 관리한다.
- `Post`: 공지·홍보자료·회원 연구 글 본문과 공개 상태를 관리한다. 회원 연구 글은 작성자와 연결하며 공지·홍보자료는 카테고리를 사용할 수 있다.
- `Inquiry`: 일반 문의·참여 신청·후원 관심 내용과 처리 상태를 보존한다.
- `LoginThrottle`: 로그인 계정·IP의 HMAC 식별자, 15분 시도 횟수와 잠금 만료 시각을 저장한다. 원문 아이디·이메일·IP는 저장하지 않는다.
- `User`: 연구자 이름, 정규화된 고유 이메일, Supabase Auth 연결 ID, 이메일 확인 시각, 세션 버전, 역할과 승인 상태를 관리한다.

`User.role`은 현재 `RESEARCHER`만 허용하고 기본값으로 강제한다. 관리자는 DB 사용자가 아니라 환경 변수 기반 단일 계정이다. `User.status`는 `PENDING`, `APPROVED`, `DISABLED`이며 기본값은 `PENDING`이다. 연구자 비밀번호와 이메일 소유 확인은 Supabase Auth가 담당하며 애플리케이션 DB에는 새 비밀번호 해시를 저장하지 않는다. `passwordHash`는 기존 계정 전환 기간에만 nullable 상태로 남기고 후속 migration에서 제거한다. 비밀번호 재설정이나 비활성화 때 `sessionVersion`을 올려 기존 Auth.js 연구자 세션을 무효화한다.

회원 연구 글은 `Post.authorId`로 작성자와 연결한다. 탈퇴하면 Supabase Auth 사용자와 애플리케이션 회원정보 및 임시저장 글을 삭제하고 공개 글은 작성자 연결을 제거한 채 보존한다. 소셜 로그인용 계정 연결 모델과 편집자 역할은 아직 없다. `20260831000000_add_supabase_auth`와 `20260902000000_add_login_throttles` migration의 Production 적용은 별도 승인이 필요하다.
