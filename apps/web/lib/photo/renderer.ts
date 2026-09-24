import {
  getTemplateArtwork,
  getTemplatePhotoSlots,
  drawTemplateDynamicText,
  type GraphicRect,
  traceTemplatePhotoSlotLocal,
} from "../templates/template-graphics";

export type RenderCapture = {
  participantId?: string;
  name?: string;
  dataUrl: string;
};

export type RenderOptions = {
  captures?: RenderCapture[];

  // Legacy two-camera fallback.
  localCapture?: string;
  remoteCapture?: string;

  layout: "JOINED" | "STACKED" | "STRIP" | "GRID" | "FILM";

  filter:
    | "NONE"
    | "WARM"
    | "SOFT"
    | "BW"
    | "VINTAGE"
    | "FADE"
    | "ROSE"
    | "DUSK"
    | "GOLD"
    | "MATTE";

  caption: boolean;
  captionText: string;

  captionFont: "SERIF" | "SCRIPT" | "SANS" | "MONO";

  captionPosition: "BOTTOM" | "TOP" | "OVERLAY";

  captionColor: "ROSE" | "CREAM" | "INK" | "WHITE";

  polaroid: boolean;

  border: "NONE" | "THIN" | "WIDE";

  spacing: "TIGHT" | "RELAXED";

  dateStamp: boolean;

  sticker:
    | "NONE"
    | "HEART"
    | "SPARKLE"
    | "STAR"
    | "FLOWER";

  background: "CREAM" | "BLUSH" | "PAPER" | "DUSK";

  frame:
    | "NONE"
    | "CREAM"
    | "ROSE"
    | "FILM"
    | "DARK"
    | "BLUSH"
    | "LACE"
    | "DOUBLE"
    | "POSTCARD";

  selectedTemplate: string;

  // Names are carried with captures so template-specific typography can remain
  // dynamic instead of baking example names into the reference artwork.
  participantNames?: string[];
};

type TemplateStyle = {
  background: string;
  ink: string;
  accent: string;
  top: string;
  bottom: string;
  mark: string;
  border: string;
  dark?: boolean;
};

function filterCss(filter: RenderOptions["filter"]) {
  switch (filter) {
    case "WARM":
      return "sepia(.10) saturate(1.10) brightness(1.01) contrast(1.03)";

    case "SOFT":
      return "saturate(.92) brightness(1.01) contrast(.97)";

    case "BW":
      return "grayscale(1) contrast(1.03)";

    case "VINTAGE":
      return "sepia(.22) saturate(.88) contrast(.96)";

    case "FADE":
      return "saturate(.78) brightness(1.03) contrast(.91)";

    case "ROSE":
      return "sepia(.08) hue-rotate(-8deg) saturate(1.10) contrast(1.02)";

    case "DUSK":
      return "brightness(.91) saturate(.84) contrast(1.05)";

    case "GOLD":
      return "sepia(.16) saturate(1.14) brightness(1.01)";

    case "MATTE":
      return "contrast(.93) saturate(.90) brightness(1.01)";

    default:
      return "none";
  }
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  );
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - r
  );
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  filter: RenderOptions["filter"],
  radius = 0,
  shape: GraphicRect["shape"] = radius > 0 ? "rounded" : "rect"
) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const scale = Math.max(
    width / imageWidth,
    height / imageHeight
  );

  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const drawX =
    x + (width - drawWidth) / 2;

  const drawY =
    y + (height - drawHeight) / 2;

  ctx.save();

  if (shape === "ellipse" || shape === "rounded" || shape === "rect") {
    traceTemplatePhotoSlotLocal(ctx, {
      x,
      y,
      w: width,
      h: height,
      radius,
      shape,
    });
    ctx.clip();
  }

  ctx.filter = filterCss(filter);

  ctx.drawImage(
    image,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );

  ctx.restore();
}

function resolveBackground(
  options: RenderOptions,
  style: TemplateStyle
) {
  if (options.background === "BLUSH") {
    return "#ead0d0";
  }

  if (options.background === "PAPER") {
    return "#f2e6d0";
  }

  if (options.background === "DUSK") {
    return "#342b2b";
  }

  return style.background;
}

function resolveBorderColor(
  options: RenderOptions,
  style: TemplateStyle
) {
  if (options.frame === "NONE") {
    return style.border;
  }

  switch (options.frame) {
    case "ROSE":
      return "#c98986";

    case "FILM":
      return "#171313";

    case "DARK":
      return "#292120";

    case "BLUSH":
      return "#dca9a6";

    case "LACE":
      return "#f3dfd3";

    case "POSTCARD":
      return "#f5eadb";

    case "DOUBLE":
      return "#b9877d";

    case "CREAM":
    default:
      return "#ead9c5";
  }
}

function calculateBaseDimensions(
  options: RenderOptions,
  count: number
) {
  // Reference templates are raster artworks with a fixed 698:1230 canvas.
  // Keeping that ratio preserves the exact composition supplied in the DOCX.
  if (options.selectedTemplate) {
    const width = 1400;
    const height = Math.round(width * 1230 / 698);
    return {
      width,
      height,
      gap: 0,
      padding: 0,
      columns: 1,
      rows: 1,
      photoWidth: width,
      actualPhotoHeight: height,
      sideBySide: false,
    };
  }

  const width = 1400;

  const gap =
    options.spacing === "RELAXED"
      ? 18
      : 6;

  const padding =
    options.polaroid
      ? 52
      : 34;

  const captionHeight =
    options.caption &&
    options.captionPosition !== "OVERLAY"
      ? 90
      : 0;

  let columns = 1;

  const sideBySide =
    options.layout === "JOINED" ||
    options.layout === "GRID" ||
    options.layout === "FILM";

  if (sideBySide) {
    if (options.layout === "GRID") {
      if (count <= 2) {
        columns = count;
      } else if (count <= 4) {
        columns = 2;
      } else {
        columns = 3;
      }
    } else if (options.layout === "FILM") {
      columns = Math.min(count, 3);
    } else {
      columns = Math.min(count, 2);
    }
  }

  const rows = Math.ceil(
    count / columns
  );

  let photoHeight: number;

  switch (options.layout) {
    case "STRIP":
      photoHeight = 620;
      break;

    case "FILM":
      photoHeight = 500;
      break;

    case "STACKED":
      photoHeight = 560;
      break;

    default:
      photoHeight = 700;
      break;
  }

  const photoWidth = sideBySide
    ? Math.floor(
        (width -
          padding * 2 -
          gap * (columns - 1)) /
          columns
      )
    : width - padding * 2;

  const actualPhotoHeight =
    sideBySide
      ? photoHeight
      : Math.max(
          420,
          photoHeight
        );

  const contentHeight =
    actualPhotoHeight * rows +
    gap * Math.max(0, rows - 1);

  const height =
    padding * 2 +
    contentHeight +
    captionHeight +
    70;

  return {
    width,
    height,
    gap,
    padding,
    columns,
    rows,
    photoWidth,
    actualPhotoHeight,
    sideBySide,
  };
}

function fallbackPhotoRects(
  options: RenderOptions,
  count: number,
  width: number,
  height: number
): GraphicRect[] {
  const gap =
    options.spacing === "RELAXED"
      ? 18
      : 6;

  const padding =
    options.polaroid
      ? 52
      : 34;

  const sideBySide =
    options.layout === "JOINED" ||
    options.layout === "GRID" ||
    options.layout === "FILM";

  let columns = 1;

  if (sideBySide) {
    if (options.layout === "GRID") {
      columns =
        count <= 2
          ? count
          : count <= 4
            ? 2
            : 3;
    } else if (options.layout === "FILM") {
      columns = Math.min(count, 3);
    } else {
      columns = Math.min(count, 2);
    }
  }

  const rows = Math.ceil(
    count / columns
  );

  const availableWidth =
    width -
    padding * 2 -
    gap * Math.max(0, columns - 1);

  const availableHeight =
    height -
    padding * 2 -
    120 -
    gap * Math.max(0, rows - 1);

  const photoWidth =
    availableWidth / columns;

  const photoHeight =
    availableHeight / rows;

  return Array.from(
    { length: count },
    (_, index) => {
      const row = sideBySide
        ? Math.floor(index / columns)
        : index;

      const column = sideBySide
        ? index % columns
        : 0;

      return {
        x:
          padding +
          column *
            (photoWidth + gap),

        y:
          80 +
          row *
            (photoHeight + gap),

        w: photoWidth,

        h: photoHeight,

        rotation:
          options.polaroid
            ? index % 2 === 0
              ? -0.025
              : 0.025
            : 0,

        radius:
          options.frame === "POSTCARD"
            ? 2
            : 12,

        polaroid:
          options.polaroid,
      };
    }
  );
}

function normalizeTemplateRects(
  rects: GraphicRect[],
  count: number,
  width: number,
  height: number
) {
  if (rects.length < count) {
    return rects;
  }

  return rects
    .slice(0, count)
    .map((rect) => ({
      ...rect,

      x: Math.max(
        0,
        Math.min(
          width - rect.w,
          rect.x
        )
      ),

      y: Math.max(
        0,
        Math.min(
          height - rect.h,
          rect.y
        )
      ),

      w: Math.max(
        40,
        Math.min(
          width,
          rect.w
        )
      ),

      h: Math.max(
        40,
        Math.min(
          height,
          rect.h
        )
      ),
    }));
}

function drawPolaroid(
  ctx: CanvasRenderingContext2D,
  rect: GraphicRect
) {
  const rotation =
    rect.rotation ?? 0;

  ctx.save();

  ctx.translate(
    rect.x + rect.w / 2,
    rect.y + rect.h / 2
  );

  ctx.rotate(rotation);

  ctx.shadowColor =
    "rgba(0,0,0,.18)";

  ctx.shadowBlur = 16;

  ctx.shadowOffsetY = 6;

  ctx.fillStyle = "#fffaf1";

  ctx.fillRect(
    -rect.w / 2 - 16,
    -rect.h / 2 - 16,
    rect.w + 32,
    rect.h + 48
  );

  ctx.shadowColor = "transparent";

  ctx.restore();
}

function drawPhotoRect(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: GraphicRect,
  options: RenderOptions
) {
  const rotation =
    rect.rotation ?? 0;

  const radius =
    rect.radius ??
    (options.frame === "LACE"
      ? 22
      : options.frame === "POSTCARD"
        ? 2
        : 12);

  ctx.save();

  ctx.translate(
    rect.x + rect.w / 2,
    rect.y + rect.h / 2
  );

  ctx.rotate(rotation);

  const x = -rect.w / 2;
  const y = -rect.h / 2;

  if (rect.polaroid || options.polaroid) {
    ctx.fillStyle = "#fffaf1";

    ctx.shadowColor =
      "rgba(0,0,0,.18)";

    ctx.shadowBlur = 14;

    ctx.shadowOffsetY = 5;

    ctx.fillRect(
      x - 14,
      y - 14,
      rect.w + 28,
      rect.h + 44
    );

    ctx.shadowColor = "transparent";
  }

  drawCover(
    ctx,
    image,
    x,
    y,
    rect.w,
    rect.h,
    options.filter,
    radius,
    rect.shape
  );

  ctx.restore();
}

function drawManualFrame(
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
  width: number,
  height: number,
  color: string
) {
  if (options.border === "NONE") {
    return;
  }

  ctx.save();

  ctx.strokeStyle = color;

  ctx.globalAlpha = 0.9;

  ctx.lineWidth =
    options.border === "WIDE"
      ? 10
      : 3;

  ctx.strokeRect(
    18,
    18,
    width - 36,
    height - 36
  );

  if (options.frame === "DOUBLE") {
    ctx.globalAlpha = 0.55;

    ctx.lineWidth = 2;

    ctx.strokeRect(
      30,
      30,
      width - 60,
      height - 60
    );
  }

  ctx.restore();
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
  style: TemplateStyle,
  width: number,
  height: number
) {
  if (!options.caption) {
    return;
  }

  const color =
    options.captionColor === "CREAM"
      ? "#f7eadb"
      : options.captionColor === "INK"
        ? style.ink
        : options.captionColor === "WHITE"
          ? "#ffffff"
          : "#c98282";

  let fontFamily: string;

  switch (options.captionFont) {
    case "SCRIPT":
      fontFamily = "cursive";
      break;

    case "SANS":
      fontFamily = "Arial, sans-serif";
      break;

    case "MONO":
      fontFamily = "monospace";
      break;

    default:
      fontFamily = "Georgia, serif";
      break;
  }

  const fontPrefix =
    options.captionFont === "SCRIPT"
      ? "italic "
      : "";

  ctx.save();

  ctx.fillStyle = color;

  ctx.font = `${fontPrefix}24px ${fontFamily}`;

  ctx.textAlign = "center";

  const text =
    options.captionText ||
    "You, Me & Every Moment ♡";

  if (
    options.captionPosition ===
    "TOP"
  ) {
    ctx.fillText(
      text,
      width / 2,
      54
    );
  } else if (
    options.captionPosition ===
    "OVERLAY"
  ) {
    ctx.shadowColor =
      "rgba(0,0,0,.45)";

    ctx.shadowBlur = 10;

    ctx.fillText(
      text,
      width / 2,
      height - 52
    );
  } else {
    ctx.fillText(
      text,
      width / 2,
      height - 48
    );
  }

  ctx.restore();
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
  width: number
) {
  if (options.sticker === "NONE") {
    return;
  }

  const symbols: Record<
    Exclude<
      RenderOptions["sticker"],
      "NONE"
    >,
    string
  > = {
    HEART: "♡",
    SPARKLE: "✦",
    STAR: "★",
    FLOWER: "✿",
  };

  ctx.save();

  ctx.fillStyle = "#c98282";

  ctx.font = "42px Georgia";

  ctx.textAlign = "right";

  ctx.fillText(
    symbols[options.sticker],
    width - 44,
    58
  );

  ctx.restore();
}

function drawDateStamp(
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
  style: TemplateStyle,
  width: number,
  height: number
) {
  if (!options.dateStamp) {
    return;
  }

  ctx.save();

  ctx.fillStyle = style.ink;

  ctx.globalAlpha = 0.72;

  ctx.font =
    "11px Arial, sans-serif";

  ctx.textAlign = "right";

  ctx.fillText(
    new Date().toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ),
    width - 40,
    height - 18
  );

  ctx.restore();
}

function drawTemplateTitle(
  ctx: CanvasRenderingContext2D,
  style: TemplateStyle,
  width: number
) {
  ctx.save();

  ctx.fillStyle = style.ink;

  ctx.font =
    "700 17px Arial, sans-serif";

  ctx.textAlign = "left";

  ctx.fillText(
    style.top,
    38,
    35
  );

  ctx.fillStyle =
    style.accent;

  ctx.font =
    "700 24px Georgia, serif";

  ctx.textAlign = "right";

  ctx.fillText(
    style.mark,
    width - 38,
    38
  );

  ctx.restore();
}

function hasSelectedTemplate(id: string) {
  return Boolean(id && id !== "none");
}

export async function renderFinalPhoto(
  options: RenderOptions,
  style: TemplateStyle
) {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load captured photo."));
      image.src = src;
    });

  /*
   * New multi-participant capture format.
   *
   * Legacy localCapture / remoteCapture
   * is still supported so existing booths
   * don't suddenly break.
   */
  const captures: RenderCapture[] =
    options.captures?.length
      ? options.captures
      : [
          options.localCapture,
          options.remoteCapture,
        ]
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
          .map(
            (dataUrl) => ({
              dataUrl,
            })
          );

  if (captures.length === 0) {
    throw new Error(
      "No captured frames are available."
    );
  }

  /*
   * This renderer can technically render
   * one participant as well. The multiplayer
   * booth itself can still enforce its own
   * minimum participant rule.
   */
  const images =
    await Promise.all(
      captures.map(
        (capture) =>
          load(capture.dataUrl)
      )
    );

  const count = images.length;

  const hasTemplate = Boolean(
    options.selectedTemplate
  );

  // All UsBooth reference templates are portrait compositions.
  // Keep their native 698:1230 ratio so the artwork never stretches.
  const width = hasTemplate ? 1400 : calculateBaseDimensions(options, count).width;
  const height = hasTemplate
    ? Math.round(width * 1230 / 698)
    : calculateBaseDimensions(options, count).height;

  const dimensions = hasTemplate
    ? { gap: 0, padding: 0, columns: 1, rows: 1, photoWidth: 0, actualPhotoHeight: 0, sideBySide: false }
    : calculateBaseDimensions(options, count);

  const { gap, padding, columns, rows, photoWidth, actualPhotoHeight, sideBySide } = dimensions;

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Unable to prepare the photo."
    );
  }

  ctx.imageSmoothingEnabled = true;

  ctx.imageSmoothingQuality =
    "high";

  /*
   * =========================================================
   * TEMPLATE ARTWORK
   * =========================================================
   *
   * The selectable booth templates are real raster assets from
   * /public/templates. Draw that artwork as the complete background,
   * then place the live captures into the coded photo windows.
   *
   * This keeps the actual template users picked visible in the final
   * downloaded image instead of only showing it in the picker.
   */
  const artwork =
    getTemplateArtwork(
      options.selectedTemplate,
      width,
      height,
      count
    );

  // UsBooth templates are rendered from our own canvas artwork.
  // There is deliberately no flattened reference image underneath them:
  // every decorative element, photo window and editable text region remains
  // generated and therefore customizable.
  if (artwork.drawBackground) {
    artwork.drawBackground(ctx, width, height);
  } else {
    ctx.fillStyle = artwork.background || resolveBackground(options, style);
    ctx.fillRect(0, 0, width, height);
  }

  /*
   * =========================================================
   * PHOTO POSITIONS
   * =========================================================
   *
   * Prefer the positions supplied by
   * the actual template artwork.
   *
   * If a template does not provide enough
   * positions, fall back safely.
   */
  const templateSlots = hasTemplate
    ? getTemplatePhotoSlots(options.selectedTemplate, width, height)
    : [];

  let photoRects =
    templateSlots.length >= count
      ? normalizeTemplateRects(
          templateSlots,
          count,
          width,
          height
        )
      : fallbackPhotoRects(
          options,
          count,
          width,
          height
        );

  /*
   * Some template artwork uses the
   * default graphic positions. Make sure
   * the number of rectangles EXACTLY
   * matches the number of captured people.
   */
  photoRects =
    photoRects.slice(0, count);

  /*
   * =========================================================
   * PHOTOS
   * =========================================================
   */
  images.forEach(
    (image, index) => {
      const rect =
        photoRects[index];

      if (!rect) {
        return;
      }

      drawPhotoRect(
        ctx,
        image,
        rect,
        options
      );
    }
  );

  /*
   * =========================================================
   * TEMPLATE FOREGROUND ARTWORK
   * =========================================================
   *
   * Decorative elements are drawn AFTER
   * the photographs.
   *
   * This means bows, flowers, tape,
   * stars, cameras, CDs, newspaper
   * elements etc. can intentionally
   * overlap the photos.
   */
  // Foreground decorations are rendered from the selected template recipe,
  // so all template artwork remains editable and independent of the reference JPG.
  if (!hasTemplate) {
    artwork.drawForeground?.(ctx, width, height);
  } else {
    const names = (
      options.participantNames?.length
        ? options.participantNames
        : captures.map((capture) => capture.name || "")
    );
    drawTemplateDynamicText(ctx, width, height, options.selectedTemplate, names);
  }

  /*
   * =========================================================
   * FRAME / EDITOR OVERLAYS
   * =========================================================
   *
   * These remain user-editable and
   * don't replace the template artwork.
   */
  const borderColor =
    resolveBorderColor(
      options,
      style
    );

  // Template artwork owns its decorative identity, but the editor controls
  // remain genuinely editable on top of every template.
  // Only the generic title/signature is disabled for template-based renders.
  if (!hasTemplate) {
    drawManualFrame(ctx, options, width, height, borderColor);
    drawTemplateTitle(ctx, style, width);
  } else if (options.border !== "NONE") {
    drawManualFrame(ctx, options, width, height, borderColor);
  }

  drawCaption(ctx, options, style, width, height);
  drawDateStamp(ctx, options, style, width, height);
  drawSticker(ctx, options, width);

  /*
   * Export high-quality JPEG.
   */
  const blob =
    await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.96
        );
      }
    );

  if (!blob) {
    throw new Error(
      "Unable to create photo."
    );
  }

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}
