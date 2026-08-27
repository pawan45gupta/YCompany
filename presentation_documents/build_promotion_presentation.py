#!/usr/bin/env python3
"""Build YCompany RIMSS promotion assessment presentation with Nagarro branding."""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "YCompany-Promotion-Assessment.pptx"
LOGO_DARK = ROOT / "assets" / "nagarro-logo-dark-transparent.png"
LOGO_LIGHT = ROOT / "assets" / "nagarro-logo-light-transparent.png"

# Layout — logo and title spacing
LOGO_LEFT = Inches(0.45)
LOGO_TOP = Inches(0.2)
LOGO_WIDTH = Inches(1.75)
TITLE_LEFT = Inches(3.05)  # clear gap after logo (~0.85")
TITLE_WIDTH = Inches(9.8)

# Nagarro brand (from official logo SVG)
GREEN = RGBColor(0x47, 0xD7, 0xAC)
DARK = RGBColor(0x06, 0x04, 0x1F)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BG = RGBColor(0xF4, 0xFA, 0xF8)
MID_GRAY = RGBColor(0x66, 0x66, 0x66)
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
FOOTER = "Nagarro · YCompany RIMSS · Confidential"


def set_run(run, *, size=18, bold=False, color=DARK, name="Calibri"):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color


def _apply_list_style(paragraph, *, numbered: bool = False):
    p_pr = paragraph._p.get_or_add_pPr()
    for tag in ("a:buNone", "a:buChar", "a:buAutoNum", "a:buBlip"):
        existing = p_pr.find(qn(tag))
        if existing is not None:
            p_pr.remove(existing)
    if numbered:
        bullet = p_pr.makeelement(qn("a:buAutoNum"), {"type": "arabicPeriod"})
    else:
        bullet = p_pr.makeelement(qn("a:buChar"), {"char": "•"})
    p_pr.insert(0, bullet)
    paragraph.level = 0


def add_footer(slide, text: str = FOOTER):
    bar = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0), SLIDE_H - Inches(0.35), SLIDE_W, Inches(0.35)
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = DARK
    bar.line.fill.background()
    tf = bar.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run = p.add_run()
    run.text = text
    set_run(run, size=10, color=WHITE)


def add_logo(slide, *, variant: str = "dark", left=LOGO_LEFT, top=LOGO_TOP):
    logo = LOGO_LIGHT if variant == "light" else LOGO_DARK
    if logo.exists():
        slide.shapes.add_picture(str(logo), left, top, width=LOGO_WIDTH)


def add_title_band(slide, title: str, subtitle: str | None = None):
    band = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(1.15)
    )
    band.fill.solid()
    band.fill.fore_color.rgb = WHITE
    band.line.fill.background()

    accent = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0), Inches(1.12), SLIDE_W, Inches(0.06)
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = GREEN
    accent.line.fill.background()

    add_logo(slide, variant="dark")

    box = slide.shapes.add_textbox(TITLE_LEFT, Inches(0.28), TITLE_WIDTH, Inches(0.75))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = title
    set_run(run, size=28, bold=True, color=DARK)

    if subtitle:
        sub = slide.shapes.add_textbox(TITLE_LEFT, Inches(0.78), TITLE_WIDTH, Inches(0.35))
        sp = sub.text_frame.paragraphs[0]
        sr = sp.add_run()
        sr.text = subtitle
        set_run(sr, size=14, color=MID_GRAY)


def add_bullets(
    slide,
    items: list[str],
    left=0.7,
    top=1.45,
    width=11.8,
    height=5.5,
    size=17,
    numbered: bool = False,
    color: RGBColor = DARK,
):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    for i, item in enumerate(items):
        if not item.strip():
            continue
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(8)
        _apply_list_style(p, numbered=numbered)
        run = p.add_run()
        run.text = item
        set_run(run, size=size, color=color)
    return box


def add_two_column(
    slide,
    slide_title: str,
    left_title: str,
    left_items: list[str],
    right_title: str,
    right_items: list[str],
):
    add_title_band(slide, slide_title)

    lt = slide.shapes.add_textbox(Inches(0.7), Inches(1.35), Inches(5.8), Inches(0.4))
    ltp = lt.text_frame.paragraphs[0]
    ltr = ltp.add_run()
    ltr.text = left_title
    set_run(ltr, size=20, bold=True, color=GREEN)

    rt = slide.shapes.add_textbox(Inches(6.85), Inches(1.35), Inches(5.8), Inches(0.4))
    rtp = rt.text_frame.paragraphs[0]
    rtr = rtp.add_run()
    rtr.text = right_title
    set_run(rtr, size=20, bold=True, color=GREEN)

    add_bullets(slide, left_items, left=0.7, top=1.85, width=5.8, height=5.0, size=16)
    add_bullets(slide, right_items, left=6.85, top=1.85, width=5.8, height=5.0, size=16)
    add_footer(slide)


def add_table_slide(slide, title, headers, rows):
    add_title_band(slide, title)
    cols, row_count = len(headers), len(rows) + 1
    table_shape = slide.shapes.add_table(
        row_count, cols, Inches(0.7), Inches(1.55), Inches(11.9), Inches(0.42 * row_count)
    )
    table = table_shape.table
    for c, h in enumerate(headers):
        cell = table.cell(0, c)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = GREEN
        for p in cell.text_frame.paragraphs:
            for r in p.runs:
                set_run(r, size=13, bold=True, color=DARK)
    for r_idx, row in enumerate(rows, start=1):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            if r_idx % 2 == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = LIGHT_BG
            for p in cell.text_frame.paragraphs:
                for run in p.runs:
                    set_run(run, size=12, color=DARK)
    add_footer(slide)


def _diagram_box(slide, left, top, width, height, title, lines, fill, title_color, body_color, title_size=11, body_size=9):
    shape = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = GREEN
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = Inches(0.08)
    tf.margin_right = Inches(0.08)
    tf.margin_top = Inches(0.06)
    p0 = tf.paragraphs[0]
    p0.alignment = PP_ALIGN.CENTER
    r0 = p0.add_run()
    r0.text = title
    set_run(r0, size=title_size, bold=True, color=title_color)
    for line in lines:
        p = tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = line
        set_run(r, size=body_size, color=body_color)
    return shape


def _arrow_down(slide, x, y1, y2):
    line = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT, Inches(x), Inches(y1), Inches(x), Inches(y2)
    )
    line.line.color.rgb = MID_GRAY
    line.line.width = Pt(1.5)
    tri = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ISOSCELES_TRIANGLE,
        Inches(x - 0.08),
        Inches(y2 - 0.02),
        Inches(0.16),
        Inches(0.12),
    )
    tri.fill.solid()
    tri.fill.fore_color.rgb = MID_GRAY
    tri.line.fill.background()
    tri.rotation = 180.0


def add_frontend_architecture_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(slide, "Frontend Architecture (High Level)")

    _diagram_box(
        slide, 3.8, 1.35, 5.7, 0.55, "Browser — React 19 + Next.js 16 App Router", [], DARK, WHITE, WHITE, 12, 9
    )
    _arrow_down(slide, 6.65, 1.92, 2.05)

    _diagram_box(
        slide,
        0.55,
        2.12,
        3.85,
        1.05,
        "Server Components (RSC)",
        ["Home · Products · PDP", "Server-rendered HTML", "SEO metadata / sitemap"],
        LIGHT_BG,
        DARK,
        DARK,
    )
    _diagram_box(
        slide,
        4.75,
        2.12,
        3.85,
        1.05,
        "Client Components",
        ["SearchClient · Cart UI", "Auth forms · CouponField", "Account dashboard"],
        WHITE,
        DARK,
        DARK,
    )
    _diagram_box(
        slide,
        8.95,
        2.12,
        3.85,
        1.05,
        "Shared Shell",
        ["Header / Footer", "middleware.ts", "loading.tsx states"],
        LIGHT_BG,
        DARK,
        DARK,
    )

    for x in (2.45, 6.65, 10.85):
        _arrow_down(slide, x, 3.2, 3.35)

    _diagram_box(
        slide,
        1.0,
        3.42,
        11.35,
        0.72,
        "Presentation Layer — Material UI 9 · Emotion SSR · AppRouterCacheProvider · ThemeProvider",
        [],
        GREEN,
        DARK,
        DARK,
        11,
        9,
    )
    _arrow_down(slide, 6.65, 4.16, 4.28)

    _diagram_box(
        slide,
        1.0,
        4.35,
        5.5,
        0.95,
        "Client State & Data",
        ["TanStack Query 5 — useCheckout / useOrders", "CartContext + localStorage", "useProductSearch (debounced)"],
        WHITE,
        DARK,
        DARK,
    )
    _diagram_box(
        slide,
        6.85,
        4.35,
        5.5,
        0.95,
        "Cross-cutting UI",
        ["ProductSearchAutocomplete", "Observability (GA / Sentry / NR)", "i18n dictionary helpers"],
        WHITE,
        DARK,
        DARK,
    )
    _arrow_down(slide, 6.65, 5.32, 5.45)

    _diagram_box(
        slide,
        2.2,
        5.52,
        8.95,
        0.62,
        "API Client Layer — fetch /api/* · Zod-validated responses · shared query keys",
        [],
        DARK,
        WHITE,
        WHITE,
        11,
        9,
    )

    add_bullets(
        slide,
        [
            "RSC delivers fast first paint; client islands handle interactivity only where needed.",
            "TanStack Query caches server data; CartContext owns cart persistence and stock clamping.",
            "All user input validated with Zod; middleware protects /account routes.",
        ],
        top=6.22,
        height=0.55,
        size=11,
    )
    add_footer(slide)


def add_system_architecture_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(slide, "System Architecture (High Level)")

    _diagram_box(slide, 4.0, 1.32, 5.3, 0.48, "Customer Browser", [], DARK, WHITE, WHITE, 12, 9)
    _arrow_down(slide, 6.65, 1.82, 1.95)
    _diagram_box(
        slide,
        3.2,
        1.98,
        6.95,
        0.48,
        "Vercel Edge / CDN — security headers · image optimization · compression",
        [],
        GREEN,
        DARK,
        DARK,
        11,
        9,
    )
    _arrow_down(slide, 6.65, 2.48, 2.58)

    # Next.js monolith container
    container = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.55), Inches(2.62), Inches(12.25), Inches(2.05)
    )
    container.fill.solid()
    container.fill.fore_color.rgb = LIGHT_BG
    container.line.color.rgb = DARK
    label = slide.shapes.add_textbox(Inches(0.75), Inches(2.68), Inches(11.9), Inches(0.3))
    lp = label.text_frame.paragraphs[0]
    lr = lp.add_run()
    lr.text = "Next.js 16 Monolith — React 19 · TypeScript 5 · App Router"
    set_run(lr, size=12, bold=True, color=DARK)

    _diagram_box(
        slide,
        0.75,
        3.02,
        3.55,
        1.35,
        "Server Components",
        ["Home · PDP · Search page", "MUI Theme + TanStack Q", "next/image · metadata"],
        WHITE,
        DARK,
        DARK,
        10,
        8,
    )
    _diagram_box(
        slide,
        4.55,
        3.02,
        3.85,
        1.35,
        "Route Handlers (/api/*)",
        ["checkout · orders · search", "coupons · auth · webhooks", "Zod + rate limiting"],
        WHITE,
        DARK,
        DARK,
        10,
        8,
    )
    _diagram_box(
        slide,
        9.65,
        3.02,
        2.85,
        1.35,
        "middleware.ts",
        ["Protect /account", "NextAuth session", "Auth redirect"],
        WHITE,
        DARK,
        DARK,
        10,
        8,
    )

    _arrow_down(slide, 6.65, 4.7, 4.82)
    _diagram_box(
        slide,
        2.0,
        4.88,
        9.35,
        0.55,
        "Domain Services — orders · coupons · search · inventory · stripe · email (Resend)",
        [],
        GREEN,
        DARK,
        DARK,
        11,
        9,
    )
    _arrow_down(slide, 6.65, 5.45, 5.55)

    _diagram_box(slide, 0.7, 5.58, 2.85, 0.72, "NextAuth v5", ["Credentials + OAuth"], WHITE, DARK, DARK, 10, 8)
    _diagram_box(
        slide,
        3.75,
        5.58,
        2.85,
        0.72,
        "Stripe API",
        ["Checkout · webhooks", "Coupons · 3DS"],
        WHITE,
        DARK,
        DARK,
        10,
        8,
    )
    _diagram_box(
        slide,
        6.8,
        5.58,
        2.85,
        0.72,
        "Elastic Cloud",
        ["Product index", "In-memory fallback"],
        WHITE,
        DARK,
        DARK,
        10,
        8,
    )
    _diagram_box(
        slide,
        9.85,
        5.58,
        2.85,
        0.72,
        "Persistence",
        ["JSON store (demo)", "PostgreSQL (next)"],
        WHITE,
        DARK,
        DARK,
        10,
        8,
    )

    note = slide.shapes.add_textbox(Inches(0.7), Inches(6.38), Inches(11.9), Inches(0.45))
    np = note.text_frame.paragraphs[0]
    _apply_list_style(np, numbered=False)
    nr = np.add_run()
    nr.text = (
        "Cross-cutting: Sentry (errors/replay) · GA4 (commerce) · New Relic APM · Resend (transactional email) · "
        "stateless tier scalable on Vercel or Kubernetes"
    )
    set_run(nr, size=10, color=MID_GRAY)
    add_footer(slide)


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    # 1 — Title
    s1 = prs.slides.add_slide(prs.slide_layouts[6])
    bg = s1.background.fill
    bg.solid()
    bg.fore_color.rgb = DARK
    add_logo(s1, variant="light", top=Inches(0.55), left=Inches(0.7))

    accent = s1.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0), Inches(2.55), SLIDE_W, Inches(0.08)
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = GREEN
    accent.line.fill.background()

    title = s1.shapes.add_textbox(Inches(0.7), Inches(2.85), Inches(11.9), Inches(1.2))
    tp = title.text_frame.paragraphs[0]
    tr = tp.add_run()
    tr.text = "Promotion Assessment"
    set_run(tr, size=40, bold=True, color=WHITE)

    sub = s1.shapes.add_textbox(Inches(0.7), Inches(3.85), Inches(11.9), Inches(1.5))
    stf = sub.text_frame
    lines = [
        "YCompany RIMSS — Retail Inventory Management Software System",
        "Tech Stack & Architecture Overview",
        "Presenter: Pawan Gupta · Nagarro Software Pvt. Ltd.",
        "Date: August 2026",
    ]
    for i, line in enumerate(lines):
        p = stf.paragraphs[0] if i == 0 else stf.add_paragraph()
        p.space_after = Pt(6)
        _apply_list_style(p, numbered=True)
        r = p.add_run()
        r.text = line
        set_run(r, size=16 if i < 2 else 14, color=GREEN if i == 0 else WHITE)

    # 2 — Agenda
    s2 = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(s2, "Agenda")
    add_bullets(
        s2,
        [
            "Project context and business objectives",
            "Technology stack (as implemented)",
            "Frontend and system architecture diagrams",
            "Backend APIs and key workflows",
            "Observability, quality gates, and deployment",
            "Summary of engineering outcomes",
        ],
        numbered=True,
    )
    add_footer(s2)

    # 3 — Project overview
    s3 = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(s3, "Project Overview")
    add_bullets(
        s3,
        [
            "Client: YCompany — luxury countryside fashion brand (RIMSS programme).",
            "Deliverable: Modern B2C ecommerce storefront with inventory-aware cart and order management.",
            "Reference implementation: Next.js 16 monolith — App Router pages + Route Handlers in one codebase.",
            "Scope: Catalog browse & search, PDP, cart, Stripe checkout, account & orders, coupons, auth.",
            "Demo-ready today; PostgreSQL migration planned as the production data-layer next step.",
            "Documents: Solution Approach, DAR, and Estimates aligned to the as-built stack.",
        ],
    )
    add_footer(s3)

    # 4 — Problem / outcomes
    s4 = prs.slides.add_slide(prs.slide_layouts[6])
    add_two_column(
        s4,
        "Business Context",
        "Legacy challenges addressed",
        [
            "Slow first paint and unresponsive UI on legacy storefront.",
            "Inefficient product search — no filters or relevance ranking.",
            "No inventory awareness — customers could over-order out-of-stock SKUs.",
            "Inconsistent experience across devices.",
        ],
        "Outcomes delivered",
        [
            "FCP target < 3s via RSC, next/image, route loading states.",
            "Elastic Cloud search with in-memory fallback + rich filters.",
            "Per-SKU stock clamping in cart (clampAddQuantity).",
            "Responsive MUI 9 layouts — mobile drawer nav and cart cards.",
        ],
    )

    # 5 — Tech stack table
    s5 = prs.slides.add_slide(prs.slide_layouts[6])
    add_table_slide(
        s5,
        "Technology Stack (As Implemented)",
        ["Layer", "Technology", "Role"],
        [
            ["Frontend", "Next.js 16 · React 19 · TypeScript 5", "App Router, RSC, SSR/CSR hybrid"],
            ["UI", "Material UI 9 · Emotion 11", "Accessible components, SSR cache provider"],
            ["Client data", "TanStack Query 5", "Cached API calls, checkout & order mutations"],
            ["Auth", "NextAuth v5", "Credentials + OAuth (Google, GitHub, Facebook, Apple)"],
            ["Payments", "Stripe Checkout", "Hosted PCI scope, webhooks, coupons"],
            ["Search", "Elastic Cloud + in-memory fallback", "searchProducts() facade, npm run search:index"],
            ["Email", "Resend REST API", "Welcome, order confirm, cancellation emails"],
            ["Observability", "Sentry · GA4 · New Relic", "Errors, analytics, APM (env-gated no-ops)"],
            ["Testing", "Vitest 4 · RTL · jsdom", "201 tests · ~95% line coverage in CI"],
            ["Deploy", "Vercel · Docker · Kubernetes", "Primary cloud + portable enterprise manifests"],
        ],
    )

    # 6 — Frontend architecture diagram
    add_frontend_architecture_slide(prs)

    # 7 — Backend APIs
    s7 = prs.slides.add_slide(prs.slide_layouts[6])
    add_table_slide(
        s7,
        "Backend — Route Handlers (src/app/api/)",
        ["Endpoint", "Purpose"],
        [
            ["POST /api/checkout", "Create Stripe Checkout Session with coupon + shipping"],
            ["POST /api/webhooks/stripe", "Verify signature; idempotent order on session.completed"],
            ["POST /api/orders/sync", "Fallback reconciliation when webhooks unavailable"],
            ["GET /api/orders · GET/POST …/[id]/cancel", "Authenticated order list, detail, cancel"],
            ["GET /api/products/search", "Rate-limited search (120/min/IP); Cache-Control 30s/SWR 60s"],
            ["POST /api/coupons/validate", "Server-side WELCOME10 / SAVE20 / FREESHIP rules"],
            ["GET/POST /api/auth/[...nextauth]", "NextAuth v5 session + OAuth callbacks"],
            ["POST /api/auth/signup · forgot/reset-password", "Registration and password recovery flows"],
        ],
    )

    # 8 — System architecture diagram
    add_system_architecture_slide(prs)

    # 9 — Checkout workflow
    s9 = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(s9, "Checkout & Order Workflow")
    add_bullets(
        s9,
        [
            "User adds items to cart — CartContext validates stock via inventory helpers.",
            "Optional coupon validated at POST /api/coupons/validate — mirrored into Stripe session.",
            "POST /api/checkout creates Stripe Checkout Session — redirect to hosted payment UI.",
            "On payment: Stripe webhook checkout.session.completed — order persisted (idempotent).",
            "Fallback: /checkout/success calls POST /api/orders/sync when webhooks not configured.",
            "Resend sends order confirmation email; GA4 purchase event tracked.",
            "User views orders at /account; can cancel while status === processing.",
        ],
        size=16,
        numbered=True,
    )
    add_footer(s9)

    # 10 — Search
    s10 = prs.slides.add_slide(prs.slide_layouts[6])
    add_two_column(
        s10,
        "Search Architecture",
        "Search architecture",
        [
            "Facade: searchProducts() in src/lib/search.ts.",
            "Primary: Elastic Cloud when ELASTICSEARCH_CLOUD_ID + API_KEY set.",
            "Index: ycompany-products — seeded via npm run search:index.",
            "Query: multi_match + brand/price filters + sort (relevance, price, name).",
            "Fallback: in-memory CatalogIndex when ES unavailable or unconfigured.",
        ],
        "API & UX",
        [
            "GET /api/products/search — Zod filters, rate limit 120 req/min/IP.",
            "Response includes source: elasticsearch | memory for transparency.",
            "SearchClient debounces 300 ms; router.replace keeps shareable URLs.",
            "Header autocomplete uses in-memory product suggestions.",
            "Cache-Control: public, max-age=30, stale-while-revalidate=60.",
        ],
    )

    # 11 — Notifications & observability
    s11 = prs.slides.add_slide(prs.slide_layouts[6])
    add_two_column(
        s11,
        "Notifications & Quality",
        "Transactional email (Resend)",
        [
            "src/lib/email/send.ts — Resend REST when RESEND_API_KEY set.",
            "Templates in templates.ts; console fallback for local dev.",
            "Welcome email on signup (/api/auth/signup).",
            "Order confirmation on webhook + orders/sync (idempotent).",
            "Cancellation email on POST /api/orders/[id]/cancel.",
        ],
        "Observability & quality",
        [
            "Sentry — errors, session replay, performance traces.",
            "GA4 — add_to_cart, begin_checkout, purchase, search, apply_coupon.",
            "New Relic — server APM via NODE_OPTIONS preload in Docker/K8s.",
            "Vitest — 201 tests; coverage thresholds lines/functions ≥ 90%, branches ≥ 85%.",
            "ESLint (eslint-config-next) + TypeScript strict in CI.",
        ],
    )

    # 12 — Deployment
    s12 = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(s12, "Deployment Topology")
    add_bullets(
        s12,
        [
            "Primary target: Vercel — vercel.json, iad1 region, security headers.",
            "Docker: node:22-alpine standalone Next.js output for portable runtimes.",
            "Kubernetes: Deployment (replicas: 2), Service, ConfigMap, Secret, probes on /.",
            "All third-party integrations are no-ops when env vars are unset — frictionless local dev.",
            "Recommended production path: Vercel + Postgres (Prisma/Drizzle) + Elastic Cloud trial/demo.",
            "Enterprise alternative: K8s + Docker with same codebase and observability agents.",
        ],
        size=16,
    )
    add_footer(s12)

    # 13 — Summary
    s13 = prs.slides.add_slide(prs.slide_layouts[6])
    add_title_band(s13, "Summary — Engineering Value")
    add_bullets(
        s13,
        [
            "End-to-end ownership: architecture, implementation, tests, docs, and deployment manifests.",
            "Modern stack chosen for velocity, accessibility, and PCI-safe payments (Stripe hosted).",
            "Resilient search and email — graceful fallbacks keep demos working without cloud credentials.",
            "Production-grade patterns: Zod validation, rate limiting, signed webhooks, idempotent orders.",
            "Full observability stack integrated but optional — supports staged rollout.",
            "Clear migration path to PostgreSQL without rewriting the storefront layer.",
        ],
        size=17,
    )
    add_footer(s13)

    # 14 — Thank you
    s14 = prs.slides.add_slide(prs.slide_layouts[6])
    bg14 = s14.background.fill
    bg14.solid()
    bg14.fore_color.rgb = DARK
    add_logo(s14, variant="light", top=Inches(0.55), left=Inches(0.7))
    accent14 = s14.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0), Inches(3.2), SLIDE_W, Inches(0.08)
    )
    accent14.fill.solid()
    accent14.fill.fore_color.rgb = GREEN
    accent14.line.fill.background()
    thanks = s14.shapes.add_textbox(Inches(0.7), Inches(3.45), Inches(11.9), Inches(1.0))
    tr14 = thanks.text_frame.paragraphs[0]
    rr = tr14.add_run()
    rr.text = "Thank you"
    set_run(rr, size=44, bold=True, color=WHITE)
    add_bullets(
        s14,
        [
            "Pawan Gupta",
            "pawan.gupta@nagarro.com",
            "YCompany RIMSS — Tech Stack & Architecture",
        ],
        top=4.55,
        height=1.2,
        size=18,
        color=WHITE,
    )
    contact_box = s14.shapes[-1]
    for i, p in enumerate(contact_box.text_frame.paragraphs):
        for run in p.runs:
            set_run(run, size=18, color=GREEN if i == 0 else WHITE, bold=(i == 0))

    prs.save(OUT)
    print(f"Created {OUT}")


if __name__ == "__main__":
    build()
