# 창립선언문 HTML 원본과 에셋

사용자 제공 `declaration (1).html`을 `founding-declaration.html`에 원본 바이트 그대로 보존했다. 원본은 참조용이며 웹에서 직접 실행하거나 런타임에 파싱하지 않는다.

- 원본 크기: 653,022바이트
- 원본 SHA-256: `d22f1127baf835c9b12295777127418d5905f70271f122823bbbbe372f58004b`
- 표시 본문: `src/components/home/FoundingManifestoSection.tsx`
- 전용 스타일: `src/components/home/FoundingManifestoSection.module.css`

내장 data URL에서 추출한 파일은 `public/founding-declaration/`에 있다. 원본 이미지의 고유 크기는 심볼 264×264, 워드마크 2856×848이다. 글꼴은 `serif-regular.woff`(400), `serif-bold.woff`(700)이며 원본의 `MSM Serif`, `Batang`, serif fallback을 선언문 범위에서 사용한다.

`npm run test:manifesto`로 원본 해시, 본문·제목·인용·날짜·서명·쪽수의 공백 정규화 대조, 에셋의 바이트 일치와 PDF 링크 보존을 검증한다. READY-59에서는 기존 PDF 3쪽을 렌더링·추출해 HTML과 별도로 대조했고, 공백·줄바꿈을 제외한 문구가 쪽별로 일치함을 확인했다. 원본 HTML의 PDF 관련 주석을 근거로 동일하다고 판단하지 않았다. 검증한 PDF의 SHA-256은 `a72c910bfd4925a1119a2061f35949a336c61b1d5b0b3c0cbb07b4c31af5caad`이며 같은 테스트에서 파일 해시를 검사한다. PDF를 교체할 때는 별도 문구 대조 후 기준 해시를 갱신한다.

READY-57에서 JSX·에셋 이식을, READY-58에서 900px 문서 폭·장 간격 제거·모바일 줄바꿈·짧은 진입 효과와 높이 변화 후 메뉴 재계산을 완료했다. 기존 PDF와 선언문 JPG는 유지한다. READY-59에서 PDF 대조·반응형/확대·대체 서체·키보드·메뉴 전환·PDF 새 탭/읽던 위치 보존을 검증했다. 실제 검증 방법과 미검증 환경은 [완료 이력](../agent-work-history-2026.md)의 READY-59를 참조한다.
