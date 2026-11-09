import Image from "next/image";
import declarationStyles from "./FoundingManifestoSection.module.css";
import styles from "./HomeSectionTransitions.module.css";

export function FoundingManifestoSection() {
  return (
    <section id="founding-manifesto" tabIndex={-1} aria-label="문선명 연구소 창립선언문" className={styles.manifesto}>
      <div className={`${styles.enter} ${declarationStyles.wrapper}`}>
        <div className={declarationStyles.declaration}>
          <article className={declarationStyles.content}>
            <section className={declarationStyles.sheet} id="founding-purpose" aria-label="창립선언문 본문">
              <header className={declarationStyles.header}>
                <div className={declarationStyles.brand}><Image className={declarationStyles.emblem} src="/founding-declaration/emblem.png" alt="문선명연구소 심볼" width={55} height={55} /><span className={declarationStyles.brandName}>문선명 연구소</span></div>
                <h2 className={declarationStyles.title}>창립선언문</h2>
                <p className={declarationStyles.subtitle}>&lt;문선명 연구소 창립을 고(告)하며&gt;</p>
                <p className={declarationStyles.opening}>“참부모님을 자랑하고 사랑하자.”</p>
              </header>
              <div className={declarationStyles.prose}>
                <p>1996년의 연두표어가 오늘날 우리에게 새삼 엄중하게 다가온다. &quot;천지의 모든 영광의 가치를 총합한 실체적인 기준이 참부모입니다.&quot;(평화신경,251)라는 말씀이 우리에게 하나의 근본적인 물음을 던지고 있기 때문이다.</p>
                <blockquote><strong>&quot;우리는 참부모님을 얼마나 알고 있으며, 얼마나 자랑하고 사랑해 왔는가?&quot;</strong></blockquote>
                <p>이 물음 앞에서 새로운 결의를 다진다. 이제 우리의 힘으로 문선명 천지인참부모님의 생애, 말씀 그리고 업적을 세상 앞에 당당하게 드러내고자 한다. 여기에서 믿음에 의한 종교적 증언만으로는 세상 앞에 드러내는 데에 한계가 있다.</p>
                <p>이에 우리는 객관적인 사실에 근거하여, 합리적인 논증과 철저한 학문적 검증을 통해 체계적인 연구로 규명하고자 한다.</p>
                <blockquote><strong>&quot;과연 문선명 천지인참부모님에 대한 연구가 가능한 일인가?&quot;</strong></blockquote>
                <p>문선명 천지인참부모님의 삶과 활동이 종교, 인종, 국가의 경계를 넘어 전 세계와 인류를 향해 전개되었다면, 그에 대한 연구도 당연히 초종교적이고 초인종적이며 초국가적인 관점에서 이루어져야 한다.</p>
                <p>문선명 천지인참부모님을 이해하는 데에 있어 다양한 관점에서 논증하고 비판하고 검증할 수 있는 열린 연구의 장을 마련하고자 한다.</p>
                <p>문선명 천지인참부모님에 대한 연구를 객관적이고 체계적인 학문의 영역으로 발전시키는 일은 단기간에 완성될 수 없는 과업이다. 그 길이 어렵다 하더라도 &quot;어떻게 하면 가능하게 할 것인가?&quot;라는 창조적이고 긍정적인 태도로 우리가 할 수 있는 일부터 하나씩 도전해 나갈 것이다.</p>
                <div className={declarationStyles.missions}>
                  <p><strong>이에 우리는 문선명 연구소를 창립하고 다음과 같은 사명을 선언한다.</strong></p>
                  <p><strong>첫째, 우리는 문선명 천지인참부모님의 생애와 말씀, 업적을 객관적이고 체계적으로 연구한다.</strong></p>
                  <p><strong>둘째, 우리는 초종교적·초인종적·초국가적 관점에서 보편적인 학문적 연구를 지향한다.</strong></p>
                  <p><strong>셋째, 우리는 연구 성과를 체계화하고 축적하여 독립적인 학문적 토대를 구축한다.</strong></p>
                  <p><strong>넷째, 우리는 연구의 성과를 사회와 인류의 공동 자산으로 발전시킨다.</strong></p>
                </div>
                <p>우리는 확신한다. 진정한 사랑과 존경은 깊이 있는 이해를 통해 더욱 성숙하며, 진실을 향한 성실한 탐구로 그 가치를 더욱 분명하게 드러낼 수 있다는 것을.</p>
                <p>그 뜻을 이루기 위한 첫걸음으로 오늘 문선명연구소의 창립을 온 천주 앞에 삼가 고하는 바이다.</p>
              </div>
              <footer className={declarationStyles.signature}>
                <p><time dateTime="2026-10-17">천기 17년 천력 9월 7일 / 2026년 10월 17일</time></p>
                <p className={declarationStyles.signers}>문선명연구소 회원 일동</p>
                <Image className={declarationStyles.wordmark} src="/founding-declaration/wordmark.png" alt="문선명연구소 · MOON SUN MYUNG INSTITUTE" width={2856} height={848} />
              </footer>
            </section>
          </article>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a
            href="/founding-manifesto.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="창립선언문 원문 보기 (PDF, 새 탭)"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary-dark underline underline-offset-4 hover:text-foreground"
          >
            원문 보기
          </a>
        </div>
      </div>
    </section>
  );
}
