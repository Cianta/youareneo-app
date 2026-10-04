import { useId } from "react";
import "./ivory-wordmark.css";

// Each letter follows its own branch. The layered strokes sculpt polished white wood,
// with fine grain and tapered shoots rather than a font filled with a texture.
const letters = [
  "M38 34C23 23 9 31 9 49C9 67 28 70 38 54M38 32C37 49 40 63 38 76C36 93 13 96 9 81",
  "M53 33C50 47 51 66 63 67C72 68 79 60 80 48M81 32L81 67",
  "M97 34C95 47 98 56 97 67M97 17L97 18",
  "M139 14C137 32 140 47 139 67M138 37C129 25 110 33 111 51C112 68 130 73 139 57",
  "M156 34C154 47 157 56 156 67M156 17L156 18",
  "M171 34L172 67M172 45C178 26 197 26 199 42C201 51 198 58 200 67",
  "M241 34C226 23 212 31 212 49C212 67 231 70 241 54M241 32C240 49 243 63 241 76C239 93 216 96 212 81",
  "M258 66L258 67",
  "M293 36C283 27 272 31 271 40C270 50 296 47 295 58C294 70 277 73 269 64",
  "M309 34C310 52 307 76 309 88M310 40C319 27 338 31 338 50C338 67 320 74 310 61",
  "M380 38C368 26 351 33 352 50C352 68 370 73 380 56M380 33C378 45 380 56 381 67",
  "M420 37C405 24 391 33 392 51C393 69 409 74 420 62",
  "M434 49C445 51 457 47 460 41C458 29 441 26 435 39C425 58 442 79 460 62",
];
const shoots = [
  "M18 30C16 22 10 19 8 12M15 23L20 17",
  "M53 47C47 46 45 41 43 40",
  "M138 23C145 19 147 13 151 9",
  "M181 33C179 26 184 21 182 17",
  "M237 84C245 86 251 82 255 82",
  "M281 49C286 43 288 41 289 38",
  "M329 34C334 25 338 23 339 17",
  "M357 62C352 68 347 69 344 74",
  "M407 31C409 24 416 23 418 18",
  "M443 69C448 74 455 76 459 81",
];

export function IvoryWordmark({ name }: { name: string }) {
  const id = useId();
  if (name.toLowerCase() !== "guiding.space") return <span>{name}</span>;
  const wood = `${id}-ivory-wood`;
  const paths = letters.join(" ");
  return (
    <span className="ivory-wordmark">
      <span className="ivory-wordmark-text">{name}</span>
      <svg viewBox="0 0 472 104" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={wood} x1="0%" y1="0%" x2="30%" y2="100%">
            <stop stopColor="#fffef8" />
            <stop offset=".28" stopColor="#fff" />
            <stop offset=".55" stopColor="#f2eee1" />
            <stop offset=".78" stopColor="#fffdf5" />
            <stop offset="1" stopColor="#b8b4a5" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={paths} stroke="#7f7a7166" strokeWidth="9.6" transform="translate(.5 1.2)" />
          <path d={paths} stroke={`url(#${wood})`} strokeWidth="8" />
          <path d={paths} stroke="#c2bcac" strokeWidth=".8" transform="translate(1.1 .8)" opacity=".8" />
          <path d={paths} stroke="#fff" strokeWidth="1.5" transform="translate(-1.25 -1.2)" />
          <g stroke={`url(#${wood})`} strokeWidth="3.5">
            {shoots.map(d => <path key={d} d={d} />)}
          </g>
          <g stroke="#fff" strokeWidth=".7" transform="translate(-.5 -.5)">
            {shoots.map(d => <path key={d} d={d} />)}
          </g>
          <path d="M26 34C20 37 14 43 14 48M117 49C116 60 124 64 131 61M219 46C218 56 226 62 232 58M357 45C355 54 361 63 369 62M395 49C395 58 399 62 407 63" stroke="#b4ac99" strokeWidth=".65" opacity=".75" />
        </g>
      </svg>
    </span>
  );
}
