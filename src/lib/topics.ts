import { PostType } from "@/generated/prisma/enums";

export type ResearchTopicLink = {
  label: string;
  href: string;
};

export type ResearchTopicVideoGuide = {
  title: string;
  description: string;
  href: string;
};

export type ResearchTopic = {
  slug: string;
  title: string;
  focusLabel: string;
  summary: string;
  description: string;
  primaryLink: ResearchTopicLink;
  secondaryLinks: ResearchTopicLink[];
  categoryConnections: Partial<Record<PostType, string[]>>;
  videoGuide: ResearchTopicVideoGuide;
  contactPrompt: string;
};

export const researchTopics: ResearchTopic[] = [
  {
    slug: "life",
    title: "생애",
    focusLabel: "생애 연구",
    summary:
      "생애와 관련된 자료, 공지, 해설 콘텐츠를 한 흐름 안에서 확인할 수 있도록 정리합니다.",
    description:
      "공식 원문과 세부 기준이 확정되기 전까지는 생애 연구와 연결될 수 있는 공개 자료와 안내 문서를 임시 탐색 경로로 제공합니다.",
    primaryLink: { label: "주제 상세 보기", href: "/topics/life" },
    secondaryLinks: [
      { label: "관련 자료", href: "/materials" },
      { label: "관련 공지", href: "/notices" },
      { label: "문의하기", href: "/contact" },
    ],
    categoryConnections: {
      [PostType.NOTICE]: ["notice"],
      [PostType.PROMOTION]: ["intro-materials"],
    },
    videoGuide: {
      title: "생애 연구 영상 안내",
      description:
        "생애 연구와 관련된 영상이 공개되면 이 주제에서 자료와 함께 볼 수 있도록 연결합니다.",
      href: "/#media",
    },
    contactPrompt:
      "생애 연구와 관련해 확인하고 싶은 자료, 문의, 제안을 남길 수 있습니다.",
  },
  {
    slug: "words",
    title: "말씀",
    focusLabel: "말씀 연구",
    summary:
      "말씀 자료와 해설, 공개 일정, 관련 공지를 함께 탐색할 수 있도록 연결합니다.",
    description:
      "말씀 연구의 분류 기준과 원문 제공 범위가 확정되기 전까지는 공개 가능한 자료, 공지, 영상 안내를 중심으로 임시 탐색 경로를 제공합니다.",
    primaryLink: { label: "주제 상세 보기", href: "/topics/words" },
    secondaryLinks: [
      { label: "관련 자료", href: "/materials" },
      { label: "관련 공지", href: "/notices" },
      { label: "영상 안내", href: "/#media" },
    ],
    categoryConnections: {
      [PostType.NOTICE]: ["notice"],
      [PostType.PROMOTION]: ["intro-materials"],
    },
    videoGuide: {
      title: "말씀 해설 영상 안내",
      description:
        "말씀 관련 영상이나 해설 콘텐츠가 공개되면 자료와 함께 볼 수 있도록 연결합니다.",
      href: "/#media",
    },
    contactPrompt:
      "말씀 자료, 해설, 공개 일정과 관련해 확인하고 싶은 내용을 남길 수 있습니다.",
  },
  {
    slug: "achievements",
    title: "업적",
    focusLabel: "업적 연구",
    summary:
      "업적과 활동 기록을 자료, 공지, 영상 안내와 함께 살펴볼 수 있도록 정리합니다.",
    description:
      "업적 연구의 세부 범위와 공식 설명이 확정되기 전까지는 공개 가능한 안내 자료와 운영 기록을 중심으로 임시 탐색 경로를 제공합니다.",
    primaryLink: { label: "주제 상세 보기", href: "/topics/achievements" },
    secondaryLinks: [
      { label: "관련 자료", href: "/materials" },
      { label: "관련 공지", href: "/notices" },
      { label: "문의하기", href: "/contact" },
    ],
    categoryConnections: {
      [PostType.NOTICE]: ["news"],
      [PostType.PROMOTION]: ["intro-materials"],
    },
    videoGuide: {
      title: "업적 기록 영상 안내",
      description:
        "업적과 활동 기록을 다루는 영상이 공개되면 이 주제에서 함께 연결합니다.",
      href: "/#media",
    },
    contactPrompt:
      "업적 연구와 관련된 자료 문의, 제안, 확인 요청을 남길 수 있습니다.",
  },
];

export function getResearchTopicBySlug(slug: string) {
  return researchTopics.find((topic) => topic.slug === slug) ?? null;
}

export function getResearchTopicStaticParams() {
  return researchTopics.map((topic) => ({ slug: topic.slug }));
}
