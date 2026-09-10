"use client";

import { useEffect, useRef, useState } from "react";
import { parseVideo, RATIO, YT_HOST } from "@/lib/video";

/* ============================================================
   ONE MOVING PICTURE, WHEREVER IT LIVES.

   The case template hands this a URL and a frame and does not know
   whether it is an .mp4 on our own storage, a YouTube link off the
   brand's channel or a Vimeo link off the edit house's. parseVideo()
   in lib/video.ts works that out; this renders the result.

   Two shapes come out of it:

     a file      a real <video>, controls on, poster set. Nothing here
                 autoplays - the client's own note about video competing
                 with text for the same attention is the reason.

     a hosted    the poster and a play button over it. Half a megabyte of
                 third-party player per embed is not a thing to spend on
                 page load, so nothing is fetched while the page loads.

   ---- why the click is fast anyway ----

   Building the YouTube player only on the click meant the reader paid
   for all of it after pressing play: the embed page, the player script,
   then the film. So the player is built a moment *before* the click,
   the first time the reader shows they are about to make it:

     intent      the pointer comes onto the frame, a finger touches it,
                 or the keyboard focuses the button
     dwell       the frame has sat at least half on screen for 1.2s - a
                 phone has no hover, and this is its version of one

   The warm player loads underneath the poster, paused and out of the
   tab order, and the click only has to say play. Dwell warms one
   player at a time, so a row of cutdowns does not build six at once,
   and it is skipped on Save-Data and 2G, where the reader has asked the
   page to spend less. A file warms the same way, by raising `preload`.

   If the player never says it is ready - the message format changed, a
   blocker ate it - the click falls back to what it always did: a fresh
   frame with autoplay on.
   ============================================================ */
type Stage = "poster" | "warm" | "play";

/* Which frame has been warmed by dwell alone. Intent is not rationed -
   a reader pointing at a film is worth the player. */
let dwellOwner: object | null = null;

const frugal = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return Boolean(c?.saveData) || /2g/.test(c?.effectiveType ?? "");
};

export default function CaseVideo({
  src,
  poster,
  ratio = "wide",
  label,
}: {
  src: string;
  poster?: string;
  ratio?: string;
  label?: string;
}) {
  const v = parseVideo(src, poster);
  const [stage, setStage] = useState<Stage>("poster");
  /* true when the frame is built by the click itself, so it autoplays */
  const [cold, setCold] = useState(false);
  const [preload, setPreload] = useState<"none" | "metadata" | "auto">("none");
  /* YouTube generates maxresdefault only for uploads that had the
     resolution to begin with; for the rest the URL 404s and the frame
     goes empty. hqdefault always exists, so a failed still falls back to
     it once rather than leaving a hole. */
  const [still, setStill] = useState(v.kind === "youtube" ? v.poster : poster);

  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const broken = useRef(false);
  const wantPlay = useRef(false);
  const me = useRef({});

  const style = { aspectRatio: RATIO[ratio] ?? RATIO.wide };
  const mounted = stage !== "poster";

  const send = (msg: object) =>
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ ...msg, id: 1, channel: "widget" }),
      YT_HOST,
    );

  const warm = () => {
    if (v.kind === "file") setPreload("auto");
    else if (v.kind === "youtube") setStage((s) => (s === "poster" ? "warm" : s));
  };

  const play = () => {
    if (v.kind !== "youtube" || stage === "poster" || broken.current) {
      setCold(true);
      setStage("play");
      return;
    }
    setStage("play");
    if (ready.current) send({ event: "command", func: "playVideo", args: [] });
    else wantPlay.current = true;
  };

  /* dwell */
  useEffect(() => {
    const el = box.current;
    if (!el || v.kind === "vimeo" || frugal()) return;
    const owner = me.current;
    let t = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(t);
        if (!e.isIntersecting) return;
        t = window.setTimeout(() => {
          io.disconnect();
          if (v.kind === "file") setPreload((p) => (p === "none" ? "metadata" : p));
          else if (!dwellOwner) {
            dwellOwner = owner;
            warm();
          }
        }, 1200);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
      if (dwellOwner === owner) dwellOwner = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.kind]);

  /* The player only reports once it is told somebody is listening, and
     only accepts commands after it has said onReady. */
  useEffect(() => {
    if (v.kind !== "youtube" || !mounted) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_HOST || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string } | null = null;
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data?.event !== "onReady") return;
      ready.current = true;
      if (wantPlay.current) {
        wantPlay.current = false;
        send({ event: "command", func: "playVideo", args: [] });
      }
    };
    window.addEventListener("message", onMessage);
    const hello = window.setInterval(() => {
      if (ready.current) window.clearInterval(hello);
      else send({ event: "listening" });
    }, 250);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(hello);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, v.kind]);

  const onLoad = () => {
    if (v.kind !== "youtube" || cold) return;
    window.setTimeout(() => {
      if (ready.current) return;
      broken.current = true;
      if (wantPlay.current) {
        wantPlay.current = false;
        setCold(true);
      }
    }, 3000);
  };

  if (v.kind === "file") {
    return (
      <div className="cs-play" style={style} ref={box} onPointerEnter={warm} onTouchStart={warm} onFocus={warm}>
        <video src={v.src} poster={poster} controls preload={preload} playsInline />
      </div>
    );
  }

  const frameSrc = () =>
    v.kind === "youtube"
      ? `${v.src}&origin=${encodeURIComponent(window.location.origin)}${cold ? "&autoplay=1" : ""}`
      : v.src;

  const live = stage === "play";

  return (
    <div className="cs-play" style={style} ref={box} onPointerEnter={warm} onTouchStart={warm} onFocus={warm}>
      {mounted && (
        <iframe
          ref={frame}
          src={frameSrc()}
          title={label ?? "Video"}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          onLoad={onLoad}
          tabIndex={live ? undefined : -1}
          aria-hidden={live ? undefined : true}
        />
      )}
      {!live && (
        <button
          type="button"
          className="cs-play__facade"
          onClick={play}
          aria-label={label ? `Play ${label}` : "Play video"}
          data-cursor="Play"
        >
          {still && (
            <img
              src={still}
              alt=""
              loading="lazy"
              onError={() =>
                setStill(v.kind === "youtube" ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : undefined)
              }
            />
          )}
          <span className="cs-play__btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
