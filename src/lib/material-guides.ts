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

const materialGuides: MaterialGuide[] = [];

export function getMaterialGuide(slug: string): MaterialGuide {
  return (
    materialGuides.find((guide) => guide.slug === slug) ??
    createFallbackMaterialGuide(slug)
  );
}

export function getMaterialArchiveItems(posts: BoardPost[]) {
  return posts
    .map((post) => ({
      post,
      guide: getMaterialGuide(post.slug),
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

function createFallbackMaterialGuide(slug: string): MaterialGuide {
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
    topicHref: "/topics/life",
    topicLabel: "생애",
    videoGuide: {
      title: "영상 콘텐츠 안내",
      description:
        "관련 영상이 준비되면 자료 해설과 함께 볼 수 있도록 연결합니다.",
      href: "/#media",
    },
  };
}
