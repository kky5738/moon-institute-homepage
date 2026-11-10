import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as enums from "../src/generated/prisma/enums";
import { getPublicPostAttachmentWhere } from "../src/lib/public-post-attachments";
import * as researchFiles from "../src/lib/research-files";
import * as researchPosts from "../src/lib/research-posts";
import * as postSlug from "../src/lib/post-slug";
import * as pagination from "../src/lib/pagination";
import * as adminPosts from "../src/lib/admin-posts";

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, console: { error() {} }, require(name: string) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as T;
}

function makeForm(values: Record<string, string>, repeated: Record<string, string[]> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  for (const [key, items] of Object.entries(repeated)) {
    for (const item of items) form.append(key, item);
  }
  return form;
}

test("WAITING-17/E1 Server Actions against isolated PostgreSQL 17", { timeout: 180_000 }, async (t) => {
  const container = `moon-posts-test-${randomUUID()}`;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8" }).trim();
  let db: PrismaClient | undefined;
  let pool: Pool | undefined;
  try {
    docker("run", "--detach", "--rm", "--name", container, "-e", "POSTGRES_PASSWORD=test",
      "-e", "POSTGRES_DB=research_posts_test", "-p", "127.0.0.1::5432", "postgres:17.11-alpine");
    for (let attempt = 0; ; attempt++) {
      try { docker("exec", container, "pg_isready", "-U", "postgres"); break; }
      catch (error) {
        if (attempt >= 60) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    const port = docker("port", container, "5432/tcp").split(":").at(-1);
    const url = `postgresql://postgres:test@127.0.0.1:${port}/research_posts_test`;
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: "pipe",
    });
    const prisma = db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    const pg = pool = new Pool({ connectionString: url });

    let researcherSession: { user: { id: string; role: string; sessionVersion: number } } | null = null;
    let adminSession: { user: { role: string; adminSessionValid: boolean } } | null = null;
    const ticketCalls: string[] = [];
    const verifyCalls: string[] = [];
    const removeCalls: string[] = [];
    const storageObjects = new Set<string>();
    const logCalls: string[] = [];
    let verifyFails = false;
    let removeFails = false;
    const cache = { revalidatePath() {}, updateTag() {} };
    const serverLog = { logServerError: (context: string) => logCalls.push(context) };
    const researcherAuth = load<typeof import("../src/lib/researcher-auth")>("src/lib/researcher-auth.ts", {
      "../../auth": { auth: async () => researcherSession },
      "next/navigation": { redirect() {}, unstable_rethrow() {} },
      "@/generated/prisma/enums": enums,
      "@/lib/prisma": { prisma },
      "@/lib/server-log": serverLog,
    });
    const adminAuth = load<typeof import("../src/lib/admin-auth")>("src/lib/admin-auth.ts", {
      "../../auth": { auth: async () => adminSession },
      "next/navigation": { redirect() {}, unstable_rethrow() {} },
      "@/lib/server-log": serverLog,
    });
    const researcherActions = load<typeof import("../src/app/account/posts/actions")>("src/app/account/posts/actions.ts", {
      "node:crypto": { randomUUID }, "next/cache": cache,
      "@/generated/prisma/enums": enums, "@/lib/post-slug": postSlug,
      "@/lib/posts": { getPublishedPostsCacheTag: () => "research" },
      "@/lib/prisma": { prisma }, "@/lib/research-files": researchFiles,
      "@/lib/researcher-auth": researcherAuth, "@/lib/research-posts": researchPosts,
      "@/lib/server-log": serverLog,
      "@/lib/supabase-storage": {
        async createResearchUploadTicket(path: string) {
          ticketCalls.push(path);
          return { bucket: "test", path, token: "test-token", supabaseUrl: "http://localhost", publishableKey: "test-key" };
        },
        async verifyResearchUpload(path: string) {
          verifyCalls.push(path);
          storageObjects.add(path);
          if (verifyFails) throw new Error("injected Storage verification failure");
        },
        async removeResearchObjects(paths: string[]) {
          removeCalls.push(...paths);
          if (removeFails) throw new Error("injected Storage removal failure");
          for (const path of paths) storageObjects.delete(path);
        },
      },
    });
    let adminSlugSuffix = randomUUID();
    const adminActions = load<typeof import("../src/app/admin/posts/actions")>("src/app/admin/posts/actions.ts", {
      "node:crypto": { randomUUID: () => adminSlugSuffix },
      "@/lib/post-slug": postSlug,
      "next/cache": cache,
      "next/navigation": { unstable_rethrow() {}, redirect(path: string) { throw Object.assign(new Error("redirect"), { destination: path }); } },
      "@/generated/prisma/enums": enums, "@/lib/admin-auth": adminAuth,
      "@/lib/admin-posts": adminPosts, "@/lib/prisma": { prisma },
      "@/lib/posts": { getPublishedPostsCacheTag: () => "posts" },
      "@/lib/supabase-storage": { removeResearchObjects: async () => {} },
      "@/lib/server-log": serverLog,
    });

    const publicPosts = load<typeof import("../src/lib/posts")>("src/lib/posts.ts", {
      "next/cache": { cacheLife() {}, cacheTag() {} },
      "@/generated/prisma/enums": enums, "@/lib/prisma": { prisma },
      "@/lib/post-slug": postSlug, "@/lib/pagination": pagination,
      "@/lib/public-post-attachments": { getPublicPostAttachmentWhere },
      "@/lib/server-log": { ...serverLog, isPrismaMissingTableError: () => false },
      "@/lib/supabase-storage": { createResearchFileUrls: async () => [] },
    });

    async function createResearcher() {
      return prisma.user.create({ data: {
        name: "test researcher", email: `${randomUUID()}@example.invalid`,
        supabaseAuthId: randomUUID(), emailVerifiedAt: new Date(),
        role: enums.UserRole.RESEARCHER, status: enums.UserStatus.APPROVED,
      } });
    }
    function signInResearcher(user: { id: number; sessionVersion: number }) {
      researcherSession = { user: { id: String(user.id), role: "RESEARCHER", sessionVersion: user.sessionVersion } };
    }
    function signInAdmin() { adminSession = { user: { role: "ADMIN", adminSessionValid: true } }; }
    async function createResearchPost(authorId: number, title = "Original") {
      return prisma.post.create({ data: {
        title, slug: randomUUID(), content: "original body", type: enums.PostType.RESEARCH,
        status: enums.PostStatus.DRAFT, authorId,
      } });
    }
    async function createAttachment(postId: number, options: {
      id?: string; kind?: enums.AttachmentKind; uploaded?: boolean; committed?: boolean;
    } = {}) {
      const id = options.id ?? randomUUID();
      return prisma.postAttachment.create({ data: {
        id, postId, kind: options.kind ?? enums.AttachmentKind.ATTACHMENT,
        originalName: options.kind === enums.AttachmentKind.INLINE_IMAGE ? "image.png" : "file.pdf",
        objectPath: `research/${postId}/${id}.test`,
        contentType: options.kind === enums.AttachmentKind.INLINE_IMAGE ? "image/png" : "application/pdf",
        size: 100, altText: options.kind === enums.AttachmentKind.INLINE_IMAGE ? "test image" : null,
        imageWidth: options.kind === enums.AttachmentKind.INLINE_IMAGE ? 20 : null,
        imageHeight: options.kind === enums.AttachmentKind.INLINE_IMAGE ? 20 : null,
        uploadedAt: options.uploaded ? new Date() : null,
        committedAt: options.committed ? new Date() : null,
      } });
    }
    function saveForm(postId: number, attachmentIds: string[], values: Record<string, string> = {}, removedIds: string[] = []) {
      return makeForm({ id: String(postId), intent: "publish", title: "Saved title", content: "Saved body", ...values }, {
        attachmentId: attachmentIds, removedAttachmentId: removedIds,
      });
    }
    async function waitForBlockedAttachmentQueries(expected: number) {
      for (let attempt = 0; attempt < 200; attempt++) {
        const { rows } = await pg.query<{ count: number }>(`SELECT count(*)::int AS count FROM pg_stat_activity
          WHERE datname = current_database() AND pid <> pg_backend_pid()
          AND wait_event_type = 'Lock' AND query ILIKE '%post_attachments%'`);
        if (rows[0].count >= expected) return;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      assert.fail(`Expected ${expected} blocked post_attachments query(s)`);
    }
    async function installAttachmentGate() {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION e1_attachment_gate() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN PERFORM pg_advisory_xact_lock(40421022); RETURN NEW; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER e1_attachment_gate BEFORE UPDATE ON "post_attachments"
        FOR EACH ROW EXECUTE FUNCTION e1_attachment_gate()`);
    }
    async function removeAttachmentGate() {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS e1_attachment_gate ON "post_attachments"`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS e1_attachment_gate()`);
    }

    await t.test("READY-56 all boards keep URLs through draft, edit, publication, archive and deletion", async () => {
      signInAdmin();
      const state = { status: "idle" as const, message: "" };
      for (const type of [enums.PostType.RESEARCH, enums.PostType.NOTICE, enums.PostType.PROMOTION]) {
        for (const withFile of [false, true]) {
          const title = `READY56-${randomUUID()}`;
          const owner = await createResearcher(); signInResearcher(owner);
          let id: number;
          let categoryId: number | undefined;
          if (type === enums.PostType.RESEARCH) {
            const prepared = await researcherActions.prepareResearchPost(makeForm({ title, intent: "draft" }));
            assert.equal(prepared.ok, true);
            if (!prepared.ok) return;
            id = prepared.postId;
          } else {
            const category = await prisma.category.create({ data: { name: type, slug: randomUUID(), postType: type } });
            categoryId = category.id;
            adminSlugSuffix = randomUUID();
            await assert.rejects(adminActions.createPost(state, makeForm({ title, content: "draft body", categoryId: String(categoryId), intent: "draft" })), /redirect/);
            id = (await prisma.post.findFirstOrThrow({ where: { title } })).id;
          }
          const original = await prisma.post.findUniqueOrThrow({ where: { id } });
          assert.equal(original.summary, null);
          const file = withFile ? await createAttachment(id, { uploaded: true, committed: type !== enums.PostType.RESEARCH }) : null;
          assert.equal(await publicPosts.getPublishedPostBySlug(type, original.slug, false), null);
          assert.ok(!(await publicPosts.getPublishedPostPage(type, 1)).posts.some((post) => post.id === id));
          await prisma.post.update({ where: { id }, data: { summary: "old summary" } });
          if (type === enums.PostType.RESEARCH) {
            assert.equal((await researcherActions.saveResearchPost(saveForm(id, file ? [file.id] : [], { intent: "draft" }))).ok, true);
            assert.equal((await researcherActions.saveResearchPost(saveForm(id, file ? [file.id] : []))).ok, true);
          } else {
            const update = (intent: string) => makeForm({ id: String(id), title: "edited title", content: "edited body", categoryId: String(categoryId), intent });
            await assert.rejects(adminActions.updatePost(state, update("draft")), /redirect/);
            await assert.rejects(adminActions.updatePost(state, update("publish")), /redirect/);
          }
          const visible = await publicPosts.getPublishedPostBySlug(type, encodeURIComponent(original.slug), false);
          assert.equal(visible?.id, id);
          assert.equal(visible?.summary, "old summary");
          assert.equal(visible?.attachmentCount, withFile ? 1 : 0);
          assert.ok((await publicPosts.getPublishedPostPage(type, 1)).posts.some((post) => post.id === id));
          await assert.rejects(adminActions.archivePost(makeForm({ id: String(id) })), /redirect/);
          assert.equal(await publicPosts.getPublishedPostBySlug(type, original.slug, false), null);
          assert.ok(!(await publicPosts.getPublishedPostPage(type, 1)).posts.some((post) => post.id === id));
          await assert.rejects(adminActions.deletePost(state, makeForm({ id: String(id) })), /redirect/);
          assert.equal(await publicPosts.getPublishedPostBySlug(type, original.slug, false), null);
          assert.ok(!(await publicPosts.getPublishedPostPage(type, 1)).posts.some((post) => post.id === id));
          const stored = await prisma.post.findUniqueOrThrow({ where: { id } });
          assert.equal(stored.slug, original.slug);
          assert.equal(stored.summary, "old summary");
          assert.ok(stored.deletedAt);
        }
      }
    });

    await t.test("READY-54 admin generates URLs and preserves legacy summary, URL and attachments", async () => {
      signInAdmin();
      const initial = { status: "idle" as const, message: "" };
      for (const type of [enums.PostType.NOTICE, enums.PostType.PROMOTION]) {
        const category = await prisma.category.create({ data: {
          name: type, slug: randomUUID(), postType: type,
        } });
        for (const title of ["한글 제목", "한글 제목", "!!!"]) {
          adminSlugSuffix = randomUUID();
          const slug = postSlug.createPostSlug(title, adminSlugSuffix.slice(0, 8));
          const form = makeForm({ title, content: "body", categoryId: String(category.id), intent: "draft" });
          await assert.rejects(adminActions.createPost(initial, form), /redirect/);
          const post = await prisma.post.findUniqueOrThrow({ where: { slug } });
          assert.equal(post.summary, null);
          assert.equal(post.type, type);
          assert.equal(post.status, enums.PostStatus.DRAFT);
          // Force the same generated address to exercise the actual DB unique constraint.
          const collision = await adminActions.createPost(initial, form);
          assert.equal(collision.status, "validation");
          assert.match(collision.message, /다시 저장/);
          adminSlugSuffix = randomUUID();
          form.set("summary", "ignored summary from old form");
          form.set("slug", "ignored-address");
          await assert.rejects(adminActions.createPost(initial, form), /redirect/);
          const retried = await prisma.post.findUniqueOrThrow({ where: { slug: postSlug.createPostSlug(title, adminSlugSuffix.slice(0, 8)) } });
          assert.equal(retried.summary, null);
          await prisma.post.update({ where: { id: post.id }, data: { summary: "legacy summary" } });
          const attachment = await createAttachment(post.id, { uploaded: true, committed: true });
          const update = makeForm({ id: String(post.id), title: "changed title", content: "changed body", categoryId: String(category.id), intent: "publish" });
          await assert.rejects(adminActions.updatePost(initial, update), /redirect/);
          const stored = await prisma.post.findUniqueOrThrow({ where: { slug } });
          assert.equal(stored.id, post.id);
          assert.equal(stored.title, "changed title");
          assert.equal(stored.summary, "legacy summary");
          assert.equal(stored.status, enums.PostStatus.PUBLISHED);
          const visible = await publicPosts.getPublishedPostBySlug(type, encodeURIComponent(slug), false);
          assert.equal(visible?.id, post.id);
          assert.equal(visible?.title, "changed title");
          assert.deepEqual(await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachment.id } }), attachment);
          // Old forms can still submit these fields; they must never override stored data.
          update.set("slug", "ignored-address");
          update.set("summary", "ignored summary");
          await assert.rejects(adminActions.updatePost(initial, update), /redirect/);
          assert.equal((await prisma.post.findUniqueOrThrow({ where: { slug } })).summary, "legacy summary");
        }
      }
    });

    await t.test("READY-54 research preparation and final save ignore summary input", async () => {
      const owner = await createResearcher(); signInResearcher(owner);
      for (const intent of ["draft", "publish"]) {
        const prepared = await researcherActions.prepareResearchPost(makeForm({ intent, title: "연구 제목", content: "body", summary: "x".repeat(501) }));
        assert.equal(prepared.ok, true);
        if (!prepared.ok) return;
        const post = await prisma.post.findUniqueOrThrow({ where: { id: prepared.postId } });
        assert.equal(post.summary, null);
        await prisma.post.update({ where: { id: post.id }, data: { summary: "legacy summary" } });
        const attachment = await createAttachment(post.id, { uploaded: true, committed: true });
        const submissions: Record<string, string>[] = [{ intent }, { intent, summary: "x".repeat(501), slug: "ignored" }];
        for (const values of submissions) {
          const saved = await researcherActions.saveResearchPost(saveForm(post.id, [attachment.id], values));
          assert.equal(saved.ok, true);
          const stored = await prisma.post.findUniqueOrThrow({ where: { slug: post.slug } });
          assert.equal(stored.summary, "legacy summary");
          assert.equal(stored.id, post.id);
          assert.equal(stored.title, "Saved title");
          assert.equal(stored.status, intent === "draft" ? enums.PostStatus.DRAFT : enums.PostStatus.PUBLISHED);
          const visible = await publicPosts.getPublishedPostBySlug(enums.PostType.RESEARCH, encodeURIComponent(post.slug), false);
          assert.equal(visible?.id ?? null, intent === "publish" ? post.id : null);
          assert.deepEqual(await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachment.id } }), attachment);
        }
      }
    });

    await t.test("research actions enforce ownership and expose only confirmed, committed files", async () => {
      const owner = await createResearcher();
      const other = await createResearcher();
      signInResearcher(owner);
      const prepared = await researcherActions.prepareResearchPost(makeForm({ intent: "draft", title: "Owner draft" }));
      assert.equal(prepared.ok, true);
      if (!prepared.ok) return;
      const postId = prepared.postId;
      const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });
      assert.equal(post.status, enums.PostStatus.DRAFT);
      assert.equal(post.authorId, owner.id);

      const attachmentId = randomUUID();
      const request = await researcherActions.requestResearchUpload(postId, {
        id: attachmentId, kind: "ATTACHMENT", name: "paper.pdf", size: 100, contentType: "application/pdf",
      });
      assert.equal(request.ok, true);
      assert.equal(ticketCalls.length, 1);
      verifyFails = true;
      assert.equal((await researcherActions.confirmResearchUpload(attachmentId)).ok, false);
      assert.equal(storageObjects.has(ticketCalls[0]), true);
      assert.equal((await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachmentId } })).uploadedAt, null);
      verifyFails = false;
      assert.equal((await researcherActions.confirmResearchUpload(attachmentId)).ok, true);

      const otherPost = await createResearchPost(other.id);
      const otherAttachment = await createAttachment(otherPost.id, { uploaded: true });
      assert.equal((await prisma.postAttachment.findMany({
        where: { postId, ...getPublicPostAttachmentWhere() },
      })).length, 0);
      assert.equal((await researcherActions.saveResearchPost(saveForm(postId, [otherAttachment.id]))).ok, false);
      assert.equal((await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachmentId } })).committedAt, null);

      const saved = await researcherActions.saveResearchPost(saveForm(postId, [attachmentId]));
      assert.equal(saved.ok, true);
      const persisted = await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachmentId } });
      assert.ok(persisted.committedAt);
      assert.equal((await prisma.post.findUniqueOrThrow({ where: { id: postId } })).status, enums.PostStatus.PUBLISHED);
      const publicFiles = await prisma.postAttachment.findMany({
        where: { postId, ...getPublicPostAttachmentWhere() },
      });
      assert.deepEqual(publicFiles.map((file) => file.id), [attachmentId]);
      assert.deepEqual(verifyCalls, [ticketCalls[0], ticketCalls[0]]);
    });

    await t.test("a final DB failure rolls back attachment commitment and publication", async () => {
      const owner = await createResearcher(); signInResearcher(owner);
      const post = await createResearchPost(owner.id);
      const attachment = await createAttachment(post.id, { uploaded: true });
      await prisma.$executeRawUnsafe(`CREATE FUNCTION e1_reject_post_update() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'injected final save failure'; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER e1_reject_post_update BEFORE UPDATE ON "posts"
        FOR EACH ROW EXECUTE FUNCTION e1_reject_post_update()`);
      let result;
      try { result = await researcherActions.saveResearchPost(saveForm(post.id, [attachment.id])); }
      finally {
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS e1_reject_post_update ON "posts"`);
        await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS e1_reject_post_update()`);
      }
      assert.equal(result?.ok, false);
      const [storedPost, storedAttachment] = await Promise.all([
        prisma.post.findUniqueOrThrow({ where: { id: post.id } }),
        prisma.postAttachment.findUniqueOrThrow({ where: { id: attachment.id } }),
      ]);
      assert.equal(storedPost.status, enums.PostStatus.DRAFT);
      assert.equal(storedPost.title, post.title);
      assert.equal(storedAttachment.committedAt, null);
      assert.equal(storedAttachment.deletedAt, null);
    });

    await t.test("inline image finalization wins a discard race and failed Storage removal can retry", async () => {
      const owner = await createResearcher(); signInResearcher(owner);
      const post = await createResearchPost(owner.id);
      const attachment = await createAttachment(post.id, { kind: enums.AttachmentKind.INLINE_IMAGE, uploaded: true });
      storageObjects.add(attachment.objectPath);
      await installAttachmentGate();
      const locker = await pg.connect();
      let savePromise: Promise<unknown> | undefined;
      let discardPromise: Promise<unknown> | undefined;
      try {
        await locker.query("SELECT pg_advisory_lock($1)", [40421022]);
        savePromise = researcherActions.saveResearchPost(saveForm(post.id, [attachment.id], {
          content: `[[research-image:${attachment.id}]]`,
        }));
        await waitForBlockedAttachmentQueries(1);
        discardPromise = researcherActions.discardResearchUpload(attachment.id);
        await waitForBlockedAttachmentQueries(2);
        await locker.query("SELECT pg_advisory_unlock($1)", [40421022]);
        assert.equal((await savePromise as { ok: boolean }).ok, true);
        await discardPromise;
      } finally {
        await locker.query("SELECT pg_advisory_unlock($1)", [40421022]).catch(() => {});
        locker.release();
        await Promise.allSettled([savePromise, discardPromise].filter(Boolean) as Promise<unknown>[]);
        await removeAttachmentGate();
      }
      const saved = await prisma.postAttachment.findUniqueOrThrow({ where: { id: attachment.id } });
      assert.ok(saved.committedAt);
      assert.equal(saved.deletedAt, null);
      assert.equal(removeCalls.includes(attachment.objectPath), false);
      assert.equal(storageObjects.has(attachment.objectPath), true);

      const retryPost = await createResearchPost(owner.id);
      const retryAttachment = await createAttachment(retryPost.id, { uploaded: true });
      storageObjects.add(retryAttachment.objectPath);
      removeFails = true;
      await researcherActions.discardResearchUpload(retryAttachment.id);
      removeFails = false;
      const retained = await prisma.postAttachment.findUniqueOrThrow({ where: { id: retryAttachment.id } });
      assert.ok(retained.deletedAt);
      assert.equal(retained.objectPath, retryAttachment.objectPath);
      assert.equal(storageObjects.has(retryAttachment.objectPath), true);
      await researcherActions.discardResearchUpload(retryAttachment.id);
      assert.equal(storageObjects.has(retryAttachment.objectPath), false);
      assert.ok(removeCalls.includes(retryAttachment.objectPath));
      assert.ok(logCalls.includes("researcher.posts.upload.discard"));
    });

    await t.test("archive racing with save leaves the post archived and rolls back attachment changes", async () => {
      const owner = await createResearcher(); signInResearcher(owner);
      const post = await createResearchPost(owner.id);
      const attachment = await createAttachment(post.id, { uploaded: true });
      await installAttachmentGate();
      const locker = await pg.connect();
      let savePromise: Promise<unknown> | undefined;
      try {
        await locker.query("SELECT pg_advisory_lock($1)", [40421022]);
        savePromise = researcherActions.saveResearchPost(saveForm(post.id, [attachment.id]));
        await waitForBlockedAttachmentQueries(1);
        signInAdmin();
        await assert.rejects(adminActions.archivePost(makeForm({ id: String(post.id) })),
          (error: { destination?: string }) => error.destination === "/admin/posts");
        await locker.query("SELECT pg_advisory_unlock($1)", [40421022]);
        assert.equal((await savePromise as { ok: boolean }).ok, false);
      } finally {
        await locker.query("SELECT pg_advisory_unlock($1)", [40421022]).catch(() => {});
        locker.release();
        await Promise.allSettled([savePromise].filter(Boolean) as Promise<unknown>[]);
        await removeAttachmentGate();
      }
      const [archived, unchangedAttachment] = await Promise.all([
        prisma.post.findUniqueOrThrow({ where: { id: post.id } }),
        prisma.postAttachment.findUniqueOrThrow({ where: { id: attachment.id } }),
      ]);
      assert.equal(archived.status, enums.PostStatus.ARCHIVED);
      assert.equal(archived.content, post.content);
      assert.equal(unchangedAttachment.committedAt, null);
      assert.equal(unchangedAttachment.deletedAt, null);
    });

    await t.test("admin cannot edit research posts but can still update notices", async () => {
      signInAdmin();
      const category = await prisma.category.create({ data: {
        name: "Notice", slug: randomUUID(), postType: enums.PostType.NOTICE,
      } });
      const researcher = await createResearcher();
      const researchPost = await createResearchPost(researcher.id, "Protected research");
      const update = (id: number, title: string) => makeForm({
        id: String(id), title, slug: randomUUID(), content: "Changed", categoryId: String(category.id), intent: "publish",
      });
      const formState = { status: "idle" as const, message: "" };
      const rejected = await adminActions.updatePost(formState, update(researchPost.id, "Forbidden"));
      assert.equal(rejected.status, "validation");
      assert.match(rejected.message, /게시글을 찾을 수 없습니다/);
      assert.equal((await prisma.post.findUniqueOrThrow({ where: { id: researchPost.id } })).title, "Protected research");

      const notice = await prisma.post.create({ data: {
        title: "Notice", slug: randomUUID(), content: "Before", type: enums.PostType.NOTICE,
        status: enums.PostStatus.DRAFT, categoryId: category.id,
      } });
      await assert.rejects(adminActions.updatePost(formState, update(notice.id, "Updated notice")),
        (error: { destination?: string }) => error.destination === "/admin/posts");
      assert.equal((await prisma.post.findUniqueOrThrow({ where: { id: notice.id } })).title, "Updated notice");
    });
  } finally {
    await pool?.end();
    await db?.$disconnect();
    try { docker("rm", "--force", container); } catch {}
  }
});
