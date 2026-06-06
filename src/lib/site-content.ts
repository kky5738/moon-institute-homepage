export const featuredNewsItems = [
  {
    label: "주요 안내",
    title: "출범 준비 홈페이지 운영 안내",
    description:
      "출범 전까지 공지, 홍보자료, 문의 접수를 중심으로 운영하며 공개 자료를 순차적으로 정리합니다.",
    date: "2026.05",
    href: "/notices",
  },
  {
    label: "월간 소식",
    title: "월간 운영 기록 준비",
    description:
      "매월 주요 공지, 자료 공개, 참여 신청 흐름을 짧은 기록으로 묶어 방문자가 쉽게 확인하도록 준비합니다.",
    date: "준비 중",
    href: "/notices",
  },
  {
    label: "자료 공유",
    title: "초기 홍보자료 정리",
    description:
      "소개 자료와 안내 문서를 게시판 기준에 맞춰 보존하고 이후 공식 자료실로 이어지게 구성합니다.",
    date: "상시",
    href: "/materials",
  },
];

export const heroSlides = [
  {
    label: "주요 안내",
    title: "출범 준비 홈페이지 운영 안내",
    summary:
      "출범 전까지 공지, 홍보자료, 문의 접수를 중심으로 운영하며 공개 자료를 순차적으로 정리합니다.",
    date: "2026.05",
    href: "/notices",
    ctaLabel: "공지 확인",
    background: "center / cover no-repeat url('/slide1.jpeg')",
  },
  {
    label: "월간 소식",
    title: "월간 운영 기록 준비",
    summary:
      "매월 주요 공지와 자료 공개 흐름을 정리해 연구소의 준비 과정을 한눈에 볼 수 있도록 준비합니다.",
    date: "준비 중",
    href: "/notices",
    ctaLabel: "소식 보기",
    background: "center / cover no-repeat url('/slide2.jpeg')",
  },
  {
    label: "자료 공유",
    title: "초기 홍보자료 정리",
    summary:
      "소개 자료와 안내 문서를 게시판 기준에 맞춰 보존하고 이후 공식 자료실로 이어지게 구성합니다.",
    date: "상시",
    href: "/materials",
    ctaLabel: "자료 보기",
    background: "center / cover no-repeat url('/slide3.jpeg')",
  },
];

export const monthlyNewsItems = [
  {
    value: "7개월",
    label: "출범 전 홍보 운영",
  },
  {
    value: "3개",
    label: "공지, 자료, 문의 핵심 경로",
  },
  {
    value: "장기",
    label: "게시글과 신청 기록 보존",
  },
];

export const videoContentItems = [
  {
    title: "연구소 소개",
    description:
      "연구소의 취지, 운영 방향, 향후 공개 일정을 차분하게 안내하는 소개 영상 영역입니다.",
    meta: "기획",
    length: "03:00",
  },
  {
    title: "자료 해설",
    description:
      "공개 자료의 배경과 읽는 순서를 짧게 설명해 처음 방문한 사람도 맥락을 잡을 수 있게 합니다.",
    meta: "준비",
    length: "05:00",
  },
  {
    title: "활동 기록",
    description:
      "강연, 모임, 자료 소개 등 출범 전후 활동을 기록형 콘텐츠로 축적할 예정입니다.",
    meta: "예정",
    length: "기록",
  },
];

export type ResearchTopicLink = {
  label: string;
  href: string;
};

export type ResearchTopicHubItem = {
  title: string;
  focusLabel: string;
  description: string;
  primaryLink: ResearchTopicLink;
  secondaryLinks: ResearchTopicLink[];
};

export const researchTopicHubItems: ResearchTopicHubItem[] = [
  {
    title: "주제1",
    focusLabel: "자료 탐색",
    description:
      "출범 전 공개 자료와 공지를 한 주제 흐름 안에서 탐색할 수 있도록 구성하는 임시 주제입니다.",
    primaryLink: { label: "관련 자료 보기", href: "/materials" },
    secondaryLinks: [
      { label: "관련 공지", href: "/notices" },
      { label: "영상 안내", href: "/#video-content" },
      { label: "문의하기", href: "/contact" },
    ],
  },
  {
    title: "주제2",
    focusLabel: "공지 흐름",
    description:
      "방문자가 게시판 메뉴보다 관심 주제를 먼저 선택하도록 돕는 연구 주제 허브의 임시 카드입니다.",
    primaryLink: { label: "관련 공지 확인", href: "/notices" },
    secondaryLinks: [
      { label: "관련 자료", href: "/materials" },
      { label: "영상 안내", href: "/#video-content" },
      { label: "문의하기", href: "/contact" },
    ],
  },
  {
    title: "주제3",
    focusLabel: "문의 연결",
    description:
      "향후 주제 상세 페이지와 자료 아카이브로 확장하기 전, 홈에서 탐색 구조를 검증하기 위한 주제입니다.",
    primaryLink: { label: "문의하기", href: "/contact" },
    secondaryLinks: [
      { label: "관련 자료", href: "/materials" },
      { label: "관련 공지", href: "/notices" },
      { label: "영상 안내", href: "/#video-content" },
    ],
  },
];

export const activityItems = [
  {
    title: "연구소 활동",
    description:
      "활동 소식과 운영 기록을 차례로 정리해 공식 홈페이지의 중심 자료로 축적합니다.",
    href: "/about",
    linkLabel: "소개 보기",
  },
  {
    title: "자료",
    description:
      "홍보자료와 안내 자료를 관리형 게시판으로 제공하고 필요에 따라 확장합니다.",
    href: "/materials",
    linkLabel: "자료 보기",
  },
  {
    title: "공지",
    description:
      "운영 일정과 주요 안내를 공지사항으로 정리해 방문자가 빠르게 확인하도록 합니다.",
    href: "/notices",
    linkLabel: "공지 보기",
  },
];

export const resourceNoticeItems = [
  {
    type: "자료",
    title: "연구소 소개 자료",
    description: "공식 소개문, 운영 목적, 향후 일정 안내 자료를 게시판에 누적합니다.",
    href: "/materials",
  },
  {
    type: "공지",
    title: "운영 일정 안내",
    description: "출범 준비 과정의 주요 일정과 변동 사항을 공지사항으로 안내합니다.",
    href: "/notices",
  },
  {
    type: "활동",
    title: "준비 활동 기록",
    description: "연구소 활동과 공개 가능한 준비 과정을 차례로 정리합니다.",
    href: "/about",
  },
];

export const participationItems = [
  "문의 접수",
  "참여 신청",
  "후원 관심",
];
