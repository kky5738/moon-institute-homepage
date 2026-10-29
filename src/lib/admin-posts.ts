import { PostType } from "@/generated/prisma/enums";

const adminEditablePostTypes: PostType[] = [
  PostType.NOTICE,
  PostType.PROMOTION,
];

export function getAdminEditablePostWhere(id: number) {
  return { id, type: { in: adminEditablePostTypes }, deletedAt: null };
}

export function getAdminEditableCategoriesWhere() {
  return {
    isActive: true,
    postType: { in: adminEditablePostTypes },
  };
}

export function getAdminEditableCategoryWhere(id: number) {
  return {
    id,
    ...getAdminEditableCategoriesWhere(),
  };
}
