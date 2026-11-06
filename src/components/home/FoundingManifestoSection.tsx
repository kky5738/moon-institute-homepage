import Image from "next/image";
import declarationStyles from "./FoundingManifestoSection.module.css";
import styles from "./HomeSectionTransitions.module.css";

export function FoundingManifestoSection() {
  return (
    <section id="founding-manifesto" tabIndex={-1} aria-label="문선명 연구소 창립선언문" className={styles.manifesto}>
      <div className={`${styles.enter} ${declarationStyles.wrapper}`}>
        <div className={declarationStyles.declaration}>
          <article className={declarationStyles.content}>
            <section className={declarationStyles.sheet} id="founding-purpose" aria-label="창립 취지">
              <header className={declarationStyles.header}>
                <div className={declarationStyles.brand}><Image className={declarationStyles.emblem} src="/founding-declaration/emblem.png" alt="문선명연구소 심볼" width={55} height={55} /><span className={declarationStyles.brandName} data-source="">문선명 연구소</span></div>
                <h2 className={declarationStyles.title} data-source="">창립선언문</h2>
                <p className={declarationStyles.subtitle} data-source="">&lt;문선명 연구소 창립을 고(告)하며&gt;</p>
                <p className={declarationStyles.opening} data-source="">“참부모님을 자랑하고 사랑하자.”</p>
              </header>
              <div className={declarationStyles.prose} data-source=""><p>1996년의 연두표어가 오늘날 우리에게 새삼 엄중하게 다가오는 것은 “천지의 모든 영광의 가치를 총합한 실체적인 기준이 참부모입니다.”(평화신경, 251)라는 말씀이 우리에게 하나의 근본적인 물음을 던지고 있기 때문이다.</p>
                <blockquote>“우리는 참부모님을 얼마나 알고 있으며, 얼마나 자랑하고 사랑해 왔는가?”</blockquote>
                <p>이 물음 앞에서 새로운 결의를 다진다. 이제 우리의 힘으로 문선명 천지인참부모님의 생애와 말씀, 업적을 세상 앞에 당당하게 드러내고자 한다. 그러나 그 방법은 단순히 종교적 믿음에 의지하여 주관적으로 증언하거나 이미 확립된 신앙적 결론을 되풀이하는 데 머물러서는 안 된다. 객관적인 사실과 사료에 근거하고, 합리적인 논증과 학문적 검증을 통해 그 역사적 의미와 말씀의 가치를 체계적으로 규명해야 한다.</p>
                <p>문선명 천지인참부모님의 생애와 말씀, 그리고 남기신 업적은 특정 종교나 신앙공동체의 관점에서만 이해되고 평가될 수 없다. 그의 삶과 활동이 종교와 인종, 국가의 경계를 넘어 세계와 인류를 향해 전개되었다면, 그에 대한 연구 또한 마땅히 초종교적이고 초인종적이며 초국가적인 관점에서 이루어져야 한다.</p>
                <p>우리는 문선명 천지인참부모님에 대한 이해가 특정한 신앙적 해석이나 제한된 관점에 머무르지 않고, 다양한 학문 분야와 말씀적 전통 속에서 폭넓게 탐구되어야 한다고 본다. 이를 위해 신앙적 확신과 학문적 검증의 영역을 구분하고, 어떠한 결론도 연구에 앞서 전제하지 않으며, 자료와 논증을 통해 검토하고 비판할 수 있는 열린 연구의 장을 마련하고자 한다.</p>
                <blockquote>“그것이 과연 가능한 일인가?”</blockquote>
                <p>이러한 현실적인 물음 앞에서 우리는 “어떻게 하면 가능하게 할 것인가?”라는 창조적이고 긍정적인 자세로 응답한다. 문선명 천지인참부모님의 생애와 말씀, 업적에 대한 연구를 객관적이고 체계적인 학문의 영역으로 발전시키는 일은 결코 단기간에 완성될 수 없는 과업이다. 그러나 그 길이 어렵다는 이유로 주저하지 않을 것이며, 지금 우리가 할 수 있는 일부터 시작하여 그 토대를 하나씩 구축해 나갈 것이다.</p></div>
              <div className={declarationStyles.pageNumber} aria-label="3장 중 1장">1 / 3</div>
            </section>
            <section className={declarationStyles.sheet} id="mission-statement" aria-label="네 가지 사명">
              <div className={declarationStyles.runningTitle}>문선명 연구소 창립선언문</div>
              <div className={declarationStyles.prose} data-source=""><p className={declarationStyles.lead}>이에 우리는 문선명연구소를 창립하고 다음과 같은 사명을 선언한다.</p>
                <section className={declarationStyles.mission}><h3>첫째, 우리는 문선명 천지인참부모님의 생애와 말씀, 업적을 객관적이고 체계적으로 연구한다.</h3><p>문헌과 사료를 수집·정리하고, 역사적 사실을 검증하며, 그 말씀 체계와 형성 과정을 학문적으로 규명한다. 연구의 모든 과정에서 자료의 신뢰성과 논증의 타당성을 중시하고, 학문적 비판과 검증에 열린 자세를 견지한다.</p></section>
                <section className={declarationStyles.mission}><h3>둘째, 우리는 초종교적·초인종적·초국가적 관점에서 보편적인 학문적 연구를 지향한다.</h3><p>특정 종교의 교리적 해석이나 신앙공동체 내부의 관점에 연구를 한정하지 않는다. 역사학, 철학, 종교학, 신학, 사회과학, 자연과학 등 다양한 학문 분야와의 교류를 통해 문선명 천지인참부모님의 생애와 말씀, 업적이 지닌 의미를 폭넓게 탐구한다.</p></section>
                <section className={declarationStyles.mission}><h3>셋째, 우리는 연구 성과를 체계화하고 축적하여 독립적인 학문적 토대를 구축한다.</h3><p>선행연구를 비판적으로 검토하고, 새로운 연구문제를 발굴하며, 개별연구와 공동연구를 지속적으로 수행한다. 이를 바탕으로 학술논문과 도서 및 연구총서 등의 발간, 학술세미나와 강연회 개최, 사료의 보존과 공개 등을 추진하여 후속 연구를 위한 기반을 마련한다.</p></section>
                <section className={declarationStyles.mission}><h3>넷째, 우리는 연구의 성과를 사회와 인류의 공동 자산으로 발전시킨다.</h3><p>연구 성과를 특정 집단의 전유물로 삼지 않고, 누구나 자유롭게 탐구하고 토론할 수 있는 학문적 자산으로 축적하고 공유한다. 국내외 연구자 및 학술기관과 교류하며, 문선명 천지인참부모님의 생애와 말씀, 업적에 관한 연구가 인류의 역사와 종교, 평화와 공존을 이해하는 데 기여하도록 노력한다.</p></section>
                <p>사람들은 사회의 발전과 공동의 가치를 실현하기 위해 뜻을 함께하는 이들과 자발적으로 모여 자신의 시간과 재원을 기꺼이 내어놓고 있다. 하물며 천지인참부모님으로부터 지극한 사랑과 귀한 생명의 가르침을 받아온 우리는 제자로서, 자녀로서 그 뜻이 지닌 의미와 가치를 인류 앞에 밝히는 일에 책임을 다해야 한다.</p></div>
              <div className={declarationStyles.pageNumber} aria-label="3장 중 2장">2 / 3</div>
            </section>
            <section className={declarationStyles.sheet} id="founding-resolution" aria-label="가르침과 결의">
              <div className={declarationStyles.runningTitle}>문선명 연구소 창립선언문</div>
              <div className={declarationStyles.prose} data-source=""><blockquote>“자동적(自動的)인, 자진적(自進的)인, 자성적(自成的)인 자가 되자.”(뜻길, 86-87)</blockquote>
                <blockquote>“부모가 하라고 해서 하면 효자가 아니예요. 부모님이 뭘 원하시는지 미리 알아가지고 해버리는 거예요.”(선집 353권, 123)</blockquote>
                <p>우리는 이 가르침을 마음에 새기며, 누군가의 지시나 요구에 의해서가 아니라 스스로의 자각과 책임으로 이 길에 나선다. 문선명 천지인참부모님을 향한 사랑과 존경을 학문적 탐구와 실천으로 발전시키고, 그 결실을 세상과 나누는 일을 우리의 사명으로 삼는다.</p>
                <p>오늘 우리는 ‘하늘이 편안한 곳’ 천안에서 그 첫발을 내딛는다.</p>
                <p>문선명연구소의 창립은 하나의 단체를 설립하는 데 그치지 않는다. 이는 문선명 천지인참부모님의 생애와 말씀, 업적에 관한 연구를 지속 가능하고 체계적인 학문적 활동으로 정립하기 위한 출발이며, 후대에 계승할 수 있는 지적·학술적 토대를 세우겠다는 공동의 선언이다.</p>
                <p>우리는 작은 시작에 머무르지 않을 것이다. 연구의 전문성과 조직적 기반을 확립하고, 연구를 위한 모임의 규모를 확대 발전시켜나가며, 국내외 학술 교류와 공동연구를 통해 그 활동의 범위를 세계로 넓혀 나갈 것이다.</p>
                <p>우리는 확신한다. 진정한 사랑과 존경은 깊이 있는 이해를 통해 더욱 성숙하며, 진실을 향한 성실한 탐구는 그 가치를 더욱 분명하게 드러낼 수 있다는 것을.</p>
                <p>이에 우리는 문선명 천지인참부모님의 생애와 말씀, 업적을 객관적으로 연구하고 체계화하여 학문으로 정립하는 역사적 과업을 우리의 사명으로 받아들인다.</p>
                <p>그 뜻을 이루기 위한 첫걸음으로 오늘 문선명연구소의 창립을 온 천주 앞에 삼가 고하는 바이다.</p></div>
              <footer className={declarationStyles.signature}>
                <p data-source=""><time dateTime="2026-10-17">천기 17년 천력 9월 7일 / 2026년 10월 17일</time></p>
                <p className={declarationStyles.signers} data-source="">문선명연구소 회원 일동</p>
                <Image className={declarationStyles.wordmark} src="/founding-declaration/wordmark.png" alt="문선명연구소 · MOON SUN MYUNG INSTITUTE" width={2856} height={848} />
              </footer>
              <div className={declarationStyles.pageNumber} aria-label="3장 중 3장">3 / 3</div>
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
