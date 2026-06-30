import type { BoardPost } from "@/lib/posts";

export type MaterialVideoGuide = {
  title: string;
  description: string;
  href: string;
};

export type MaterialGuide = {
  slug: string;
  readingOrder: number;
  stepLabel: string;
  archiveSummary: string;
  explanationSummary: string;
  readingPoints: string[];
  recommendationSlugs: string[];
  topicHref: string;
  topicLabel: string;
  videoGuide: MaterialVideoGuide;
};

export type MaterialArchiveItem = {
  post: BoardPost;
  guide: MaterialGuide;
};

const fallbackReadingOrder = 99;

const materialGuides: MaterialGuide[] = [
  {
    slug: "life-research-material-guide",
    readingOrder: 1,
    stepLabel: "생애 입문",
    archiveSummary:
      "생애 연구 자료를 처음 확인하는 방문자가 공개 범위와 이용 순서를 먼저 파악할 수 있도록 배치한 안내 자료입니다.",
    explanationSummary:
      "공식 원문이 확정되기 전까지는 생애 연구 자료를 어떤 순서로 확인할지 안내하는 자료로 다룹니다. 인물과 역사에 관한 구체 설명은 추후 제공되는 원문을 우선해 보완합니다.",
    readingPoints: [
      "생애 연구 자료가 어떤 기준으로 공개될 예정인지 확인합니다.",
      "관련 공지와 함께 보면 자료 공개 일정과 운영 흐름을 이어서 볼 수 있습니다.",
      "확정 원문 전에는 연구 안내 자료의 성격으로 읽습니다.",
    ],
    recommendationSlugs: ["words-research-material-guide"],
    topicHref: "/topics/life",
    topicLabel: "생애",
    videoGuide: {
      title: "생애 연구 영상 안내",
      description:
        "생애 연구와 관련된 영상이 준비되면 자료 해설과 함께 볼 수 있도록 연결합니다.",
      href: "/#media",
    },
  },
  {
    slug: "words-research-material-guide",
    readingOrder: 2,
    stepLabel: "말씀 입문",
    archiveSummary:
      "말씀 자료를 확인하기 전 분류 기준, 공개 일정, 해설 콘텐츠 연결 방식을 살펴볼 수 있는 안내 자료입니다.",
    explanationSummary:
      "말씀 원문과 해설 범위가 확정되기 전까지는 자료 이용 순서와 확인 경로를 안내하는 자료로 제공합니다.",
    readingPoints: [
      "말씀 자료의 공개 범위와 향후 보완 방향을 확인합니다.",
      "자료 본문보다 안내 구조와 연결 경로를 먼저 확인합니다.",
      "관련 영상이 준비되면 자료 해설과 함께 살펴봅니다.",
    ],
    recommendationSlugs: ["achievements-research-material-guide"],
    topicHref: "/topics/words",
    topicLabel: "말씀",
    videoGuide: {
      title: "말씀 해설 영상 안내",
      description:
        "말씀 관련 영상이나 해설 콘텐츠가 공개되면 자료와 함께 연결합니다.",
      href: "/#media",
    },
  },
  {
    slug: "achievements-research-material-guide",
    readingOrder: 3,
    stepLabel: "업적 입문",
    archiveSummary:
      "업적 연구와 활동 기록 자료를 공지, 영상 안내, 문의 경로와 함께 확인할 수 있도록 정리한 안내 자료입니다.",
    explanationSummary:
      "업적 연구의 세부 범위와 공식 설명이 확정되기 전까지는 공개 가능한 자료 이용 순서를 안내하는 자료로 다룹니다.",
    readingPoints: [
      "업적 연구 자료가 어떤 흐름으로 정리될 예정인지 확인합니다.",
      "운영 기록과 공지사항을 함께 보면 공개 맥락을 이어서 볼 수 있습니다.",
      "추가 확인이 필요한 내용은 문의 경로로 연결합니다.",
    ],
    recommendationSlugs: ["life-research-material-guide"],
    topicHref: "/topics/achievements",
    topicLabel: "업적",
    videoGuide: {
      title: "업적 기록 영상 안내",
      description:
        "업적과 활동 기록을 다루는 영상이 공개되면 자료 해설과 함께 연결합니다.",
      href: "/#media",
    },
  },
];

export function getMaterialGuide(
  slug: string,
  categorySlug?: string,
): MaterialGuide {
  return (
    materialGuides.find((guide) => guide.slug === slug) ??
    createFallbackMaterialGuide(slug, categorySlug)
  );
}

export function getMaterialArchiveItems(posts: BoardPost[]) {
  return posts
    .map((post) => ({
      post,
      guide: getMaterialGuide(post.slug, post.categorySlug),
    }))
    .sort((first, second) => {
      const orderDifference =
        first.guide.readingOrder - second.guide.readingOrder;

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return first.post.id - second.post.id;
    });
}

export function getRecommendedMaterialPosts(
  currentSlug: string,
  posts: BoardPost[],
) {
  const guide = getMaterialGuide(currentSlug);
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));

  return guide.recommendationSlugs
    .map((slug) => postBySlug.get(slug))
    .filter((post): post is BoardPost => Boolean(post))
    .filter((post) => post.slug !== currentSlug);
}

function createFallbackMaterialGuide(
  slug: string,
  categorySlug?: string,
): MaterialGuide {
  const topic = getFallbackTopic(categorySlug);

  return {
    slug,
    readingOrder: fallbackReadingOrder,
    stepLabel: "보관 자료",
    archiveSummary:
      "아직 별도 해설 요약이 준비되지 않은 자료입니다. 기본 게시글 정보와 함께 보관 자료로 표시합니다.",
    explanationSummary:
      "이 자료에는 아직 별도 해설 요약이 연결되지 않았습니다. 자료 본문과 목록 정보를 중심으로 확인합니다.",
    readingPoints: [
      "자료 제목과 요약을 먼저 확인합니다.",
      "관련 공지나 주제 페이지에서 공개 흐름을 함께 확인합니다.",
      "필요한 맥락이 부족하면 문의 경로를 이용합니다.",
    ],
    recommendationSlugs: [],
    topicHref: topic.href,
    topicLabel: topic.label,
    videoGuide: {
      title: "영상 콘텐츠 안내",
      description:
        "관련 영상이 준비되면 자료 해설과 함께 볼 수 있도록 연결합니다.",
      href: "/#media",
    },
  };
}

function getFallbackTopic(categorySlug?: string) {
  if (categorySlug === "words-materials") {
    return { href: "/topics/words", label: "말씀" };
  }

  if (categorySlug === "achievement-materials") {
    return { href: "/topics/achievements", label: "업적" };
  }

  return { href: "/topics/life", label: "생애" };
}
