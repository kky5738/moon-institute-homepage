# 창립선언문 HTML 원본과 에셋

사용자 제공 `declaration (1).html`을 `founding-declaration.html`에 원본 바이트 그대로 보존했다. 원본은 참조용이며 웹에서 직접 실행하거나 런타임에 파싱하지 않는다.

- 원본 크기: 653,022바이트
- 원본 SHA-256: `d22f1127baf835c9b12295777127418d5905f70271f122823bbbbe372f58004b`
- 표시 본문: `src/components/home/FoundingManifestoSection.tsx`
- 전용 스타일: `src/components/home/FoundingManifestoSection.module.css`

내장 data URL에서 추출한 파일은 `public/founding-declaration/`에 있다. 원본 이미지의 고유 크기는 심볼 264×264, 워드마크 2856×848이다. 글꼴은 `serif-regular.woff`(400), `serif-bold.woff`(700)이며 원본의 `MSM Serif`, `Batang`, serif fallback을 선언문 범위에서 사용한다.

`npm run test:manifesto`로 원본 해시, 본문·제목·인용·날짜·서명·쪽수의 공백 정규화 대조, 에셋의 바이트 일치와 PDF 링크 보존을 검증한다. PDF와 HTML의 문구 동일 여부는 이 대조에 포함하지 않으며 READY-59에서 별도로 확인한다. 원본 HTML의 PDF 관련 주석은 동일성의 증거로 취급하지 않는다.

READY-57은 JSX·에셋 이식 범위다. 기존 720px 래퍼·원본 장 간격과 홈 전환 배치의 후속 조정은 READY-58에서 진행한다. 기존 PDF와 선언문 JPG는 유지한다.
