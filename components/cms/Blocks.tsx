/* ============================================================
   A POST'S BLOCKS, DRAWN. Used by the public post page and by the
   editor's preview, so what an editor sees is what goes live.

   Everything is rendered as React text - there is no
   dangerouslySetInnerHTML anywhere in here - and links are checked
   again on the way out, whatever the server already did.
   ============================================================ */
import { Fragment, type ReactNode } from "react";
import type { Block, Img, Rich } from "@/lib/cms/types";

export function safeHref(h: string | undefined): string | null {
  if (!h) return null;
  if (/^#[\w-]*$/.test(h) || /^\/(?!\/)/.test(h)) return h;
  try {
    const u = new URL(h);
    return ["https:", "http:", "mailto:", "tel:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

export const plain = (r: Rich | undefined) => (r ?? []).map((x) => x.t).join("");

export function RichText({ value }: { value: Rich | undefined }) {
  return (
    <>
      {(value ?? []).map((r, i) => {
        let node: ReactNode = r.t;
        if (r.c) node = <code>{node}</code>;
        if (r.b) node = <strong>{node}</strong>;
        if (r.i) node = <em>{node}</em>;
        if (r.u) node = <u>{node}</u>;
        if (r.s) node = <s>{node}</s>;
        const href = safeHref(r.h);
        if (href) {
          const external = /^https?:/.test(href);
          node = (
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {node}
            </a>
          );
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

export function videoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let yt: string | null = null;
    if (host === "youtu.be") yt = u.pathname.slice(1, 12);
    if (host === "youtube.com" || host === "m.youtube.com") {
      yt = u.searchParams.get("v") || (u.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})/) || [])[1] || null;
    }
    if (yt && /^[\w-]{11}$/.test(yt)) return `https://www.youtube-nocookie.com/embed/${yt}`;
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const m = u.pathname.match(/(\d{6,12})/);
      if (m) return `https://player.vimeo.com/video/${m[1]}?dnt=1`;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

const Picture = ({ img, className }: { img: Img; className?: string }) =>
  img.src ? <img className={className} src={img.src} alt={img.alt} loading="lazy" decoding="async" /> : null;

export function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case "p":
      return plain(b.text).trim() ? (
        <p className={b.align === "center" ? "pb-p is-center" : "pb-p"}><RichText value={b.text} /></p>
      ) : null;
    case "h2":
      return <h2 className="pb-h2"><RichText value={b.text} /></h2>;
    case "h3":
      return <h3 className="pb-h3"><RichText value={b.text} /></h3>;
    case "quote":
      return (
        <figure className="pb-quote">
          <blockquote><RichText value={b.text} /></blockquote>
          {b.cite && <figcaption>{b.cite}</figcaption>}
        </figure>
      );
    case "callout":
      return <aside className={`pb-callout is-${b.tone}`}><RichText value={b.text} /></aside>;
    case "ul":
    case "ol": {
      const List = b.type;
      return (
        <List className="pb-list">
          {b.items.map((it, i) => <li key={i}><RichText value={it} /></li>)}
        </List>
      );
    }
    case "img":
      return b.src ? (
        <figure className={`pb-img is-${b.size}`}>
          <Picture img={b} />
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      ) : null;
    case "gallery":
      return (
        <div className="pb-gallery" data-count={Math.min(b.images.length, 4)}>
          {b.images.map((img, i) => <Picture key={i} img={img} />)}
        </div>
      );
    case "imgText":
      return (
        <div className={`pb-imgtext is-${b.side}`}>
          <Picture img={b} />
          <div><RichText value={b.text} /></div>
        </div>
      );
    case "cols":
      return (
        <div className="pb-cols">
          <p><RichText value={b.left} /></p>
          <p><RichText value={b.right} /></p>
        </div>
      );
    case "video": {
      const src = videoEmbed(b.url);
      return src ? (
        <figure className="pb-video">
          <div className="pb-video__frame">
            <iframe
              src={src}
              title={b.caption || "Video"}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      ) : null;
    }
    case "button": {
      const href = safeHref(b.href);
      return href && b.label ? (
        <p className="pb-button">
          <a className="nav__cta" href={href} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <span>{b.label}</span>
          </a>
        </p>
      ) : null;
    }
    case "divider":
      return <hr className="pb-divider" />;
    default:
      return null;
  }
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="pb">
      {blocks.map((b) => <BlockView key={b.id} block={b} />)}
    </div>
  );
}
