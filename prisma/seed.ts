import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  InquiryStatus,
  InquiryType,
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
    name: "소개자료",
    slug: "intro-materials",
    description: "연구소 소개와 공유용 홍보자료",
    postType: PostType.PROMOTION,
    sortOrder: 1,
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
  const introMaterialsCategory = savedCategories.get("intro-materials");

  if (!noticeCategory || !newsCategory || !introMaterialsCategory) {
    throw new Error("Seed categories were not created.");
  }

  await prisma.post.upsert({
    where: { slug: "launch-preparation-notice" },
    update: {},
    create: {
      title: "문선명 연구소 출범 준비 안내",
      slug: "launch-preparation-notice",
      summary:
        "문선명 연구소 출범을 준비하며 공식 홈페이지와 홍보 자료 게시판을 단계적으로 공개할 예정입니다.",
      content:
        "문선명 연구소 출범 준비를 위한 공지사항입니다. 자세한 공식 소개 원문은 확정 후 반영합니다.",
      type: PostType.NOTICE,
      status: PostStatus.PUBLISHED,
      isPinned: true,
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      categoryId: noticeCategory.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: "promotion-board-plan" },
    update: {},
    create: {
      title: "홍보자료 게시판 운영 계획",
      slug: "promotion-board-plan",
      summary:
        "출범 전 기간 동안 연구소 소개 자료, 행사 안내, 공유 가능한 홍보 자료를 관리형 게시판으로 제공합니다.",
      content:
        "홍보자료 게시판은 관리자가 등록한 자료를 방문자가 확인하는 방식으로 시작합니다.",
      type: PostType.NOTICE,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-05-08T00:00:00.000Z"),
      categoryId: newsCategory.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: "institute-introduction-material" },
    update: {},
    create: {
      title: "연구소 소개 자료 준비본",
      slug: "institute-introduction-material",
      summary:
        "출범 준비 단계에서 공유할 연구소 소개 자료의 기본 구조를 준비하고 있습니다.",
      content:
        "이 자료는 공식 원문이 확정되기 전까지 임시 홍보자료로 관리됩니다.",
      type: PostType.PROMOTION,
      status: PostStatus.PUBLISHED,
      isPinned: true,
      publishedAt: new Date("2026-05-12T00:00:00.000Z"),
      categoryId: introMaterialsCategory.id,
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
