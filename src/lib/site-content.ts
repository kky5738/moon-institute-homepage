import homeIntroductionImage from "@/assets/home-introduction.jpeg";

export const homeIntroduction = {
  image: homeIntroductionImage,
  alt: "눈을 감고 생각에 잠긴 문선명 선생의 모습",
  message: "천지인참부모님을 자랑하고 사랑하자",
};

export const heroSlides = [
  {
    label: "생애 연구",
    title: "생애",
    summary:
      "생애와 관련된 자료, 공지, 해설 콘텐츠를 한 흐름 안에서 확인할 수 있도록 정리합니다.",
    date: "연구 주제 01",
    href: "/topics/life",
    ctaLabel: "생애 보기",
    background: "center / cover no-repeat url('/slide1.jpeg')",
  },
  {
    label: "말씀 연구",
    title: "말씀",
    summary:
      "말씀 자료와 해설, 공개 일정, 관련 공지를 함께 탐색할 수 있도록 연결합니다.",
    date: "연구 주제 02",
    href: "/topics/words",
    ctaLabel: "말씀 보기",
    background: "center / cover no-repeat url('/slide2.jpeg')",
  },
  {
    label: "업적 연구",
    title: "업적",
    summary:
      "업적과 활동 기록을 자료, 공지, 영상 안내와 함께 살펴볼 수 있도록 정리합니다.",
    date: "연구 주제 03",
    href: "/topics/achievements",
    ctaLabel: "업적 보기",
    background: "center / cover no-repeat url('/slide3.jpeg')",
  },
];
