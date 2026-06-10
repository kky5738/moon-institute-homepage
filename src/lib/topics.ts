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
    slug: "pre-launch-archive",
    title: "출범 준비 자료",
    focusLabel: "자료 탐색",
    summary:
      "출범 전 공개 자료와 소개 문서를 한 흐름 안에서 확인할 수 있도록 정리합니다.",
    description:
      "공식 원문이 확정되기 전까지는 출범 준비 과정에서 공개 가능한 안내, 소개 자료, 공유 문서를 중심으로 탐색 경로를 제공합니다.",
    primaryLink: { label: "주제 상세 보기", href: "/topics/pre-launch-archive" },
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
      title: "소개 영상 안내",
      description:
        "연구소 소개 영상이 공개되면 이 주제에서 소개 자료와 함께 볼 수 있도록 연결합니다.",
      href: "/#media",
    },
    contactPrompt:
      "출범 준비 자료와 소개 문서에 관해 확인하고 싶은 내용을 남길 수 있습니다.",
  },
  {
    slug: "operations-notices",
    title: "공지와 운영 기록",
    focusLabel: "공지 흐름",
    summary:
      "운영 일정, 월간 소식, 준비 기록을 공지와 자료 목록으로 연결합니다.",
    description:
      "방문자가 게시판 이름보다 관심 흐름을 먼저 선택할 수 있도록, 운영 관련 공지와 준비 과정의 주요 소식을 느슨하게 묶습니다.",
    primaryLink: { label: "주제 상세 보기", href: "/topics/operations-notices" },
    secondaryLinks: [
      { label: "관련 공지", href: "/notices" },
      { label: "관련 자료", href: "/materials" },
      { label: "영상 안내", href: "/#media" },
    ],
    categoryConnections: {
      [PostType.NOTICE]: ["notice", "news"],
      [PostType.PROMOTION]: [],
    },
    videoGuide: {
      title: "활동 기록 영상",
      description:
        "활동 기록형 영상이 공개되면 공지와 운영 기록을 보완하는 콘텐츠로 연결합니다.",
      href: "/#media",
    },
    contactPrompt:
      "운영 일정, 공지 확인, 향후 안내 수신과 관련한 문의를 남길 수 있습니다.",
  },
  {
    slug: "participation-guide",
    title: "참여와 문의 안내",
    focusLabel: "문의 연결",
    summary:
      "문의, 참여 신청, 후원 관심으로 이어지는 공개 안내를 한 화면에서 연결합니다.",
    description:
      "초기 운영에서는 공개 게시판 기능을 과도하게 늘리지 않고, 문의와 참여 신청을 안정적으로 접수하는 경로를 우선 제공합니다.",
    primaryLink: { label: "주제 상세 보기", href: "/topics/participation-guide" },
    secondaryLinks: [
      { label: "문의하기", href: "/contact" },
      { label: "관련 공지", href: "/notices" },
      { label: "관련 자료", href: "/materials" },
    ],
    categoryConnections: {
      [PostType.NOTICE]: ["news"],
      [PostType.PROMOTION]: [],
    },
    videoGuide: {
      title: "참여 안내 영상",
      description:
        "참여 안내 영상이 준비되면 문의 전 확인할 수 있는 짧은 안내 콘텐츠로 연결합니다.",
      href: "/#media",
    },
    contactPrompt:
      "참여 신청, 일반 문의, 후원 관심을 남기면 관리자 확인 후 안내합니다.",
  },
];

export function getResearchTopicBySlug(slug: string) {
  return researchTopics.find((topic) => topic.slug === slug) ?? null;
}

export function getResearchTopicStaticParams() {
  return researchTopics.map((topic) => ({ slug: topic.slug }));
}
