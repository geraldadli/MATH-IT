import fox from "./assets/math-it-fox-detective-editorial.png";
import cat from "./assets/math-it-cat-detective-editorial.png";
import bear from "./images/math-it-bear-detective-editorial.png";
import type { AvatarConfig } from "./types";

export const mascotImages = { fox, cat, bear } satisfies Record<AvatarConfig["animal"], string>;
