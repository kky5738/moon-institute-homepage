import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  InquiryStatus,
  InquiryType,
  PostPhase,
  PostStatus,
  PostType,
} from "../src/generated/prisma/enums";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const categories = [
  {
    name: "공지",
    slug: "notice",
    description: "연구소 출범 준비와 운영 관련 공지",
    postType: PostType.NOTICE,
    sortOrder: 1,
  },
  {
    name: "소식",
    slug: "news",
    description: "연구소 준비 과정의 주요 소식",
    postType: PostType.NOTICE,
    sortOrder: 2,
  },
  {
    name: "자료",
    slug: "intro-materials",
    description: "공개 가능한 홍보자료",
    postType: PostType.PROMOTION,
    sortOrder: 1,
  },
  {
    name: "생애 자료",
    slug: "life-materials",
    description: "생애 연구와 연결되는 공개 자료",
    postType: PostType.PROMOTION,
    sortOrder: 2,
  },
  {
    name: "말씀 자료",
    slug: "words-materials",
    description: "말씀 연구와 연결되는 공개 자료",
    postType: PostType.PROMOTION,
    sortOrder: 3,
  },
  {
    name: "업적 자료",
    slug: "achievement-materials",
    description: "업적 연구와 연결되는 공개 자료",
    postType: PostType.PROMOTION,
    sortOrder: 4,
  },
];

async function main() {
  const savedCategories = new Map<string, { id: number }>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });

    savedCategories.set(saved.slug, saved);
  }

  const noticeCategory = savedCategories.get("notice");
  const newsCategory = savedCategories.get("news");
  const lifeMaterialsCategory = savedCategories.get("life-materials");
  const wordsMaterialsCategory = savedCategories.get("words-materials");
  const achievementMaterialsCategory = savedCategories.get(
    "achievement-materials",
  );

  if (
    !noticeCategory ||
    !newsCategory ||
    !lifeMaterialsCategory ||
    !wordsMaterialsCategory ||
    !achievementMaterialsCategory
  ) {
    throw new Error("Seed categories were not created.");
  }

  await prisma.post.upsert({
    where: { slug: "launch-preparation-notice" },
    update: {
      phase: PostPhase.PRE_LAUNCH,
      status: PostStatus.PUBLISHED,
      categoryId: noticeCategory.id,
    },
    create: {
      title: "문선명 연구소 출범 준비 안내",
      slug: "launch-preparation-notice",
      summary:
        "문선명 연구소 출범을 준비하며 공식 홈페이지와 홍보 자료 게시판을 단계적으로 공개할 예정입니다.",
      content:
        "문선명 연구소 출범 준비를 위한 공지사항입니다. 자세한 공식 소개 원문은 확정 후 반영합니다.",
      type: PostType.NOTICE,
      status: PostStatus.PUBLISHED,
      phase: PostPhase.PRE_LAUNCH,
      isPinned: true,
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      categoryId: noticeCategory.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: "promotion-board-plan" },
    update: {
      phase: PostPhase.PRE_LAUNCH,
      status: PostStatus.PUBLISHED,
      categoryId: newsCategory.id,
    },
    create: {
      title: "홍보자료 게시판 운영 계획",
      slug: "promotion-board-plan",
      summary:
        "출범 전 기간 동안 행사 안내와 공유 가능한 홍보 자료를 관리형 게시판으로 제공합니다.",
      content:
        "홍보자료 게시판은 관리자가 등록한 자료를 방문자가 확인하는 방식으로 시작합니다.",
      type: PostType.NOTICE,
      status: PostStatus.PUBLISHED,
      phase: PostPhase.PRE_LAUNCH,
      publishedAt: new Date("2026-05-08T00:00:00.000Z"),
      categoryId: newsCategory.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: "life-research-material-guide" },
    update: {
      phase: PostPhase.PRE_LAUNCH,
      status: PostStatus.PUBLISHED,
      categoryId: lifeMaterialsCategory.id,
    },
    create: {
      title: "생애 연구 자료 안내",
      slug: "life-research-material-guide",
      summary:
        "생애 연구 자료를 공개하기 전 자료 이용 순서와 확인 경로를 안내합니다.",
      content:
        "생애 연구 자료 안내입니다. 공식 원문과 세부 기준이 확정되면 자료 본문과 해설을 보완합니다.",
      type: PostType.PROMOTION,
      status: PostStatus.PUBLISHED,
      phase: PostPhase.PRE_LAUNCH,
      isPinned: true,
      publishedAt: new Date("2026-05-12T00:00:00.000Z"),
      categoryId: lifeMaterialsCategory.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: "words-research-material-guide" },
    update: {
      phase: PostPhase.PRE_LAUNCH,
      status: PostStatus.PUBLISHED,
      categoryId: wordsMaterialsCategory.id,
    },
    create: {
      title: "말씀 연구 자료 안내",
      slug: "words-research-material-guide",
      summary:
        "말씀 자료의 공개 범위와 해설 콘텐츠 연결 방식을 확인할 수 있는 안내 자료입니다.",
      content:
        "말씀 연구 자료 안내입니다. 원문 제공 범위와 해설 기준이 확정되면 자료 본문을 보완합니다.",
      type: PostType.PROMOTION,
      status: PostStatus.PUBLISHED,
      phase: PostPhase.PRE_LAUNCH,
      publishedAt: new Date("2026-05-13T00:00:00.000Z"),
      categoryId: wordsMaterialsCategory.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: "achievements-research-material-guide" },
    update: {
      phase: PostPhase.PRE_LAUNCH,
      status: PostStatus.PUBLISHED,
      categoryId: achievementMaterialsCategory.id,
    },
    create: {
      title: "업적 연구 자료 안내",
      slug: "achievements-research-material-guide",
      summary:
        "업적 연구와 활동 기록 자료를 공지, 영상 안내, 문의 경로와 함께 확인하도록 안내합니다.",
      content:
        "업적 연구 자료 안내입니다. 공식 설명과 공개 가능한 활동 기록이 확정되면 자료 본문을 보완합니다.",
      type: PostType.PROMOTION,
      status: PostStatus.PUBLISHED,
      phase: PostPhase.PRE_LAUNCH,
      publishedAt: new Date("2026-05-14T00:00:00.000Z"),
      categoryId: achievementMaterialsCategory.id,
    },
  });

  await prisma.inquiry.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "홍길동",
      email: "sample@example.com",
      type: InquiryType.PARTICIPATION,
      status: InquiryStatus.NEW,
      subject: "참여 신청 문의",
      message: "연구소 출범 준비 과정에 참여하고 싶습니다.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
