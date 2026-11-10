# 첫 화면 콘텐츠 저장·업로드 (READY-60~64)

READY-63 공개 이미지 `/home-introduction/{콘텐츠 ID}/image`는 매 요청에서 현재 포인터를 확인하고 해당 업로드의 원본만 `private, no-store`로 제공한다. 적용 전·이전 적용본은 404이며 관리용 썸네일은 관리자 인증을 유지한다. 공개 페이지에 signed URL·Storage object path를 넣지 않는다. 업로드는 `unoptimized`, 기본 정적 import는 기존 최적화를 사용한다. `next.config.ts`의 localPatterns는 기존 정적 에셋 경로만 허용해 공개/관리 이미지의 최적화 캐시 우회를 막는다. 새 정적 이미지 디렉터리를 추가할 때는 이 허용 경로도 확인한다. 이미 방문자에게 전달된 사본의 회수는 보장하지 않는다.

1. **초기화:** 승인된 격리 PostgreSQL의 URL을 `DATABASE_URL`과 `DIRECT_URL`에 모두 지정한 셸에서 `npx prisma migrate deploy`를 실행한다. `20261110000000_add_home_introduction`은 저장소의 기존 이미지(`src/assets/home-introduction.jpeg`, 1507×1848, 1,351,980 bytes)와 원문 문구·대체 텍스트를 기본 콘텐츠로 보존하고 단일 설정 포인터를 생성한다. 기존 범용 seed는 실행하지 않는다. Prisma migration 이력에 따라 한 번만 적용되며 기존 콘텐츠를 덮어쓰지 않는다. 운영 적용은 별도 승인 대상이다.
2. **Storage:** 기존 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET`(기본 `research-files`) 설정을 사용한다. private bucket과 기존 파일 정책을 유지하고 `home-introduction/{서버 UUID}.{jpg|png|webp}`에 저장한다. 브라우저에는 기존 방식의 signed upload token과 publishable key만 전달한다. 업로드 발급은 기본 `upsert: false`여서 보관 원본을 덮어쓰지 않는다. bucket의 20MiB·JPEG/PNG/WebP 허용 설정은 실제 연결 환경에서 별도 확인한다.
3. **등록 순서:** `readHomeIntroductionFile(file)`로 파일 검사·표시 방향 기준 치수·미리보기 URL을 얻는다. URL은 선택 교체·화면 이탈 시 호출자가 `URL.revokeObjectURL`로 해제한다. `requestHomeIntroductionUpload({contentType, size, message, altText})` → 기존 Supabase 클라이언트의 `uploadToSignedUrl(path, token, file, {contentType})` → `confirmHomeIntroductionUpload(id)` 순으로 호출한다. 입력 안내는 `HOME_INTRODUCTION_GUIDANCE`를 사용한다. 문구·대체 텍스트는 일반 텍스트로 보존하며 출력 시 HTML로 해석하지 않는다. 서버는 관리자 세션과 발급 소유자를 확인하고 Storage 메타데이터·실제 바이트 수·시그니처·전체 디코딩·실제 치수를 검사한다. 클라이언트의 치수는 저장하지 않는다. EXIF 1~8을 반영하며 단일 정지 이미지, 각 변 20,000px·총 4천만 화소를 상한으로 한다. 이미 설치되고 브랜드 에셋 스크립트에서도 쓰는 Next.js 의존성 `sharp` 0.34.5를 사용했으며 새 패키지는 추가하지 않았다.
4. **실패·후속 연결:** 발급 대기는 `home_introduction_uploads`에, 검증 완료 묶음만 `home_introduction_contents`에 저장한다. 설정은 완료 묶음에만 FK로 연결되므로 대기 이미지는 적용 불가능하다. 완료·취소는 같은 업로드 행을 잠가 직렬 처리한다. 등록 실패 시 같은 시도의 미연결 object만 제거하고 완료 재요청은 같은 ID로 성공한다. 실패 후 다시 등록할 때는 새 발급을 요청한다. 취소에는 `cancelHomeIntroductionUpload(id)`를 사용한다. Storage 정리 실패 시 대기 행을 남겨 같은 취소를 재시도하고, 로그에는 기존 비밀값 비노출 로거를 사용한다. 브라우저 강제 종료 등으로 완료/취소가 호출되지 않은 대기 업로드는 자동 청소하지 않는다. 운영 청소가 필요하면 대기 행과 완료 콘텐츠 미연결 여부를 확인한 별도 절차가 필요하다. READY-61에서 `/admin/home-introduction`의 관리자 등록·PC/모바일 미리보기와 최근 등록 목록을 연결했다. READY-62에서 적용·보관 목록 페이지 나누기와 관리자 전용 썸네일을 연결했다. READY-63에서 현재 콘텐츠 조회와 공개 이미지 제공을 연결했다. 이번 단계의 등록만으로 홈페이지 포인터는 바뀌지 않는다.

검증은 `npm run test:home-introduction`으로 실행한다. 19개 테스트에 관리자 등록 후 갱신, 적용·캐시 재시도, 공개·관리 이미지 접근, 실제 디코딩, 임시 Docker PostgreSQL의 migration·저장·잠금·동시 적용·부분 업로드·실제 INSERT 실패 롤백·재연결 후 유지가 포함된다. 이 자동 테스트의 Storage는 메모리 대역이다. 기존 첨부 권한 회귀는 `npm run test:posts`와 `npm run test:posts:integration`으로 확인한다.

READY-64에서는 별도로 Chromium·로컬 production 서버·임시 PostgreSQL과 기존 `.env.staging`의 실제 private Storage를 연결했다. 운영과 다른 프로젝트임을 확인하고 이번 테스트에서 생성한 UUID object만 업로드·삭제했다. staging DB와 운영 DB에는 migration을 적용하지 않았다. staging bucket의 `public=false`, 파일 크기·MIME 제한 설정은 각각 `null`임을 확인했으며 정책은 변경하지 않았다. 애플리케이션의 20MiB·JPEG/PNG/WebP 검사는 유지한다. 실제 signed upload와 서버 다운로드, 적용·복원·재시작 유지, anonymous 직접 다운로드 차단을 확인했다.

실제 signed download URL은 정상 응답 200과 미조회 1초 URL의 만료 후 400을 확인했고, 같은 시점 앱의 현재 이미지 URL 재조회는 200이었다. 이미 조회한 signed URL은 Storage 캐시에서 계속 응답할 수 있으므로 만료를 배포 사본의 회수 수단으로 쓰지 않는다. 공개 렌더러는 signed URL을 저장하지 않으므로 만료 URL 갱신 로직이 필요하지 않다. 2시간짜리 signed upload ticket의 실시간 만료까지 기다리는 검증은 하지 않았다.

READY-62 적용·복원은 보관 목록의 `현재 화면에 적용`을 사용한다. `applyHomeIntroduction(id)`는 관리자 인증 후 완료 콘텐츠를 검사하고 단일 설정 행의 잠금 안에서 포인터·최종 적용 시각을 함께 저장한다. 같은 현재 ID의 재요청은 시각을 변경하지 않는다. 캐시 갱신 실패 시 `refreshHomeIntroductionCache()`로 갱신만 재시도하며 기존 ID를 다시 적용하지 않는다. READY-63의 공개 조회 캐시는 `HOME_INTRODUCTION_CACHE_TAG`(`home-introduction`)와 `minutes` 수명을 사용한다. 관리자 썸네일 경로는 인증 후 원본을 최대 256×192 WebP로 축소해 `private, no-store`로 제공한다. Next Image에는 `unoptimized`를 유지해 관리자 이미지가 공유 최적화 캐시에 들어가지 않게 한다. 공개 화면 반영과 새 방문/새로고침 후 교체는 READY-63의 격리 production 서버에서 확인했다. READY-64에서 전체 흐름과 실제 staging 연결을 확인했다. 등록 성공은 Server Action의 `refresh()`로 목록을 갱신하고 공개 캐시는 바꾸지 않는다. 적용 성공은 서버 `revalidatePath` 응답으로 갱신하며 클라이언트가 중복 `router.refresh()`를 호출하지 않는다. 캐시 오류 때는 현재 DB 상태를 다시 조회하고 캐시 갱신을 재시도한다.


## 운영 반영 순서

1. 운영 백업과 대상 연결·private bucket 설정을 확인한다. 아래 실행은 별도 운영 승인 후 배포 창에서 진행한다.
2. 승인된 운영 `DATABASE_URL`·`DIRECT_URL`로 `npx prisma migrate deploy`를 먼저 실행한다. 일반 `db:setup`·`db:seed`는 사용하지 않는다.
3. migration 성공 후 READY-60~64 코드가 포함된 main을 배포한다. 현재 단계에서 운영 DB만 미리 변경할 필요는 없다.
4. 관리자 등록(미공개) → 적용 → 비로그인 홈페이지 → 이전/기본 콘텐츠 복원과 보관본 접근 차단을 점검한다.
5. 코드 롤백이 필요하면 추가된 테이블·보관 파일을 삭제하지 않는다. 관리자에서 기본 콘텐츠로 복원한 뒤 이전 코드를 배포하며, 기존 첨부 정책과 데이터는 보존한다.
